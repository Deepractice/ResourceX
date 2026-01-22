# Registry HTTP Protocol

## 背景

当前 RxrTransport 需要依赖 Registry 实例才能工作，无法像 http transport 一样无状态。

**问题分析：**

- http transport 无状态：URL 包含完整地址，直接访问网络
- rxr transport 有状态：需要 Registry 实例来读取资源

**核心原因：** rxr 的数据来源是 Registry，而当前 Registry 只有本地实现。

## 目标

定义 Registry HTTP 协议，使 RxrTransport 可以：

1. 像 http transport 一样无状态
2. 根据 domain 自动路由到对应的 Registry Server
3. 内置到 ARP，无需用户手动注入

## 设计

### URL 映射

```
arp:text:rxr://deepractice.ai/nuwa.text@1.0.0/thought/file.md
              └─── domain ───┘└────── rxl ─────┘└─ internal ─┘
                    ↓
GET https://deepractice.ai/.resourcex/v1/files/nuwa.text@1.0.0/thought/file.md
```

### 特殊处理 localhost

```
arp:text:rxr://localhost/my.text@1.0.0/file.md
    ↓
直接读取本地 ~/.resourcex/...
```

### HTTP API 协议

参考 AgentVM 已有实现 (`AgentVM/packages/avm/src/http/registry.ts`)：

```
POST /v1/registry/link      - Link a resource
GET  /v1/registry/resource  - Get resource details (manifest + schema)
POST /v1/registry/resolve   - Resolve and execute resource
GET  /v1/registry/exists    - Check if resource exists
POST /v1/registry/delete    - Delete resource
GET  /v1/registry/search    - Search resources
```

**新增（for RxrTransport）：**

```
GET /v1/registry/files/{rxl}/{path}  - Get file inside resource
```

### 架构

```
┌─────────────────────────────────────┐
│  Registry Server (独立服务)          │
│  - 实现 HTTP API 协议                │
│  - 可以是 AgentVM 或独立部署          │
└─────────────────────────────────────┘
                 ↑
                 │ HTTPS
                 │
┌─────────────────────────────────────┐
│  ARP (客户端)                        │
│  - rxr transport = Registry Client  │
│  - 根据 domain 路由请求              │
│  - localhost 走本地文件系统          │
└─────────────────────────────────────┘
```

### 包结构调整

```
packages/
├── arp/                 # ARP 协议（不变）
│   └── transport/
│       └── rxr.ts       # RxrTransport（支持本地 + 远程）
├── core/                # 核心类型（不变）
├── registry/            # Registry 实现
│   ├── local/           # 本地实现（当前的 ARPRegistry）
│   ├── client/          # HTTP 客户端（新增）
│   └── server/          # HTTP 服务端路由（从 AgentVM 迁移）
└── type/                # 类型系统（不变）
```

## 实现步骤

### Phase 1: 当前 PR（已完成）

- [x] Registry.get() 方法
- [x] RxrTransport 基础实现（依赖 Registry 实例）
- [x] BDD 测试

### Phase 2: 协议定义

- [ ] 定义 Registry HTTP API schemas（从 AgentVM 迁移）
- [ ] 定义 well-known endpoint: `/.resourcex/`
- [ ] 定义服务发现机制

### Phase 3: 实现

- [ ] Registry HTTP Client
- [ ] Registry HTTP Server routes（可选，供 AgentVM 使用）
- [ ] RxrTransport 支持远程访问
- [ ] localhost 特殊处理（本地文件系统）

### Phase 4: 集成

- [ ] AgentVM 迁移到 ResourceX 提供的协议
- [ ] RxrTransport 内置到 ARP（无需手动注入）

## 依赖关系

**当前（有循环依赖风险）：**

```
registry → arp (registry 用 arp 做 I/O)
arp → registry (rxr transport 需要 registry) ← 问题！
```

**目标（通过协议解耦）：**

```
registry → arp (registry 用 arp 做 I/O)
arp → HTTP protocol (rxr transport 是 HTTP 客户端，不依赖 registry 代码)
```

## 开放问题

1. **服务发现**：如何知道 `deepractice.ai` 对应的 Registry endpoint？
   - 约定 `https://{domain}/.resourcex/`？
   - DNS TXT record？

2. **认证**：远程 Registry 如何认证？
   - API Key？
   - OAuth？

3. **缓存**：是否需要本地缓存远程资源？
   - 类似 npm cache
