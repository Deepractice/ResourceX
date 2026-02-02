# Content-Addressable Storage (CAS)

## 背景

当前存储架构存在以下问题：

1. **版本管理麻烦** - 用户需要手动管理版本号
2. **重复存储** - 相同内容不同 tag 会存多份
3. **跨 Registry 重复** - local 和 cache 有相同内容也会存多份
4. **无法秒传** - push 时无法判断远程是否已有相同内容
5. **索引和内容耦合** - tag 既是索引也是存储路径
6. **组件过多** - LocalRegistry、MirrorRegistry、Storage 包，职责重叠

## 设计方案

### 核心思想

采用 **内容寻址存储 (Content-Addressable Storage)**，参考 [OCI Distribution Spec](https://github.com/opencontainers/distribution-spec)：

- **RXAStore** - 存储文件内容（Blob），按 digest 寻址
- **RXMStore** - 存储 Manifest（包含 RXL + 元数据 + files 映射）

### 关键洞察

**RXM 本身包含 RXL**，所以不需要单独的 RefStore：

```typescript
interface RXM {
  // RXL 部分（定位）
  name: string;
  tag: string;
  registry?: string; // 区分 local 和 cache
  path?: string;

  // 元数据
  type: string;
  description?: string;

  // 文件映射（指向 RXA）
  files: Record<string, string>; // filename → digest

  // 其他
  createdAt?: Date;
  updatedAt?: Date;
}
```

### 架构变更

```
之前                                  现在
─────────────────────                ─────────────────────

┌─────────────────┐                  ┌─────────────────┐
│ LocalRegistry   │                  │   CASRegistry   │
├─────────────────┤                  ├─────────────────┤
│ MirrorRegistry  │        →         │ ┌─────────────┐ │
├─────────────────┤                  │ │  RXAStore   │ │
│ LinkedRegistry  │                  │ └─────────────┘ │
└────────┬────────┘                  │ ┌─────────────┐ │
         │                           │ │  RXMStore   │ │
┌────────▼────────┐                  │ └─────────────┘ │
│  Storage 包     │                  └─────────────────┘
│ (FileSystem等)  │                  ┌─────────────────┐
└─────────────────┘                  │ LinkedRegistry  │
                                     │   (保持不变)     │
                                     └─────────────────┘
```

**变化：**

- ❌ 删除 `LocalRegistry`
- ❌ 删除 `MirrorRegistry`
- ❌ 删除 `Storage` 包
- ✅ 新增 `CASRegistry`（合并 local + cache）
- ✅ 新增 `RXAStore` 接口
- ✅ 新增 `RXMStore` 接口
- ✅ 保留 `LinkedRegistry`（开发用）

### 通过 RXM.registry 区分 local 和 cache

不需要两个 Registry 类，用 `registry` 字段区分：

```typescript
// local 资源
{ name: "hello", tag: "1.0.0", registry: undefined, ... }

// 远程缓存资源
{ name: "hello", tag: "1.0.0", registry: "deepractice.ai", ... }
```

查询时：

```typescript
// 查 local
rxmStore.search({ registry: null });

// 查某个 registry 的缓存
rxmStore.search({ registry: "deepractice.ai" });

// 清理缓存
rxmStore.deleteByRegistry("deepractice.ai");
```

## 接口设计

### RXAStore - 内容存储

```typescript
interface RXAStore {
  /**
   * 获取文件内容
   */
  get(digest: string): Promise<Buffer>;

  /**
   * 存储文件内容，返回 digest
   * 如果已存在相同 digest，跳过写入（去重）
   */
  put(data: Buffer): Promise<string>;

  /**
   * 检查是否存在
   */
  has(digest: string): Promise<boolean>;

  /**
   * 删除（GC 用）
   */
  delete(digest: string): Promise<void>;

  /**
   * 列出所有 digest（GC 用）
   */
  list(): Promise<string[]>;
}
```

### RXMStore - Manifest 存储

```typescript
interface RXMStore {
  /**
   * 获取 manifest
   */
  get(name: string, tag: string, registry?: string): Promise<RXM | null>;

  /**
   * 存储 manifest
   */
  put(manifest: RXM): Promise<void>;

  /**
   * 检查是否存在
   */
  has(name: string, tag: string, registry?: string): Promise<boolean>;

  /**
   * 删除
   */
  delete(name: string, tag: string, registry?: string): Promise<void>;

  /**
   * 列出某个资源的所有 tag
   */
  listTags(name: string, registry?: string): Promise<string[]>;

  /**
   * 列出所有资源名
   */
  listNames(registry?: string, query?: string): Promise<string[]>;

  /**
   * 搜索
   */
  search(options?: RXMSearchOptions): Promise<RXM[]>;

  /**
   * 按 registry 删除（清理缓存）
   */
  deleteByRegistry(registry: string): Promise<void>;
}

interface RXMSearchOptions {
  registry?: string | null; // null = local, string = specific registry
  query?: string;
  limit?: number;
  offset?: number;
}
```

### CASRegistry - 组合使用

```typescript
class CASRegistry implements Registry {
  constructor(
    private rxaStore: RXAStore,
    private rxmStore: RXMStore
  ) {}

  async put(rxr: RXR): Promise<void> {
    // 1. 存储所有文件到 RXAStore
    const files: Record<string, string> = {};
    for (const [name, content] of Object.entries(rxr.files)) {
      const digest = await this.rxaStore.put(content);
      files[name] = digest;
    }

    // 2. 构建并存储 RXM
    const rxm: RXM = {
      name: rxr.manifest.name,
      tag: rxr.manifest.tag,
      registry: rxr.manifest.registry,
      type: rxr.manifest.type,
      files,
      createdAt: new Date(),
    };
    await this.rxmStore.put(rxm);
  }

  async get(rxl: RXL): Promise<RXR> {
    // 1. 获取 RXM
    const rxm = await this.rxmStore.get(rxl.name, rxl.tag, rxl.registry);
    if (!rxm) throw new Error("Not found");

    // 2. 获取所有文件
    const files: Record<string, Buffer> = {};
    for (const [name, digest] of Object.entries(rxm.files)) {
      files[name] = await this.rxaStore.get(digest);
    }

    return { manifest: rxm, files };
  }
}
```

## 存储后端灵活组合

RXAStore 和 RXMStore 可以用不同的存储后端：

| 场景        | RXAStore   | RXMStore   |
| ----------- | ---------- | ---------- |
| 本地开发    | FileSystem | SQLite     |
| 生产 Server | R2/S3      | PostgreSQL |
| 测试        | Memory     | Memory     |
| 边缘节点    | FileSystem | SQLite     |

```typescript
// 本地开发
const registry = new CASRegistry(
  new FileSystemRXAStore("./data/blobs"),
  new SQLiteRXMStore("./data/metadata.db")
);

// 生产环境
const registry = new CASRegistry(
  new R2RXAStore(r2Client, "resources-bucket"),
  new PostgresRXMStore(pgPool)
);

// 测试
const registry = new CASRegistry(new MemoryRXAStore(), new MemoryRXMStore());
```

## 存储结构示例

### 文件系统

```
~/.resourcex/
├── blobs/                          # RXAStore
│   ├── sha256:aaa...
│   ├── sha256:bbb...
│   └── sha256:ccc...
│
├── metadata.db                     # RXMStore (SQLite)
│
└── linked/                         # LinkedRegistry (保持不变)
    └── hello/1.0.0 → /dev/path
```

### S3/R2 + PostgreSQL

```
# R2 Bucket (RXAStore)
bucket/
└── blobs/
    ├── sha256:aaa...
    ├── sha256:bbb...
    └── sha256:ccc...

# PostgreSQL (RXMStore)
CREATE TABLE manifests (
  id SERIAL PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  tag VARCHAR(255) NOT NULL,
  registry VARCHAR(255),
  type VARCHAR(50) NOT NULL,
  files JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(name, tag, registry)
);

CREATE INDEX idx_manifests_registry ON manifests(registry);
CREATE INDEX idx_manifests_name ON manifests(name);
```

## 工作流程

### ADD 操作

```
rx.add("./my-resource")
    ↓
1. FolderLoader 加载文件
2. 对每个文件:
   - digest = sha256(content)
   - rxaStore.put(content) → digest
3. 构建 RXM { name, tag, type, files: { filename: digest } }
4. rxmStore.put(rxm)
```

### USE 操作

```
rx.use("hello:1.0.0")
    ↓
1. rxm = rxmStore.get("hello", "1.0.0")
2. 对每个 file in rxm.files:
   - content = rxaStore.get(digest)
3. 执行 resolver
```

### PUSH 操作（秒传支持）

```
rx.push("hello:1.0.0")
    ↓
1. rxm = rxmStore.get("hello", "1.0.0")
2. 对每个 file in rxm.files:
   - 询问 Server: "你有 digest 吗？"
   - 没有 → 上传
   - 有 → 跳过（秒传）
3. 上传 rxm
```

### PULL 操作

```
rx.pull("deepractice.ai/hello:1.0.0")
    ↓
1. 从远程获取 rxm
2. 对每个 file in rxm.files:
   - 本地有 → 跳过
   - 本地没有 → 下载
3. rxm.registry = "deepractice.ai"
4. rxmStore.put(rxm)  # 存为缓存
```

## 垃圾回收 (GC)

```typescript
async function gc(rxaStore: RXAStore, rxmStore: RXMStore): Promise<void> {
  // 1. 收集所有被引用的 digest
  const referenced = new Set<string>();
  for (const rxm of await rxmStore.search({})) {
    for (const digest of Object.values(rxm.files)) {
      referenced.add(digest);
    }
  }

  // 2. 删除未被引用的 blob
  for (const digest of await rxaStore.list()) {
    if (!referenced.has(digest)) {
      await rxaStore.delete(digest);
    }
  }
}
```

## 包结构

```
packages/
├── registry/                       # 合并后的包
│   ├── index.ts
│   │
│   ├── interfaces/
│   │   ├── RXAStore.ts            # 接口
│   │   └── RXMStore.ts            # 接口
│   │
│   ├── CASRegistry.ts             # 核心实现
│   ├── LinkedRegistry.ts          # 保持不变
│   │
│   ├── impl/                       # 内置实现
│   │   ├── FileSystemRXAStore.ts
│   │   ├── MemoryRXAStore.ts
│   │   ├── FileSystemRXMStore.ts
│   │   ├── SQLiteRXMStore.ts
│   │   └── MemoryRXMStore.ts
│   │
│   └── utils/
│       └── digest.ts              # sha256 计算
│
└── (删除 storage 包)
```

## 好处总结

| 方面            | 之前                      | 现在                 |
| --------------- | ------------------------- | -------------------- |
| **包数量**      | 2 个 (storage + registry) | 1 个 (registry)      |
| **Registry 类** | 3 个                      | 2 个 (CAS + Linked)  |
| **存储效率**    | 重复存储                  | 内容去重             |
| **Push**        | 总是上传                  | 秒传支持             |
| **查询**        | 扫描文件                  | 数据库索引           |
| **灵活性**      | 固定结构                  | RXA/RXM 可用不同后端 |

## 实现步骤

1. **Phase 1: 接口定义**
   - 定义 `RXAStore` 接口
   - 定义 `RXMStore` 接口
   - 实现 `digest` 计算

2. **Phase 2: 内置实现**
   - `MemoryRXAStore` / `MemoryRXMStore` (测试)
   - `FileSystemRXAStore` / `SQLiteRXMStore` (本地)

3. **Phase 3: CASRegistry**
   - 实现 `CASRegistry`
   - 集成到 `createResourceX()`

4. **Phase 4: 清理**
   - 删除 `LocalRegistry`
   - 删除 `MirrorRegistry`
   - 删除 `storage` 包
   - 实现 GC

5. **Phase 5: 远程协议**
   - 更新 push/pull 协议支持秒传

## Code Review 确认

### 问题 1：RXM.files 字段

**结论**：改为 `Record<string, string>`（filename → digest），必填

```typescript
// 之前
readonly files?: string[];

// 之后
readonly files: Record<string, string>;
```

文件结构通过 key 保留（如 `"templates/main.txt": "sha256:xxx"`）。

### 问题 2：RXA 的角色

**结论**：保留 RXA 用于传输

- 存储：分散为 blob
- 传输：打包成 RXA (tar.gz)
- RXR 结构不变：`{ locator, manifest, archive }`

### 问题 3：RegistryAccessChain

**结论**：保留 AccessChain，职责单一化便于扩展

```
RegistryAccessChain
├── LinkedAccessor  → LinkedRegistry
├── CASAccessor     → CASRegistry
└── RemoteAccessor  → 远程拉取 + 写入 CASRegistry
```

### 问题 4：core 包改动

**结论**：只改 `RXM.files`，其他不变

| 文件 | 改动                                   |
| ---- | -------------------------------------- |
| RXM  | ✅ files 改为 `Record<string, string>` |
| RXR  | ❌ 不变                                |
| RXA  | ❌ 不变                                |
| RXL  | ❌ 不变                                |

## BDD 影响

**CAS 是内部实现改动，对外 API 不变**：

| API           | 用户体验         | BDD    |
| ------------- | ---------------- | ------ |
| `rx.add()`    | 不变             | 不用改 |
| `rx.use()`    | 不变             | 不用改 |
| `rx.push()`   | 不变（可能更快） | 不用改 |
| `rx.pull()`   | 不变             | 不用改 |
| `rx.search()` | 不变             | 不用改 |

**结论**：现有 BDD 测试作为回归测试，跑通即说明改造成功。

## 相关 Issues

- #017 - Separate Local and Cache (被此方案替代)
- #019 - Registry Storage Separation (被此方案替代)
