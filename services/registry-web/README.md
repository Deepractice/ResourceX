# Registry Web

ResourceX Registry web interface, built with Next.js and deployed on Cloudflare.

## Tech Stack

- **Framework**: Next.js 15 (App Router)
- **React**: 19
- **Styling**: Tailwind CSS
- **Components**: @resourcexjs/ui
- **Deployment**: OpenNext for Cloudflare

## Pages

| Route                 | Description                             |
| --------------------- | --------------------------------------- |
| `/`                   | Homepage - Popular and recent resources |
| `/resource/[locator]` | Resource detail page                    |
| `/browse`             | Browse all resources (TODO)             |
| `/prompts`            | Filter by prompts (TODO)                |
| `/tools`              | Filter by tools (TODO)                  |
| `/agents`             | Filter by agents (TODO)                 |

## Development

```bash
# Install dependencies (from monorepo root)
bun install

# Build UI components first
cd packages/ui && bun run build

# Start dev server
cd services/registry-web
bun run dev
```

Open http://localhost:3000

## Build & Deploy

```bash
# Build for production
bun run build

# Preview locally with Cloudflare
bun run preview

# Deploy to Cloudflare
bun run deploy
```

## Project Structure

```
src/
├── app/
│   ├── layout.tsx              # Root layout with Sidebar
│   ├── page.tsx                # Homepage
│   ├── globals.css             # Global styles + design tokens
│   └── resource/
│       └── [locator]/
│           └── page.tsx        # Resource detail page
├── components/
│   └── Sidebar.tsx             # Navigation sidebar
└── lib/
    └── api.ts                  # Registry API client
```

## Environment Variables

| Variable           | Description           | Default                                                   |
| ------------------ | --------------------- | --------------------------------------------------------- |
| `REGISTRY_API_URL` | Registry API base URL | `https://resourcex-registry-api.jshansince93.workers.dev` |

## API Integration

The web app fetches data from `registry-api`:

```typescript
import { searchResources, getResource } from "~/lib/api";

// Search resources
const locators = await searchResources("prompt");

// Get resource details
const resource = await getResource("deepractice.ai/assistant.prompt@1.0.0");
```

## Components Used

From `@resourcexjs/ui`:

- `Logo` - Brand logo
- `NavItem` - Sidebar navigation items
- `SearchBox` - Search input
- `Button` - Primary/secondary buttons
- `ResourceCard` - Resource preview card
- `Breadcrumb` - Navigation breadcrumbs
- `CodeBlock` - Code display with copy
- `FileList` - File listing
- `VersionList` - Version history
