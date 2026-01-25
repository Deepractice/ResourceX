# Issue 021: Registry Cache-Source 架构

## 背景

当前 Registry 架构混淆了 Client 和 Server 的职责，`createRegistry` 有过多复杂配置（type: "git", endpoint 等）。需要简化架构，明确 Cache/Source/Mirror 的关系。

## 核心概念

### Source（权威源）

- well-known 指向的 Registry
- `deepractice.ai/.well-known/resourcex` → `https://registry.deepractice.ai`
- 可以 publish（发布新资源）
- 有所有版本，权威的

### Cache（本地缓存）

- 本地存储：`~/.resourcex/`
- 存储自己发布的资源 + 缓存远端资源
- 就是 LocalStorage

### Mirror（镜像）

- Mirror = 远端 Cache
- 本地 Cache 启动 Server 后就变成 Mirror
- 不是 well-known 指向的
- 只读（不能 publish 到别人的域名）

### 关系

```
Mirror = 远端 Cache
Cache 启动 Server = Mirror
```

同一个 Registry 可以同时是：

- 对自己发布的资源 → Source
- 对缓存的别人的资源 → Mirror

## 获取流程

```
registry.get("deepractice.ai/tool@1.0.0")

不指定 mirror:
  本地 Cache → Source (well-known 发现)

指定 mirror:
  本地 Cache → Mirror/Proxy → Source
```

详细流程：

```typescript
async get(locator: string): Promise<RXR> {
  const rxl = parseRXL(locator);

  // 1. 本地 Cache
  if (await this.storage.exists(locator)) {
    return this.storage.get(locator);
  }

  // 2. Mirror/Proxy (如果配置了)
  if (this.mirror) {
    try {
      const rxr = await this.fetchFrom(this.mirror, locator);
      await this.storage.put(rxr);  // 缓存到本地
      return rxr;
    } catch {
      // Proxy 没有，继续找 Source
    }
  }

  // 3. Source (well-known 发现)
  const source = await this.discover(rxl.domain);
  const rxr = await this.fetchFrom(source, locator);
  await this.storage.put(rxr);  // 缓存到本地
  return rxr;
}
```

## API 设计

### Client API（最常用）

```typescript
// 标准用法
const registry = createRegistry({
  path?: string;           // 本地 cache 路径，默认 ~/.resourcex
  mirror?: string;         // 可选，远端 mirror
  types?: BundledType[];   // 自定义类型
});

// 使用
registry.get("deepractice.ai/tool@1.0.0");  // 本地 → [mirror] → source
registry.get("localhost/my-tool@1.0.0");    // 只查本地，不走远端
registry.add(rxr);                           // 添加到本地
registry.link("./dev-tool");                 // 开发模式
```

### Server API（部署时）

```typescript
// 选择 Storage 后端
const registry = createRegistry({
  storage: new GitStorage({ url: "..." }),  // 用 git 仓库作为存储
  types?: BundledType[];
});

// 启动 Server → 变成 Source/Mirror
serve(registry, { port: 3000 });
```

### Storage 选项

```typescript
// 文件系统（默认）
new LocalStorage({ path: "~/.resourcex" });

// Git 仓库作为后端
new GitStorage({ url: "git@github.com:org/registry.git" });

// 对象存储（未来）
new S3Storage({ bucket: "..." });
```

## 类比

| ResourceX   | Go Modules        | npm                    |
| ----------- | ----------------- | ---------------------- |
| 本地 Cache  | `$GOPATH/pkg/mod` | `node_modules` + cache |
| mirror 配置 | `GOPROXY`         | registry 配置          |
| Source      | 直连源            | registry.npmjs.org     |
| Mirror      | gomirror.cn       | npmmirror.com          |

## 实现步骤

### Phase 1: 简化 createRegistry

1. 移除复杂配置（`type: "git"`, `endpoint` 等）
2. 保留简单配置：`path`, `mirror`, `storage`, `types`
3. 默认使用 LocalStorage

### Phase 2: 实现远端获取

1. 实现 `discover(domain)` - well-known 发现
2. 实现 `fetchFrom(endpoint, locator)` - HTTP API 获取
3. 修改 `Registry.get()` - 本地 → mirror → source 流程

### Phase 3: Server 支持（未来）

1. 实现 `serve(registry, options)` - HTTP Server
2. 实现 Registry HTTP API 规范

## 当前代码状态

已完成：

- [x] Storage 接口定义
- [x] LocalStorage 实现
- [x] GitStorage 实现（作为 Server 端存储选项）
- [x] HttpStorage 实现（需要重新定位）
- [x] Registry 类（需要修改）

需要修改：

- [ ] 简化 createRegistry.ts
- [ ] Registry 类增加远端发现逻辑
- [ ] 重新定位 HttpStorage（改为内部获取用，不是 Storage）

## 存储结构

```
~/.resourcex/
  ├── localhost/              # 我发布的资源 (Source)
  │   └── my-tool/
  │       └── 1.0.0/
  │           ├── manifest.json
  │           └── archive.tar.gz
  │
  └── deepractice.ai/         # 缓存的远端资源 (Mirror)
      └── tool/
          └── 1.0.0/
              ├── manifest.json
              └── archive.tar.gz
```

## 关键决策

1. **远端获取只有一种协议：Registry HTTP API** - Client 不直接 git clone
2. **GitStorage 是 Server 端选择** - 用 git 仓库作为存储后端
3. **LocalStorage = Cache** - 存储本地资源 + 缓存远端资源
4. **Cache 启动 Server = Mirror** - 同一个 Registry 多重身份
5. **删除 HttpStorage** - 远端获取在 Registry 内部实现，不是 Storage
6. **mirror 配置** - 单个 URL，叫 `mirror` 不叫 `mirror`
7. **localhost 只查本地** - 不走远端，没有就报错
