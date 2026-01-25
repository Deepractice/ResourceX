# Issue 020: Resolver + Sandbox + Registry 架构设计

## 背景

当前 ResourceX 的 resolve 流程在主进程中执行，没有隔离。需要引入 Sandbox 机制，让 Resolver 代码在隔离环境中执行。

## 设计决策

### 已完成

- [x] 移除 serializer（统一使用 archive.buffer() 存储）

### 核心决策

1. **ResourceType 整体 Serverless 化**：整个 type 定义变成可执行代码文件
2. **Bundle 与 Registry 分离**：先 bundle，再传给 registry
3. **Sandbox 隔离级别**：通过 `sandbox` 字段控制（none / isolated / container）

## 三层架构

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Resource (静态数据)                                                     │
│  ├── RXL (Locator)                                                      │
│  ├── RXM (Manifest)                                                     │
│  └── RXA (Archive) / RXP (Package)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  ResourceType (类型定义 - 源代码文件)                                    │
│  ├── name, aliases, description (元数据)                                │
│  ├── schema (参数 schema)                                               │
│  └── resolve() (执行函数 - 源代码)                                      │
├─────────────────────────────────────────────────────────────────────────┤
│  Registry + Sandbox (运行时)                                            │
│  ├── 接受 BundledType[] (预打包的类型)                                  │
│  ├── sandbox 字段控制隔离级别                                           │
│  └── resolve() 时发送到 sandbox 执行                                    │
└─────────────────────────────────────────────────────────────────────────┘
```

## 类型定义

### BundledType

```typescript
interface BundledType {
  name: string;
  aliases?: string[];
  description: string;
  schema?: JSONSchema;
  code: string; // bundled resolve 函数
  sandbox?: SandboxType; // 隔离级别，默认 "none"
}

type SandboxType = "none" | "isolated" | "container";
```

### ResourceType 源码格式

```typescript
// text.type.ts - 整个文件就是 type 定义
export default {
  name: "text",
  aliases: ["txt", "plaintext"],
  description: "Plain text content",
  schema: undefined,

  async resolve(rxr: RXR): Promise<string> {
    const pkg = await rxr.archive.extract();
    const buffer = await pkg.file("content");
    return buffer.toString("utf-8");
  },
};
```

## API 设计

### Bundle API

```typescript
// @resourcexjs/type 导出

// 1. 预 bundle 好的内置类型（build time 打包）
export const builtinTypes: BundledType[];

// 2. Bundle 自定义类型
export async function bundleResourceType(source: string): Promise<BundledType>;
// source: 文件路径 或 源代码字符串

// 3. 批量 bundle
export async function bundleResourceTypes(sources: string[]): Promise<BundledType[]>;
```

### Registry API

```typescript
// @resourcexjs/registry

interface RegistryConfig {
  path?: string;
  types?: BundledType[]; // 只接受 bundled types
}

// 创建 registry
const registry = createRegistry({
  types: [
    ...builtinTypes, // 内置的，已 bundle
    ...myBundledTypes, // 自定义的，已 bundle
  ],
});
```

## 执行流程

```typescript
class LocalRegistry {
  private types: Map<string, BundledType>;
  private sandbox: Sandbox;

  constructor(config: { types: BundledType[] }) {
    // 注册 bundled types
    for (const type of config.types) {
      this.types.set(type.name, type);
      for (const alias of type.aliases ?? []) {
        this.types.set(alias, type);
      }
    }
  }

  async resolve(locator: string): Promise<ResolvedResource> {
    // 1. 获取 RXR
    const rxr = await this.get(locator);

    // 2. 找到对应的 bundled type
    const type = this.types.get(rxr.manifest.type);
    if (!type) throw new Error(`Unsupported type`);

    // 3. 返回 ResolvedResource，execute 是 sandbox 代理
    return {
      resource: rxr,
      schema: type.schema,
      execute: async (args) => {
        // 根据 sandbox 级别执行
        const level = type.sandbox ?? "none";
        return this.sandbox.execute(
          type.code,
          {
            rxr: serialize(rxr),
            args,
          },
          { level }
        );
      },
    };
  }
}
```

## RXR 序列化

```typescript
// RXR 结构可序列化
interface SerializedRXR {
  locator: string; // rxr.locator.toString()
  manifest: object; // rxr.manifest.toJSON()
  archive: Buffer; // rxr.archive.buffer()
}

// Sandbox 内部反序列化
function deserializeRXR(data: SerializedRXR): RXR {
  return {
    locator: parseRXL(data.locator),
    manifest: createRXM(data.manifest),
    archive: createRXA({ buffer: data.archive }),
  };
}
```

## Bundle 时机

| 类型       | Bundle 时机                   | 说明                                 |
| ---------- | ----------------------------- | ------------------------------------ |
| 内置类型   | Build time                    | 发布 @resourcexjs/type 时预先 bundle |
| 自定义类型 | 用户调用 bundleResourceType() | 运行前一次性 bundle                  |

## Sandbox 隔离级别

| 级别        | 说明               | 使用场景           |
| ----------- | ------------------ | ------------------ |
| `none`      | 直接在当前进程执行 | 内置类型、可信代码 |
| `isolated`  | 隔离的 JS 运行时   | 用户自定义类型     |
| `container` | 完全隔离的容器     | 不可信代码         |

## 实现步骤

### Phase 1: BundledType 基础

1. 定义 `BundledType` 接口
2. 实现 `bundleResourceType()` 函数
3. 预 bundle 内置类型（text/json/binary）
4. 导出 `builtinTypes`

### Phase 2: Registry 适配

1. 修改 `createRegistry()` 接受 `types: BundledType[]`
2. 移除 `supportType()` 方法
3. 实现 execute 代理（sandbox: "none" 先行）

### Phase 3: Sandbox 集成

1. 集成 SandboX 包
2. 实现 `isolated` 模式
3. 实现 `container` 模式

## 待定问题

1. **Bundler 实现**：用 esbuild / bun build？
2. **依赖处理**：resolve 函数的依赖如何 bundle？
3. **SandboX 接口**：如何与 sandboxxjs 集成？

## 参考

- Cloudflare Workers 模式
- Serverless 函数执行模型
