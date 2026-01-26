# Issue 026: Deepractice Account Service

## Overview

Deepractice Account 是 Deepractice 统一账户中心，专注于身份认证（SSO），为所有 Deepractice 产品提供统一的用户身份管理。

**定位**：只管身份认证，不管 API Token、Team 等业务功能。

---

## 基本信息

| 属性     | 值                      |
| -------- | ----------------------- |
| 服务名   | account                 |
| 域名     | account.deepractice.dev |
| 数据库名 | deepractice-dev-account |

---

## 技术栈

| 层级   | 技术选型                      |
| ------ | ----------------------------- |
| 前端   | Next.js 15 + Tailwind CSS     |
| API    | Hono                          |
| 数据库 | Cloudflare D1 + Drizzle ORM   |
| 部署   | OpenNext + Cloudflare Workers |

---

## 核心功能

### 功能列表

1. **用户登录/注册** - 统一的身份入口
2. **OAuth 登录** - GitHub、Google 第三方登录
3. **邮箱密码登录** - 传统登录方式
4. **OIDC Provider** - 让其他 Deepractice 产品接入
5. **用户基本信息管理** - 个人资料维护

### 登录方式

| 方式                 | 说明              |
| -------------------- | ----------------- |
| Continue with GitHub | GitHub OAuth 登录 |
| Continue with Google | Google OAuth 登录 |
| Continue with Email  | 邮箱 + 密码登录   |

---

## OIDC Provider

### 端点列表

| 端点                                | 说明                    |
| ----------------------------------- | ----------------------- |
| `/.well-known/openid-configuration` | OIDC 配置发现           |
| `/.well-known/jwks.json`            | JWT 公钥集              |
| `/authorize`                        | 授权端点                |
| `/token`                            | Token 端点              |
| `/userinfo`                         | 用户信息端点            |
| `/logout`                           | 登出端点（可选）        |
| `/device/code`                      | Device Flow（CLI 登录） |

### OIDC 流程

```
┌─────────────────────────────────────────────────────────────────┐
│                        用户                                      │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 访问产品
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│              Deepractice 产品 (ResourceX, AgentX...)             │
│                                                                 │
│   1. 检测未登录 → 跳转 account.deepractice.dev/authorize        │
│   2. 收到 authorization_code                                    │
│   3. 换取 access_token + id_token                               │
│   4. 获取用户信息                                                │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ OIDC 协议
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│                  Account Service (IdP)                          │
│                  account.deepractice.dev                        │
│                                                                 │
│   - 验证用户身份（OAuth/邮箱密码）                               │
│   - 签发 id_token（包含用户身份信息）                           │
│   - 签发 access_token（用于访问 userinfo）                      │
│   - 管理 authorization_code 和 refresh_token                    │
└─────────────────────────────────────────────────────────────────┘
```

### Device Flow（CLI 登录）

```
┌─────────────────────────────────────────────────────────────────┐
│  CLI 工具 (如 resourcex CLI)                                     │
│                                                                 │
│  1. POST /device/code → 获取 device_code + user_code            │
│  2. 显示: "请访问 account.deepractice.dev/device 输入: ABCD-1234" │
│  3. 轮询 POST /token (grant_type=device_code)                    │
│  4. 用户完成授权后，获取 access_token                            │
└─────────────────────────────────────────────────────────────────┘
                         │
                         │ 用户在浏览器
                         ↓
┌─────────────────────────────────────────────────────────────────┐
│  用户浏览器                                                      │
│                                                                 │
│  1. 访问 account.deepractice.dev/device                         │
│  2. 输入 user_code: ABCD-1234                                   │
│  3. 登录（如果未登录）                                           │
│  4. 确认授权                                                    │
└─────────────────────────────────────────────────────────────────┘
```

---

## 数据模型

### users（用户表）

| 字段           | 类型        | 说明                 |
| -------------- | ----------- | -------------------- |
| id             | TEXT PK     | 用户 ID              |
| email          | TEXT UNIQUE | 邮箱                 |
| email_verified | BOOLEAN     | 邮箱是否验证         |
| password_hash  | TEXT        | 密码哈希（邮箱登录） |
| name           | TEXT        | 显示名称             |
| avatar_url     | TEXT        | 头像 URL             |
| created_at     | TIMESTAMP   | 创建时间             |
| updated_at     | TIMESTAMP   | 更新时间             |

### connections（OAuth 关联表）

| 字段             | 类型      | 说明                   |
| ---------------- | --------- | ---------------------- |
| id               | TEXT PK   | 关联 ID                |
| user_id          | TEXT FK   | 用户 ID                |
| provider         | TEXT      | 提供商 (github/google) |
| provider_user_id | TEXT      | 提供商用户 ID          |
| access_token     | TEXT      | OAuth access_token     |
| refresh_token    | TEXT      | OAuth refresh_token    |
| created_at       | TIMESTAMP | 创建时间               |

### clients（OIDC 客户端表）

| 字段           | 类型      | 说明                 |
| -------------- | --------- | -------------------- |
| id             | TEXT PK   | 客户端 ID            |
| secret_hash    | TEXT      | 客户端密钥哈希       |
| name           | TEXT      | 客户端名称           |
| redirect_uris  | TEXT      | 回调 URL 列表 (JSON) |
| allowed_scopes | TEXT      | 允许的 scope (JSON)  |
| created_at     | TIMESTAMP | 创建时间             |

### authorization_codes（授权码表）

| 字段           | 类型      | 说明                |
| -------------- | --------- | ------------------- |
| code           | TEXT PK   | 授权码              |
| client_id      | TEXT FK   | 客户端 ID           |
| user_id        | TEXT FK   | 用户 ID             |
| redirect_uri   | TEXT      | 回调 URL            |
| scope          | TEXT      | 授权范围            |
| code_challenge | TEXT      | PKCE code_challenge |
| expires_at     | TIMESTAMP | 过期时间            |
| created_at     | TIMESTAMP | 创建时间            |

### refresh_tokens（刷新令牌表）

| 字段       | 类型      | 说明      |
| ---------- | --------- | --------- |
| token      | TEXT PK   | 刷新令牌  |
| client_id  | TEXT FK   | 客户端 ID |
| user_id    | TEXT FK   | 用户 ID   |
| scope      | TEXT      | 授权范围  |
| expires_at | TIMESTAMP | 过期时间  |
| created_at | TIMESTAMP | 创建时间  |

### device_codes（设备码表）

| 字段        | 类型        | 说明                           |
| ----------- | ----------- | ------------------------------ |
| device_code | TEXT PK     | 设备码                         |
| user_code   | TEXT UNIQUE | 用户码 (如 ABCD-1234)          |
| client_id   | TEXT FK     | 客户端 ID                      |
| user_id     | TEXT        | 用户 ID (授权后填充)           |
| scope       | TEXT        | 授权范围                       |
| status      | TEXT        | 状态 (pending/approved/denied) |
| expires_at  | TIMESTAMP   | 过期时间                       |
| created_at  | TIMESTAMP   | 创建时间                       |

---

## 配置

### 环境变量

| 变量                   | 说明                       |
| ---------------------- | -------------------------- |
| `GITHUB_CLIENT_ID`     | GitHub OAuth Client ID     |
| `GITHUB_CLIENT_SECRET` | GitHub OAuth Client Secret |
| `GOOGLE_CLIENT_ID`     | Google OAuth Client ID     |
| `GOOGLE_CLIENT_SECRET` | Google OAuth Client Secret |

### Cloudflare Workers Secrets

| Secret            | 说明                 |
| ----------------- | -------------------- |
| `JWT_PRIVATE_KEY` | JWT 签名私钥 (RS256) |
| `JWT_PUBLIC_KEY`  | JWT 验证公钥         |

---

## 职责边界

### Account Service 负责

| 职责                | 说明               |
| ------------------- | ------------------ |
| 用户身份认证        | 验证用户是谁       |
| OAuth/OIDC Provider | 为其他产品提供 SSO |
| 用户基本信息        | 邮箱、名称、头像   |

### Account Service 不负责

| 职责           | 说明                  | 归属           |
| -------------- | --------------------- | -------------- |
| API Token 管理 | 各产品的 API 访问令牌 | 各产品自己管理 |
| Team/组织管理  | 团队和组织功能        | 未来单独服务   |
| 权限/角色管理  | RBAC/ABAC             | 未来 IAM 服务  |

---

## UI 设计

### 设计文件

- 位置：`design/identity.pen`
- 页面：登录首页、邮箱登录页
- 适配：Desktop + Mobile

### 页面列表

| 页面     | 路径      | 说明                      |
| -------- | --------- | ------------------------- |
| 登录首页 | `/`       | OAuth 按钮 + 邮箱登录入口 |
| 邮箱登录 | `/email`  | 邮箱 + 密码表单           |
| 注册页   | `/signup` | 新用户注册                |
| 设备授权 | `/device` | Device Flow 用户码输入    |

---

## 项目结构

```
services/account/
├── src/
│   ├── app/                      # Next.js App Router
│   │   ├── page.tsx              # 登录首页
│   │   ├── email/page.tsx        # 邮箱登录
│   │   ├── signup/page.tsx       # 注册页
│   │   ├── device/page.tsx       # 设备授权页
│   │   └── api/[...route]/route.ts  # Hono API 入口
│   │
│   ├── api/                      # Hono 路由
│   │   ├── oauth.ts              # OAuth 回调处理
│   │   ├── oidc.ts               # OIDC 端点
│   │   └── user.ts               # 用户信息 API
│   │
│   ├── db/
│   │   └── schema.ts             # Drizzle schema
│   │
│   └── lib/
│       ├── auth.ts               # 认证逻辑
│       └── jwt.ts                # JWT 签发/验证
│
├── features/                     # BDD feature 文件
│   ├── login.feature
│   ├── oauth.feature
│   └── oidc.feature
│
├── tests/e2e/                    # E2E 测试
│
├── drizzle/                      # 数据库迁移
│   └── migrations/
│
├── wrangler.jsonc                # Cloudflare 配置
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## 实现计划

### Phase 1: 基础框架

- [ ] 创建 `services/account/` 目录
- [ ] 初始化 Next.js 15 + Tailwind CSS
- [ ] 配置 Hono API 路由
- [ ] 配置 Drizzle ORM + D1

### Phase 2: OAuth 登录

- [ ] 实现 GitHub OAuth 登录
- [ ] 实现 Google OAuth 登录
- [ ] 实现 users 和 connections 表

### Phase 3: 邮箱密码登录

- [ ] 实现邮箱注册
- [ ] 实现邮箱登录
- [ ] 实现密码重置（可选）

### Phase 4: OIDC Provider

- [ ] 实现 `/.well-known/openid-configuration`
- [ ] 实现 `/.well-known/jwks.json`
- [ ] 实现 `/authorize` 端点
- [ ] 实现 `/token` 端点
- [ ] 实现 `/userinfo` 端点
- [ ] 实现 clients 表管理

### Phase 5: Device Flow

- [ ] 实现 `/device/code` 端点
- [ ] 实现 `/device` 授权页
- [ ] 实现 device_codes 表

### Phase 6: 部署

- [ ] 配置 OpenNext
- [ ] 部署到 Cloudflare Workers
- [ ] 配置自定义域名 account.deepractice.dev

---

## 与其他服务的关系

```
┌─────────────────────────────────────────────────────────────────┐
│                     Deepractice 生态                             │
│                                                                 │
│  ┌───────────────┐  ┌───────────────┐  ┌───────────────┐       │
│  │   ResourceX   │  │    AgentX     │  │   其他产品    │       │
│  │   Registry    │  │    Cloud      │  │     ...      │       │
│  └───────┬───────┘  └───────┬───────┘  └───────┬───────┘       │
│          │                  │                  │                │
│          └──────────────────┴──────────────────┘                │
│                             │                                   │
│                             │ OIDC                              │
│                             ↓                                   │
│          ┌─────────────────────────────────────┐                │
│          │         Account Service             │                │
│          │      account.deepractice.dev        │                │
│          │                                     │                │
│          │   - 用户身份认证                    │                │
│          │   - OIDC Provider                   │                │
│          │   - 用户基本信息                    │                │
│          └─────────────────────────────────────┘                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## 相关文件

- `issues/025-resourcex-platform-strategy.md` - 平台战略
- `issues/023-deepractice-design-tokens.md` - 设计规范
- `design/identity.pen` - UI 设计文件
