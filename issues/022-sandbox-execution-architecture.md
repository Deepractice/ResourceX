# Issue 022: Sandbox 执行架构

## 背景

ResourceX 需要支持在隔离环境中执行 resolver 代码。目标是：

1. **Registry 部署在 Cloudflare Workers** - 轻算力、低成本
2. **计算转嫁到 Sandbox** - Registry 只做存储和调度
3. **Sandbox 无状态** - 接收 (code, data)，返回 result

## 核心概念

### 架构总览

```
┌──────────────────────────────────────────────────────────────────┐
│ 开发者机器                                                        │
│                                                                  │
│ 1. 写 resolver.ts（可 import 任意依赖）                           │
│ 2. bundleResourceType() → BundledType（包含所有依赖的代码字符串）   │
│ 3. publish RXR + BundledType                                     │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼
┌──────────────────────────────────────────────────────────────────┐
│ Registry (Cloudflare Workers) - 轻算力                            │
│                                                                  │
│ 职责：                                                            │
│ - 存储：RXR (manifest + archive) + BundledType                   │
│ - 调度：收到 resolve 请求 → 发给 Sandbox 执行                      │
│                                                                  │
│ 不做：                                                            │
│ - 不做 bundle（CF Workers 没有 Bun/esbuild）                      │
│ - 不执行 resolver 代码                                            │
└──────────────────────┬───────────────────────────────────────────┘
                       │
                       ▼ 发送 code + data
┌──────────────────────────────────────────────────────────────────┐
│ Sandbox (SandboX) - 无状态计算                                    │
│                                                                  │
│ 输入：                                                            │
│ - BundledType.code（已 bundle 的 resolver 代码）                  │
│ - RXR 数据（manifest JSON + archive Buffer）                      │
│ - args（执行参数）                                                 │
│                                                                  │
│ 执行：                                                            │
│ - 读取数据，重建 RXR 对象                                         │
│ - 调用 resolver.resolve(rxr, args)                               │
│                                                                  │
│ 输出：                                                            │
│ - 执行结果                                                        │
└──────────────────────────────────────────────────────────────────┘
```

### 关键设计决策

#### 1. Bundle 时机：Publish 前

```
❌ Registry 运行时 bundle
   - CF Workers 没有 Bun/esbuild
   - 无法在 CF 上部署

✅ Publish 前 bundle（开发者机器上）
   - 类似 npm publish，上传已构建的代码
   - Registry 只存储，不构建
```

#### 2. BundledType.code 内容：完全自包含

```typescript
// resolver.type.ts - 用户写的源码
import { createRXA, createRXM } from "@resourcexjs/core";
import Handlebars from "handlebars";

export default {
  name: "prompt",
  async resolve(rxr) {
    const pkg = await rxr.archive.extract();
    const template = (await pkg.file("template.hbs")).toString();
    return Handlebars.compile(template);
  },
};

// ↓ bundleResourceType()

// BundledType.code - bundle 后的代码
// 包含：
// - @resourcexjs/core 的 createRXA, createRXM, parseRXL
// - handlebars 库
// - resolver 逻辑
// 完全自包含，无外部依赖
```

#### 3. 类型注册：统一入口，无内置

```typescript
// ❌ 之前：TypeHandlerChain 默认注册 builtinTypes
const chain = TypeHandlerChain.create(); // 自动有 text/json/binary

// ✅ 之后：默认什么都没有，全部显式传入
const registry = createRegistry({
  types: [textType, jsonType, binaryType],
});
```

**好处**：

- 统一入口，用户完全控制
- 没有隐式行为
- 按需加载，不用的类型不传

**我们提供**：

- `textType`, `jsonType`, `binaryType` - 预 bundle 好的常用类型
- `builtinTypes` - 方便一次性导入

```typescript
import { createRegistry, builtinTypes } from "resourcexjs";

// 用法 1：全部内置类型
const registry = createRegistry({ types: builtinTypes });

// 用法 2：只用部分
const registry = createRegistry({ types: [textType] });

// 用法 3：内置 + 自定义
const registry = createRegistry({
  types: [...builtinTypes, myPromptType],
});
```

#### 4. 平台兼容性：V8 vs Node.js

Cloudflare Workers 运行在 V8 上，不是 Node.js：

| API           | Node.js | CF Workers (V8)  |
| ------------- | ------- | ---------------- |
| `Buffer`      | ✅ 原生 | ❌ 需要 polyfill |
| `fs`          | ✅ 原生 | ❌ 没有          |
| `TextDecoder` | ✅      | ✅               |
| `Uint8Array`  | ✅      | ✅               |

**解决方案**：

- Resolver 代码使用跨平台 API（TextDecoder, Uint8Array）
- 或 bundle 时注入 Buffer polyfill

## 数据传递

### RXR 如何传入 Sandbox

```typescript
// SandboX API
sandbox.upload(buffer, path); // 上传二进制
sandbox.fs.write(path, data); // 写文件
sandbox.evaluate(code); // 执行代码

// 传入 RXR 数据
await sandbox.upload(archiveBuffer, "/tmp/archive.tar.gz");
await sandbox.fs.write("/tmp/manifest.json", JSON.stringify(manifest));
```

### 执行流程

```typescript
// Registry 调用 Sandbox
async function executeInSandbox(bundledType: BundledType, rxr: RXR, args?: unknown) {
  const sandbox = createSandbox({
    isolator: bundledType.sandbox ?? "none",
    runtime: "node",
  });

  try {
    // 1. 上传 RXR 数据
    const archiveBuffer = await rxr.archive.buffer();
    await sandbox.upload(archiveBuffer, "/tmp/archive.tar.gz");
    await sandbox.fs.write("/tmp/manifest.json", JSON.stringify(rxr.manifest.toJSON()));

    // 2. 执行 bundled code
    const { value } = await sandbox.evaluate(`
      ${bundledType.code}

      // 读取数据
      const fs = require('fs');
      const manifestData = JSON.parse(fs.readFileSync('/tmp/manifest.json', 'utf-8'));
      const archiveBuffer = fs.readFileSync('/tmp/archive.tar.gz');

      // 重建 RXR（createRXM, createRXA 已在 bundled code 中）
      const manifest = createRXM(manifestData);
      const archive = await createRXA({ buffer: archiveBuffer });
      const locator = parseRXL(manifest.toLocator());
      const rxr = { locator, manifest, archive };

      // 执行 resolver
      const args = ${JSON.stringify(args)};
      return await resolver.resolve(rxr, args);
    `);

    return value;
  } finally {
    await sandbox.destroy();
  }
}
```

## Bundler 设计

### bundleResourceType()

```typescript
// packages/type/src/bundler.ts

export async function bundleResourceType(sourcePath: string): Promise<BundledType> {
  // 1. 读取源文件
  const source = await readFile(sourcePath, "utf-8");

  // 2. 使用 Bun.build bundle（包含所有依赖）
  const result = await Bun.build({
    stdin: { contents: source, loader: "ts" },
    target: "browser", // 确保 V8 兼容
    format: "esm",
    bundle: true, // 打包所有依赖
    minify: true,
  });

  // 3. 提取元数据
  const module = await import(sourcePath);
  const typeSource = module.default;

  // 4. 返回 BundledType
  return {
    name: typeSource.name,
    aliases: typeSource.aliases,
    description: typeSource.description,
    schema: typeSource.schema,
    code: await result.outputs[0].text(),
    sandbox: typeSource.sandbox ?? "none",
  };
}
```

### 内置类型的 Bundle

内置类型（text/json/binary）也需要真正 bundle：

```typescript
// packages/type/src/builtins/text.type.ts
import { createRXM, createRXA, parseRXL } from "@resourcexjs/core";

export default {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  sandbox: "none",

  async resolve(rxr) {
    const pkg = await rxr.archive.extract();
    const buffer = await pkg.file("content");
    return new TextDecoder().decode(buffer); // 跨平台 API
  },
};
```

**Build 时**：预先 bundle 这些文件，生成 `builtinTypes.ts`。

## 接口变更

### BundledType

```typescript
interface BundledType {
  name: string;
  aliases?: string[];
  description: string;
  schema?: JSONSchema;
  code: string; // 完全自包含的 bundled 代码
  sandbox?: SandboxType; // "none" | "isolated" | "container"
}
```

### ResolvedResource

```typescript
interface ResolvedResource<TArgs = void, TResult = unknown> {
  resource: RXR;
  type: BundledType; // 新增：关联的类型
  schema?: JSONSchema;
  execute: (args?: TArgs) => Promise<TResult>;
}
```

### createRegistry

```typescript
interface RegistryConfig {
  storage?: Storage;
  mirror?: string;
  types: BundledType[]; // 必传，无默认值
}

// 用法
const registry = createRegistry({
  types: builtinTypes,
});
```

### TypeHandlerChain

```typescript
class TypeHandlerChain {
  // 改动：create() 不再自动注册 builtinTypes
  static create(): TypeHandlerChain {
    return new TypeHandlerChain(); // 空的
  }

  // 用户显式注册
  register(type: BundledType): void;
}
```

## 实现步骤

### Phase 1: 重构类型注册

1. [ ] 修改 `TypeHandlerChain.create()` - 不自动注册 builtinTypes
2. [ ] 修改 `createRegistry()` - types 参数必传
3. [ ] 更新 builtinTypes 导出 - 提供预 bundle 的类型

### Phase 2: 真正 Bundle 内置类型

1. [ ] 创建 `packages/type/src/builtins/` 目录
2. [ ] 编写 `text.type.ts`, `json.type.ts`, `binary.type.ts`
3. [ ] 使用跨平台 API（TextDecoder 代替 Buffer.toString）
4. [ ] Build 时预先 bundle 生成 `builtinTypes.ts`

### Phase 3: 集成 SandboX

1. [ ] 添加 `sandboxxjs` 依赖
2. [ ] 实现 `executeInSandbox()` 函数
3. [ ] 修改 `TypeHandlerChain.executeCode()` - 根据 sandbox 级别选择执行方式：
   - `none`: 当前方式（AsyncFunction）或 SandboX none isolator
   - `isolated`: SandboX srt isolator
   - `container`: SandboX cloudflare isolator

### Phase 4: 测试

1. [ ] 单元测试：bundler 正确打包依赖
2. [ ] 集成测试：sandbox 执行返回正确结果
3. [ ] BDD 测试：完整流程

## 待讨论问题

1. **Bundler 选择**：Bun.build vs esbuild？
   - Bun.build 需要 Bun 运行时
   - esbuild 更通用

2. **Sandbox 选择**：什么时候用哪个 isolator？
   - 内置类型：none（可信代码）
   - 用户类型：isolated（默认）
   - 不可信代码：container

3. **错误处理**：Sandbox 执行失败怎么处理？
   - 超时
   - 内存溢出
   - 代码错误

## 参考

- [SandboX](https://github.com/Deepractice/SandboX) - 多语言安全执行沙箱
- [Cloudflare Workers](https://developers.cloudflare.com/workers/) - 边缘计算平台
- [Issue 020](./020-resolver-sandbox-architecture.md) - 原始 sandbox 设计
- [Issue 021](./021-registry-cache-source-architecture.md) - Registry 架构
