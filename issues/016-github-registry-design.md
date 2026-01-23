# GitHub Repository as Registry

## 背景

当前 ResourceX 缺少可用的远程 Registry，导致无法走通完整闭环。GitHub 是理想的 Registry 存储后端：

- ✅ 免费静态文件托管（Raw URL）
- ✅ 版本控制（Git tags/branches）
- ✅ 协作和权限管理
- ✅ 全球 CDN 加速

## 核心设计原则

**domain = Registry Identifier（注册表标识符）**

- 可以是传统域名：`deepractice.ai`
- 可以是 GitHub path：`github.com/deepractice/rolex`
- 通过 **well-known 统一发现**（必须）

## GitHub 仓库结构

### 标准格式

```
rolex/                                  # GitHub repo
├── .well-known/
│   └── resourcex                       # 服务发现
├── .resourcex/                         # Registry 存储目录
│   └── {domain}/                       # 逻辑域名（如 deepractice.ai）
│       └── {path}/
│           └── {name}.{type}/
│               └── {version}/
│                   ├── manifest.json
│                   └── content.tar.gz
└── README.md
```

### 示例：RoleX 仓库

```
rolex/
├── .well-known/
│   └── resourcex
│       {
│         "version": "1.0",
│         "registry": "github://deepractice/rolex@main"
│       }
│
├── .resourcex/
│   └── deepractice.ai/
│       └── roles/
│           ├── nuwa.role/
│           │   └── 1.0.0/
│           │       ├── manifest.json
│           │       └── content.tar.gz
│           └── sean.role/
│               └── 1.0.0/
│                   ├── manifest.json
│                   └── content.tar.gz
└── README.md
```

**manifest.json 内容：**

```json
{
  "domain": "deepractice.ai",
  "path": "roles",
  "name": "nuwa",
  "type": "role",
  "version": "1.0.0"
}
```

## Well-Known 配置

**位置：** `.well-known/resourcex`

**格式：**

```json
{
  "version": "1.0",
  "registry": "github://deepractice/rolex@main"
}
```

**特殊格式说明：**

- `github://` 前缀表示这是 GitHub Registry
- 格式：`github://{owner}/{repo}@{ref}`
- `ref` 可以是：branch、tag、commit

## 服务发现流程

### 方式 1: 自定义域名

```
用户请求：deepractice.ai/roles/nuwa.role@1.0.0

1. Well-known 发现
   GET https://deepractice.ai/.well-known/resourcex
   → { "registry": "github://deepractice/rolex@main" }

2. 解析为 GitHubRegistry
   owner: deepractice, repo: rolex, ref: main

3. 构造 Raw URL
   https://raw.githubusercontent.com/deepractice/rolex/main/.resourcex/deepractice.ai/roles/nuwa.role/1.0.0/manifest.json
```

### 方式 2: GitHub Path

```
用户请求：github.com/deepractice/rolex/roles/nuwa.role@1.0.0

1. Well-known 发现（GitHub Raw URL）
   GET https://raw.githubusercontent.com/deepractice/rolex/main/.well-known/resourcex
   → { "registry": "github://deepractice/rolex@main", "basePath": ".resourcex" }

2. 解析为 GitHubRegistry
   owner: deepractice, repo: rolex, ref: main, basePath: .resourcex

3. 构造 Raw URL
   https://raw.githubusercontent.com/deepractice/rolex/main/.resourcex/github.com/deepractice/rolex/roles/nuwa.role/1.0.0/manifest.json
```

**重要：两种方式都必须有 .well-known/resourcex 文件！**

## Git 版本控制

### 使用 Git Tags

```bash
# 发布新版本
git add .resourcex/deepractice.ai/roles/nuwa.role/1.0.0/
git commit -m "publish: nuwa.role@1.0.0"
git tag -a deepractice.ai/nuwa.role@1.0.0 -m "Release nuwa.role 1.0.0"
git push --follow-tags

# Well-known 可以指向特定 tag
{
  "registry": "github://deepractice/rolex@v1.0.0"
}
```

### 使用 Branches

```
main              → 稳定版本
develop           → 开发版本
release/v1.0      → 发布分支
```

## 发布工作流（手动）

```bash
# 1. 在本地开发资源
cd my-role/
# resource.json + content files

# 2. Load 和 link 到本地
bun run dev.ts
# const rxr = await loadResource("./my-role");
# await localRegistry.link(rxr);
# → ~/.resourcex/local/my-role.role/1.0.0/

# 3. 测试本地资源
# await localRegistry.resolve("my-role.role@1.0.0");

# 4. 准备发布：复制到 GitHub repo
cd rolex/
mkdir -p .resourcex/deepractice.ai/roles/my-role.role/1.0.0
cp ~/.resourcex/local/my-role.role/1.0.0/* \
   .resourcex/deepractice.ai/roles/my-role.role/1.0.0/

# 5. 更新 manifest domain（从 localhost 改为真实 domain）
# Edit .resourcex/deepractice.ai/roles/my-role.role/1.0.0/manifest.json
# { "domain": "deepractice.ai", ... }

# 6. Git 提交
git add .resourcex/deepractice.ai/roles/my-role.role/1.0.0/
git commit -m "publish: my-role.role@1.0.0"
git tag -a deepractice.ai/my-role.role@1.0.0 -m "Release 1.0.0"
git push --follow-tags

# 7. 其他人拉取
# await registry.pull("deepractice.ai/my-role.role@1.0.0");
# → 从 GitHub 拉取到 ~/.resourcex/cache/deepractice.ai/...
```

## 发布工作流（自动化 - 未来）

```typescript
await registry.publish(myRole, {
  target: {
    type: "github",
    owner: "deepractice",
    repo: "rolex",
    branch: "main",
    token: process.env.GITHUB_TOKEN,
  },
});

// 内部流程：
// 1. 读取 ~/.resourcex/local/my-role.role/1.0.0/*
// 2. 更新 manifest.json 的 domain
// 3. 通过 GitHub API 创建文件
// 4. 创建 Git tag
// 5. 复制到 ~/.resourcex/cache/deepractice.ai/... (本地副本)
```

## Pull 流程

```typescript
await registry.pull("deepractice.ai/nuwa.role@1.0.0");

// 内部流程：
// 1. 检查 cache/：如果已存在，直接返回
// 2. Well-known 发现：deepractice.ai → github://deepractice/rolex@main
// 3. 创建 GitHubRegistry
// 4. 从 GitHub 拉取 manifest + content
// 5. 保存到 cache/deepractice.ai/nuwa.role/1.0.0/
```

## Private Repo 支持

```typescript
// GitHub Registry 配置支持 token
const registry = createRegistry({
  type: "github",
  owner: "deepractice",
  repo: "private-rolex",
  token: process.env.GITHUB_TOKEN,
});

// 或环境变量
// GITHUB_TOKEN=xxx
// 自动用于所有 GitHub Registry 请求
```

## 多仓库支持

不同 domain 可以对应不同 GitHub repo：

```
deepractice.ai → github://deepractice/rolex
github.com → github://github/resources
mycompany.com → github://mycompany/registry
```

每个都通过各自的 well-known 发现。

## 注意事项

1. **Rate Limiting**: GitHub Raw URL 有请求限制，需要考虑缓存策略
2. **Token 管理**: Private repo 需要 token，如何安全存储
3. **CDN 延迟**: GitHub Raw 有 CDN 缓存，更新可能延迟几分钟
4. **大文件**: content.tar.gz 不应该太大（建议 < 10MB）

## 相关 Issues

- #29 - Add GithubTransport for arp:// protocol (启发)
- #015 - Registry Remote Support (基础)
