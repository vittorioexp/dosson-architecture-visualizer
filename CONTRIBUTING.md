# Contributing to Dosson

Thank you for contributing to **Dosson Architecture Visualizer**.

## Development setup

```bash
cp .env.example .env
pnpm install --ignore-scripts
pnpm --filter @dosson-architecture-visualizer/api exec prisma generate
pnpm docker:up
pnpm db:migrate
pnpm dev
```

## Project structure

See [ARCHITECTURE.md](./ARCHITECTURE.md).

## Adding an analyzer

1. Create a class implementing `IAnalyzer` in `packages/analyzers/src/analyzers/`.
2. Export it from `packages/analyzers/src/builtins.ts`.
3. Register it in `packages/core/src/default-registry.ts`.
4. Add a unit test.

## Commands

| Command | Description |
|---------|-------------|
| `pnpm build` | Build all packages |
| `pnpm test` | Run unit tests |
| `pnpm test:e2e` | Playwright E2E |
| `pnpm --filter @dosson-architecture-visualizer/cli exec node dist/bin.js analyze .` | CLI analyze |

## Pull requests

- Keep changes focused
- Ensure `pnpm build` and `pnpm test` pass
- Follow existing TypeScript and naming conventions
