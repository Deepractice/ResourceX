# 005: ARP Prefix Aliases

## 背景

当前 ARP URL 必须以 `arp:` 开头：

```
arp:text:file://./config.txt
```

在某些场景下，`arp:` 前缀显得冗长。希望支持：

1. 自定义前缀别名（如 `@`, `r`）
2. 无前缀 ARP

## 期望用法

### 自定义前缀别名

```typescript
const rx = createResourceX({
  arpAliases: ["arp", "@", "r"], // 支持多个别名
});

// 以下都有效
await rx.resolve("arp:text:file://./config.txt"); // 标准
await rx.resolve("@text:file://./config.txt"); // 短别名
await rx.resolve("r:text:file://./config.txt"); // 短别名
```

### 无前缀 ARP

```typescript
const rx = createResourceX({
  arpAliases: ["arp", ""], // 空字符串 = 无前缀
});

// 直接用 semantic:transport://location
await rx.resolve("text:file://./config.txt");
await rx.resolve("binary:https://example.com/image.png");
```

## URL 解析规则

```
parseURL(url):
  1. 检查是否匹配 ARP 格式（带前缀或无前缀）
     - {prefix}:semantic:transport://location
     - semantic:transport://location  (无前缀)

  2. 检查是否匹配 Resource 格式
     - {prefix}:name://location
     - name://location  (无前缀)

  3. 都不匹配 → ParseError
```

### 格式区分规则

| URL 格式                    | 冒号数量        | 识别为               |
| --------------------------- | --------------- | -------------------- |
| `@text:file://./config.txt` | 2               | ARP（前缀 `@`）      |
| `text:file://./config.txt`  | 2               | 无前缀 ARP           |
| `@mydata://config.txt`      | 1               | Resource（前缀 `@`） |
| `mydata://config.txt`       | 0（只有 `://`） | Resource（无前缀）   |

## 异常场景分析

### 1. Resource 名字包含冒号

```typescript
// ❌ 不允许
defineResource({ name: "my:data", ... });
```

**解决方案**：Resource 名字验证规则已限制为 `/^[a-z][a-z0-9-]*$/`（不含冒号）

### 2. Resource 名字和 Semantic 同名

```typescript
defineResource({ name: "text", semantic: "json", transport: "file" });

// 使用
text://config.txt  // Resource "text"
text:file://...    // 无前缀 ARP (semantic=text)
```

**分析**：通过格式区分，不会混淆。

### 3. 前缀冲突

```typescript
defineResource({ prefix: "@", name: "data" });

// 如果同时启用 @ 作为 ARP alias
arpAliases: ["@"];
```

**分析**：通过冒号数量区分

- `@text:file://...` → ARP（2 个冒号）
- `@data://...` → Resource（1 个冒号）

## 接口设计

```typescript
interface ResourceXConfig {
  /**
   * ARP prefix aliases (default: ["arp"])
   * Empty string "" means prefix-less ARP is allowed
   */
  arpAliases?: string[];

  transports?: TransportHandler[];
  semantics?: SemanticHandler[];
  resources?: ResourceDefinition[];
}

interface ResourceDefinition {
  /**
   * Prefix for this resource (default: "")
   * Examples: "", "@", "@deepractice", "arp"
   */
  prefix?: string;

  name: string;
  semantic: string;
  transport: string;
  basePath?: string;
}
```

## 使用示例

### Deepractice 生态

```typescript
const rx = createResourceX({
  arpAliases: ["arp", "@"],
  resources: [
    {
      prefix: "@deepractice",
      name: "sandbox",
      semantic: "text",
      transport: "file",
      basePath: "~/.deepractice/sandbox",
    },
    {
      prefix: "@deepractice",
      name: "promptx",
      semantic: "text",
      transport: "file",
      basePath: "~/.deepractice/promptx",
    },
  ],
});

// 使用
await rx.deposit("@deepractice:sandbox://logs/app.log", "...");
await rx.deposit("@deepractice:promptx://cache/prompt.md", "...");

// 也可以用标准格式
await rx.deposit("arp:text:file://~/.deepractice/sandbox/logs/app.log", "...");
```

### 简洁模式

```typescript
const rx = createResourceX({
  arpAliases: ["@", ""], // @ 和无前缀
  resources: [
    {
      prefix: "",
      name: "s",
      semantic: "text",
      transport: "file",
      basePath: "~/.deepractice/sandbox",
    },
  ],
});

// 超短
await rx.deposit("s://logs/app.log", "...");

// 无前缀 ARP
await rx.deposit("text:file://./local.txt", "...");
```

## 实现步骤

1. 添加 `arpAliases` 到 `ResourceXConfig`
2. 添加 `prefix` 到 `ResourceDefinition`
3. 更新 `parseURL()` 逻辑
4. 添加 BDD 测试
5. 更新文档

## 优先级

**Medium** - 便利性功能，提升用户体验。

---

**Status**: Open
**Priority**: Medium
**Labels**: enhancement
