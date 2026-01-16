<div align="center">
  <h1>ResourceX</h1>
  <p>
    <strong>基于 ARP 协议的 AI Agent 统一资源管理器</strong>
  </p>
  <p>Unified resource manager for AI Agents based on ARP</p>

  <p>
    <b>统一访问</b> · <b>原生协议</b> · <b>完全可扩展</b>
  </p>
  <p>
    <b>Unified Access</b> · <b>Web Native</b> · <b>Fully Extensible</b>
  </p>

  <p>
    <a href="https://github.com/Deepractice/ResourceX"><img src="https://img.shields.io/github/stars/Deepractice/ResourceX?style=social" alt="Stars"/></a>
    <img src="https://visitor-badge.laobi.icu/badge?page_id=Deepractice.ResourceX" alt="Views"/>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/ResourceX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/resourcexjs"><img src="https://img.shields.io/npm/v/resourcexjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>

  <p>
    <a href="README.md">English</a> |
    <a href="README.zh-CN.md"><strong>简体中文</strong></a>
  </p>
</div>

---

## 为什么需要 ResourceX？

AI Agent 需要从不同来源访问资源：本地文件读取配置、远程 URL 获取提示词、云存储读取训练数据。每种来源都需要不同的代码：

```typescript
// 不同来源 = 不同代码
const localConfig = await fs.readFile("./config.txt", "utf-8");
const remotePrompt = await fetch("https://api.example.com/prompt.txt").then((r) => r.text());
const s3Data = await s3Client.getObject({ Bucket: "...", Key: "..." });
```

**ResourceX 用统一协议解决这个问题**：一套 API 访问所有资源，无论来源和类型。

```typescript
// 一套 API 搞定所有
const config = await rx.resolve("arp:text:file://./config.txt");
const prompt = await rx.resolve("arp:text:https://api.example.com/prompt.txt");
const data = await rx.resolve("arp:binary:s3://bucket/data.bin");
```

## 快速开始

```bash
npm install resourcexjs
```

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// 读取文本文件
const resource = await rx.resolve("arp:text:file://./hello.txt");
console.log(resource.content); // "Hello World"
```

## 核心功能

### Resolve（读取资源）

```typescript
// 远程文本
const text = await rx.resolve("arp:text:https://example.com/file.txt");
console.log(text.content); // string

// 本地二进制
const image = await rx.resolve("arp:binary:file://./photo.png");
console.log(image.content); // Buffer
```

### Deposit（写入资源）

```typescript
// 写入文本到本地文件
await rx.deposit("arp:text:file://./config.txt", "hello world");

// 写入二进制数据
await rx.deposit("arp:binary:file://./image.png", imageBuffer);
```

### Exists & Delete（检查和删除）

```typescript
// 检查资源是否存在
const exists = await rx.exists("arp:text:file://./config.txt");

// 删除资源
await rx.delete("arp:text:file://./config.txt");
```

## 工作原理

ResourceX 使用 **ARP (Agent Resource Protocol)** 协议，一种将**资源类型**与**访问方式**分离的 URL 格式：

```
arp:{semantic}:{transport}://{location}
```

- **semantic**: 资源是什么（`text`、`binary`）
- **transport**: 如何访问（`https`、`http`、`file`）
- **location**: 资源位置

### Semantic + Transport = 正交组合

Semantic 和 Transport 可以任意组合：

| Semantic | Transport | 示例                                        |
| -------- | --------- | ------------------------------------------- |
| `text`   | `file`    | `arp:text:file://./config.txt`              |
| `text`   | `https`   | `arp:text:https://example.com/data.txt`     |
| `binary` | `file`    | `arp:binary:file://./image.png`             |
| `binary` | `s3`      | `arp:binary:s3://bucket/data.bin`（自定义） |

### 内置 Handler

**Semantic:**

| 名称     | 内容类型 | 描述                 |
| -------- | -------- | -------------------- |
| `text`   | `string` | 纯文本（UTF-8 编码） |
| `binary` | `Buffer` | 原始二进制（无转换） |

**Transport:**

| 名称    | 能力            | 描述         |
| ------- | --------------- | ------------ |
| `https` | 读              | HTTPS 协议   |
| `http`  | 读              | HTTP 协议    |
| `file`  | 读/写/列表/删除 | 本地文件系统 |

## Resource 定义

厌倦了重复写长 URL？定义快捷方式：

```typescript
import { createResourceX } from "resourcexjs";
import { join } from "path";
import { homedir } from "os";

const rx = createResourceX({
  resources: [
    {
      name: "app-config",
      semantic: "text",
      transport: "file",
      basePath: join(homedir(), ".myapp", "config"),
    },
  ],
});

// 简洁清晰
await rx.deposit("app-config://settings.txt", "theme=dark");

// 而不是
await rx.deposit("arp:text:file://~/.myapp/config/settings.txt", "theme=dark");
```

## 可扩展性

### 自定义 Transport

添加新的传输协议（S3、GCS、Redis 等）：

```typescript
rx.registerTransport({
  name: "s3",
  capabilities: { canRead: true, canWrite: true, canList: true, canDelete: true, canStat: false },
  async read(location: string): Promise<Buffer> {
    // 你的 S3 实现
    return buffer;
  },
  async write(location: string, content: Buffer): Promise<void> {
    // 你的 S3 实现
  },
});

// 使用
await rx.resolve("arp:text:s3://bucket/key.txt");
```

### 自定义 Semantic

添加新的语义类型（JSON、YAML、Image 等）：

```typescript
rx.registerSemantic({
  name: "json",
  async resolve(transport, location, context) {
    const buffer = await transport.read(location);
    return {
      type: "json",
      content: JSON.parse(buffer.toString()),
      meta: { ...context, size: buffer.length, resolvedAt: context.timestamp.toISOString() },
    };
  },
  async deposit(transport, location, data, context) {
    const buffer = Buffer.from(JSON.stringify(data));
    await transport.write(location, buffer);
  },
});

// 使用
const data = await rx.resolve("arp:json:https://api.example.com/data.json");
console.log(data.content); // 解析后的对象
```

## CLI

```bash
npm install -g @resourcexjs/cli

# 解析并打印内容
arp "arp:text:https://example.com/file.txt"

# 解析 URL 组件
arp parse "arp:text:https://example.com/file.txt"

# 输出为 JSON
arp "arp:text:https://example.com/file.txt" --json
```

## 包结构

| 包                                     | 描述       |
| -------------------------------------- | ---------- |
| [`resourcexjs`](./packages/resourcex)  | 主包       |
| [`@resourcexjs/core`](./packages/core) | 核心实现   |
| [`@resourcexjs/cli`](./packages/cli)   | 命令行工具 |

## 生态系统

[Deepractice](https://github.com/Deepractice) AI Agent 基础设施的一部分：

- **[PromptX](https://github.com/Deepractice/PromptX)** - AI Agent 上下文平台
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent 运行时平台
- **[ToolX](https://github.com/Deepractice/ToolX)** - 工具集成
- **[UIX](https://github.com/Deepractice/UIX)** - AI-to-UI 协议层
- **[SandboX](https://github.com/Deepractice/SandboX)** - Agent 沙箱

## 参与贡献

查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 了解开发设置和指南。

## 许可证

[MIT](./LICENSE)

---

<div align="center">
  <p>
    Built with ❤️ by <a href="https://github.com/Deepractice">Deepractice</a>
  </p>
</div>
