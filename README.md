# Dosson Architecture Visualizer

Enterprise SaaS platform that automatically analyzes software repositories and generates interactive architecture visualizations with AI-powered insights.

## Features

### Repository Import
- **GitHub repositories** — clone and analyze any public or private repo
- **ZIP upload** — upload archived project source code
- **Local folders** — analyze projects on disk (API-only)

### Automatic Detection (20+ analyzers)
- Languages, frameworks, package managers
- Architecture style (Clean Architecture, MVC, Microservices, Serverless, Event-Driven)
- Services, modules, APIs, databases, queues, caches
- Authentication providers, external services, environment variables
- Docker, Kubernetes, Terraform, CI/CD pipelines, cloud providers
- Monorepo structure (Turborepo, Nx, Lerna, pnpm workspaces)

### Interactive Visualizations
- Architecture diagram, module dependency graph, service map
- API route graph, folder structure, database relationships
- Sequence diagrams with expand/collapse, search, filter, highlight, zoom, minimap

### Export Formats
- Mermaid, PlantUML, JSON (PNG/SVG/PDF via external renderers)

### AI-Powered Analysis
- Architecture summary, business domain detection, complexity/coupling analysis
- Code smells, dead code candidates, circular dependencies
- Refactoring suggestions, scalability/security/performance risks
- Technical debt assessment, missing tests/documentation

### Enterprise Dashboard
- Architecture, complexity, maintainability, security scores
- Test coverage estimation, documentation score, dependency health
- Largest/most coupled modules, unused files and dependencies

## Architecture

```
dosson-architecture-visualizer/
├── apps/
│   ├── api/          # NestJS REST API (Clean Architecture)
│   ├── web/          # Next.js 15 dashboard (@dosson-architecture-visualizer/dashboard)
│   └── website/      # Marketing landing page
├── packages/
│   ├── shared/       # Shared types and constants
│   ├── plugin-sdk/   # IAnalyzer, AnalyzerRegistry, plugin contracts
│   ├── parser/       # Safe file indexing and analysis context
│   ├── analyzers/    # Built-in analyzer implementations (16 detectors)
│   ├── graph/        # GraphBuilder and exporters (Mermaid, PlantUML, Graphviz)
│   ├── core/         # UI-agnostic analysis orchestration engine
│   ├── report-generator/  # Standalone HTML reports
│   └── cli/          # `dosson` CLI (analyze, graph, report, export, doctor)
├── docker-compose.yml
└── Dockerfile
```

### Dependency Graph

```
shared → plugin-sdk → parser
shared → analyzers (builtins)
analyzers + parser + graph + plugin-sdk → core
core + graph + report-generator → cli
core → api
```

### Design Decisions

**Monorepo (Turborepo + pnpm)**
Analyzers run as pure TypeScript with no framework dependencies, enabling isolated testing and potential worker extraction. Shared types enforce contracts between API and frontend.

**Pluggable Analyzer Framework**
Each analyzer implements `IAnalyzer` from `@dosson-architecture-visualizer/plugin-sdk`. The `AnalyzerRegistry` runs them in priority order and merges partial results. The **core engine** (`@dosson-architecture-visualizer/core`) orchestrates analysis without UI dependencies — usable from CLI, API, or custom integrations.

**Clean Architecture (API)**
- `domain/` — interfaces and contracts
- `application/` — use cases and orchestration
- `infrastructure/` — Prisma, Redis, S3, BullMQ, AI providers
- `presentation/` — REST controllers, guards, DTOs

**Background Job Pipeline (BullMQ)**
```
ingest → analyze → generate graphs → AI summarization → persist
```
Each step updates analysis progress for real-time UI polling.

**AI Provider Abstraction**
OpenAI-compatible interface supporting multiple providers (OpenAI, Anthropic). Falls back to heuristic analysis when no API key is configured.

**Security**
- Sandboxed analysis in isolated temp directories
- Path traversal protection on storage and zip extraction
- Zip bomb protection (entry count + uncompressed size limits)
- Helmet, CORS, rate limiting, input validation
- No arbitrary code execution — static analysis only

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | Next.js 15, React 19, TypeScript, TailwindCSS, shadcn/ui, React Flow, Framer Motion |
| Backend | NestJS, TypeScript, BullMQ |
| Database | PostgreSQL, Prisma |
| Cache | Redis |
| Storage | Local filesystem + S3-compatible (MinIO) |
| Auth | Session-based (Better Auth schema) |
| Observability | OpenTelemetry, Pino structured logging, health endpoints |
| AI | OpenAI-compatible provider abstraction |
| Testing | Vitest (unit/integration), Playwright (E2E) |

## Quick Start

### Prerequisites
- Node.js 20+
- pnpm 9+
- Docker & Docker Compose

### One-Command Setup

```bash
cp .env.example .env
pnpm setup
```

This will:
1. Install dependencies
2. Start PostgreSQL, Redis, and MinIO via Docker
3. Run Prisma migrations
4. Seed a demo user and session token

### Start Development

```bash
pnpm dev
```

- **Frontend (Dashboard)**: http://localhost:3000
- **Website**: http://localhost:3001
- **API**: http://localhost:4000
- **API Docs**: http://localhost:4000/api/docs
- **MinIO Console**: http://localhost:9001

### Authentication

After seeding, copy the session token from the terminal output and paste it in **Settings** → **API Authentication**, or use it as a Bearer token:

```bash
curl -H "Authorization: Bearer <token>" http://localhost:4000/api/v1/projects
```

## CLI

Analyze any repository locally without the dashboard:

```bash
# Build CLI first (or use root shortcut after build)
pnpm build
pnpm dosson doctor
pnpm dosson analyze .
pnpm dosson graph . --format mermaid
pnpm dosson report . --output report.html
pnpm dosson export . --type architecture --format json
```

See [docs/CLI.md](docs/CLI.md) for full command reference.

## Docker

### Infrastructure Only

```bash
docker compose up -d
```

Starts PostgreSQL, Redis, and MinIO.

### Full Production Build

```bash
docker build -t dosson-architecture-visualizer .
```

## Environment Variables

See [`.env.example`](.env.example) for all configuration options. Key variables:

| Variable | Description |
|----------|------------|
| `DATABASE_URL` | PostgreSQL connection string |
| `REDIS_URL` | Redis connection string |
| `BETTER_AUTH_SECRET` | Auth secret (min 32 chars) |
| `OPENAI_API_KEY` | OpenAI API key for AI analysis |
| `GITHUB_TOKEN` | GitHub token for private repos |
| `STORAGE_TYPE` | `local` or `s3` |

## API Reference

REST API with OpenAPI documentation at `/api/docs`.

| Endpoint | Method | Description |
|----------|--------|------------|
| `/api/v1/projects` | GET, POST | List/create projects |
| `/api/v1/projects/upload` | POST | Upload ZIP file |
| `/api/v1/projects/:id` | GET, DELETE | Get/delete project |
| `/api/v1/projects/:id/reanalyze` | POST | Trigger re-analysis |
| `/api/v1/projects/:id/dashboard` | GET | Dashboard data |
| `/api/v1/analyses/:id` | GET | Analysis status |
| `/api/v1/analyses/:id/result` | GET | Full analysis result |
| `/api/v1/analyses/:id/graphs` | GET | All graphs |
| `/api/v1/analyses/:id/export/:type/:format` | GET | Export graph |
| `/health` | GET | Health check |

## Testing

```bash
# Unit tests
pnpm test

# E2E tests (requires running servers)
pnpm test:e2e
```

## Roadmap

- [ ] Real-time WebSocket progress updates
- [ ] GitHub OAuth integration
- [ ] Team workspaces and RBAC
- [ ] Custom analyzer plugins via API
- [ ] Architecture diff between commits
- [ ] PDF/SVG/PNG native export
- [ ] VS Code extension
- [ ] Scheduled re-analysis and drift detection
- [ ] Multi-repository comparison view

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Adding a New Analyzer

```typescript
import type { IAnalyzer, AnalysisContext, PartialAnalysisResult } from '@dosson-architecture-visualizer/plugin-sdk';

export class MyAnalyzer implements IAnalyzer {
  readonly name = 'MyAnalyzer';
  readonly priority = 50;
  readonly description = 'Detects something specific';

  async analyze(context: AnalysisContext): Promise<PartialAnalysisResult> {
    return { /* partial result */ };
  }
}
```

Register in `packages/core/src/default-registry.ts` or load via the plugin SDK.

See [CONTRIBUTING.md](CONTRIBUTING.md) and [ARCHITECTURE.md](ARCHITECTURE.md) for details.

## License

MIT License. See [LICENSE](LICENSE) for details.
