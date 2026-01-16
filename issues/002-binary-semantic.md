# 002: Add Binary Semantic Handler

## 背景

在 SandboX 项目集成 ResourceX 时，需要存储二进制文件（如图片、编译产物等）。目前只有 `text` semantic，二进制数据需要 base64 编码后存储，不够高效。

## 当前问题

```typescript
// 只能用 text + base64
const base64 = buffer.toString("base64");
await rx.deposit("arp:text:file://./data.b64", base64);

// 读取时需要解码
const resource = await rx.resolve("arp:text:file://./data.b64");
const buffer = Buffer.from(resource.content, "base64");
```

**问题：**

1. 额外的编码/解码开销
2. base64 增加约 33% 体积
3. 不直观，文件扩展名不能反映真实类型

## 期望用法

```typescript
// 直接存储 Buffer
await rx.deposit("arp:binary:file://./image.png", buffer);

// 直接读取 Buffer
const resource = await rx.resolve("arp:binary:file://./image.png");
console.log(resource.content); // Buffer
```

## 建议实现

```typescript
const binaryHandler: SemanticHandler<Buffer> = {
  name: "binary",

  async resolve(transport, location) {
    const buffer = await transport.read(location);
    return {
      type: "binary",
      content: buffer,
      meta: {
        semantic: "binary",
        location,
        size: buffer.length,
        mimeType: detectMimeType(location), // 可选：根据扩展名推断
      },
    };
  },

  async deposit(transport, location, data) {
    if (!transport.write) {
      throw new Error(`Transport ${transport.name} does not support write`);
    }
    // data 可以是 Buffer 或 Uint8Array
    const buffer = Buffer.isBuffer(data) ? data : Buffer.from(data);
    await transport.write(location, buffer);
  },
};
```

## 使用场景

1. **图片/媒体文件**

   ```typescript
   await rx.deposit("arp:binary:file://./assets/logo.png", imageBuffer);
   ```

2. **编译产物**

   ```typescript
   await rx.deposit("arp:binary:file://./dist/app.wasm", wasmBuffer);
   ```

3. **SandboX 资产持久化**
   ```typescript
   // StateStore 存储 blob
   await rx.deposit("arp:binary:file://~/.deepractice/sandbox/blobs/sha256-xxx", blob);
   ```

## 优先级

**建议实现** - binary 是非常常见的资源类型，与 text 同等重要。

## 来源

此 issue 来自 SandboX 项目的 StateStore 持久化需求。当前使用 base64 workaround，但不够优雅。

---

**Status**: Open
**Priority**: High
**Labels**: enhancement, semantic-handler
