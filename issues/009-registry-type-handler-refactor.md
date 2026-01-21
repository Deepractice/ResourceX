# 009 - Registry TypeHandlerChain 重构

## 状态：进行中

---

## 问题

### Bundle 后单例失效

`globalTypeHandlerChain` 在 bundle 后变成多个实例，导致：

- `createRegistry({ types })` 注册的类型
- 和导出的 `globalTypeHandlerChain`
- 不是同一个实例

### 架构问题

`TypeHandlerChain` 作为全局单例独立于 `Registry` 存在，导致：

1. Bundle 问题
2. 无法查询某个 Registry 支持哪些类型
3. 多个 Registry 共享同一个 TypeHandlerChain

---

## 方案

### 核心改动

1. **`Registry.resolve()` 返回 `ResolvedResource`**

```typescript
interface ResolvedResource<TArgs, TResult> {
  resource: RXR; // 原始资源
  schema?: JSONSchema; // 类型 schema
  execute(args?: TArgs): Promise<TResult>;
}

// 使用
const resolved = await registry.resolve(locator);
resolved.resource.manifest; // 访问元数据
await resolved.execute(args); // 执行
```

2. **`Registry` 内部持有 `TypeHandlerChain`**

```typescript
class ARPRegistry implements Registry {
  private readonly typeHandler: TypeHandlerChain;

  constructor(config?: RegistryConfig) {
    this.typeHandler = TypeHandlerChain.create();
    if (config?.types) {
      for (const type of config.types) {
        this.typeHandler.register(type);
      }
    }
  }
}
```

3. **废弃 `globalTypeHandlerChain`**

```typescript
/**
 * @deprecated Use registry.typeHandler or TypeHandlerChain.create() instead.
 */
export const globalTypeHandlerChain = TypeHandlerChain.getInstance();
```

### API 变化

| Before                                | After                                            |
| ------------------------------------- | ------------------------------------------------ |
| `registry.resolve(locator)` → `RXR`   | `registry.resolve(locator)` → `ResolvedResource` |
| `globalTypeHandlerChain.resolve(rxr)` | `resolved.execute(args)`                         |
| `rxr.manifest`                        | `resolved.resource.manifest`                     |

### Breaking Changes

- `Registry.resolve()` 返回类型从 `RXR` 变为 `ResolvedResource`
- 需要 RXR 时从 `resolved.resource` 获取

---

## 实现步骤

- [ ] 编写 BDD feature 文件
- [ ] 添加 `TypeHandlerChain.create()` 静态方法
- [ ] 修改 `ResolvedResource` 接口添加 `resource` 字段
- [ ] 修改 `ARPRegistry` 使用自己的 `TypeHandlerChain`
- [ ] 修改 `ARPRegistry.resolve()` 返回 `ResolvedResource`
- [ ] 标记 `globalTypeHandlerChain` 为 deprecated
- [ ] 更新测试
- [ ] 更新文档

---

## 相关文件

- `packages/type/src/TypeHandlerChain.ts`
- `packages/type/src/types.ts`
- `packages/registry/src/ARPRegistry.ts`
- `packages/registry/src/types.ts`
