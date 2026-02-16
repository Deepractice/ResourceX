---
"@resourcexjs/core": minor
"@resourcexjs/node-provider": minor
"resourcexjs": minor
"@resourcexjs/cli": minor
"@resourcexjs/mcp-server": minor
---

feat: add auto-detection pipeline, SourceLoaderChain, and API redesign

- Add RXS intermediate type for raw file representation
- Add TypeDetector interface and TypeDetectorChain (Chain of Responsibility)
- Add built-in detectors: ResourceJsonDetector, SkillDetector
- Add SourceLoader interface and SourceLoaderChain (Chain of Responsibility)
- Add built-in loaders: FolderSourceLoader, GitHubSourceLoader
- Add resolveSource() pipeline: load → detect → generate RXD → archive → RXR
- Split ResourceX API: resolve(locator) + ingest(source) replacing use()
- Flatten public API: resolve/ingest return T directly (Executable internalized)
- Rename CLI command and MCP tool from "use" to "ingest"
- Auto-detect resource type from file patterns (no resource.json required)
- Support GitHub URLs as source via GitHubSourceLoader
