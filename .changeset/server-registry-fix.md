---
"@resourcexjs/server": patch
---

fix(server): store and lookup resources without registry prefix

Server now correctly stores resources without the registry prefix in the path.
When a resource is published to `registry.example.com/hello:1.0.0`, it's stored
as `hello:1.0.0` on the server. The registry prefix is added by clients when
they pull resources.
