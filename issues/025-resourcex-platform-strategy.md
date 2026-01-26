# ResourceX 平台战略与架构决策

## 背景

ResourceX 基础架构已完成（registry-api, registry-web, well-known 已部署到 Cloudflare），现在需要明确平台战略和后续迭代方向。

---

## 大目标

**ResourceX 定位：AI Agent 资源的 npm/Maven**

- 开源的中央资源仓库
- 支持镜像机制
- 面向 AI Agent 生态的 prompts, tools, agents 等资源
- 短期内不考虑商业化变现

**类比**：
| 领域 | 中央仓库 | ResourceX对标 |
|------|----------|---------------|
| JavaScript | npmjs.org | registry.deepractice.org |
| Java | Maven Central | registry.deepractice.org |
| Python | PyPI | registry.deepractice.org |
| AI Agent | (空缺) | **ResourceX** |

---

## 域名规划

```
┌─────────────────────────────────────────────────────────────┐
│                    Deepractice 域名体系                      │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  deepractice.ai                                             │
│  └── 云平台（商业产品）                                      │
│      - AgentX Cloud                                         │
│      - 付费功能、企业服务                                    │
│      - 生产环境                                             │
│                                                             │
│  deepractice.org                                            │
│  └── 开源社区                                               │
│      - 开源项目主页                                         │
│      - 社区文档                                             │
│      - ResourceX Registry（公共资源仓库）                    │
│      - 生产环境                                             │
│                                                             │
│  deepractice.dev                                            │
│  └── 开发环境 / MVP验证                                     │
│      - 技术验证区域                                         │
│      - 快速迭代，不承诺稳定性                                │
│      - 当前使用中                                           │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

**当前状态**：

- registry.deepractice.dev - Registry 前端（已部署）
- registry.deepractice.dev/api/v1 - Registry API（已部署）
- deepractice.dev/.well-known/resourcex - 服务发现（已部署）

**未来迁移**：

- MVP 验证通过后，根据需要迁移到 .org 或 .ai
- ResourceX Registry 最终应该在 deepractice.org（强调开源中立）

---

## 用户体系设计

### 访问权限模型

| 操作           | 是否需要登录 |
| -------------- | ------------ |
| 浏览资源       | 否           |
| 搜索资源       | 否           |
| 下载/使用资源  | 否           |
| 发布资源       | **是**       |
| 管理自己的资源 | **是**       |

### 账户体系架构

**决策：使用 Deepractice 统一账户体系**

```
┌─────────────────────────────────────────────────────────────┐
│                      用户                                    │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ 登录
                         ↓
┌─────────────────────────────────────────────────────────────┐
│              Deepractice 账户体系 (IdP)                      │
│              id.deepractice.dev (开发)                       │
│              id.deepractice.ai (生产)                        │
│                                                             │
│   ┌─────────────────────────────────────────────────────┐   │
│   │  支持的登录方式：                                    │   │
│   │  - GitHub OAuth                                     │   │
│   │  - Google OAuth                                     │   │
│   │  - 邮箱密码                                         │   │
│   │  - ... 未来其他方式                                  │   │
│   └─────────────────────────────────────────────────────┘   │
│                                                             │
│   统一的 Deepractice Account                                │
└─────────────────────────────────────────────────────────────┘
                         │
                         │ SSO (OIDC协议)
                         ↓
┌─────────────────────────────────────────────────────────────┐
│                 Deepractice 生态产品                         │
│                                                             │
│   ┌───────────┐  ┌───────────┐  ┌───────────┐              │
│   │ ResourceX │  │  AgentX   │  │  其他产品  │              │
│   │ Registry  │  │  Cloud    │  │    ...    │              │
│   └───────────┘  └───────────┘  └───────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### SSO vs OAuth

| 维度         | 说明                            |
| ------------ | ------------------------------- |
| **业务层面** | 这是 SSO - 一次登录，全生态通用 |
| **技术层面** | 用 OAuth/OIDC 协议实现          |

**好处**：

1. **统一账户** - 用户一个账号走遍 Deepractice 所有产品
2. **灵活登录** - 用户可选 GitHub/Google 等登录 Deepractice
3. **引流效果** - ResourceX 用户自动成为 Deepractice 用户
4. **开放感** - 用 GitHub 登录不会觉得被强绑特定平台
5. **ResourceX 保持简单** - 只对接 Deepractice IdP，不用自己处理多个 OAuth

### 当前状态

**账户体系尚未实现**，暂时搁置：

- 等 Deepractice 账户体系（IdP）ready 后再接入
- ResourceX 先做其他功能，登录功能后补

---

## 代码结构决策

### 当前：服务放在 ResourceX 仓库

```
ResourceX/
├── packages/              # 核心库（发布到 npm）
│   ├── arp/                 @resourcexjs/arp
│   ├── core/                @resourcexjs/core
│   ├── type/                @resourcexjs/type
│   ├── loader/              @resourcexjs/loader
│   ├── registry/            @resourcexjs/registry
│   ├── ui/                  @resourcexjs/ui
│   └── resourcex/           resourcexjs
│
├── services/              # 部署服务（Cloudflare Workers）
│   ├── registry-api/        资源中心 API
│   ├── registry-web/        资源中心前端
│   └── well-known/          服务发现
│
├── bdd/                   # BDD 测试
└── issues/                # 设计文档
```

**决策理由**：

- 现在聚焦 ResourceX 资源中心，没必要建新仓库
- 代码在一起，改起来方便
- services 目录独立，以后需要拆分成本不高

### 未来：按需拆分

如果以后需要，可以拆分为：

- `ResourceX/` - 纯 SDK，npm 包
- `DeepracticeCloud/` - 云平台服务
- `DeepracticeID/` - 账户体系

---

## 当前已完成

| 组件         | 状态                              | 部署位置                              |
| ------------ | --------------------------------- | ------------------------------------- |
| registry-api | ✅ 已部署                         | registry.deepractice.dev/api/v1       |
| registry-web | ✅ 已部署                         | registry.deepractice.dev              |
| well-known   | ✅ 已部署                         | deepractice.dev/.well-known/resourcex |
| BDD 测试     | ✅ 19 scenarios, 65 steps passing | -                                     |

---

## 下一步：User Journey 迭代

基于 ISSUE 协作模式（见 `issues/024-user-journey-issue-collaboration.md`），需要推进的核心 Journey：

### Journey 1: Developer Publishing（开发者发布资源）

```
起点：开发者本地有一个写好的 Prompt/Tool
终点：资源已发布到 Registry，其他人可以搜索和使用

关键步骤：
1. 创建 resource.json 元数据
2. 使用 CLI 打包并发布
3. 在 Registry-web 上查看
4. 其他用户可以搜索到
```

**依赖**：

- CLI 工具（未实现）
- 用户认证（暂时跳过，先做公开发布）

### Journey 2: Developer Discovery（开发者发现资源）

```
起点：开发者需要一个 AI 资源
终点：找到并安装了合适的资源

关键步骤：
1. 访问 Registry-web
2. 搜索/浏览资源
3. 查看资源详情
4. 复制安装命令
5. 在项目中使用
```

**依赖**：

- Registry-web 完善（部分完成）
- 有示例资源可展示

### Journey 3: Agent Integration（Agent 集成资源）

```
起点：Agent 运行时需要某个资源
终点：Agent 自动发现、下载、使用资源

关键步骤：
1. Agent 通过 well-known 发现 Registry
2. 搜索/获取资源
3. 下载并缓存
4. 在运行时使用
```

**依赖**：

- SDK（已有 @resourcexjs/registry）
- 需要集成到 Agent 运行时

---

## 优先级建议

1. **Journey 2: Developer Discovery** - 先把界面做完整，手动发布几个示例资源
2. **Journey 1: Developer Publishing** - 实现 CLI 发布功能
3. **用户认证** - 等 Deepractice IdP ready 后接入
4. **Journey 3: Agent Integration** - 和 AgentX 协同开发

---

## 相关文件

- `issues/024-user-journey-issue-collaboration.md` - ISSUE 协作模式
- `issues/000-unified-development-mode.md` - 开发模式
- `services/registry-api/` - Registry API 实现
- `services/registry-web/` - Registry 前端实现
- `CLAUDE.md` - 项目技术文档
