# Registry Remote Support

## 背景

当前 Registry 只有本地实现（ARPRegistry），且依赖 ARP 做文件 I/O。为了支持远程 Registry 访问，需要重新设计架构。

## 核心问题

1. **ARPRegistry 依赖 ARP**：导致 RxrTransport 无法放在 arp 包（会循环依赖）
2. **Registry 是服务，不是文件系统**：有解析、类型处理等逻辑，不应该被当作纯 I/O
3. **需要支持远程访问**：通过 HTTP API 访问其他 domain 的 Registry

## 设计方案

### 1. Registry 不依赖 ARP

Registry 独立实现存储层：

- **LocalRegistry**：直接用 Node.js `fs` 模块
- **RemoteRegistry**：直接用 `fetch`

```
packages/
├── arp/           # 纯 I/O（file, http, rxr）
├── registry/      # 独立实现，不依赖 arp
│   ├── LocalRegistry   → fs 模块
│   └── RemoteRegistry  → fetch
└── core/          # RXL, RXM, RXC
```

**依赖关系：**

```
arp → registry（RxrTransport 用 Registry）
registry → core
registry → type
无循环依赖！
```

### 2. 统一 createRegistry 入口

```typescript
/**
 * Local 模式配置
 */
interface LocalRegistryConfig {
  path?: string; // 存储路径，默认 ~/.resourcex
  types?: ResourceType[]; // 支持的资源类型
}

/**
 * Remote 模式配置
 */
interface RemoteRegistryConfig {
  endpoint: string; // 远程 Registry API 地址
}

type RegistryConfig = LocalRegistryConfig | RemoteRegistryConfig;

/**
 * 统一入口 - 根据 config 类型自动创建对应 Registry
 */
function createRegistry(config?: RegistryConfig): Registry {
  if (config && "endpoint" in config) {
    return new RemoteRegistry(config);
  } else {
    return new LocalRegistry(config);
  }
}
```

**使用示例：**

```typescript
// 本地（默认）
const registry = createRegistry();
const registry2 = createRegistry({ path: "./custom-path" });

// 远程
const registry3 = createRegistry({
  endpoint: "https://registry.deepractice.ai/v1",
});
```

### 3. Well-Known 服务发现

**路径：**

```
GET https://{domain}/.well-known/resourcex
Content-Type: application/json
```

**响应：**

```json
{
  "version": "1.0",
  "registry": "https://registry.deepractice.ai/v1"
}
```

**作用：**

- RXL 只有 domain（如 `deepractice.ai/nuwa.text@1.0.0`）
- 通过 well-known 发现该 domain 的 Registry API 地址
- 类似 Go modules 的服务发现机制

### 4. Registry HTTP API

基于 AgentVM 已有实现，标准化 HTTP API：

| 方法 | 路径                                        | 说明               |
| ---- | ------------------------------------------- | ------------------ |
| GET  | `/v1/registry/resource?locator={locator}`   | 获取资源元信息     |
| POST | `/v1/registry/resolve`                      | Resolve + 执行     |
| GET  | `/v1/registry/exists?locator={locator}`     | 检查存在           |
| GET  | `/v1/registry/search?query=&limit=&offset=` | 搜索               |
| GET  | `/v1/registry/files/{locator}/{path...}`    | 获取内部文件       |
| POST | `/v1/registry/link`                         | Link（服务端专用） |
| POST | `/v1/registry/delete`                       | 删除（服务端专用） |

**Files 接口示例：**

```
GET /v1/registry/files/nuwa.text@1.0.0/thought/first-principles.md

Response: 文件内容
```

### 5. RxrTransport 实现

RxrTransport 根据 domain 自动选择 Registry：

```typescript
class RxrTransport implements TransportHandler {
  readonly name = "rxr";

  async get(location: string): Promise<TransportResult> {
    const { domain, locator, internalPath } = this.parseLocation(location);

    // 根据 domain 创建对应的 Registry
    const registry =
      domain === "localhost"
        ? createRegistry() // LocalRegistry
        : createRegistry({ endpoint: await this.discover(domain) }); // RemoteRegistry

    // 获取资源内部文件
    const rxr = await registry.get(locator);
    const file = await rxr.content.file(internalPath);

    return {
      content: file,
      metadata: { type: "file", size: file.length },
    };
  }

  private async discover(domain: string): Promise<string> {
    const response = await fetch(`https://${domain}/.well-known/resourcex`);
    const data = await response.json();
    return data.registry;
  }

  // ... 其他方法
}
```

**RxrTransport 位置：arp 包**

因为 Registry 不再依赖 arp，所以：

- arp 可以依赖 registry
- RxrTransport 放在 arp 包
- 无循环依赖

### 6. 完整流程

```
用户请求：arp:text:rxr://deepractice.ai/nuwa.text@1.0.0/thought/file.md

1. RxrTransport.get() 解析 location
   - domain: deepractice.ai
   - locator: nuwa.text@1.0.0
   - internalPath: thought/file.md

2. 发现 Registry endpoint
   GET https://deepractice.ai/.well-known/resourcex
   → { "registry": "https://registry.deepractice.ai/v1" }

3. 创建 RemoteRegistry
   createRegistry({ endpoint: "https://registry.deepractice.ai/v1" })

4. 获取资源
   registry.get("nuwa.text@1.0.0")
   → 内部调用 GET /v1/registry/files/nuwa.text@1.0.0/thought/file.md

5. 返回文件内容
```

**localhost 流程：**

```
用户请求：arp:text:rxr://localhost/hello.text@1.0.0/content

1. RxrTransport.get() 解析 location
   - domain: localhost

2. 创建 LocalRegistry
   createRegistry()

3. 获取资源（直接读本地文件系统）
   registry.get("localhost/hello.text@1.0.0")
   → 读取 ~/.resourcex/localhost/hello.text/1.0.0/content.tar.gz

4. 返回文件内容
```

## 实现步骤

### Phase 1: 重构 Registry（不依赖 ARP）

- [ ] 创建 LocalRegistry（用 fs 模块替代 ARP）
- [ ] 迁移 ARPRegistry 逻辑到 LocalRegistry
- [ ] 移除 registry 对 arp 的依赖
- [ ] 更新测试

### Phase 2: 实现 RemoteRegistry

- [ ] 定义 HTTP API schemas
- [ ] 实现 RemoteRegistry（HTTP Client）
- [ ] 实现 well-known 发现
- [ ] 统一 createRegistry 入口

### Phase 3: 更新 RxrTransport

- [ ] RxrTransport 支持自动创建 Registry
- [ ] 移除手动注入的需求
- [ ] 内置到 ARP
- [ ] 更新测试和文档

### Phase 4: HTTP Server（可选）

- [ ] 从 AgentVM 迁移 registry routes
- [ ] 导出供 AgentVM 等使用

## 文件变更

| 操作 | 文件                                                           |
| ---- | -------------------------------------------------------------- |
| 新增 | `packages/registry/src/LocalRegistry.ts`                       |
| 新增 | `packages/registry/src/RemoteRegistry.ts`                      |
| 修改 | `packages/registry/src/types.ts`                               |
| 修改 | `packages/registry/src/createRegistry.ts`                      |
| 删除 | `packages/registry/src/ARPRegistry.ts`（迁移到 LocalRegistry） |
| 修改 | `packages/arp/src/transport/rxr.ts`                            |
| 修改 | `packages/arp/package.json`（添加 registry 依赖）              |

## 兼容性

- `createRegistry()` 默认行为不变（创建 LocalRegistry）
- 现有代码无需修改
- 新增 remote 模式为可选功能
