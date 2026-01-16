# 005: ARP Prefix Aliases

## 背景

当前 ARP URL 必须以 `arp:` 开头：

```
arp:text:file://./config.txt
```

在某些场景下，`arp:` 前缀显得冗长。希望支持自定义前缀别名（如 `@`, `r`）。

## 设计原则

**统一前缀**：ARP 和 Resource 共用同一套前缀，保持一致性。

**好处**：

1. **用户识别** - 看到特定前缀（`@`, `r:`, `arp:`）就知道是 ResourceX URL
2. **解析简单** - 只需检查前缀 + 冒号数量
3. **AI 友好** - 前缀作为上下文标识，帮助 AI 快速识别

## 期望用法

### 自定义前缀别名

```typescript
const rx = createResourceX({
  arpAliases: ["@"], // 设置前缀为 @
  resources: [{ name: "sandbox", semantic: "text", transport: "deepractice" }],
});

// ARP 和 Resource 都用 @
await rx.resolve("@text:file://./config.txt"); // ARP
await rx.resolve("@sandbox://logs/app.log"); // Resource
```

### 多个前缀别名

```typescript
const rx = createResourceX({
  arpAliases: ["arp", "@", "r"], // 支持 3 个前缀
});

// 都有效（ARP）
await rx.resolve("arp:text:file://./config.txt");
await rx.resolve("@text:file://./config.txt");
await rx.resolve("r:text:file://./config.txt");

// 都有效（Resource，如果定义了）
await rx.resolve("arp:sandbox://...");
await rx.resolve("@sandbox://...");
await rx.resolve("r:sandbox://...");
```

### 默认行为

```typescript
// 不配置时，默认只支持 "arp"
const rx = createResourceX();

await rx.resolve("arp:text:file://./config.txt"); // ✅
await rx.resolve("@text:file://./config.txt"); // ❌ 报错
```

## URL 解析规则

```
parseURL(url):
  1. 提取前缀（第一个冒号之前）
     - 检查 prefix 是否在 arpAliases 中
     - 不在 → ParseError

  2. 数冒号判断类型
     - {prefix}:semantic:transport://  → ARP（2 冒号）
     - {prefix}:name://                → Resource（1 冒号）

  3. 解析对应格式
```

### 格式区分规则

| URL 格式                    | 前缀检查         | 冒号数量 | 识别为     |
| --------------------------- | ---------------- | -------- | ---------- |
| `@text:file://./config.txt` | `@` ∈ arpAliases | 2        | ARP        |
| `@sandbox://logs/app.log`   | `@` ∈ arpAliases | 1        | Resource   |
| `text:file://./config.txt`  | 无合法前缀       | -        | ParseError |
| `sandbox://logs/app.log`    | 无合法前缀       | -        | ParseError |

## 异常场景和 BDD

### 1. 无前缀 URL（应报错）

```gherkin
Scenario: Reject URL without valid prefix
  Given ResourceX with arpAliases ["@"]
  When resolve "text:file://./config.txt"
  Then should throw error
  And error message should contain "Invalid prefix"
```

### 2. Resource 名字和 Semantic 同名

```gherkin
Scenario: Resource name same as semantic name
  Given ResourceX with arpAliases ["@"]
  And resource "text" defined with semantic "json", transport "file"
  When resolve "@text://config.txt"
  Then should resolve as Resource "text" (not ARP semantic)
  And type should be "json"
```

**分析**：通过冒号数量区分，`@text://` = Resource（1 冒号）

### 3. 前缀不在 arpAliases 中

```gherkin
Scenario: Reject unregistered prefix
  Given ResourceX with arpAliases ["@"]
  When resolve "r:text:file://./config.txt"
  Then should throw error
  And error message should contain "Invalid prefix" or "Unknown prefix"
```

### 4. 格式错误（冒号位置不对）

```gherkin
Scenario: Reject malformed URL
  Given ResourceX with arpAliases ["@"]
  When resolve "@textfile://./config.txt"
  Then should throw error
  And error message should contain "Invalid URL format"
```

## 接口设计

```typescript
interface ResourceXConfig {
  /**
   * ARP prefix aliases (default: ["arp"])
   * All URLs (ARP and Resource) must start with one of these prefixes
   */
  arpAliases?: string[];

  transports?: TransportHandler[];
  semantics?: SemanticHandler[];
  resources?: ResourceDefinition[];
}

// ResourceDefinition 不需要 prefix 字段（跟随 arpAliases）
interface ResourceDefinition {
  name: string;
  semantic: string;
  transport: string;
  basePath?: string;
}
```

## 使用示例

### Deepractice 生态（推荐配置）

```typescript
const rx = createResourceX({
  arpAliases: ["@"], // 统一用 @
  transports: [deepracticeHandler()],
  resources: [
    { name: "sandbox", semantic: "text", transport: "deepractice", basePath: "sandbox" },
    { name: "promptx", semantic: "text", transport: "deepractice", basePath: "promptx" },
  ],
});

// 清晰一致
await rx.deposit("@text:deepractice://sandbox/logs/app.log", "...");
await rx.deposit("@sandbox://logs/app.log", "...");
```

### 兼容模式（支持多前缀）

```typescript
const rx = createResourceX({
  arpAliases: ["arp", "@"], // 同时支持标准和简写
});

// 都可以用
await rx.resolve("arp:text:file://./config.txt");
await rx.resolve("@text:file://./config.txt");
```

## 实现步骤

1. 添加 `arpAliases` 到 `ResourceXConfig`（默认 `["arp"]`）
2. 修改 `parseURL()` 逻辑
   - 提取并验证前缀
   - 数冒号判断 ARP vs Resource
3. 添加 BDD 测试（包含所有异常场景）
4. 更新文档

## 优先级

**Medium** - 便利性功能，提升用户体验和 AI 识别能力。

---

**Status**: Open
**Priority**: Medium
**Labels**: enhancement
