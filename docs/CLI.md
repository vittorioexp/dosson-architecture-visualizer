# Dosson CLI

The `dosson` command-line tool works **offline** — no API keys or database required.

## Install

From the monorepo root after `pnpm build`:

```bash
pnpm --filter @dosson-architecture-visualizer/cli exec node dist/bin.js --help
```

## Commands

### `dosson analyze [path]`

Analyze a local repository.

```bash
dosson analyze .
dosson analyze ./my-app --verbose
dosson analyze . --json
dosson analyze . --output report.json
```

### `dosson graph [path]`

Export architecture graphs.

```bash
dosson graph . --type module_dependency --format mermaid -o graph.mmd
dosson graph . --type api --format plantuml
dosson graph . --format graphviz
```

Graph types: `architecture`, `module_dependency`, `service_map`, `api`, `folder_structure`, `database`, `sequence`.

### `dosson report [path]`

Generate a standalone HTML report (dark mode, interactive filter).

```bash
dosson report . -o report.html -n "My App"
```

### `dosson export [path]`

Export full analysis JSON.

```bash
dosson export . -o analysis.json
```

### `dosson doctor`

Check environment and Dosson installation.

```bash
dosson doctor
```
