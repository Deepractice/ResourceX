---
"@resourcexjs/core": minor
"@resourcexjs/loader": minor
"@resourcexjs/type": minor
"@resourcexjs/registry": minor
"resourcexjs": minor
---

feat: RXC archive format - multi-file resource support

**Breaking Changes:**

- `createRXC` now accepts a files record instead of string/Buffer/Stream
- `createRXC` is now async (returns `Promise<RXC>`)
- Removed `loadRXC` function (use `loadResource` instead)
- Removed `rxc.text()` and `rxc.json()` methods

**New API:**

```typescript
// Create from files
await createRXC({ content: "Hello" }); // single file
await createRXC({ "a.ts": "...", "b.css": "..." }); // multi-file
await createRXC({ archive: tarGzBuffer }); // from archive

// Read files
await rxc.file("content"); // single file → Buffer
await rxc.files(); // all files → Map<string, Buffer>
await rxc.buffer(); // raw tar.gz → Buffer
```

**FolderLoader improvements:**

- No longer requires `content` file name
- Supports any file names and nested directories
- All files (except `resource.json`) are packaged into RXC

**Internal:**

- RXC now stores content as tar.gz archive internally
- Uses `modern-tar` for tar packaging
