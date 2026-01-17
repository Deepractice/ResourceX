# 009: Resource Server (资源中心服务)

## Background

ResourceX 需要一个开源的资源中心服务，类似 Nexus 对于 Maven artifacts。这个服务可以：

1. 独立部署，作为私有资源中心
2. 嵌入到其他应用（如 AgentVM），提供资源管理能力
3. 作为 Deepractice 云平台的基础

## Design Principles

### 1. 开源优先

```
@resourcexjs/server（开源）
        ↓
┌───────┴───────┐
↓               ↓
自部署           云平台
(企业私有)       (托管服务 + 增值)
```

### 2. 可嵌入

Server 可以独立运行，也可以嵌入到其他应用：

```typescript
// 独立运行
import { startServer } from "@resourcexjs/server";
startServer({ port: 3000 });

// 嵌入到 AgentVM
import { createResourceServer } from "@resourcexjs/server";
app.use("/resources", createResourceServer(config));
```

### 3. 存储抽象

支持多种存储后端：

```typescript
createResourceServer({
  storage: "file", // 文件系统
  // storage: "s3",     // S3 兼容存储
  // storage: "db",     // 数据库
});
```

## Features

### Phase 1: 基础功能

- [ ] 资源 CRUD API
- [ ] Manifest 解析和验证
- [ ] 文件系统存储
- [ ] 资源发现（目录扫描）
- [ ] 基础搜索

### Phase 2: 版本和依赖

- [ ] 版本管理
- [ ] 依赖解析
- [ ] Lock 文件支持

### Phase 3: 高级功能

- [ ] Type Handler 注册
- [ ] Webhook 通知
- [ ] 访问控制
- [ ] 审计日志

### Phase 4: 企业功能（云平台增值）

- [ ] 高可用部署
- [ ] 全球 CDN
- [ ] 高级搜索
- [ ] 团队协作
- [ ] 企业 SSO

## API Design

### Resource Operations

```
GET    /resources                      # 列出资源
GET    /resources/:name                # 获取资源（latest）
GET    /resources/:name@:version       # 获取指定版本
POST   /resources                      # 发布资源
PUT    /resources/:name@:version       # 更新资源
DELETE /resources/:name@:version       # 删除资源
```

### Search

```
GET    /search?q=keyword               # 搜索
GET    /search?type=prompt             # 按类型筛选
GET    /search?author=sean             # 按作者筛选
```

### Type Handlers

```
GET    /types                          # 列出支持的类型
POST   /types                          # 注册新类型
GET    /types/:name/schema             # 获取类型 schema
```

## Package Structure

```
packages/
├── arp/              # @resourcexjs/arp（已完成）
├── core/             # @resourcexjs/core（待定）
├── resourcex/        # resourcexjs SDK
├── server/           # @resourcexjs/server（新）
│   ├── src/
│   │   ├── index.ts
│   │   ├── server.ts        # HTTP 服务
│   │   ├── router.ts        # API 路由
│   │   ├── storage/         # 存储抽象
│   │   │   ├── types.ts
│   │   │   ├── file.ts
│   │   │   └── s3.ts
│   │   ├── registry/        # 资源注册表
│   │   └── handlers/        # Type handlers
│   └── tests/
└── cli/              # @resourcexjs/cli
```

## Integration with AgentVM

```
┌─────────────────────────────────────────────────┐
│  AgentVM                                        │
│                                                 │
│  ┌───────────────────────────────────────────┐  │
│  │  @resourcexjs/server                      │  │
│  │                                           │  │
│  │  /resources/*  →  资源管理 API            │  │
│  │  /types/*      →  Type Handler 管理       │  │
│  │  /search/*     →  搜索 API                │  │
│  │                                           │  │
│  └───────────────────────────────────────────┘  │
│                      ↓                          │
│  ┌───────────────────────────────────────────┐  │
│  │  Storage (file / s3 / db)                 │  │
│  └───────────────────────────────────────────┘  │
└─────────────────────────────────────────────────┘
```

AgentVM 集成后：

- 不需要重新设计资源管理接口
- 直接使用 ResourceX Server 的 API
- 资源存储和管理由 Server 负责

## Comparison

| 系统          | 开源版              | 云服务          |
| ------------- | ------------------- | --------------- |
| Nexus         | Nexus OSS           | Sonatype Hosted |
| GitLab        | GitLab CE           | gitlab.com      |
| MinIO         | MinIO Server        | MinIO Cloud     |
| **ResourceX** | @resourcexjs/server | deepractice.ai  |

## Open Questions

1. **认证方式** - API Key? OAuth? JWT?
2. **存储格式** - 资源在文件系统中怎么组织？
3. **缓存策略** - 如何缓存热门资源？
4. **同步机制** - 多个 server 之间如何同步？

---

**Status**: Open
**Priority**: Medium (本地版完成后)
**Labels**: design, server, infrastructure
**Depends on**: 008-resource-locator
