# 003: Add Deepractice Transport

## 背景

Deepractice 生态有多个项目（SandboX、PromptX、ToolX 等），都需要在用户本地存储数据。统一使用 `~/.deepractice/` 作为数据目录。

目前各项目需要自己处理：

1. 跨平台的 home 目录获取
2. baseDir 配置传递
3. 路径拼接

## 问题

```typescript
// 现在：每个项目自己处理
import { homedir } from "os";
import { join } from "path";

const baseDir = join(homedir(), ".deepractice", "sandbox");
await rx.deposit(`arp:text:file://${join(baseDir, "logs", "key.json")}`, data);
```

**问题：**

1. 每个项目重复相同的逻辑
2. baseDir 需要层层传递
3. URL 拼接繁琐，容易出错

## 期望用法

```typescript
// 之后：使用 deepractice transport
await rx.deposit("arp:text:deepractice://sandbox/logs/key.json", data);

// 自动映射到
// macOS: /Users/sean/.deepractice/sandbox/logs/key.json
// Linux: /home/sean/.deepractice/sandbox/logs/key.json
// Windows: C:\Users\sean\.deepractice\sandbox\logs\key.json
```

## 设计

### Transport 定义

```typescript
import { homedir } from "os";
import { join } from "path";
import { readFile, writeFile, access, unlink, mkdir } from "fs/promises";

const deepracticeTransport: TransportHandler = {
  name: "deepractice",

  capabilities: {
    canWrite: true,
    canList: true,
    canDelete: true,
  },

  // deepractice://sandbox/logs/key.json → ~/.deepractice/sandbox/logs/key.json
  private resolvePath(location: string): string {
    return join(homedir(), ".deepractice", location);
  },

  async read(location: string): Promise<Buffer> {
    const fullPath = this.resolvePath(location);
    return readFile(fullPath);
  },

  async write(location: string, content: Buffer): Promise<void> {
    const fullPath = this.resolvePath(location);
    // 确保目录存在
    const dir = dirname(fullPath);
    await mkdir(dir, { recursive: true });
    await writeFile(fullPath, content);
  },

  async exists(location: string): Promise<boolean> {
    try {
      await access(this.resolvePath(location));
      return true;
    } catch {
      return false;
    }
  },

  async delete(location: string): Promise<void> {
    await unlink(this.resolvePath(location));
  },

  async list(location: string): Promise<string[]> {
    const fullPath = this.resolvePath(location);
    return readdir(fullPath);
  },
};
```

### URL 格式

```
arp:{semantic}:deepractice://{path}

示例：
arp:text:deepractice://sandbox/logs/sandbox-123.json
arp:binary:deepractice://sandbox/blobs/sha256-abc123
arp:json:deepractice://promptx/config.json
arp:text:deepractice://toolx/tools/calculator/index.ts
```

## 使用场景

### SandboX

```typescript
// StateStore
await rx.deposit("arp:text:deepractice://sandbox/logs/session-123.json", logJson);
await rx.deposit("arp:binary:deepractice://sandbox/blobs/sha256-xxx", blob);
```

### PromptX

```typescript
// 本地 prompt 缓存
await rx.deposit("arp:text:deepractice://promptx/cache/prompt-abc.md", promptContent);
```

### ToolX

```typescript
// 工具配置
await rx.deposit("arp:json:deepractice://toolx/config.json", toolConfig);
```

## 目录结构

```
~/.deepractice/
├── sandbox/
│   ├── logs/
│   │   └── session-123.json
│   └── blobs/
│       └── sha256-xxx
├── promptx/
│   └── cache/
│       └── prompt-abc.md
├── toolx/
│   └── config.json
└── resourcex/
    └── cache/
        └── ...
```

## 优先级

**建议实现** - 这是 Deepractice 生态的基础设施，多个项目都会受益。

## 来源

此 issue 来自 SandboX 项目的 StateStore 实现讨论。

---

**Status**: Open
**Priority**: High
**Labels**: enhancement, transport-handler, ecosystem
