# mcp-management

Monorepo for an [MCP (Model Context Protocol)](https://modelcontextprotocol.io/) management stack: a Node.js server that loads plugins, registers tools via the MCP SDK, persists state, and speaks MCP over **stdio**, plus a **Next.js** web UI. Tooling is **pnpm** + **Turborepo**; packages are TypeScript-first.

**Repository:** [github.com/mewisme/mcp](https://github.com/mewisme/mcp)

## Requirements

- **Node.js** 22+ (see root `package.json` `engines`)
- **pnpm** 10+ (version pinned via `packageManager` in root `package.json`)

## Quick start

```bash
pnpm install
pnpm dev
```

`pnpm dev` runs every workspace package’s `dev` script via Turborepo. To work on one app:

```bash
pnpm exec turbo dev --filter=@meewmeew/mcp    # MCP server (watch)
pnpm exec turbo dev --filter=@meewmeew/web    # Next.js app
```

Build, quality checks, and tests from the repo root:

```bash
pnpm build
pnpm lint
pnpm check-types
pnpm test
```

Format sources with Prettier: `pnpm format`.

## What’s in the repo

| Area | Location | Package | Role |
|------|----------|---------|------|
| MCP server | `apps/server` | `@meewmeew/mcp` | Plugin loading, lifecycle, persistence, stdio MCP transport; CLI `mcp-management` |
| Web app | `apps/web` | `@meewmeew/web` | Next.js 16 UI (App Router under `src/app/`) |
| Built-in plugins | `packages/builtin-plugins` | `@meewmeew/builtin-plugins` | Curated plugins; registry export `BUILTIN_PLUGINS` |
| Plugin API | `packages/plugin-sdk` | `@meewmeew/plugin-sdk` | Contracts, manifests, tool registration |
| Shared utilities | `packages/shared` | `@meewmeew/shared` | Logger, errors, path guards / allowed roots |
| Tooling | `packages/eslint-config`, `packages/typescript-config` | — | Shared ESLint and TypeScript bases |

Workspace layout is declared in `pnpm-workspace.yaml` (`apps/*`, `packages/*`).

## MCP server (`@meewmeew/mcp`)

The server bootstraps in `apps/server/src/bootstrap/`, registers plugin loaders (built-in, and optionally path / package / bundle when allowed), runs a **PluginManager** with an execution policy, and exposes MCP over **stdio**.

- **Published package:** `@meewmeew/mcp` on npm (build output under `apps/server/dist/`).
- **Local config:** copy `apps/server/.env.example` to `.env` in the directory you run from (`dotenv` loads the cwd’s `.env`).

**Persistence and logs**

- JSON state: `store.json` under **`MCP_DATA_DIR`** (default `~/.mcp-management` on the current user).
- Plugin audit log: `{MCP_DATA_DIR}/logs/plugin-audit.log` (Winston), separate from `store.json`.
- In-memory persistence: `MCP_IN_MEMORY_PERSISTENCE=true`, or when `NODE_ENV=test`.

**Security / plugins**

- External loaders (path, package, bundle) require **`MCP_ALLOW_EXTERNAL_PLUGINS=true`**; built-ins always load.
- Filesystem-related tooling respects blocked OS paths and optional **`MCP_FS_ALLOWED_ROOTS`** (comma-separated paths); see `@meewmeew/shared`.

Full CLI options, scripts table, and architecture notes: [`apps/server/README.md`](apps/server/README.md).

## Web app (`@meewmeew/web`)

Next.js **16**, React **19**, Tailwind **4**. Routes live under `apps/web/src/app/`. For editor/agent notes on this stack, see [`AGENTS.md`](AGENTS.md) and [`apps/web/AGENTS.md`](apps/web/AGENTS.md).

## Versioning and release

- **`pnpm bump`** (or `node scripts/bump.js [major|minor|patch]`) bumps the **root** `package.json` version only.
- CI (`.github/workflows/mcp-server.yml`) on `main`: builds and tests `@meewmeew/mcp`, syncs `apps/server/package.json` from the root version, creates the `vX.Y.Z` git tag if missing, and publishes **`@meewmeew/mcp`** to npm when `NPM_TOKEN` is configured.

## Documentation for contributors

- **[`AGENTS.md`](AGENTS.md)** — monorepo layout, commands, server mental model, how to add a built-in plugin (see also `.cursor/skills/builtin-tool-plugin/SKILL.md`).

## Useful links

- [Model Context Protocol](https://modelcontextprotocol.io/)
- [Turborepo — tasks and filters](https://turborepo.dev/docs/crafting-your-repository/running-tasks)
