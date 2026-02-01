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

// 使用资源
const result = await rx.use("my-prompt:1.0.0");
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
| [`@resourcexjs/core`](./packages/core)         | 核心原语 (RXL, RXM, RXA, RXR) |
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
