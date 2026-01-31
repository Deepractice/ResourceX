# ResourceX 原语设计

## 背景

当前 ResourceX 缺少：

1. 对"开发目录"格式的明确定义 (RXF, RXD)
2. 清晰的原子操作边界
3. 本地/远程操作的语义区分

## 类型体系

```
┌──────┬─────────────────────┬──────────────────────────────────────┐
│ 类型 │        全称         │                 描述                 │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXD  │ Resource Definition │ resource.json 内容，完整定义         │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXF  │ Resource Folder     │ 开发目录 = RXD + 文件                │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXL  │ Resource Locator    │ 定位符                               │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXM  │ Resource Manifest   │ 元数据（含文件结构）                 │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXA  │ Resource Archive    │ tar.gz 压缩包                        │
├──────┼─────────────────────┼──────────────────────────────────────┤
│ RXR  │ Resource            │ 完整资源 = RXL + RXM + RXA           │
└──────┴─────────────────────┴──────────────────────────────────────┘
```

注：移除 RXP (Resource Package)，`extract()` 直接返回 `Record<string, Buffer>`。

## 类型定义

```typescript
// RXD - 完整定义 (resource.json)
interface RXD {
  name: string;
  type: string;
  version: string;
  domain?: string; // 默认 localhost
  path?: string;
  description?: string;
  author?: string;
  // ...可扩展
}

// RXF - 开发目录
interface RXF {
  readonly path: string;
  readonly definition: RXD;
  readonly files: string[];
}

// RXL - 定位符
interface RXL {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
}

// RXM - 元数据
interface RXM {
  readonly domain: string;
  readonly path?: string;
  readonly name: string;
  readonly type: string;
  readonly version: string;
  readonly files?: string[]; // 包内文件结构
}

// RXA - 压缩包
interface RXA {
  readonly stream: ReadableStream;
  buffer(): Promise<Buffer>;
}

// RXR - 完整资源
interface RXR {
  readonly locator: RXL;
  readonly manifest: RXM;
  readonly archive: RXA;
}
```

## 原语操作

### 设计原则

1. **只接受对象** - 底层不接受字符串，字符串解析放上层
2. **原子操作** - 每个操作职责单一，可组合
3. **无语法糖** - 底层保持纯净，语法糖在上层封装

### 创建原语

```typescript
manifest(rxd: RXD): RXM
archive(files: Record<string, Buffer>): RXA
locator(rxm: RXM): RXL
resource(rxm: RXM, rxa: RXA): RXR
```

### 转换原语

```typescript
extract(rxa: RXA): Record<string, Buffer>
```

### 本地操作（隐含本地 storage）

```typescript
save(rxr: RXR): void
load(rxl: RXL): RXR
remove(rxl: RXL): void
has(rxl: RXL): boolean
```

### 远程操作

```typescript
push(remote: Storage, rxl: RXL): void   // 本地 → 远程
pull(remote: Storage, rxl: RXL): void   // 远程 → 本地
```

## 数据流

```
                            ┌─────────────────────────────────────┐
                            │            RXF (开发目录)            │
                            │  { path, definition: RXD, files[] } │
                            └──────────────┬──────────────────────┘
                                           │
                         ┌─────────────────┼─────────────────┐
                         │                 │                 │
                         ▼                 │                 ▼
               ┌─────────────────┐         │       ┌─────────────────┐
               │   RXD (定义)    │         │       │  files 内容     │
               │ {name,type,ver} │         │       │ Record<str,Buf> │
               └────────┬────────┘         │       └────────┬────────┘
                        │                  │                │
                   manifest()              │           archive()
                        │                  │                │
                        ▼                  │                ▼
               ┌─────────────────┐         │       ┌─────────────────┐
               │   RXM (元数据)  │         │       │   RXA (压缩包)  │
               └────────┬────────┘         │       └────────┬────────┘
                        │                  │                │
                   locator()               │                │
                        │                  │                │
                        ▼                  │                │
               ┌─────────────────┐         │                │
               │   RXL (定位符)  │         │                │
               └─────────────────┘         │                │
                                           │                │
                        ┌──────────────────┴────────────────┘
                        │
                   resource(rxm, rxa)
                        │
                        ▼
               ┌─────────────────────────────────┐
               │           RXR (资源)            │
               │  { locator, manifest, archive } │
               └────────────────┬────────────────┘
                                │
          ┌─────────────────────┼─────────────────────┐
          │                     │                     │
          ▼                     ▼                     ▼
   ┌────────────┐       ┌────────────┐       ┌────────────────┐
   │  extract() │       │ 本地操作   │       │   远程同步     │
   │  RXA→files │       │ save/load  │       │   push/pull    │
   └────────────┘       │ remove/has │       └────────────────┘
                        └────────────┘
```

## 原语总表

```
┌───────────┬─────────────────────────────────────────┬───────────────┐
│   原语    │                  签名                   │     描述      │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ manifest  │ (rxd: RXD) → RXM                        │ 定义 → 元数据 │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ archive   │ (files: Record<string, Buffer>) → RXA   │ 文件 → 压缩包 │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ locator   │ (rxm: RXM) → RXL                        │ 元数据 → 定位符│
├───────────┼─────────────────────────────────────────┼───────────────┤
│ resource  │ (rxm: RXM, rxa: RXA) → RXR              │ 组合成资源    │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ extract   │ (rxa: RXA) → Record<string, Buffer>     │ 解包          │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ save      │ (rxr: RXR) → void                       │ 存到本地      │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ load      │ (rxl: RXL) → RXR                        │ 从本地加载    │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ remove    │ (rxl: RXL) → void                       │ 从本地删除    │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ has       │ (rxl: RXL) → boolean                    │ 本地是否存在  │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ push      │ (remote: Storage, rxl: RXL) → void      │ 推送到远程    │
├───────────┼─────────────────────────────────────────┼───────────────┤
│ pull      │ (remote: Storage, rxl: RXL) → void      │ 从远程拉取    │
└───────────┴─────────────────────────────────────────┴───────────────┘
```

## 使用示例

```typescript
// 从开发目录打包并保存
const rxf: RXF = { path: "./my-prompt", definition: rxd, files: ["prompt.txt"] };
const rxm = manifest(rxf.definition);
const rxa = archive(fileContents);
const rxr = resource(rxm, rxa);
save(rxr);

// 加载并解包
const rxr = load(rxl);
const files = extract(rxr.archive);

// 推送到远程
push(remoteStorage, rxl);

// 从远程拉取
pull(remoteStorage, rxl);
```

## 上层封装示例

```typescript
// 语法糖放上层
class ResourceX {
  // 从路径加载并保存
  async add(path: string): Promise<void> {
    const rxf = await loadRXF(path); // 上层：读取文件系统
    const rxm = manifest(rxf.definition);
    const files = await readFiles(rxf); // 上层：读取文件内容
    const rxa = archive(files);
    const rxr = resource(rxm, rxa);
    save(rxr);
  }

  // 从字符串定位符加载
  async get(locatorStr: string): Promise<RXR> {
    const rxl = parseRXL(locatorStr); // 上层：字符串解析
    return load(rxl);
  }
}
```

## 验收标准

- [ ] 定义 RXD 类型
- [ ] 定义 RXF 类型
- [ ] 更新 RXM 添加 files 字段
- [ ] 实现 manifest() 原语
- [ ] 实现 archive() 原语
- [ ] 实现 locator() 原语
- [ ] 实现 resource() 原语
- [ ] 实现 extract() 原语
- [ ] 实现 save/load/remove/has 本地操作
- [ ] 实现 push/pull 远程操作
- [ ] 移除 RXP 类型
- [ ] 更新 CLAUDE.md 文档
- [ ] BDD 测试覆盖

## 相关文件

- `packages/core/src/` - RXD, RXF, RXL, RXM, RXA, RXR 类型
- `packages/core/src/primitives/` - 原语实现
- `packages/registry/src/` - save/load/remove/has/push/pull
- `bdd/features/core/` - BDD 测试
