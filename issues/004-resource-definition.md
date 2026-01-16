# 004: Resource Definition

## 背景

ARP URL 格式 `arp:{semantic}:{transport}://{location}` 提供完全灵活的组合能力，但日常使用中经常重复写相同的 semantic + transport + basePath。

## 设计

**Resource = 固化的 ARP**

Resource 是 ARP URL 的快捷方式，固定 semantic、transport、basePath。

## API 设计

### 配置式创建

```typescript
interface ResourceXConfig {
  transports?: TransportHandler[]; // 自定义 transport
  semantics?: SemanticHandler[]; // 自定义 semantic
  resources?: ResourceDefinition[]; // Resource 定义
}

interface ResourceDefinition {
  name: string;
  semantic: string;
  transport: string;
  basePath?: string;
}
```

### 使用示例

```typescript
import { createResourceX } from "resourcexjs";
import { join } from "path";
import { homedir } from "os";

const deepPath = (...segments: string[]) =>
  join(homedir(), ".deepractice", ...segments);

const rx = createResourceX({
  resources: [
    { name: "sandbox-log", semantic: "json", transport: "file", basePath: deepPath("sandbox", "logs") },
    { name: "sandbox-blob", semantic: "binary", transport: "file", basePath: deepPath("sandbox", "blobs") },
    { name: "promptx-cache", semantic: "text", transport: "file", basePath: deepPath("promptx", "cache") },
  ]
});

// 使用 Resource URL
await rx.deposit("sandbox-log://session-123.json", { events: [...] });
await rx.deposit("sandbox-blob://sha256-abc", buffer);
const prompt = await rx.resolve("promptx-cache://prompt-xyz.md");

// 仍然可以使用标准 ARP URL
await rx.resolve("arp:text:https://example.com/file.txt");
```

## 对比

|        | ARP                                 | Resource          |
| ------ | ----------------------------------- | ----------------- |
| 格式   | `arp:semantic:transport://location` | `name://location` |
| 灵活性 | 完全灵活，任意组合                  | 固定组合          |
| 用途   | 一次性使用、特殊场景                | 简化常用场景      |

## URL 解析逻辑

```
parseURL(url)
    │
    ├── url.startsWith("arp:")
    │       └── parseARP() → { semantic, transport, location }
    │
    └── url.match(/^([a-z][a-z0-9-]*):\/\/(.*)$/)
            │
            ├── 查找已注册 Resource
            │       └── 找到 → 展开为 { semantic, transport, location: basePath + loc }
            │
            └── 未找到 → ParseError("Unknown resource")
```

## 代码结构

```
packages/core/src/
├── resource/
│   ├── types.ts        # ResourceDefinition 接口
│   ├── registry.ts     # 注册表
│   └── index.ts        # 导出
├── parser.ts           # 修改：parseURL() 支持 Resource URL
└── resolve.ts          # 不变，复用现有逻辑

packages/resourcex/src/
├── ResourceX.ts        # 修改：构造函数接受 config
└── createResourceX.ts  # 修改：传递 config
```

## 实现步骤

1. 定义 `ResourceDefinition` 类型
2. 实现 Resource 注册表
3. 实现 `parseURL()` 统一入口
4. 修改 `createResourceX()` 接受配置
5. 添加 BDD 测试

## 未来扩展

```typescript
// Phase 2: 配置文件
const rx = createResourceX({
  configFile: "./resourcex.config.ts",
});

// Phase 3: 自动发现
const rx = createResourceX(); // 自动读取 resourcex.config.ts
```

## 优先级

**Medium** - 便利性功能，不影响核心能力。

---

**Status**: Open
**Priority**: Medium
**Labels**: enhancement
