# `@meewmeew/mcp`

MCP (Model Context Protocol) server that loads plugins, manages their lifecycle, persists state to disk (or memory), and speaks MCP over **stdio**. Built-in tools ship in `@meewmeew/builtin-plugins`; external plugins can be loaded from path, npm package, or bundle when explicitly enabled.

This package is part of the [mcp-management](https://github.com/mewisme/mcp) monorepo (`apps/server`).

## Requirements

- Node.js 22+ (aligned with the repo)
- [pnpm](https://pnpm.io/) at the workspace root

## Install and run (from the monorepo root)

```bash
pnpm install
```

**Development** (watch mode, runs `src/bootstrap/index.ts`):

```bash
pnpm exec turbo dev --filter=@meewmeew/mcp
```

**Production-style** (uses compiled output):

```bash
pnpm exec turbo build --filter=@meewmeew/mcp
pnpm exec turbo start --filter=@meewmeew/mcp
```

Or from this directory after a build:

```bash
pnpm start
# same as: node dist/index.js
```

**CLI** (after `pnpm build` in this package, or when installed from npm):

```bash
mcp-management
```

The published `bin` points at the bundled `dist/index.js` entry (see `package.json`).

## Configuration

Environment variables are loaded from a **`.env` file in the current working directory** (`dotenv`). Copy `.env.example` to `.env` and adjust.

| Variable | Purpose |
|----------|---------|
| `NODE_ENV` | e.g. `development`, `production`, `test` |
| `LOG_LEVEL` | Logger level (default `info`) |
| `MCP_DATA_DIR` | Directory for JSON persistence and logs. Default: `~/.mcp-management` |
| `MCP_IN_MEMORY_PERSISTENCE` | Set to `true` to skip the JSON file store (e.g. tests). Also forced when `NODE_ENV=test` |
| `MCP_ALLOW_EXTERNAL_PLUGINS` | Set to `true` to allow **path**, **package**, and **bundle** plugin loaders. Built-ins always load |
| `PORT` | Reserved; stdio transport does not listen on HTTP today |

**Data on disk**

- Plugin mirror / state: `store.json` under `MCP_DATA_DIR`
- Plugin audit events: `{MCP_DATA_DIR}/logs/plugin-audit.log` (Winston; not in `store.json`)

## Architecture (short)

1. **Bootstrap** loads config, creates persistence, registers plugin loaders (built-in, path, package, bundle), builds **PluginManager** with registry + **ExecutionPolicy**, then connects MCP over **stdio** via **MCPServerAdapter**.
2. **Built-in plugins** come from `BUILTIN_PLUGINS` in `@meewmeew/builtin-plugins`.
3. **Security**: `host-direct` execution is policy-gated; built-ins are allowlisted by the plugin manager. Filesystem-related built-ins respect blocked system paths via `@meewmeew/shared` (`system-path-guard`).

## Scripts (this package)

| Script | Command |
|--------|---------|
| `pnpm build` | `tsup` → `dist/` (bundles workspace deps for a single artifact) |
| `pnpm dev` | `tsx watch src/bootstrap/index.ts` |
| `pnpm start` | `node dist/index.js` |
| `pnpm test` | `vitest run` |
| `pnpm lint` / `pnpm check-types` | ESLint / `tsc --noEmit` |

## Related packages

- `@meewmeew/plugin-sdk` — plugin contracts, manifests, tool registration
- `@meewmeew/builtin-plugins` — curated built-in MCP tools
- `@meewmeew/shared` — logger, errors, path guards
