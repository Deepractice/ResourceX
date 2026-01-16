# 001: Add Deposit Capability to ResourceX

## 背景

当前 ResourceX 只支持资源读取（resolve），不支持写入。在 SandboX 项目集成时发现需要持久化能力，引发了关于是否应该添加写入能力的讨论。

## 问题

```typescript
// 目前只能读
const resource = await rx.resolve("arp:text:file://./config.json");

// 无法写
await rx.deposit("arp:text:file://./config.json", content); // ❌ 不存在
```

## 设计理念：银行隐喻

ResourceX 作为"资源银行"，采用银行操作的命名：

```
ResourceX = 资源银行

deposit  → 存入资源
resolve  → 取出/兑现资源
exists   → 查询资源是否存在
delete   → 删除资源
```

**为什么是 `deposit` 而不是 `write`？**

1. `resolve` 不只是 `read`，它包含了解析、转换、呈现的完整流程
2. 对应地，写入也不只是 `write`，而是"存放资源"的完整流程
3. `deposit ↔ resolve` 在包管理领域有先例（Gradle、Ivy）
4. 与 ResourceX 的"资源管理"定位契合

## 架构设计：Transport 与 Semantic 的职责分离

### 核心问题

当资源不只是单文件（如目录、包）时，transport 和 semantic 的边界如何划分？

```
单文件：arp:text:file://./config.json
  → 简单，transport 读一个文件，semantic 解析内容

复合资源：arp:package:file://./my-plugin/
  → 复杂，需要读取整个目录结构
  → transport 应该处理目录？还是 semantic 应该编排多次读取？
```

### 设计决策

**Transport 只负责定位 (WHERE) 和 I/O 原语**：

```
Transport 回答：资源在哪？如何进行底层 I/O？

file://   → 定位到本地文件系统，提供文件 I/O
https://  → 定位到网络地址，提供 HTTP I/O
arp://    → 定位到 ResourceX 托管服务
s3://     → 定位到 AWS S3
```

**Semantic 负责资源语义 (WHAT + HOW)**：

```
Semantic 回答：资源是什么？如何读写？

text    → 单文件，UTF-8 编解码
json    → 单文件，JSON 序列化/反序列化
package → 多文件，目录结构处理
image   → 单文件，图像编解码
```

### 职责清晰

```
Transport (WHERE + I/O 原语)
├── 定位：知道资源在哪
└── 原语：read / write / list / exists / delete

Semantic (WHAT + HOW)
├── 结构：单文件？目录？压缩包？
├── 内容：如何 parse / serialize
└── 编排：调用 transport 原语完成操作
```

**关键洞察**：Semantic 使用 Transport 的原语来完成操作，而不是 Transport 直接返回处理好的数据。

### 组合的威力

同一个 `package` semantic，不同 transport 下的行为：

| 组合                                 | Semantic 如何使用 Transport     |
| ------------------------------------ | ------------------------------- |
| `arp:package:file://./dir/`          | 用 `list` + `read` 遍历本地目录 |
| `arp:package:https://x.com/a.tar.gz` | 用 `read` 下载压缩包，自己解压  |
| `arp:package:s3://bucket/prefix/`    | 用 `list` + `read` 遍历 S3 对象 |

**Semantic 完全控制逻辑，Transport 只提供原语**。

## 接口设计

### ResourceX API（用户层）

```typescript
interface ResourceX {
  // 核心操作
  resolve<T>(url: string): Promise<Resource<T>>;
  deposit<T>(url: string, data: T): Promise<void>;

  // 扩展操作
  exists(url: string): Promise<boolean>;
  delete(url: string): Promise<void>;
}
```

### Transport Handler（I/O 原语层）

Transport 只提供底层 I/O 原语，不关心资源语义：

```typescript
interface TransportHandler {
  readonly name: string; // 'file', 'https', 's3', etc.

  // 基础 I/O 原语
  read(location: string): Promise<Buffer>;
  write?(location: string, content: Buffer): Promise<void>;

  // 扩展原语（可选）
  list?(location: string): Promise<string[]>; // 列目录/前缀
  exists?(location: string): Promise<boolean>; // 检查存在
  delete?(location: string): Promise<void>; // 删除

  // 能力声明
  readonly capabilities: {
    canWrite: boolean;
    canList: boolean;
    canDelete: boolean;
  };
}
```

### Semantic Handler（资源语义层）

Semantic 控制如何使用 Transport 原语来处理资源：

```typescript
interface SemanticHandler<T> {
  readonly name: string; // 'text', 'json', 'package', etc.

  // 核心操作：Semantic 编排 Transport 原语
  resolve(transport: TransportHandler, location: string): Promise<Resource<T>>;
  deposit(transport: TransportHandler, location: string, data: T): Promise<void>;

  // 扩展操作
  exists?(transport: TransportHandler, location: string): Promise<boolean>;
  delete?(transport: TransportHandler, location: string): Promise<void>;
}
```

### 实现示例

**text semantic（简单，单文件）**：

```typescript
const textHandler: SemanticHandler<string> = {
  name: "text",

  async resolve(transport, location) {
    const buffer = await transport.read(location);
    return {
      data: buffer.toString("utf-8"),
      metadata: { semantic: "text", location, size: buffer.length },
    };
  },

  async deposit(transport, location, data) {
    if (!transport.write) {
      throw new Error(`Transport ${transport.name} does not support write`);
    }
    await transport.write(location, Buffer.from(data, "utf-8"));
  },
};
```

**package semantic（复杂，多文件）**：

```typescript
const packageHandler: SemanticHandler<Package> = {
  name: "package",

  async resolve(transport, location) {
    if (!transport.list) {
      // 回退：尝试作为压缩包处理
      const buffer = await transport.read(location);
      return this.parseArchive(buffer);
    }

    // 遍历目录
    const files = await transport.list(location);
    const contents = new Map<string, Buffer>();
    for (const file of files) {
      contents.set(file, await transport.read(`${location}/${file}`));
    }
    return {
      data: { files: contents },
      metadata: { semantic: "package", location, fileCount: files.length },
    };
  },

  async deposit(transport, location, pkg) {
    if (!transport.write) {
      throw new Error(`Transport ${transport.name} does not support write`);
    }
    for (const [name, content] of pkg.files) {
      await transport.write(`${location}/${name}`, content);
    }
  },
};
```

## 分析

### 技术角度

| 维度           | resolve             | deposit                  |
| -------------- | ------------------- | ------------------------ |
| Transport 职责 | 提供 read/list 原语 | 提供 write/delete 原语   |
| Semantic 职责  | 编排原语 + parse    | 编排原语 + serialize     |
| 复杂度         | 简单                | 复杂（认证/权限/原子性） |
| 支持度         | 所有 transport      | 部分（http/https 只读）  |

### 商业角度

如果加 deposit，ResourceX 可以从"协议/工具库"升级为"资源平台"：

```
开发者 deposit prompt/tool/config
            ↓
      ResourceX 托管
            ↓
    其他 Agent resolve
            ↓
        生态形成
```

类似 npm / Docker Hub / Hugging Face 的模式，具有网络效应和商业价值。

## 建议方案

分阶段实现：

### Phase 1: 本地 Deposit

支持 `file://` transport 的 deposit：

```typescript
// 用法
await rx.deposit("arp:text:file://./data/config.txt", "hello world");
await rx.deposit("arp:json:file://./data/config.json", { key: "value" });
```

实现步骤：

1. 扩展 TransportHandler 接口，添加 I/O 原语
2. 重构 SemanticHandler 接口，让其编排 Transport 原语
3. 为 file transport 实现 write/list/exists/delete 原语
4. 为 text semantic 实现 deposit 方法
5. 在 ResourceX 类中添加 deposit API

### Phase 2: 托管服务

添加 `arp://` transport 实现平台化：

```typescript
// 存入到 ResourceX 托管
await rx.deposit("arp:prompt:arp://sean/my-prompt.txt", promptContent);

// 其他用户取出
const resource = await rx.resolve("arp:prompt:arp://sean/my-prompt.txt");
```

需要：

- 后端托管服务
- 用户认证系统
- 存储后端
- 权限管理

## 优先级

- Phase 1 (本地 Deposit): **建议实现** - SandboX 等项目有实际需求
- Phase 2 (托管服务): **未来方向** - 设计时预留扩展点

## 来源

此 issue 来自 SandboX 项目的 StateStore 持久化需求讨论。

---

**Status**: Implemented
**Priority**: Medium
**Labels**: enhancement, api-design, architecture
**Implemented**: 2026-01-16
