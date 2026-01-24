---
"@resourcexjs/registry": minor
"resourcexjs": minor
---

feat(registry): add GitHubRegistry using tarball download

- Add `GitHubRegistry` class that downloads GitHub repository tarball instead of git clone
- Faster than `GitRegistry` (isomorphic-git) for read-only access
- Support `https://github.com/owner/repo` URL format in well-known discovery
- Add `parseGitHubUrl()` and `isGitHubUrl()` utilities
- Update well-known worker to return GitHub URL as primary registry
