# Feature: Type as Resource (元类型)

> **状态：暂缓**
>
> 经过讨论，此 feature 暂缓实现。原因见下方"暂缓原因"。

## 背景

目前 ResourceX 有 3 个内置类型：`text`, `json`, `binary`。

为了实现"一切皆资源"的设计理念，提议增加一个内置类型：`type`（元类型），使得新类型的定义本身也是资源。

## 目标

```
# 类型定义也是资源
localhost/types/prompt.type@1.0.0     # prompt 类型的定义

# 使用这些类型的资源
localhost/sean/hello.prompt@1.0.0     # 一个 prompt 资源
```

## 暂缓原因

### 核心问题：类型定义需要代码

`ResourceType` 包含 `serializer` 和 `resolver`，这两个是**代码**（函数），不是数据：

```typescript
interface ResourceType<T> {
  name: string;
  description: string;
  serializer: {
    serialize(rxr: RXR): Promise<Buffer>; // 代码
    deserialize(data: Buffer, manifest: RXM): Promise<RXR>; // 代码
  };
  resolver: {
    resolve(rxr: RXR): Promise<T>; // 代码
  };
}
```

如果用 JSON 存储类型定义，无法表达 serializer/resolver 的代码逻辑。

### 可能的解决方案

`typeType` 本质上是一个**代码包**：

```typescript
// prompt.type 资源的内容（代码）
export default {
  name: "prompt",
  description: "AI Prompt template",
  serializer: { ... },
  resolver: { ... },
} satisfies ResourceType;
```

但这带来新问题：

- **安全性**：执行不可信代码
- **代码格式**：ESM、CommonJS、WASM？
- **依赖管理**：代码可能依赖其他模块

这本质上是一个**插件系统**，超出了当前 ResourceX 的范围。

## 当前方案

1. **保持现状**：内置类型 `text`, `json`, `binary`
2. **代码定义类型**：用户通过 `defineResourceType()` 在代码中定义新类型
3. **包分发**：类型通过 npm/bun 包分发，如 `@resourcex/type-prompt`

```typescript
// 用户代码
import { promptType } from "@resourcex/type-prompt";
import { defineResourceType } from "resourcexjs";

defineResourceType(promptType);
```

## 未来计划

当 ResourceX 有了完整的包/插件系统后，可以重新考虑此 feature：

1. **resourceTypePackage**：类型作为代码包资源
2. **安全沙箱**：安全执行代码
3. **依赖解析**：处理代码依赖

## 相关

- AgentVM 可以通过 npm 包方式提供 `prompt`, `tool`, `agent` 类型
