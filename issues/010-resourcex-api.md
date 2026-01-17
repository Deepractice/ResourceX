# 010: ResourceX API Design (核心对象设计)

## Background

ResourceX 是 AI 资源管理协议的应用层 SDK（类似 npm），底层使用 ARP (Agent Resource Protocol) 进行 I/O 操作。本 issue 定义 ResourceX 的核心对象体系和 API 设计。

## Core Objects

ResourceX 定义四个核心对象，形成统一的命名体系：

| 缩写    | 全称               | 职责                       |
| ------- | ------------------ | -------------------------- |
| **RXL** | ResourceX Locator  | 定位符，解析和定位资源     |
| **RXM** | ResourceX Manifest | 元数据，描述资源信息       |
| **RXC** | ResourceX Content  | 内容，承载实际数据         |
| **RXR** | ResourceX Resource | 完整资源 = RXL + RXM + RXC |

### Object Hierarchy

```
RXR (Resource)
 ├── RXL (Locator)  → 定位：在哪里
 ├── RXM (Manifest) → 元数据：是什么
 └── RXC (Content)  → 内容：实际数据
```

## RXL - ResourceX Locator

解析定位符字符串，格式：`[domain/path/]name[.type][@version]`

```typescript
interface RXL {
  // 属性
  domain?: string; // deepractice.ai
  path?: string; // sean/team
  name: string; // assistant
  type?: string; // prompt
  version?: string; // 1.0.0

  // 方法
  toString(): string; // 还原为定位符字符串
  manifest(): Promise<RXM>; // 获取元数据
  content(): Promise<RXC>; // 获取内容
  resolve(): Promise<RXR>; // 获取完整资源
}
```

### Examples

```typescript
const rx = createResourceX({ ... });

// 解析定位符
const rxl = rx.parse("deepractice.ai/sean/assistant.prompt@1.0.0");

rxl.domain;      // "deepractice.ai"
rxl.path;        // "sean"
rxl.name;        // "assistant"
rxl.type;        // "prompt"
rxl.version;     // "1.0.0"
rxl.toString();  // "deepractice.ai/sean/assistant.prompt@1.0.0"
```

## RXM - ResourceX Manifest

资源元数据，存储在 `resource.json` 中。

```typescript
interface RXM {
  // 核心字段
  kind: string; // 资源类型
  name: string; // 资源名称
  version: string; // 版本号
  description?: string; // 描述

  // 扩展字段
  author?: string;
  license?: string;
  dependencies?: Record<string, string>;
  [key: string]: unknown; // 允许扩展

  // 方法
  validate(): boolean; // 验证 schema
  toJSON(): object; // 序列化
}
```

### Examples

```typescript
const rxm = await rxl.manifest();

rxm.kind; // "prompt"
rxm.name; // "assistant"
rxm.version; // "1.0.0"
rxm.dependencies; // { "utils": "^1.0.0" }
rxm.validate(); // true
```

## RXC - ResourceX Content

资源内容，支持多种操作。

```typescript
interface RXC {
  // 读取方法
  text(): Promise<string>; // 作为文本
  buffer(): Promise<Buffer>; // 作为 Buffer
  stream(): ReadableStream; // 流式读取
  json<T>(): Promise<T>; // 解析为 JSON

  // 写入方法
  toFile(path: string): Promise<void>; // 写入文件

  // 元信息
  size: number; // 内容大小
  type: string; // MIME 类型
}
```

### Examples

```typescript
const rxc = await rxl.content();

// 多种读取方式
const text = await rxc.text();
const buffer = await rxc.buffer();
const data = await rxc.json<PromptConfig>();

// 流式处理
const stream = rxc.stream();

// 导出到文件
await rxc.toFile("./output.txt");
```

## RXR - ResourceX Resource

完整资源对象，包含定位、元数据和内容。

```typescript
interface RXR {
  // 组成部分
  locator: RXL;
  manifest: RXM;
  content: RXC;

  // 方法
  publish(): Promise<void>; // 发布资源
}
```

### Examples

```typescript
// 获取完整资源
const rxr = await rxl.resolve();
rxr.locator; // RXL
rxr.manifest; // RXM
rxr.content; // RXC

// 创建并发布资源
const rxr = rx.create({
  locator: "sean/assistant.prompt@1.0.0",
  manifest: { kind: "prompt", name: "assistant", version: "1.0.0" },
  content: "You are an assistant...",
});
await rxr.publish();
```

## Main API

```typescript
// 创建实例
const rx = createResourceX({
  sources: [
    ".",                           // 当前目录
    "~/.resourcex/resources",      // 全局资源目录
  ],
  typeHandlers: [promptHandler, toolHandler],
});

// 核心操作
rx.parse(locator: string): RXL;                    // 解析定位符
rx.create(options: CreateOptions): RXR;            // 创建资源
rx.publish(rxr: RXR): Promise<void>;               // 发布资源
rx.discover(): Promise<RXR[]>;                     // 发现本地资源
rx.search(query: SearchQuery): Promise<RXR[]>;     // 搜索资源
rx.registerType(handler: TypeHandler): void;       // 注册类型处理器
```

## Resolution Flow

```
rx.parse(locator)
       ↓
      RXL
       ↓
  rxl.resolve()
       ↓
      RXR ─── rxr.locator  → RXL
           ├── rxr.manifest → RXM
           └── rxr.content  → RXC
```

## Publish Flow

```
rx.create({ locator, manifest, content })
       ↓
      RXR
       ↓
  rxr.publish()
       ↓
   ┌───┴───┐
   ↓       ↓
 写入     写入
manifest  content
```

## Relation to ARP

ResourceX 底层使用 ARP 进行 I/O 操作：

```
ResourceX (应用层)              ARP (协议层)
─────────────────              ────────────
RXL → 定位资源目录      →      arp:text:file:///path/resource.json
RXM → 读取 manifest     →      arp.parse(...).resolve()
RXC → 读取 content      →      arp.parse(...).resolve()
```

## Implementation Phases

### Phase 1: 基础

- [ ] RXL 解析和验证
- [ ] RXM 基础结构
- [ ] RXC 基础读取（text, buffer）
- [ ] RXR 组合

### Phase 2: 本地操作

- [ ] 本地资源发现（discover）
- [ ] 资源发布（publish）
- [ ] 文件系统存储

### Phase 3: 扩展

- [ ] RXC 流式操作
- [ ] Type Handler 注册
- [ ] 搜索功能

---

**Status**: Open
**Priority**: High
**Labels**: design, api, core
**Depends on**: 008-resource-locator
