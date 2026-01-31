# ResourceX 统一架构设计

## 背景

当前架构存在命名和定位混淆：

1. **Registry 命名混淆** - "Registry" 通常指服务端（如 npm registry），但 `@resourcexjs/registry` 实际是客户端资源管理器
2. **职责不清** - Registry 同时做了本地缓存、远程获取、类型解析
3. **缺少服务端** - 真正的 HTTP Server 还没实现

## 核心洞察：RXR 是一切的中心

```
                        创建
                    RXF ──────→ RXR
                                 │
         ┌───────────┬───────────┼───────────┬───────────┐
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
      存储        传输        解析        搜索       提取
    save/get    push/pull   resolve    search    extract
         │           │           │           │           │
         ▼           ▼           ▼           ▼           ▼
       RXR         RXR       Result       RXL[]      Files
```

**ResourceX 的本质就是 RXR 的生命周期管理：创建、存储、传输、解析。**

类比其他系统：

| 系统          | 核心对象 | 所有操作围绕它                 |
| ------------- | -------- | ------------------------------ |
| Git           | commit   | clone, push, pull, checkout... |
| Docker        | image    | build, push, pull, run...      |
| npm           | package  | install, publish, run...       |
| **ResourceX** | **RXR**  | save, push, pull, resolve...   |

## 设计灵感：Git 模型

```
Git 没有 "registry" 概念！

本地 (.git/)
    │
    └── remote (配置的远程地址)
          ├── origin → git@github.com:user/repo.git
          └── upstream → git@github.com:org/repo.git

GitLab/GitHub Server
    └── git (底层还是 git)
```

借鉴 Git：

- **domain 就是 remote** - 资源自带 domain，通过 well-known 发现服务地址
- **去中心化** - 不需要中心化的 registry
- **Server = Client + HTTP** - 服务端底层也是客户端

## 新架构

```
┌─────────────────────────────────────────────────────────────┐
│                      ResourceX 统一模型                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│   createResourceX()          createResourceXServer()        │
│         │                            │                      │
│         ▼                            ▼                      │
│   ┌───────────┐              ┌─────────────────┐           │
│   │ ResourceX │              │ ResourceXServer │           │
│   │ (客户端)  │              │   (服务端)      │           │
│   └─────┬─────┘              └────────┬────────┘           │
│         │                             │                     │
│         │                    ┌────────┴────────┐           │
│         │                    │                 │           │
│         │                    ▼                 ▼           │
│         │            ┌───────────┐     ┌────────────┐      │
│         │            │ ResourceX │     │ HTTP API   │      │
│         │            │ (内部)    │     │ Layer      │      │
│         │            └───────────┘     └────────────┘      │
│         │                                                   │
│         └──────────────────┬───────────────────────────────┘
│                            │
│                            ▼
│                     ┌────────────┐
│                     │  Storage   │
│                     └────────────┘
└─────────────────────────────────────────────────────────────┘
```

**核心洞察：ResourceXServer 底层就是 ResourceX**

## 镜像功能自然实现

```
用户 (中国)
    │
    └── rx.resolve("deepractice.ai/hello.text@1.0.0")
              │
              ▼
        镜像 Server (cn.deepractice.ai)
              │
              ├── 本地有？ ──Yes──→ 直接返回
              │
              └── 本地没有？
                    │
                    ▼
              rx.pull("deepractice.ai/...")  ← Server 作为客户端
                    │
                    ▼
              源 Server (deepractice.ai)
                    │
                    ▼
              缓存到本地 + 返回给用户
```

**一套代码，既是客户端也是服务端，镜像是自然的结果！**

## API 设计

### createResourceX() - 客户端

```typescript
interface ResourceXConfig {
  cache?: string; // 本地缓存路径，默认 ~/.resourcex
  mirror?: string; // 镜像地址
  types?: BundledType[]; // 自定义类型
  isolator?: IsolatorType; // 沙箱: none | srt | cloudflare
}

interface ResourceX {
  // ===== 核心 API =====

  // 解析资源（自动处理: 本地缓存 → 远程拉取 → 类型解析）
  resolve<TArgs, TResult>(locator: string): Promise<ResolvedResource<TArgs, TResult>>;

  // 开发链接（软链接，修改即生效）
  link(path: string): Promise<void>;

  // 发布到远程（推到 resource.json 定义的 domain）
  push(path: string): Promise<void>;

  // ===== 细粒度 API =====

  // 获取原始 RXR（不解析类型）
  get(locator: string): Promise<RXR>;

  // 只拉取到本地，不解析
  pull(locator: string): Promise<RXR>;

  // 本地存储操作
  save(rxr: RXR): Promise<void>;
  remove(locator: string): Promise<void>;
  has(locator: string): Promise<boolean>;

  // 搜索本地
  search(options?: SearchOptions): Promise<RXL[]>;

  // 添加自定义类型
  supportType(type: BundledType): void;
}
```

### createResourceXServer() - 服务端

```typescript
interface ResourceXServerConfig {
  storage?: string; // 存储路径
  port?: number; // HTTP 端口
  mirror?: string; // 上游镜像（可选，用于二级镜像）
}

interface ResourceXServer {
  // 启动 HTTP 服务
  listen(port?: number): Promise<void>;

  // 关闭服务
  close(): Promise<void>;

  // 内部的 ResourceX 实例（可选暴露）
  readonly rx: ResourceX;
}
```

### 服务端内部实现

```typescript
class ResourceXServer {
  readonly rx: ResourceX;

  constructor(config: ResourceXServerConfig) {
    // Server 底层就是 ResourceX
    this.rx = createResourceX({
      cache: config.storage,
      mirror: config.mirror, // 支持级联镜像
    });
  }

  // HTTP API 只是代理到 rx
  private async handleGetResource(locator: string): Promise<RXR> {
    return this.rx.get(locator); // 自动处理本地/远程
  }

  private async handleGetContent(locator: string): Promise<Buffer> {
    const rxr = await this.rx.get(locator);
    return rxr.archive.buffer();
  }

  private async handlePutResource(rxr: RXR): Promise<void> {
    return this.rx.save(rxr);
  }
}
```

## resolve 数据流

```
rx.resolve("deepractice.ai/hello.text@1.0.0")
    │
    ├─→ has() 本地有？
    │     │
    │     ├─ Yes → load from cache
    │     │
    │     └─ No  → 远程获取
    │               │
    │               ├─ mirror 配置了？
    │               │     │
    │               │     ├─ Yes → 从 mirror 拉取
    │               │     │         │
    │               │     │         └─ mirror 没有？→ well-known 发现源
    │               │     │
    │               │     └─ No  → well-known 发现源
    │               │
    │               └─→ save to cache
    │
    └─→ TypeHandler.resolve() → ResolvedResource { execute() }
```

## 两层架构：Registry + Storage

借鉴 Nexus/Artifactory 的模型，分为两层：

```
┌─────────────────────────────────────────────────────────────┐
│                      Registry 层（业务语义）                 │
├─────────────────────────────────────────────────────────────┤
│  HostedRegistry     MirrorRegistry     LinkedRegistry       │
│   (我拥有的)         (缓存/镜像)        (开发链接)           │
└──────────┬───────────────────┬───────────────────┬──────────┘
           │                   │                   │
           ▼                   ▼                   ▼
┌─────────────────────────────────────────────────────────────┐
│                      Storage 层（底层存储）                  │
├─────────────────────────────────────────────────────────────┤
│   FileSystemStorage       S3Storage          R2Storage      │
│        (fs)                (AWS)           (Cloudflare)     │
└─────────────────────────────────────────────────────────────┘
```

### Storage 层 - 纯 I/O 操作

```typescript
// 底层存储接口 - 纯粹的 key-value 存储
interface Storage {
  get(key: string): Promise<Buffer>;
  put(key: string, data: Buffer): Promise<void>;
  delete(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
  list(prefix?: string): Promise<string[]>;
}

// 实现
class FileSystemStorage implements Storage { ... }  // 本地文件系统
class S3Storage implements Storage { ... }          // AWS S3
class R2Storage implements Storage { ... }          // Cloudflare R2
class MemoryStorage implements Storage { ... }      // 内存（测试用）
```

### Registry 层 - 业务逻辑，操作 RXR

```typescript
// Registry 接口 - 操作 RXR 对象
interface Registry {
  get(rxl: RXL): Promise<RXR>;
  put(rxr: RXR): Promise<void>;
  remove(rxl: RXL): Promise<void>;
  has(rxl: RXL): Promise<boolean>;
  list(domain?: string): Promise<RXL[]>;
}

// 自己拥有的资源（权威数据）
class HostedRegistry implements Registry {
  constructor(storage: Storage) { ... }
}

// 缓存/镜像的远程资源（可清理）
class MirrorRegistry implements Registry {
  constructor(storage: Storage) { ... }
  clear(domain?: string): Promise<void>;  // 清理缓存
}

// 开发链接（软链接到开发目录）
class LinkedRegistry implements Registry {
  constructor(storage: Storage) { ... }
  link(path: string): Promise<RXL>;
  unlink(rxl: RXL): Promise<void>;
}
```

### 组合示例

```typescript
// 本地开发
const hosted = new HostedRegistry(new FileSystemStorage("~/.resourcex/hosted"));
const mirror = new MirrorRegistry(new FileSystemStorage("~/.resourcex/cache"));
const linked = new LinkedRegistry(new FileSystemStorage("~/.resourcex/linked"));

// 生产环境 - 使用 S3
const hosted = new HostedRegistry(new S3Storage({ bucket: "my-resources" }));

// 边缘镜像 - 使用 Cloudflare R2
const mirror = new MirrorRegistry(new R2Storage({ bucket: "cache" }));
```

### ResourceX 内部路由

```typescript
class ResourceX {
  private hosted: HostedRegistry;
  private mirror: MirrorRegistry;
  private linked: LinkedRegistry;

  async get(locator: string): Promise<RXR> {
    const rxl = parse(locator);

    // 1. 先查 linked（开发优先）
    if (await this.linked.has(rxl)) {
      return this.linked.get(rxl);
    }

    // 2. 再查 hosted（自己的资源）
    if (await this.hosted.has(rxl)) {
      return this.hosted.get(rxl);
    }

    // 3. 最后查 mirror（缓存的远程资源）
    if (await this.mirror.has(rxl)) {
      return this.mirror.get(rxl);
    }

    throw new Error("Not found");
  }

  async save(rxr: RXR): Promise<void> {
    // 根据 domain 配置决定存到 hosted 还是 mirror
    if (this.isMyDomain(rxr.locator.domain)) {
      return this.hosted.put(rxr);
    } else {
      return this.mirror.put(rxr);
    }
  }
}
```

### 存储目录结构

```
~/.resourcex/
├── hosted/                    # HostedRegistry - 自己拥有的资源
│   ├── my-company.com/
│   │   └── tool.text/
│   │       └── 1.0.0/
│   │           ├── manifest.json
│   │           └── archive.tar.gz
│   └── localhost/
│       └── my-tool.text/
│
├── cache/                     # MirrorRegistry - 缓存的远程资源
│   └── deepractice.ai/
│       └── hello.text/
│           └── 1.0.0/
│
└── linked/                    # LinkedRegistry - 软链接到开发目录
    └── localhost/
        └── my-dev.text/
            └── 1.0.0 → /path/to/dev/folder
```

## Server 模式设计

借鉴 Nexus 的三种仓库类型：

```typescript
interface ResourceXServerConfig {
  storage?: string;
  port?: number;

  // 模式
  mode: "hosted" | "proxy" | "hybrid";

  // hosted 模式：我拥有哪些 domain
  domains?: string[];

  // proxy 模式：上游地址（或使用 well-known）
  upstream?: string;
}
```

### 三种模式

| 模式     | 用途 | 暴露的资源                  |
| -------- | ---- | --------------------------- |
| `hosted` | 源站 | 只暴露 `domains` 配置的资源 |
| `proxy`  | 镜像 | 暴露所有缓存的远程资源      |
| `hybrid` | 混合 | 自己的 + 代理缓存的         |

### 示例

```typescript
// 源站：只提供自己 domain 的资源
createResourceXServer({
  mode: "hosted",
  domains: ["my-company.com"],
});

// 镜像：代理缓存远程资源
createResourceXServer({
  mode: "proxy",
});

// 混合：公司内部 + 公共镜像
createResourceXServer({
  mode: "hybrid",
  domains: ["my-company.com"],
});
```

## 包结构调整

```
packages/
├── core/        # 核心原语 (RXD, RXL, RXM, RXA, RXR)
├── arp/         # ARP I/O 协议
├── type/        # 类型系统 (BundledType, TypeHandlerChain)
├── storage/     # 底层存储 (新增)
│   ├── Storage (接口)
│   ├── FileSystemStorage
│   ├── S3Storage
│   ├── R2Storage
│   └── MemoryStorage
├── registry/    # 业务层 Registry (重构)
│   ├── Registry (接口)
│   ├── HostedRegistry
│   ├── MirrorRegistry
│   └── LinkedRegistry
├── resourcex/   # 主包
│   ├── createResourceX()       # 客户端
│   └── createResourceXServer() # 服务端
└── server/      # HTTP 层（可选独立包，或合并到 resourcex）
```

**保留 `@resourcexjs/registry` 包**，但重构为业务层：

- 底层存储 → `@resourcexjs/storage` (新增)
- 业务逻辑 → `@resourcexjs/registry` (重构: HostedRegistry, MirrorRegistry, LinkedRegistry)
- 客户端 → `resourcexjs` (createResourceX)
- 服务端 → `resourcexjs` (createResourceXServer)

**移除 `@resourcexjs/loader` 包**，加载逻辑合并到 resourcex

## 使用示例

### 场景1: AI Agent 使用资源

```typescript
const rx = createResourceX();

// 自动处理：本地缓存 → 远程拉取 → 类型解析
const tool = await rx.resolve("deepractice.ai/tools/search.tool@1.0.0");
const result = await tool.execute({ query: "hello" });
```

### 场景2: 开发者本地开发

```typescript
const rx = createResourceX();

// 链接开发目录，修改即生效
await rx.link("./my-prompt");

// 测试
const prompt = await rx.resolve("localhost/my-prompt.prompt@1.0.0");
console.log(await prompt.execute());
```

### 场景3: 发布资源

```typescript
const rx = createResourceX();

// 推送到 resource.json 定义的 domain
await rx.push("./my-prompt");
```

### 场景4: 搭建私有 Server

```typescript
const server = createResourceXServer({
  storage: "./data",
  port: 3000,
});

await server.listen();
// 自动提供 HTTP API:
// GET  /resource?locator=xxx
// GET  /content?locator=xxx
// POST /resource
```

### 场景5: 搭建镜像 Server

```typescript
const mirror = createResourceXServer({
  storage: "./mirror-cache",
  port: 3000,
  // 不配置 mirror，使用 well-known 发现源
});

await mirror.listen();

// 用户配置镜像
const rx = createResourceX({
  mirror: "https://cn.deepractice.ai",
});
```

### 场景6: 级联镜像

```typescript
// 二级镜像，指向一级镜像
const tier2Mirror = createResourceXServer({
  storage: "./tier2-cache",
  mirror: "https://cn.deepractice.ai", // 一级镜像
});
```

## 与 Git 对比

|          | Git                | ResourceX                 |
| -------- | ------------------ | ------------------------- |
| 客户端   | `git` CLI          | `createResourceX()`       |
| 服务端   | GitHub/GitLab      | `createResourceXServer()` |
| 远程概念 | remote URL         | domain (via well-known)   |
| 镜像     | git clone --mirror | Server 作为客户端自动实现 |
| 发现机制 | 手动配置 URL       | well-known 自动发现       |

## RX API 分层设计

从最小核心开始，逐步扩展：

```typescript
// ===== Level 1: 最小核心 (5 个方法) =====
interface ResourceX {
  // 本地存储
  save(rxr: RXR): Promise<void>;
  get(locator: string): Promise<RXR>;

  // 远程传输
  push(rxr: RXR): Promise<void>;
  pull(locator: string): Promise<RXR>;

  // 解析执行
  resolve(locator: string): Promise<ResolvedResource>;
}

// ===== Level 2: 完整本地操作 =====
interface ResourceX {
  // ... Level 1
  remove(locator: string): Promise<void>;
  has(locator: string): Promise<boolean>;
}

// ===== Level 3: 开发支持 =====
interface ResourceX {
  // ... Level 2
  link(path: string): Promise<void>;
  load(path: string): Promise<RXR>; // 从目录加载
}

// ===== Level 4: 搜索发现 =====
interface ResourceX {
  // ... Level 3
  search(options?: SearchOptions): Promise<RXL[]>;
}

// ===== Level 5: 类型扩展 =====
interface ResourceX {
  // ... Level 4
  supportType(type: BundledType): void;
}
```

## 验收标准

### Phase 1: Storage 层（底层 I/O）

- [ ] 创建 `@resourcexjs/storage` 包
- [ ] 定义 `Storage` 接口
- [ ] 实现 `FileSystemStorage`
- [ ] 实现 `MemoryStorage`（测试用）
- [ ] (可选) `S3Storage`, `R2Storage`

### Phase 2: Registry 层（业务逻辑）

- [ ] 重构 `@resourcexjs/registry` 包
- [ ] 定义 `Registry` 接口
- [ ] 实现 `HostedRegistry`
- [ ] 实现 `MirrorRegistry`
- [ ] 实现 `LinkedRegistry`
- [ ] 存储目录结构迁移 (hosted/cache/linked)

### Phase 3: ResourceX 客户端

- [ ] 实现 `createResourceX()` 工厂函数
- [ ] 实现 Level 1 API: save, get, push, pull, resolve
- [ ] 实现 Level 2 API: remove, has
- [ ] 实现 Level 3 API: link, load
- [ ] 实现 Level 4 API: search
- [ ] 实现 Level 5 API: supportType

### Phase 4: ResourceX Server

- [ ] 实现 `createResourceXServer()` 工厂函数
- [ ] 实现 hosted 模式
- [ ] 实现 proxy 模式
- [ ] 实现 hybrid 模式
- [ ] 实现 HTTP API 层 (GET /resource, GET /content, POST /resource)

### Phase 5: 清理和文档

- [ ] 移除 `@resourcexjs/loader` 包
- [ ] 更新 CLAUDE.md 文档
- [ ] BDD 测试覆盖
- [ ] 镜像功能测试
- [ ] 级联镜像功能测试

## 相关 Issue

- #027 - RXF 原语设计
- #015 - Registry Remote Support
- #014 - Registry HTTP Protocol
