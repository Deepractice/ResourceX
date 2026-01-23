# Issue #019: 分离 Registry 和 Storage 层

**状态**: 待处理
**优先级**: 中
**类型**: 重构

---

## 问题

当前每个 Registry 实现都混合了多个职责：

```
LocalRegistry  - 文件存储 + 验证 + 类型处理
GitRegistry    - Git 存储 + 验证 + 安全检查 + 类型处理
RemoteRegistry - HTTP 访问 + 验证 + 类型处理
```

导致：

1. **重复代码** - domain 验证、TypeHandlerChain 在每个实现里重复
2. **难以扩展** - 添加 S3Storage 需要重新实现所有安全逻辑
3. **职责不清** - 存储和业务逻辑混在一起

---

## 方案

### 分层架构

```
┌─────────────────────────────────────────┐
│              Registry                    │
│  - domain 验证                           │
│  - well-known 发现                       │
│  - TypeHandlerChain                      │
│  - 安全检查（远程需要 domain）            │
│  - get/resolve/exists/search             │
└─────────────────┬───────────────────────┘
                  │ 使用
                  ▼
┌─────────────────────────────────────────┐
│         Storage (接口)                   │
│  get(path): Promise<Buffer>             │
│  exists(path): Promise<boolean>         │
│  list(prefix): Promise<string[]>        │
│  put?(path, data): Promise<void>        │
│  delete?(path): Promise<void>           │
└─────────────────────────────────────────┘
         ▲          ▲          ▲          ▲
         │          │          │          │
   ┌─────┴───┐ ┌────┴────┐ ┌───┴────┐ ┌───┴────┐
   │FileStore│ │GitStore │ │S3Store │ │HttpStore│
   └─────────┘ └─────────┘ └────────┘ └─────────┘
```

### Storage 接口

```typescript
interface Storage {
  readonly name: string;
  readonly type: "local" | "remote"; // 用于安全检查

  get(path: string): Promise<Buffer>;
  exists(path: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;

  // 可选，只读存储不实现
  put?(path: string, data: Buffer): Promise<void>;
  delete?(path: string): Promise<void>;
}
```

### Registry 实现

```typescript
class Registry {
  private storage: Storage;
  private typeHandler: TypeHandlerChain;
  private trustedDomain?: string;

  constructor(config: RegistryConfig) {
    this.storage = createStorage(config);
    this.typeHandler = TypeHandlerChain.create();

    // 统一的安全检查
    if (this.storage.type === "remote" && !config.domain) {
      throw new RegistryError("Remote storage requires domain binding");
    }
    this.trustedDomain = config.domain;
  }

  async get(locator: string): Promise<RXR> {
    const path = this.buildPath(locator);
    const manifest = await this.readManifest(path);

    // 统一的 domain 验证
    this.validateDomain(manifest);

    const content = await this.storage.get(`${path}/content.tar.gz`);
    return this.typeHandler.deserialize(content, manifest);
  }
}
```

### 创建 Storage

```typescript
function createStorage(config: StorageConfig): Storage {
  if (config.type === "file") return new FileStorage(config);
  if (config.type === "git") return new GitStorage(config);
  if (config.type === "s3") return new S3Storage(config);
  if (config.type === "http") return new HttpStorage(config);
  throw new Error(`Unknown storage type: ${config.type}`);
}
```

---

## 好处

1. **安全逻辑只写一次** - 在 Registry 层统一处理
2. **易于扩展** - 添加 S3 只需实现 Storage 接口
3. **易于测试** - Mock Storage 进行单元测试
4. **职责清晰** - Storage 只管读写，Registry 管业务逻辑

---

## 业界参考

| 系统   | Registry 层        | Storage 层    |
| ------ | ------------------ | ------------- |
| npm    | Registry API       | tarballs 存储 |
| Docker | Registry v2        | Blob Storage  |
| Maven  | Repository Manager | 文件/S3/...   |
| OCI    | Distribution Spec  | 可插拔后端    |

---

## 实现步骤

1. 定义 `Storage` 接口
2. 实现 `FileStorage`（从 LocalRegistry 抽取）
3. 实现 `GitStorage`（从 GitRegistry 抽取）
4. 重构 `Registry` 使用 `Storage`
5. 迁移测试
6. 实现 `S3Storage`（新功能）

---

## 相关 Issue

- #017 分离 local/cache 存储
- #018 GitRegistry 实现

---

## 备注

这是一个较大的重构，建议在当前功能稳定后进行。
