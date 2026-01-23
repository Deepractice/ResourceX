# Separate Local and Cache Directories

## 背景

当前 LocalRegistry 把本地开发的资源和远程缓存的资源混在一起存储：

```
~/.resourcex/
├── localhost/my-role.role/1.0.0/       # 本地开发
└── deepractice.ai/nuwa.role/1.0.0/     # 远程缓存（通过 pull）
```

**问题：**

1. **localhost 语义混乱** - 既是 domain 又是"本地标记"
2. **无法区分** - 哪些是开发中的，哪些是安装的
3. **publish 复杂** - 从 localhost 发布时需要改 domain
4. **清理困难** - 想清理缓存时不知道删哪些

## 设计方案

### 新的存储结构

```
~/.resourcex/
├── local/                              # 本地开发区（不按 domain 组织）
│   └── {name}.{type}/
│       └── {version}/
│           ├── manifest.json
│           └── content.tar.gz
│
└── cache/                              # 远程缓存区（按 domain 组织）
    └── {domain}/
        └── {path}/
            └── {name}.{type}/
                └── {version}/
                    ├── manifest.json
                    └── content.tar.gz
```

### 示例

```
~/.resourcex/
├── local/
│   ├── my-role.role/
│   │   └── 1.0.0/
│   │       ├── manifest.json          # domain: "deepractice.ai"
│   │       └── content.tar.gz
│   └── test-prompt.text/
│       └── 1.0.0/
│           ├── manifest.json          # domain: "localhost"（测试用）
│           └── content.tar.gz
│
└── cache/
    ├── deepractice.ai/
    │   └── roles/
    │       └── nuwa.role/
    │           └── 1.0.0/
    │               ├── manifest.json
    │               └── content.tar.gz
    └── github.com/
        └── deepractice/
            └── rolex/
                └── sean.role/
                    └── 1.0.0/
                        ├── manifest.json
                        └── content.tar.gz
```

## API 变更

### Registry 接口新增

```typescript
interface Registry {
  // 现有
  link(rxr: RXR): Promise<void>;
  get(locator: string): Promise<RXR>;
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;

  // 新增
  pull(locator: string, options?: PullOptions): Promise<void>;
  publish(rxr: RXR, options?: PublishOptions): Promise<void>;
}

interface PullOptions {
  from?: Registry; // 从指定 Registry 拉取（可选）
}

interface PublishOptions {
  to: {
    type: "http" | "github";
    // type=http
    endpoint?: string;
    // type=github
    owner?: string;
    repo?: string;
    branch?: string;
    token?: string;
  };
}
```

### 操作语义

```typescript
const registry = createRegistry(); // LocalRegistry

// 1. link() - 链接到 local/
await registry.link(myRole);
// → ~/.resourcex/local/my-role.role/1.0.0/
// → manifest.json 保留原始 domain（可能是 localhost 或真实 domain）

// 2. pull() - 从远程拉取到 cache/
await registry.pull("deepractice.ai/nuwa.role@1.0.0");
// → 发现远程 Registry
// → 拉取资源
// → 保存到 ~/.resourcex/cache/deepractice.ai/roles/nuwa.role/1.0.0/

// 3. resolve() - 优先 local/，其次 cache/
await registry.resolve("my-role.role@1.0.0");
// → 查找 local/my-role.role/1.0.0/（按 name.type@version）
// → 如果不存在，查找 cache/（按 domain/path/name.type@version）

await registry.resolve("deepractice.ai/nuwa.role@1.0.0");
// → 先查找 local/（按 name 匹配）
// → 再查找 cache/deepractice.ai/roles/nuwa.role/1.0.0/

// 4. publish() - 从 local/ 发布到远程 + 复制到 cache/
await registry.publish(myRole, {
  to: {
    type: "github",
    owner: "deepractice",
    repo: "rolex",
    branch: "main",
    token: process.env.GITHUB_TOKEN,
  },
});
// Step 1: 验证 local/my-role.role/1.0.0/ 存在
// Step 2: 检查 manifest.json 的 domain（必须不是 localhost）
// Step 3: 推送到 GitHub repo
// Step 4: 复制到 cache/{domain}/... 作为本地副本

// 5. delete() - 只删除 local/ 或 cache/ 中的资源
await registry.delete("my-role.role@1.0.0");
// → 删除 local/my-role.role/1.0.0/

await registry.delete("deepractice.ai/nuwa.role@1.0.0");
// → 删除 cache/deepractice.ai/roles/nuwa.role/1.0.0/（缓存）
// → 不影响远程 Registry
```

## LocalRegistry 实现变更

### 路径构建逻辑

```typescript
class LocalRegistry implements Registry {
  private buildPath(locator: string, area: "local" | "cache"): string {
    const rxl = parseRXL(locator);

    if (area === "local") {
      // local/ 只按 name.type/version 组织
      const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
      const version = rxl.version ?? "latest";
      return join(this.basePath, "local", resourceName, version);
    } else {
      // cache/ 按 domain/path/name.type/version 组织
      const domain = rxl.domain ?? "localhost";
      let path = join(this.basePath, "cache", domain);
      if (rxl.path) {
        path = join(path, rxl.path);
      }
      const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
      const version = rxl.version ?? "latest";
      return join(path, resourceName, version);
    }
  }
}
```

### resolve() 查找顺序

```typescript
async resolve(locator: string): Promise<ResolvedResource> {
  const rxl = parseRXL(locator);

  // 1. 先在 local/ 查找（按 name.type@version 匹配）
  const localPath = this.buildPath(locator, 'local');
  if (await this.existsAt(localPath)) {
    return this.loadFrom(localPath);
  }

  // 2. 再在 cache/ 查找（按完整 domain/path/name.type@version）
  const cachePath = this.buildPath(locator, 'cache');
  if (await this.existsAt(cachePath)) {
    return this.loadFrom(cachePath);
  }

  // 3. 都不存在，抛出错误
  throw new RegistryError(`Resource not found: ${locator}`);
}
```

## 迁移方案

从当前结构迁移到新结构：

```typescript
// 迁移脚本
async function migrate() {
  const oldBase = "~/.resourcex";
  const newBase = "~/.resourcex-new";

  // 扫描旧结构
  for (const entry of oldEntries) {
    const manifest = readManifest(entry);

    if (manifest.domain === "localhost") {
      // 移动到 local/
      moveTo(`${newBase}/local/${manifest.name}.${manifest.type}/${manifest.version}`);
    } else {
      // 移动到 cache/
      moveTo(`${newBase}/cache/${manifest.domain}/...`);
    }
  }

  // 替换
  rm(oldBase);
  mv(newBase, oldBase);
}
```

**或者简单点：** 直接删除旧的，从零开始（如果没有重要数据）

## 向后兼容

Breaking Change，需要在 changeset 说明：

```markdown
BREAKING CHANGE: Storage structure changed

Old:
~/.resourcex/{domain}/{path}/{name}.{type}/{version}/

New:
~/.resourcex/local/{name}.{type}/{version}/ # 本地开发
~/.resourcex/cache/{domain}/{path}/{name}.{type}/{version}/ # 远程缓存

Migration: Delete ~/.resourcex and re-link/pull resources
```

## 好处

| 方面       | 改进                                   |
| ---------- | -------------------------------------- |
| **清晰度** | local 和 cache 职责明确                |
| **管理**   | 可以独立清理缓存或开发资源             |
| **发布**   | local → cache + remote，流程清晰       |
| **domain** | 不再有特殊的 localhost domain          |
| **性能**   | resolve 优先 local（开发中的资源更快） |

## 相关 Issues

- #015 - Registry Remote Support (基础)
- #016 - GitHub Registry Design (依赖此设计)
