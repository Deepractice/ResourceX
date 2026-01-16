# 006: Rename deepractice transport to agentvm

## 背景

当前 `deepractice` transport 使用 `~/.deepractice/` 作为本地存储目录。

**问题**：

- `deepractice` 这个名字将来要留给云平台 transport（远程）
- 本地存储应该和产品名 **AgentVM** 保持一致
- 符合业务叙事（参见 `/apps/business/app/zh/docs/agentvm/`）

## 改动

### Transport 名称

```typescript
// 当前
deepracticeHandler({ parentDir: "~" }); // → ~/.deepractice/

// 改为
agentvmHandler({ parentDir: "~" }); // → ~/.agentvm/
```

### 目录结构

```
~/.agentvm/           (改名)
├── sandbox/
│   ├── logs/
│   └── blobs/
├── promptx/
└── toolx/
```

### URL 格式

```typescript
// 当前
arp:text:deepractice://sandbox/logs/app.log

// 改为
arp:text:agentvm://sandbox/logs/app.log
@text:agentvm://sandbox/logs/app.log
```

## 影响范围

**代码**：

- `packages/core/src/transport/deepractice.ts` → `agentvm.ts`
- `packages/core/src/transport/index.ts` - 导出名称
- `packages/core/src/index.ts` - 导出名称
- `packages/resourcex/src/index.ts` - 导出名称

**测试**：

- `bdd/features/deepractice-transport.feature` → `agentvm-transport.feature`
- `bdd/steps/deepractice.steps.ts` → `agentvm.steps.ts`
- 所有测试中的 URL

**文档**：

- README.md - 所有提到 deepractice transport 的地方
- README.zh-CN.md - 中文版
- CLAUDE.md - Handler 列表
- `packages/core/README.md`
- `packages/resourcex/README.md`
- `issues/003-deepractice-transport.md` - 标记为已废弃

**不兼容**：

- 不保留向后兼容（没有用户数据）
- 完全移除 `deepractice` 名称

## 实施步骤

1. 重命名所有文件和代码
2. 更新所有测试
3. 更新所有文档
4. 运行 CI 确保通过
5. 写 changeset（breaking change?）

## 优先级

**High** - 名称和产品对齐，越早改越好。

---

**Status**: Completed
**Priority**: High
**Labels**: breaking-change, rename

## 实现完成

- ✅ Transport: `deepracticeHandler` → `agentvmHandler`
- ✅ Config: `DeepracticeConfig` → `AgentVMConfig`
- ✅ 目录: `~/.deepractice/` → `~/.agentvm/`
- ✅ URL: `deepractice://` → `agentvm://`
- ✅ 所有测试、文档已更新
