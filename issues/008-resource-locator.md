# 008: Resource Locator (资源定位符)

## Background

ResourceX 作为 AI 资源管理协议（类似 npm），需要设计一个资源定位符格式。定位符的职责是**定位资源在哪**，而不是描述资源是什么（那是 manifest 的职责）。

## Design Principles

### 1. 符号语义统一

每个符号有明确且唯一的语义：

| 符号 | 语义      | 说明                             |
| ---- | --------- | -------------------------------- |
| `/`  | 层级/路径 | 域名、组织、用户的层级关系       |
| `.`  | 类型标识  | 资源类型（可选，类似文件扩展名） |
| `@`  | 版本指向  | 指向特定版本                     |

### 2. 职责分离

|      | 定位符                            | Manifest                                   |
| ---- | --------------------------------- | ------------------------------------------ |
| 职责 | 定位资源在哪                      | 描述资源是什么                             |
| 内容 | domain, path, name, type, version | kind, description, dependencies, config... |

### 3. 去中心化

借鉴 Go modules 的思路：

- **namespace = 域名** → 你拥有域名，你控制 namespace
- **资源存储 = 任意位置** → GitHub、自建服务器、平台托管
- **Registry = 可选缓存层** → 加速发现，不是必须

### 4. 开放协议

ResourceX 是开放协议，而非封闭平台：

| 我们做   | 我们不做      |
| -------- | ------------- |
| 协议规范 | 规定具体 type |
| 扩展机制 | 垄断 registry |
| 参考实现 | 锁定用户      |

**为什么开放？**

- 封闭系统的风险：大厂做类似产品 → 资源更多、用户更多 → 我们被替代
- 开放协议的优势：大厂进场 → 在协议上构建 → 生态繁荣 → ResourceX 成为标准

类比：

- HTTP、TCP/IP 是开放协议，没有被任何公司垄断
- ResourceX 应该是 AI 资源的开放协议

## Locator Format

```
[domain/path/]name[.type][@version]
```

### Components

| 部分    | 必需 | 说明                               |
| ------- | ---- | ---------------------------------- |
| domain  | 可选 | 资源来源域名                       |
| path    | 可选 | 组织/用户层级路径                  |
| name    | 必需 | 资源名称                           |
| type    | 可选 | 资源类型（prompt, tool, agent...） |
| version | 可选 | 版本号（默认 latest）              |

### Examples

```bash
# 本地资源（无 domain）
assistant
assistant.prompt
assistant.prompt@1.0.0

# 本地显式
localhost/assistant
localhost/my-project/assistant.tool

# 平台托管
deepractice.ai/assistant                      # 官方资源
deepractice.ai/sean/assistant                 # 用户资源
deepractice.ai/org/team/assistant             # 组织/团队
deepractice.ai/sean/assistant.prompt@1.0.0    # 完整形式

# 自托管
mycompany.com/assistant
mycompany.com/ai-team/assistant.agent

# GitHub
github.com/user/assistant
github.com/org/repo/assistant.tool@2.0.0
```

## Resource Sources

| 类型     | Domain 示例         | 说明               |
| -------- | ------------------- | ------------------ |
| 本地     | 省略 或 `localhost` | 本地开发，无需网络 |
| 平台托管 | `deepractice.ai`    | 平台提供托管服务   |
| 自托管   | `mycompany.com`     | 企业私有部署       |
| GitHub   | `github.com/user`   | 利用现有 Git 平台  |

## Type (Optional & Open)

类型是可选的，因为：

1. **Manifest 已有 kind** - 加载资源时自然获得类型
2. **上下文通常明确** - 使用场景已经知道需要什么类型
3. **保持简洁** - 不强制每次都写类型

但显式类型有助于：

- 快速识别资源用途
- 减少一次 I/O（不需要先读 manifest）
- 同名不同类型的资源共存

```bash
assistant           # 类型由 manifest 定义
assistant.prompt    # 显式声明是 prompt
assistant.tool      # 同名但不同类型
```

### Type 是开放的

**ResourceX 不规定 type 有哪些**，每个 registry/仓库自己定义：

```
deepractice.ai 定义：prompt, tool, agent, workflow...
mycompany.com 定义：model, dataset, pipeline...
research.org 定义：paper, experiment, benchmark...
```

### Type Handler 扩展机制

ResourceX 提供扩展点，仓库实现自己的 type handler：

```typescript
interface TypeHandler {
  name: string; // type 名称
  schema?: JSONSchema; // manifest 验证 schema
  validate?(manifest: Manifest): boolean; // 验证逻辑
  resolve?(manifest: Manifest): Promise<Resource>; // 解析逻辑
}

// 注册自定义 type
rx.registerType({
  name: "prompt",
  schema: promptManifestSchema,
  resolve: async (manifest) => {
    // 自定义解析逻辑
  },
});
```

### 分层架构

```
┌─────────────────────────────────────────────┐
│  deepractice.ai                             │
│  TypeHandlers: prompt, tool, agent...       │
├─────────────────────────────────────────────┤
│  mycompany.com                              │
│  TypeHandlers: model, dataset, pipeline...  │
├─────────────────────────────────────────────┤
│  ResourceX Protocol                         │
│  - 定位符格式                                │
│  - manifest 基础字段                         │
│  - registerType() 扩展点                     │
│  - 不规定具体 type                           │
└─────────────────────────────────────────────┘
```

## Relation to ARP

ResourceX 定位符是上层协议，底层使用 ARP 访问资源：

```
ResourceX Locator                    ARP URL
deepractice.ai/sean/assistant   →    arp:text:https://deepractice.ai/sean/assistant/resource.json
                                     arp:text:file:///local/path/content.txt
```

ResourceX 负责：

1. 解析定位符
2. 定位资源目录
3. 读取 manifest (resource.json)
4. 生成 ARP URL 访问实际内容

## Comparison

| 系统          | 定位符格式                            | 类型                | 版本       |
| ------------- | ------------------------------------- | ------------------- | ---------- |
| npm           | `[@scope/]name[@version]`             | package.json        | `@version` |
| Go            | `domain/path[@version]`               | go.mod              | `@version` |
| Docker        | `[registry/]name[:tag]`               | -                   | `:tag`     |
| **ResourceX** | `[domain/path/]name[.type][@version]` | `.type` 或 manifest | `@version` |

## Open Questions

1. **type 和 manifest kind 不一致怎么办？** - 以 manifest 为准？报错？
2. **name 命名规则** - 允许哪些字符？大小写敏感？
3. **version 格式** - semver？自由格式？
4. **路径深度限制** - 是否限制 `/` 的层级数？

---

**Status**: Open
**Priority**: High
**Labels**: design, protocol
