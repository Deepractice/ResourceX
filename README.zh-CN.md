<div align="center">
  <h1>ResourceX</h1>
  <p><strong>AI 资源的包管理器</strong></p>
  <p>让 Claude 使用你的 prompts、tools、agents</p>

  <p>
    <a href="https://github.com/Deepractice/ResourceX"><img src="https://img.shields.io/github/stars/Deepractice/ResourceX?style=social" alt="Stars"/></a>
    <a href="LICENSE"><img src="https://img.shields.io/github/license/Deepractice/ResourceX?color=blue" alt="License"/></a>
    <a href="https://www.npmjs.com/package/resourcexjs"><img src="https://img.shields.io/npm/v/resourcexjs?color=cb3837&logo=npm" alt="npm"/></a>
  </p>

  <p>
    <a href="README.md">English</a> |
    <a href="README.zh-CN.md"><strong>简体中文</strong></a>
  </p>
</div>

---

## 为什么选择 ResourceX？

你的 prompts、tools、agent 配置散落在各处——文件里、Notion 里、脑子里。ResourceX 提供：

- **统一格式**打包任何 AI 资源
- **版本控制**，像 npm 包一样管理
- **MCP 集成**，让 Claude 直接使用你的资源

简单说，**AI 资源的 npm**。

---

## 2 分钟开始

### 1. 配置 MCP

**Claude Desktop** (`~/.claude/claude_desktop_config.json`):

```json
{
  "mcpServers": {
    "resourcex": {
      "command": "npx",
      "args": ["@resourcexjs/mcp-server"]
    }
  }
}
```

**VS Code** (Claude 扩展设置):

```json
{
  "claude.mcpServers": {
    "resourcex": {
      "command": "npx",
      "args": ["@resourcexjs/mcp-server"]
    }
  }
}
```

### 2. 在 Claude 中使用

```
You: 搜索 code review 相关的资源
Claude: [调用 search("code review")] 找到以下资源...

You: 用 code-review:1.0.0 审查这段代码
Claude: [调用 use("code-review:1.0.0")] 好的，让我用这个 prompt 来审查...
```

就这样，Claude 现在可以访问和使用 ResourceX 资源了。

---

## 进阶用法

<details>
<summary><b>创建自己的资源</b></summary>

```bash
# 创建资源目录
mkdir my-prompt && cd my-prompt

# 创建元信息
cat > resource.json << 'EOF'
{
  "name": "my-prompt",
  "type": "text",
  "version": "1.0.0"
}
EOF

# 创建内容
echo "You are a helpful assistant specialized in..." > content

# 添加到本地
npx @resourcexjs/cli add .
```

</details>

<details>
<summary><b>使用 CLI 管理资源</b></summary>

```bash
# 安装
npm install -g @resourcexjs/cli

# 常用命令
rx add ./my-prompt      # 添加本地资源
rx list                 # 列出所有资源
rx use name:1.0.0       # 使用资源
rx search keyword       # 搜索资源
rx push name:1.0.0      # 发布到 registry
rx pull name:1.0.0      # 从 registry 拉取
```

详见 [CLI 文档](./apps/cli/README.md)

</details>

<details>
<summary><b>在代码中使用 SDK</b></summary>

```bash
npm install resourcexjs
```

```typescript
import { createResourceX } from "resourcexjs";

const rx = createResourceX();

// 添加资源
await rx.add("./my-prompt");

// 解析并执行
const result = await rx.resolve("my-prompt:1.0.0");
console.log(result.content);

// 搜索资源
const results = await rx.search("code review");
```

详见 [SDK 文档](./packages/resourcex/README.md)

</details>

<details>
<summary><b>自托管 Registry</b></summary>

```typescript
import { createRegistryServer } from "@resourcexjs/server";

const app = createRegistryServer({
  storagePath: "./data",
});

export default app; // 部署到任何支持 Hono 的平台
```

详见 [Server 文档](./packages/server/README.md)

</details>

---

## 文档

**教程** - 入门指南

- [快速开始](./docs/tutorials/quick-start.md) - 2 分钟上手
- [创建第一个资源](./docs/tutorials/first-resource.md) - 创建、测试、本地使用
- [发布资源](./docs/tutorials/publish-resource.md) - 通过 Registry 分享

**指南** - 特定任务

- [MCP 集成](./docs/guides/mcp-integration.md) - 配置 AI Agent
- [开发工作流](./docs/guides/development-workflow.md) - link 实时开发
- [版本管理](./docs/guides/versioning.md) - 管理资源版本
- [自托管 Registry](./docs/guides/self-hosting.md) - 部署自己的 Registry

**参考** - 技术文档

- [CLI 参考](./docs/reference/cli.md) - `rx` 命令参考
- [SDK 参考](./docs/reference/sdk.md) - `resourcexjs` API 参考
- [MCP 工具参考](./docs/reference/mcp-tools.md) - MCP 工具参考

**概念** - 原理解释

- [Locators](./docs/concepts/locators.md) - 资源标识符
- [资源类型](./docs/concepts/resource-types.md) - 内置和自定义类型
- [Registry](./docs/concepts/registry.md) - Registry 工作原理

---

## 包

| 包                                             | 描述                           |
| ---------------------------------------------- | ------------------------------ |
| [`@resourcexjs/cli`](./apps/cli)               | `rx` 命令行工具                |
| [`@resourcexjs/mcp-server`](./apps/mcp-server) | MCP Server，用于 AI Agent 集成 |
| [`resourcexjs`](./packages/resourcex)          | SDK                            |
| [`@resourcexjs/server`](./packages/server)     | 自托管 Registry Server         |

<details>
<summary>内部包（开发者）</summary>

| 包                                             | 描述                          |
| ---------------------------------------------- | ----------------------------- |
| [`@resourcexjs/core`](./packages/core)         | 核心原语 (RXI, RXL, RXM, RXA, RXR) |
| [`@resourcexjs/storage`](./packages/storage)   | 存储后端                      |
| [`@resourcexjs/registry`](./packages/registry) | Registry 实现                 |
| [`@resourcexjs/loader`](./packages/loader)     | 资源加载                      |
| [`@resourcexjs/type`](./packages/type)         | 类型系统                      |
| [`@resourcexjs/arp`](./packages/arp)           | 底层 I/O 协议                 |

</details>

---

## 生态系统

[Deepractice](https://github.com/Deepractice) AI 基础设施的一部分：

- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent 框架
- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent 运行时
- **ResourceX** - 资源管理（本项目）

## 许可证

[Apache-2.0](./LICENSE)

---

<div align="center">
  由 <a href="https://github.com/Deepractice">Deepractice</a> 用 ❤️ 构建
</div>
