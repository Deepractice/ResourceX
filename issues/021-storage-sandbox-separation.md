# Issue 021: Storage 与 Sandbox 分离架构

## 背景

当前 Registry 实现混淆了两个正交的概念：

- **存储 (Storage)**：资源存在哪里
- **算力 (Sandbox)**：resolve/execute 在哪里执行

LocalRegistry / RemoteRegistry / GitRegistry 看起来是三种 Registry，但实际上只是三种 **Storage Backend**，算力层完全没有抽象。

## 问题

### 1. 命名混乱

```typescript
// 这些都叫 "Registry"，但它们只是存储后端
LocalRegistry; // 本地文件系统
RemoteRegistry; // HTTP API
GitRegistry; // Git 仓库
```

### 2. 算力层缺失

当前所有 resolve/execute 都在主进程执行，没有隔离选项：

```typescript
// 当前实现 - 算力固定
registry.resolve("tool.text@1.0.0"); // 总是在当前进程执行
```

### 3. 无法组合

无法表达 "Git 存储 + 容器执行" 或 "R2 存储 + Cloudflare Workers 执行" 这样的组合。

## 设计方案

### 核心思想：两层抽象

```
┌─────────────────────────────────────────────────┐
│  Storage (存储抽象)                              │
│  ├── LocalStorage    (文件系统 ~/.resourcex)    │
│  ├── GitStorage      (Git 仓库 clone)           │
│  ├── HttpStorage     (HTTP API)                 │
│  └── S3Storage       (S3/R2 对象存储)           │
├─────────────────────────────────────────────────┤
│  Sandbox (算力抽象)                              │
│  ├── ProcessSandbox  (当前进程，无隔离)          │
│  ├── IsolatedSandbox (QuickJS / isolated-vm)    │
│  ├── ContainerSandbox(Docker / Firecracker)     │
│  └── CloudSandbox    (Workers / Lambda)         │
├─────────────────────────────────────────────────┤
│  Registry = Storage + Sandbox                    │
│  统一入口，组合存储和算力                         │
└─────────────────────────────────────────────────┘
```

### Storage 接口

```typescript
interface Storage {
  readonly type: string;

  // 基础 CRUD
  get(locator: string): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;

  // 开发模式 (可选)
  link?(path: string): Promise<void>;
}
```

### Sandbox 接口

```typescript
interface Sandbox {
  readonly type: SandboxType;

  execute<TArgs, TResult>(
    code: string, // bundled resolver code
    context: {
      rxr: SerializedRXR; // 序列化的 RXR
      args?: TArgs; // 执行参数
    }
  ): Promise<TResult>;
}

type SandboxType = "process" | "isolated" | "container" | "cloud";
```

### Registry 接口 (不变)

```typescript
interface Registry {
  // 存储操作
  link(path: string): Promise<void>;
  add(source: string | RXR): Promise<void>;
  get(locator: string): Promise<RXR>;
  exists(locator: string): Promise<boolean>;
  delete(locator: string): Promise<void>;
  search(options?: SearchOptions): Promise<RXL[]>;

  // 执行操作 - 现在通过 Sandbox 执行
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;
}
```

### 创建 API

```typescript
// 创建存储后端
const localStorage = createStorage({ type: "local", path: "~/.resourcex" });
const gitStorage = createStorage({ type: "git", url: "git@github.com:org/registry.git" });
const httpStorage = createStorage({ type: "http", endpoint: "https://registry.example.com" });
const r2Storage = createStorage({ type: "s3", bucket: "my-registry", endpoint: "..." });

// 创建沙箱
const processSandbox = createSandbox({ type: "process" }); // 默认
const isolatedSandbox = createSandbox({ type: "isolated" });
const containerSandbox = createSandbox({ type: "container", image: "..." });

// 组合成 Registry
const registry = createRegistry({
  storage: gitStorage,
  sandbox: isolatedSandbox,
  types: builtinTypes,
});

// 简写形式 (向后兼容)
const registry = createRegistry(); // local storage + process sandbox
const registry = createRegistry({ path: "..." }); // local storage
const registry = createRegistry({ endpoint: "..." }); // http storage
```

## 存储 × 算力 矩阵

| 存储 \ 算力 | Process  | Isolated    | Container   | Cloud      |
| ----------- | -------- | ----------- | ----------- | ---------- |
| **Local**   | 开发测试 | 安全开发    | 隔离测试    | ❌         |
| **Git**     | 生产     | 生产+安全   | CI/CD       | ❌         |
| **HTTP**    | 客户端   | 客户端+安全 | 客户端+隔离 | ❌         |
| **S3/R2**   | CDN模式  | CDN+安全    | CDN+隔离    | Serverless |

**说明：**

- Local/Git/HTTP 存储 + Cloud 算力 = 不合理（数据在本地，为什么去云端执行？）
- S3/R2 存储 + Cloud 算力 = 纯 Serverless 模式

## 典型场景

### 1. 本地开发 (默认)

```typescript
const registry = createRegistry();
// storage: LocalStorage
// sandbox: ProcessSandbox
```

### 2. 生产使用 (Git + 隔离)

```typescript
const registry = createRegistry({
  storage: createStorage({
    type: "git",
    url: "git@github.com:company/resources.git",
  }),
  sandbox: createSandbox({ type: "isolated" }),
});
```

### 3. Serverless (R2 + Workers)

```typescript
const registry = createRegistry({
  storage: createStorage({
    type: "s3",
    bucket: "resources",
    endpoint: "https://xxx.r2.cloudflarestorage.com",
  }),
  sandbox: createSandbox({
    type: "cloud",
    provider: "cloudflare-workers",
  }),
});
```

### 4. AI Agent (MCP Server)

```typescript
// MCP Server 内部
const registry = createRegistry({
  storage: createStorage({ type: "local" }),
  sandbox: createSandbox({ type: "isolated" }),  // 安全隔离
  types: [...builtinTypes, ...customTypes],
});

// 暴露给 AI
tools: {
  "resourcex.resolve": async (locator, args) => {
    const resolved = await registry.resolve(locator);
    return resolved.execute(args);
  }
}
```

## 包结构调整

```
packages/
├── core/           # RXL, RXM, RXA, RXP (不变)
├── type/           # BundledType, bundler (不变)
├── storage/        # 新包: Storage 抽象
│   ├── Storage.ts          # 接口定义
│   ├── LocalStorage.ts
│   ├── GitStorage.ts
│   ├── HttpStorage.ts
│   └── S3Storage.ts
├── sandbox/        # 新包: Sandbox 抽象
│   ├── Sandbox.ts          # 接口定义
│   ├── ProcessSandbox.ts
│   ├── IsolatedSandbox.ts
│   └── ContainerSandbox.ts
├── registry/       # 重构: 组合 Storage + Sandbox
│   ├── Registry.ts
│   └── createRegistry.ts
└── resourcex/      # 主包 (re-exports)
```

## 迁移路径

### Phase 1: 抽象分离

1. 创建 `@resourcexjs/storage` 包
2. 将 LocalRegistry 的存储逻辑迁移到 LocalStorage
3. 将 GitRegistry 的存储逻辑迁移到 GitStorage
4. 将 RemoteRegistry 的存储逻辑迁移到 HttpStorage
5. Registry 改为组合 Storage

### Phase 2: Sandbox 集成

1. 创建 `@resourcexjs/sandbox` 包
2. 实现 ProcessSandbox (当前行为)
3. 实现 IsolatedSandbox (QuickJS)
4. Registry 改为组合 Storage + Sandbox

### Phase 3: 扩展存储

1. 实现 S3Storage (兼容 R2)
2. 文档和示例

### Phase 4: 云端算力 (可选)

1. CloudSandbox 接口
2. Cloudflare Workers 实现
3. Serverless Registry 示例

## 向后兼容

```typescript
// 这些用法保持不变
const registry = createRegistry();
const registry = createRegistry({ path: "..." });
const registry = createRegistry({ endpoint: "..." });
const registry = createRegistry({ type: "git", url: "...", domain: "..." });

// 内部实现变为
function createRegistry(config) {
  const storage = inferStorage(config);
  const sandbox = config.sandbox ?? createSandbox({ type: "process" });
  return new Registry({ storage, sandbox, types: config.types });
}
```

## 收益

1. **概念清晰**：存储和算力分离，不再混淆
2. **自由组合**：任意 Storage + 任意 Sandbox
3. **易于扩展**：新增存储或算力后端只需实现接口
4. **安全可控**：通过 Sandbox 控制执行环境
5. **Serverless Ready**：为云端执行打下基础

## 相关 Issue

- Issue 020: Resolver + Sandbox + Registry 架构设计 (合并到本 issue)
- Issue 015: Registry Remote Support (HttpStorage 部分已完成)
