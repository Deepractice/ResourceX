# 005: URL Prefix Alias

## 背景

当前 ARP URL 必须以 `arp:` 开头，在频繁使用时显得冗长。

## 设计

**固定设计**：

- `arp:` - 标准前缀（**永远支持**，不可配置）
- `@` - 默认简写前缀（**可配置**）

```typescript
// 默认配置
const rx = createResourceX();

// 同时支持
arp:text:file://./config.txt  // 标准
@text:file://./config.txt      // 简写（默认 @）

// 自定义简写
const rx = createResourceX({ alias: "#" });

// 同时支持
arp:text:file://./config.txt  // 标准（永远可用）
#text:file://./config.txt      // 简写（改成 #）
```

**好处**：

1. `arp:` 永远可用，向后兼容
2. 简写可配置，避免符号冲突
3. AI 和用户都有清晰的识别标识

## URL 格式

### ARP URL

```
{prefix}:semantic:transport://location

prefix: "arp" 或配置的 alias（默认 "@"）
```

**示例**：

```
arp:text:file://./config.txt     // 标准
@text:file://./config.txt        // 简写（默认）
#text:file://./config.txt        // 简写（配置 alias: "#"）
```

### Resource URL

```
{prefix}:name://location

prefix: "arp" 或配置的 alias（默认 "@"）
```

**示例**：

```
arp:sandbox://logs/app.log       // 标准
@sandbox://logs/app.log          // 简写（默认）
#sandbox://logs/app.log          // 简写（配置 alias: "#"）
```

## 接口设计

```typescript
interface ResourceXConfig {
  /**
   * Shorthand prefix alias (default: "@")
   * Standard "arp:" is always supported
   */
  alias?: string;

  transports?: TransportHandler[];
  semantics?: SemanticHandler[];
  resources?: ResourceDefinition[];
}

// ResourceDefinition 不需要 prefix 字段
interface ResourceDefinition {
  name: string;
  semantic: string;
  transport: string;
  basePath?: string;
}
```

## 使用示例

### 默认配置（推荐）

```typescript
const rx = createResourceX({
  transports: [deepracticeHandler()],
  resources: [{ name: "sandbox", semantic: "text", transport: "deepractice", basePath: "sandbox" }],
});

// 标准
await rx.deposit("arp:text:deepractice://sandbox/logs/app.log", "...");
await rx.deposit("arp:sandbox://logs/app.log", "...");

// 简写
await rx.deposit("@text:deepractice://sandbox/logs/app.log", "...");
await rx.deposit("@sandbox://logs/app.log", "...");
```

### 自定义简写

```typescript
const rx = createResourceX({
  alias: "#", // 改成 #
});

// 标准（永远可用）
await rx.resolve("arp:text:file://./config.txt");

// 简写（改成 #）
await rx.resolve("#text:file://./config.txt");
```

## BDD 测试场景

### 正常场景

```gherkin
Scenario: Use standard arp prefix
  Given ResourceX with default config
  When resolve "arp:text:file://./hello.txt"
  Then should return resource object

Scenario: Use default alias @
  Given ResourceX with default config
  When resolve "@text:file://./hello.txt"
  Then should return resource object

Scenario: Use custom alias #
  Given ResourceX with alias "#"
  When resolve "#text:file://./hello.txt"
  Then should return resource object
  When resolve "arp:text:file://./hello.txt"
  Then should return resource object (arp always works)

Scenario: Resource URL with @ prefix
  Given ResourceX with default config
  And resource "mydata" defined
  When resolve "@mydata://config.txt"
  Then should return resource object

Scenario: Resource URL with arp prefix
  Given ResourceX with default config
  And resource "mydata" defined
  When resolve "arp:mydata://config.txt"
  Then should return resource object
```

### 异常场景

```gherkin
Scenario: Reject URL without any prefix
  Given ResourceX with default config
  When resolve "text:file://./config.txt"
  Then should throw error
  And error message should contain "Invalid"

Scenario: Reject URL with wrong custom alias
  Given ResourceX with alias "#"
  When resolve "@text:file://./config.txt"
  Then should throw error (@ not configured, only arp and # work)

Scenario: Resource name same as semantic name
  Given ResourceX with default config
  And resource "text" defined with semantic "binary"
  When resolve "@text://data.bin"
  Then should resolve as Resource "text"
  And type should be "binary" (not text)
```

## 实现步骤

1. 添加 `alias` 到 `ResourceXConfig`（默认 `"@"`）
2. 修改 `parseURL()` 逻辑
   - 检查 `arp:` 或 `{alias}`
   - 数冒号判断 ARP vs Resource
3. 添加 BDD 测试（包含所有异常场景）
4. 更新文档

## 优先级

**Medium** - 便利性功能，提升用户体验和 AI 识别能力。

---

**Status**: Open
**Priority**: Medium
**Labels**: enhancement
