# Provider Architecture

## 背景

当前 ResourceX 存在平台耦合问题：

1. **core 包**依赖 Node.js（fs、crypto）
2. **server 包**写死了 FileSystemStorage
3. **resourcexjs** 直接使用 Node.js 特定实现

这导致无法在其他平台（Cloudflare Workers、Deno、浏览器）运行。

## 目标

- **core** = 纯逻辑，零平台依赖
- **resourcexjs** = SDK + Server，通过 Provider 注入平台实现
- 统一的 API，不同平台只需切换入口

## 设计方案

### Provider 接口（定义在 core）

```typescript
/**
 * ResourceX Provider - 平台方实现
 */
interface ResourceXProvider {
  /**
   * 平台标识
   */
  readonly platform: string; // 'node' | 'bun' | 'cloudflare' | 'deno'

  /**
   * 创建存储
   */
  createStores(config: ProviderConfig): ProviderStores;

  /**
   * 创建资源加载器（可选，用于从文件夹加载）
   */
  createLoader?(config: ProviderConfig): ResourceLoader;
}

interface ProviderConfig {
  /**
   * 存储路径或连接信息
   */
  path?: string;

  /**
   * 平台特定配置
   */
  [key: string]: unknown;
}

interface ProviderStores {
  rxaStore: RXAStore;
  rxmStore: RXMStore;
}
```

### resourcexjs 包结构

```
resourcexjs/
├── index.ts                    # 基础 API（需先 setProvider）
├── node.ts                     # Node.js 入口（自动注入 Provider）
├── bun.ts                      # Bun 入口
├── cloudflare.ts               # Cloudflare Workers 入口
├── deno.ts                     # Deno 入口
│
├── core/
│   ├── provider.ts             # setProvider / getProvider
│   ├── createResourceX.ts      # SDK 实现
│   └── createResourceXServer.ts # Server 实现
│
└── providers/
    ├── node/
    │   ├── NodeProvider.ts
    │   ├── FileSystemRXAStore.ts
    │   └── SQLiteRXMStore.ts
    │
    ├── cloudflare/
    │   ├── CloudflareProvider.ts
    │   ├── R2RXAStore.ts
    │   └── D1RXMStore.ts
    │
    └── memory/
        └── MemoryProvider.ts   # 测试用
```

### API 设计

```typescript
// ===== 基础 API (resourcexjs/index.ts) =====

// Provider 管理
export function setProvider(provider: ResourceXProvider): void;
export function getProvider(): ResourceXProvider;

// SDK
export function createResourceX(config?: ResourceXConfig): ResourceX;

// Server
export function createResourceXServer(config?: ServerConfig): Hono;

// 类型导出
export type { ResourceX, ResourceXConfig, ResourceXProvider };
```

```typescript
// ===== 平台入口 (resourcexjs/node.ts) =====

import { setProvider } from "./index.js";
import { NodeProvider } from "./providers/node/index.js";

// 自动注入 Node.js Provider
setProvider(new NodeProvider());

// 重导出所有 API
export * from "./index.js";
```

### 用户使用

```typescript
// ===== 方式 1: 平台入口（推荐）=====
import { createResourceX, createResourceXServer } from "resourcexjs/node";

// SDK
const rx = createResourceX({
  registry: "https://registry.example.com",
});

await rx.add("./my-resource");
await rx.use("hello:1.0.0");

// Server
const server = createResourceXServer({ port: 3000 });
Bun.serve({ fetch: server.fetch, port: 3000 });
```

```typescript
// ===== 方式 2: 手动注入 =====
import { setProvider, createResourceX } from 'resourcexjs';
import { NodeProvider } from 'resourcexjs/providers/node';

setProvider(new NodeProvider());

const rx = createResourceX({ ... });
```

```typescript
// ===== 方式 3: 自定义 Provider =====
import { setProvider, createResourceX } from 'resourcexjs';

const customProvider: ResourceXProvider = {
  platform: 'custom',
  createStores(config) {
    return {
      rxaStore: new MyCustomRXAStore(),
      rxmStore: new MyCustomRXMStore(),
    };
  },
};

setProvider(customProvider);
const rx = createResourceX({ ... });
```

### Cloudflare Workers 示例

```typescript
// worker.ts
import { createResourceXServer } from "resourcexjs/cloudflare";

export default {
  fetch: createResourceXServer({
    // R2 和 D1 由 Cloudflare 运行时提供
  }).fetch,
};
```

```typescript
// CloudflareProvider.ts
class CloudflareProvider implements ResourceXProvider {
  readonly platform = "cloudflare";

  constructor(private env: { R2: R2Bucket; D1: D1Database }) {}

  createStores() {
    return {
      rxaStore: new R2RXAStore(this.env.R2),
      rxmStore: new D1RXMStore(this.env.D1),
    };
  }

  // Cloudflare Workers 无文件系统，不提供 loader
  createLoader() {
    return undefined;
  }
}
```

## 包结构变更

### 之前

```
packages/
├── core/           # 有平台依赖
├── storage/        # FileSystem, Memory
├── server/         # 独立包，写死 FileSystem
└── resourcexjs/    # SDK
```

### 之后

```
packages/
├── core/           # 纯逻辑，零平台依赖
│   ├── model/
│   ├── type/
│   └── registry/   # CASRegistry + SPI 接口
│
└── resourcexjs/    # SDK + Server + Providers
    ├── index.ts
    ├── node.ts
    ├── cloudflare.ts
    ├── core/
    └── providers/
```

**删除：**

- `@resourcexjs/storage` → 移到 providers
- `@resourcexjs/server` → 合并到 resourcexjs

## 实现步骤

### Phase 1: 接口定义

- [ ] 在 core 中定义 `ResourceXProvider` 接口
- [ ] 导出 Provider 相关类型

### Phase 2: resourcexjs 重构

- [ ] 实现 `setProvider` / `getProvider`
- [ ] 重构 `createResourceX` 使用 Provider
- [ ] 合并 server 到 resourcexjs，实现 `createResourceXServer`

### Phase 3: Node.js Provider

- [ ] 实现 `FileSystemRXAStore`
- [ ] 实现 `SQLiteRXMStore`（或 FileSystemRXMStore）
- [ ] 实现 `NodeProvider`
- [ ] 创建 `resourcexjs/node` 入口

### Phase 4: 清理

- [ ] 删除 `@resourcexjs/storage` 包
- [ ] 删除 `@resourcexjs/server` 包
- [ ] 移除 core 中的平台依赖
- [ ] 更新文档和示例

### Phase 5: 其他平台（可选）

- [ ] Memory Provider（测试用）
- [ ] Cloudflare Provider
- [ ] Deno Provider

## 兼容性

- 对外 API 保持不变（`createResourceX`）
- 用户只需改 import 路径：

  ```typescript
  // 之前
  import { createResourceX } from "resourcexjs";

  // 之后
  import { createResourceX } from "resourcexjs/node";
  ```

## 相关 Issues

- #030 - Content-Addressable Storage（已实现 CASRegistry）
