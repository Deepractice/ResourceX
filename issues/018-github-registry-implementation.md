# GitHubRegistry Implementation

## 背景

完成 GitHub 作为 Registry 的闭环实现，包括：

- GitHubRegistry 读取
- pull() 从远程拉取到本地缓存
- publish() 从本地发布到 GitHub

依赖 #016（设计）和 #017（local/cache 分离）。

## 实现步骤

### Phase 1: 实现 GitHubRegistry（只读）

**文件：** `packages/registry/src/GitHubRegistry.ts`

```typescript
import type { Registry, GitHubRegistryConfig } from "./types.js";
import type { RXR, RXL } from "@resourcexjs/core";
import { parseRXL, createRXM } from "@resourcexjs/core";
import { TypeHandlerChain } from "@resourcexjs/type";
import { RegistryError } from "./errors.js";

export class GitHubRegistry implements Registry {
  private readonly owner: string;
  private readonly repo: string;
  private readonly ref: string;
  private readonly basePath: string;
  private readonly token?: string;
  private readonly typeHandler: TypeHandlerChain;

  constructor(config: GitHubRegistryConfig) {
    this.owner = config.owner;
    this.repo = config.repo;
    this.ref = config.ref ?? "main";
    this.basePath = config.basePath ?? ".resourcex";
    this.token = config.token;
    this.typeHandler = TypeHandlerChain.create();
  }

  async get(locator: string): Promise<RXR> {
    const rxl = parseRXL(locator);
    const domain = rxl.domain ?? "localhost";

    // 构造 GitHub Raw URL
    const baseUrl = `https://raw.githubusercontent.com/${this.owner}/${this.repo}/${this.ref}/${this.basePath}`;

    let path = `${baseUrl}/${domain}`;
    if (rxl.path) {
      path += `/${rxl.path}`;
    }
    const resourceName = rxl.type ? `${rxl.name}.${rxl.type}` : rxl.name;
    const version = rxl.version ?? "latest";

    const manifestUrl = `${path}/${resourceName}/${version}/manifest.json`;
    const contentUrl = `${path}/${resourceName}/${version}/content.tar.gz`;

    // Fetch manifest
    const manifestRes = await this.fetch(manifestUrl);
    if (!manifestRes.ok) {
      throw new RegistryError(`Resource not found: ${locator}`);
    }
    const manifestData = await manifestRes.json();
    const manifest = createRXM(manifestData);

    // Fetch content
    const contentRes = await this.fetch(contentUrl);
    if (!contentRes.ok) {
      throw new RegistryError(`Content not found: ${locator}`);
    }
    const contentBuffer = Buffer.from(await contentRes.arrayBuffer());

    // Deserialize
    return this.typeHandler.deserialize(contentBuffer, manifest);
  }

  private async fetch(url: string): Promise<Response> {
    const headers: HeadersInit = {};
    if (this.token) {
      headers["Authorization"] = `token ${this.token}`;
    }
    return fetch(url, { headers });
  }

  // resolve/exists/search 实现...

  // 不支持的操作（只读）
  async link(): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.link()");
  }

  async delete(): Promise<void> {
    throw new RegistryError("GitHubRegistry is read-only - use LocalRegistry.delete()");
  }

  async publish(): Promise<void> {
    throw new RegistryError("Use LocalRegistry.publish() instead");
  }
}
```

### Phase 2: LocalRegistry 添加 pull()

**文件：** `packages/registry/src/LocalRegistry.ts`

```typescript
async pull(locator: string, options?: PullOptions): Promise<void> {
  const rxl = parseRXL(locator);
  const domain = rxl.domain;

  if (!domain || domain === "localhost") {
    throw new RegistryError("Cannot install localhost resources");
  }

  // 1. 检查 cache/ 是否已存在
  const cachePath = this.buildPath(locator, 'cache');
  if (await this.existsAt(cachePath)) {
    return; // 已缓存，跳过
  }

  // 2. 确定远程 Registry
  let remote: Registry;
  if (options?.from) {
    remote = options.from;
  } else {
    // 自动发现
    const endpoint = await discoverRegistry(domain);

    if (endpoint.startsWith('github://')) {
      // 解析 github://owner/repo@ref
      const parsed = parseGitHubUrl(endpoint);
      remote = new GitHubRegistry(parsed);
    } else {
      // HTTP Registry
      remote = new RemoteRegistry({ endpoint });
    }
  }

  // 3. 从远程拉取
  const rxr = await remote.get(locator);

  // 4. 保存到 cache/
  await this.saveToCache(rxr);
}

private async saveToCache(rxr: RXR): Promise<void> {
  const cachePath = this.buildPath(rxr.manifest.toLocator(), 'cache');

  await mkdir(cachePath, { recursive: true });

  // Write manifest
  const manifestPath = join(cachePath, 'manifest.json');
  await writeFile(manifestPath, JSON.stringify(rxr.manifest.toJSON(), null, 2));

  // Write content
  const contentPath = join(cachePath, 'content.tar.gz');
  const buffer = await this.typeHandler.serialize(rxr);
  await writeFile(contentPath, buffer);
}
```

### Phase 3: LocalRegistry 添加 publish()

**文件：** `packages/registry/src/LocalRegistry.ts`

```typescript
async publish(rxr: RXR, options: PublishOptions): Promise<void> {
  const locator = rxr.manifest.toLocator();
  const domain = rxr.manifest.domain;

  // 1. 验证：必须在 local/ 存在
  const localPath = this.buildPath(locator, 'local');
  if (!(await this.existsAt(localPath))) {
    throw new RegistryError(`Resource not found in local: ${locator}`);
  }

  // 2. 验证：domain 不能是 localhost
  if (domain === "localhost") {
    throw new RegistryError("Cannot publish localhost resources - set a real domain in manifest");
  }

  // 3. 推送到远程
  if (options.to.type === 'github') {
    await this.publishToGitHub(rxr, options.to);
  } else if (options.to.type === 'http') {
    await this.publishToHttp(rxr, options.to);
  }

  // 4. 复制到 cache/ 作为本地副本
  await this.saveToCache(rxr);
}

private async publishToGitHub(rxr: RXR, config: GitHubPublishConfig): Promise<void> {
  const { owner, repo, branch = 'main', token } = config;

  if (!token) {
    throw new RegistryError("GitHub token required for publishing");
  }

  const rxl = rxr.manifest.toLocator();
  const parsed = parseRXL(rxl);

  // 构造 GitHub 路径
  const domain = parsed.domain ?? "localhost";
  let path = `.resourcex/${domain}`;
  if (parsed.path) {
    path += `/${parsed.path}`;
  }
  const resourceName = parsed.type ? `${parsed.name}.${parsed.type}` : parsed.name;
  const version = parsed.version ?? "latest";
  const resourcePath = `${path}/${resourceName}/${version}`;

  // 使用 GitHub API 创建文件
  const octokit = new Octokit({ auth: token });

  // 上传 manifest.json
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `${resourcePath}/manifest.json`,
    message: `publish: ${rxl}`,
    content: Buffer.from(JSON.stringify(rxr.manifest.toJSON(), null, 2)).toString('base64'),
    branch,
  });

  // 上传 content.tar.gz
  const contentBuffer = await this.typeHandler.serialize(rxr);
  await octokit.repos.createOrUpdateFileContents({
    owner,
    repo,
    path: `${resourcePath}/content.tar.gz`,
    message: `publish: ${rxl} (content)`,
    content: contentBuffer.toString('base64'),
    branch,
  });
}
```

### Phase 4: createRegistry 支持 GitHub

**文件：** `packages/registry/src/types.ts`

```typescript
export interface GitHubRegistryConfig {
  type: "github";
  owner: string;
  repo: string;
  ref?: string; // branch/tag/commit, default: 'main'
  basePath?: string; // default: '.resourcex'
  token?: string; // for private repos
}

export type RegistryConfig = LocalRegistryConfig | RemoteRegistryConfig | GitHubRegistryConfig;
```

**文件：** `packages/registry/src/createRegistry.ts`

```typescript
export function createRegistry(config?: RegistryConfig): Registry {
  if (!config) {
    return new LocalRegistry();
  }

  if ("endpoint" in config) {
    return new RemoteRegistry(config);
  }

  if ("type" in config && config.type === "github") {
    return new GitHubRegistry(config);
  }

  return new LocalRegistry(config);
}
```

### Phase 5: Well-known 支持 GitHub URL

**文件：** `packages/registry/src/RemoteRegistry.ts`

```typescript
export async function discoverRegistry(domain: string): Promise<string> {
  const wellKnownUrl = `https://${domain}/.well-known/resourcex`;

  const response = await fetch(wellKnownUrl);
  if (!response.ok) {
    throw new RegistryError(`Well-known discovery failed for ${domain}`);
  }

  const data = (await response.json()) as WellKnownResponse;
  return data.registry; // 可能是 "https://..." 或 "github://owner/repo@ref"
}

// 新增：解析 github:// URL
export function parseGitHubRegistryUrl(url: string): GitHubRegistryConfig {
  // url: github://deepractice/rolex@main
  if (!url.startsWith("github://")) {
    throw new RegistryError(`Invalid GitHub registry URL: ${url}`);
  }

  const rest = url.slice("github://".length);
  const [ownerRepo, ref] = rest.split("@");
  const [owner, repo] = ownerRepo.split("/");

  return {
    type: "github",
    owner,
    repo,
    ref: ref ?? "main",
  };
}
```

### Phase 6: RxrTransport 支持 GitHub

**文件：** `packages/arp/src/transport/rxr.ts`

```typescript
private async getRegistry(domain: string): Promise<RxrTransportRegistry> {
  if (this.registry) {
    return this.registry;
  }

  if (registryCache.has(domain)) {
    return registryCache.get(domain)!;
  }

  let registry: Registry;

  if (domain === "localhost") {
    registry = createRegistry();
  } else {
    const endpoint = await discoverRegistry(domain);

    if (endpoint.startsWith('github://')) {
      // GitHub Registry
      const config = parseGitHubRegistryUrl(endpoint);
      registry = createRegistry(config);
    } else {
      // HTTP Registry
      registry = createRegistry({ endpoint });
    }
  }

  registryCache.set(domain, registry);
  return registry;
}
```

## 依赖

```bash
# GitHub API 客户端
bun add @octokit/rest
```

## BDD 测试

**文件：** `bdd/features/registry-pull.feature`

```gherkin
@registry @pull
Feature: Registry Pull
  Pull resources from remote registry to local cache

  Background:
    Given a local registry with default configuration

  Scenario: Pull from HTTP registry
    Given a remote registry with resource "deepractice.ai/test.text@1.0.0"
    When I pull "deepractice.ai/test.text@1.0.0"
    Then the resource should exist in cache
    And I can resolve "deepractice.ai/test.text@1.0.0" from cache

  Scenario: Pull from GitHub registry
    Given a GitHub registry with resource "deepractice.ai/nuwa.role@1.0.0"
    When I pull "deepractice.ai/nuwa.role@1.0.0"
    Then the resource should exist in cache
    And I can resolve "deepractice.ai/nuwa.role@1.0.0" from cache
```

**文件：** `bdd/features/registry-publish.feature`

```gherkin
@registry @publish
Feature: Registry Publish
  Publish resources from local to remote registry

  Background:
    Given a local registry with default configuration

  Scenario: Publish to GitHub registry
    Given a linked local resource "my-role.role@1.0.0" with domain "deepractice.ai"
    When I publish the resource to GitHub:
      | owner | repo  | branch |
      | dp    | rolex | main   |
    Then the resource should exist in cache
    And the resource should exist in GitHub repo
```

## 完整使用示例

```typescript
import { createRegistry } from "resourcexjs";

const local = createRegistry(); // LocalRegistry

// === 开发阶段 ===

// 1. Link 到 local/
await local.link(myRole);
// → ~/.resourcex/local/my-role.role/1.0.0/
// → manifest: { domain: "deepractice.ai", ... }

// 2. 本地测试
const role = await local.resolve("my-role.role@1.0.0");
// → 从 local/ 读取

// === 发布阶段 ===

// 3. Publish 到 GitHub
await local.publish(myRole, {
  to: {
    type: "github",
    owner: "deepractice",
    repo: "rolex",
    branch: "main",
    token: process.env.GITHUB_TOKEN,
  },
});
// → 推送到 GitHub
// → 复制到 ~/.resourcex/cache/deepractice.ai/roles/my-role.role/1.0.0/

// === 使用阶段（其他开发者）===

// 4. Pull 从 GitHub
const user = createRegistry();
await user.pull("deepractice.ai/my-role.role@1.0.0");
// → 发现 well-known: github://deepractice/rolex@main
// → 创建 GitHubRegistry
// → 拉取到 ~/.resourcex/cache/deepractice.ai/...

// 5. Resolve 使用
const role = await user.resolve("deepractice.ai/my-role.role@1.0.0");
// → 从 cache/ 读取
```

## 文件清单

| 操作 | 文件                                                               |
| ---- | ------------------------------------------------------------------ |
| 新增 | `packages/registry/src/GitHubRegistry.ts`                          |
| 修改 | `packages/registry/src/types.ts` (新增 GitHubRegistryConfig)       |
| 修改 | `packages/registry/src/createRegistry.ts` (支持 GitHub config)     |
| 修改 | `packages/registry/src/LocalRegistry.ts` (添加 install/publish)    |
| 修改 | `packages/registry/src/RemoteRegistry.ts` (parseGitHubRegistryUrl) |
| 修改 | `packages/registry/src/index.ts` (导出新增内容)                    |
| 修改 | `packages/registry/package.json` (添加 @octokit/rest 依赖)         |
| 修改 | `packages/arp/src/transport/rxr.ts` (支持 github:// endpoint)      |
| 新增 | `bdd/features/registry-pull.feature`                               |
| 新增 | `bdd/features/registry-publish.feature`                            |
| 新增 | `bdd/steps/registry/pull.steps.ts`                                 |
| 新增 | `bdd/steps/registry/publish.steps.ts`                              |

## 依赖关系

```
#016 (GitHub Registry 设计)
  ↓
#017 (local/cache 分离)
  ↓
#018 (GitHubRegistry 实现) ← 本 issue
```

## 验证清单

- [ ] 从 GitHub 读取资源
- [ ] pull() 拉取到 cache/
- [ ] publish() 推送到 GitHub
- [ ] well-known 支持 github:// URL
- [ ] RxrTransport 支持 GitHub
- [ ] BDD 测试通过
- [ ] 文档更新

## 相关

- #015 - Registry Remote Support
- #016 - GitHub Registry Design
- #017 - Separate Local and Cache
- #29 - Add GithubTransport (GitHub issue)
