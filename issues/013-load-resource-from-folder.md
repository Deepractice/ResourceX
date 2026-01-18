# Feature: Load Resource from Folder

## 背景

用户通常以目录形式组织资源：

```
my-prompt/
├── resource.json    # 资源元数据
└── content          # 资源内容
```

目前 ResourceX 需要用户手动解析 `resource.json`、读取 `content`、组装 RXR 对象。应该提供一个便捷 API 自动完成这些步骤。

## 需求

提供 `loadResourceFromFolder()` 函数，从目录加载资源。

## API 设计

```typescript
/**
 * Load a resource from a folder
 *
 * @param folderPath - Absolute path to resource folder
 * @returns RXR object ready for registry.link()
 *
 * @throws ResourceXError if resource.json not found or invalid
 * @throws ResourceXError if content file not found
 */
async function loadResourceFromFolder(folderPath: string): Promise<RXR>;
```

## resource.json 格式

```json
{
  "name": "hello",
  "type": "prompt",
  "version": "1.0.0",
  "description": "A helpful assistant prompt",
  "tags": ["ai", "assistant"]
}
```

**必填字段：**

- `name` - 资源名称
- `type` - 资源类型
- `version` - 版本号

**可选字段：**

- `description` - 描述
- `tags` - 标签数组
- `domain` - 域名（默认 "localhost"）
- `path` - 路径（可选）

## 目录结构规范

```
{folderName}/
├── resource.json    # 必须存在
└── content          # 必须存在，固定文件名（无扩展名）
```

## 实现逻辑

```typescript
async function loadResourceFromFolder(folderPath: string): Promise<RXR> {
  // 1. 读取 resource.json
  const manifestPath = join(folderPath, "resource.json");
  const manifestData = JSON.parse(await fs.readFile(manifestPath, "utf-8"));

  // 2. 校验必填字段
  if (!manifestData.name || !manifestData.type || !manifestData.version) {
    throw new ResourceXError("Invalid resource.json: missing required fields");
  }

  // 3. 创建 RXM
  const manifest = createRXM({
    domain: manifestData.domain ?? "localhost",
    path: manifestData.path,
    name: manifestData.name,
    type: manifestData.type,
    version: manifestData.version,
    description: manifestData.description,
  });

  // 4. 读取 content 文件
  const contentPath = join(folderPath, "content");
  const contentBuffer = await fs.readFile(contentPath);

  // 5. 组装 RXR
  return {
    locator: parseRXL(manifest.toLocator()),
    manifest,
    content: createRXC(contentBuffer),
  };
}
```

## 使用示例

```typescript
import { loadResourceFromFolder, createRegistry } from "resourcexjs";

const registry = createRegistry();

// 加载资源
const rxr = await loadResourceFromFolder("/Users/sean/my-prompt");

// 链接到本地 registry
await registry.link(rxr);

// 完成！
```

## 归属

建议放在 `@resourcexjs/core` 或 `resourcexjs` 主包。

## 相关

- AgentVM Desktop 将使用此功能实现"Link Resource"功能
- 未来可扩展：`loadResourceFromFile()`（单文件快速创建）
