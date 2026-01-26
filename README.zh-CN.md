<div align="center">
  <h1>ResourceX</h1>
  <p><strong>The resource infrastructure and solution for AI Agents</strong></p>
  <p>AI 智能体的资源基础设施和解决方案</p>

  <p>Manage, version, and share prompts, tools, skills, and everything</p>
  <p>管理、版本化、共享 prompts、tools、skills 以及一切</p>

  <p>
    <b>Decentralized</b> · <b>Extensible</b> · <b>Universal</b>
  </p>
  <p>
    <b>去中心化</b> · <b>可扩展</b> · <b>通用</b>
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

  <p>
    <a href="#快速开始">快速开始</a> •
    <a href="./docs/README.md">文档</a> •
    <a href="./docs/api/core.md">API 参考</a>
  </p>
</div>

---

## 为什么需要 ResourceX？

AI Agent 需要管理各种资源：**prompts**、**tools**、**agents**、**skills**、**配置文件**，以及更多。ResourceX 提供统一的资源层，包含协议、运行时和仓库。_万物皆资源。_

```
┌─────────────────────────────────────────────────────────────┐
│                     Registry 层                             │
│                                                             │
│  Local / Remote          →  存储与发现                      │
│  add / resolve / search  →  资源操作                        │
├─────────────────────────────────────────────────────────────┤
│                    ResourceX 层                             │
│                                                             │
│  RXL (定位符)    →  deepractice.ai/assistant.prompt@1.0.0  │
│  RXM (清单)      →  资源元数据                              │
│  RXA (归档)      →  tar.gz 格式，用于存储/传输              │
│  RXP (包)        →  解压后的文件，用于运行时访问            │
│  类型系统        →  text / json / binary / custom           │
├─────────────────────────────────────────────────────────────┤
│                       ARP 层                                │
│                                                             │
│  格式: arp:{semantic}:{transport}://{location}              │
│  底层 I/O 原语：file, http, https, rxr                      │
└─────────────────────────────────────────────────────────────┘
```

## 快速开始

```bash
npm install resourcexjs
# 或者
bun add resourcexjs
```

```typescript
import { createRegistry, parseRXL, createRXM, createRXA } from "resourcexjs";

// 1. 创建资源 (RXR = 定位符 + 清单 + 归档)
const manifest = createRXM({
  domain: "localhost",
  name: "my-prompt",
  type: "text",
  version: "1.0.0",
});

const rxr = {
  locator: parseRXL(manifest.toLocator()),
  manifest,
  archive: await createRXA({ content: "You are a helpful assistant." }),
};

// 2. 添加到本地 registry (~/.resourcex)
const registry = createRegistry();
await registry.add(rxr);

// 3. 解析并执行
const resolved = await registry.resolve("localhost/my-prompt.text@1.0.0");
const text = await resolved.execute(); // "You are a helpful assistant."

// 访问原始资源
console.log(resolved.resource.manifest.name); // "my-prompt"
```

## [文档](./docs/README.md)

### [快速入门](./docs/getting-started/introduction.md)

- [介绍](./docs/getting-started/introduction.md) - 什么是 ResourceX
- [安装](./docs/getting-started/installation.md) - 安装指南
- [快速开始](./docs/getting-started/quick-start.md) - 5 分钟教程

### [核心概念](./docs/concepts/overview.md)

- [架构概览](./docs/concepts/overview.md) - 两层设计
- **[ResourceX 层](./docs/concepts/resourcex/rxl-locator.md)**
  - [RXL - 定位符](./docs/concepts/resourcex/rxl-locator.md) - `domain/path/name.type@version`
  - [RXM - 清单](./docs/concepts/resourcex/rxm-manifest.md) - 资源元数据
  - [RXA - 归档](./docs/concepts/resourcex/rxa-archive.md) - 归档（存储/传输）
  - [RXR - 资源](./docs/concepts/resourcex/rxr-resource.md) - 完整资源对象
  - [类型系统](./docs/concepts/resourcex/type-system.md) - 内置与自定义类型
  - [Registry](./docs/concepts/resourcex/registry.md) - 存储与检索
- **[ARP 层](./docs/concepts/arp/protocol.md)**
  - [协议](./docs/concepts/arp/protocol.md) - Agent Resource Protocol
  - [ARL](./docs/concepts/arp/arl.md) - ARP 资源定位符
  - [Transport](./docs/concepts/arp/transport.md) - file, http, https, rxr
  - [Semantic](./docs/concepts/arp/semantic.md) - text, binary

### [使用指南](./docs/guides/local-registry.md)

- [本地 Registry](./docs/guides/local-registry.md) - 开发工作流
- [Git Registry](./docs/guides/git-registry.md) - 团队共享
- [远程 Registry](./docs/guides/remote-registry.md) - HTTP API
- [自定义类型](./docs/guides/custom-types.md) - 定义你自己的类型
- [ARP 协议](./docs/guides/arp-protocol.md) - 底层 I/O

### [API 参考](./docs/api/core.md)

- [Core API](./docs/api/core.md) - RXL, RXM, RXA, RXP, RXR
- [Registry API](./docs/api/registry.md) - Registry 操作
- [ARP API](./docs/api/arp.md) - Transport & Semantic
- [错误处理](./docs/api/errors.md) - 错误类型

### [设计与贡献](./docs/design/README.md)

- [设计决策](./docs/design/README.md) - 架构原理
- [开发环境](./docs/contributing/development.md) - 设置与命令
- [开发流程](./docs/contributing/workflow.md) - BDD 流程
- [代码规范](./docs/contributing/conventions.md) - 代码风格

## 包结构

| 包                                             | 描述                               |
| ---------------------------------------------- | ---------------------------------- |
| [`resourcexjs`](./packages/resourcex)          | 主包 - 你需要的一切                |
| [`@resourcexjs/core`](./packages/core)         | 核心类型 (RXL, RXM, RXA, RXP, RXR) |
| [`@resourcexjs/registry`](./packages/registry) | Registry 实现                      |
| [`@resourcexjs/arp`](./packages/arp)           | ARP 协议                           |

## 生态系统

[Deepractice](https://github.com/Deepractice) AI 基础设施的一部分：

- **[AgentVM](https://github.com/Deepractice/AgentVM)** - AI Agent 运行时
- **[AgentX](https://github.com/Deepractice/AgentX)** - AI Agent 框架
- **ResourceX** - 资源管理（本项目）

## 参与贡献

查看 [CONTRIBUTING.md](./CONTRIBUTING.md) 和 [开发指南](./docs/contributing/development.md)。

## 许可证

[MIT](./LICENSE)

---

<div align="center">
  由 <a href="https://github.com/Deepractice">Deepractice</a> 用心构建
</div>
