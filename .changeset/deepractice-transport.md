---
"@resourcexjs/core": minor
"resourcexjs": minor
---

Add built-in Deepractice transport for ecosystem local storage:

- Add `deepracticeHandler(config?)` factory function
- Maps `deepractice://path` to `~/.deepractice/path`
- Configurable `parentDir` for testing and custom installations
- Full capabilities: read/write/list/delete/exists/stat
