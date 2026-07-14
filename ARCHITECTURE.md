# Architecture

Dosson Architecture Visualizer is a Turborepo monorepo. The **Core Engine** is UI-agnostic and powers the CLI, API, and Dashboard.

## Package dependency graph

```
shared
  ↑
plugin-sdk ──→ parser
  ↑
analyzers (built-in detectors)
  ↑
graph ──────────→ report-generator
  ↑
core ←────────── cli
  ↑
api (NestJS SaaS)     dashboard (Next.js)
```

## Principles

1. **Core never depends on UI** — `@dosson-architecture-visualizer/core` orchestrates analysis only.
2. **CLI is standalone** — `dosson analyze .` works without database or Redis.
3. **AI is optional** — static analyzers are the source of truth; AI augments when keys exist.
4. **Plugins** — implement `IAnalyzer` from `plugin-sdk` and register via `AnalyzerRegistry`.
5. **Backward compatibility** — API imports `core`; legacy `analyzers` path preserved via builtins export.

## Analysis pipeline

```
createAnalysisContext(path)  →  AnalyzerRegistry.runAll()  →  merge scores
  →  GraphBuilder.buildAll()  →  AnalysisOutput
```

## Apps

| App | Package | Port | Role |
|-----|---------|------|------|
| Dashboard | `@dosson-architecture-visualizer/dashboard` | 3000 | SaaS UI |
| Website | `@dosson-architecture-visualizer/website` | 3001 | Marketing / docs landing |
| API | `@dosson-architecture-visualizer/api` | 4000 | REST + BullMQ jobs |

## Security

- Sandboxed temp directories for ingest
- No code execution from analyzed repos
- Zip bomb and path traversal guards in API ingest service
