---
"@resourcexjs/core": minor
---

feat(core): add skill resource type for agent skill packages

Add built-in `skill` type that resolves SKILL.md content from resource archives. Supports optional `references/` directory for progressive disclosure — pass `{ reference: "filename.md" }` to load a specific reference file instead of the main SKILL.md.
