# Agent guide — mcp-management

This repository is a **pnpm + Turborepo** monorepo for an **MCP (Model Context Protocol) management** stack: a Node server that loads plugins, exposes tools via the MCP SDK, and optional persistence; plus a **Next.js** web app.

## Monorepo layout

| Area | Package / app | Role |
|------|----------------|------|
| Server | `apps/server` (`@meewmeew/mcp`) | MCP core: plugin loading, lifecycle, persistence, stdio MCP transport |
| Web | `apps/web` (`@meewmeew/web`) | Next.js 16 UI (App Router under `src/app/`) |
| Built-in plugins | `packages/builtin-plugins` (`@meewmeew/builtin-plugins`) | Curated plugins; export list `BUILTIN_PLUGINS` |
| Plugin API | `packages/plugin-sdk` (`@meewmeew/plugin-sdk`) | `PluginContract`, manifests, tool registration, context |
| Shared | `packages/shared` (`@meewmeew/shared`) | Logger, errors |
| Tooling | `packages/eslint-config`, `packages/typescript-config` | ESLint and TS bases |

The workspace is declared in `pnpm-workspace.yaml` (`apps/*`, `packages/*`).

## Commands (from repo root)

- **Install**: `pnpm install`
- **Dev (all)**: `pnpm dev` (turbo; runs each package’s `dev`)
- **Dev server only**: `pnpm exec turbo dev --filter=@meewmeew/mcp`
- **Dev web only**: `pnpm exec turbo dev --filter=@meewmeew/web`
- **Build**: `pnpm build`
- **Lint / types / tests**: `pnpm lint`, `pnpm check-types`, `pnpm test`

Server-specific: persistence uses a **JSON file** (`store.json`) under **`MCP_DATA_DIR`**, defaulting to **`~/.mcp-management`**. **Plugin audit logs** are written separately with **Winston** to **`{MCP_DATA_DIR}/logs/plugin-audit.log`** (not in `store.json`). Copy `apps/server/.env.example` to `.env` if you need overrides. Built-in filesystem and dev workspace tools allow any path except **blocked OS system directories** (see `@meewmeew/shared` `system-path-guard`). External loaders (`path` / `package` / `bundle`) need **`MCP_ALLOW_EXTERNAL_PLUGINS=true`**.

## Server architecture (mental model)

1. **Bootstrap** (`apps/server/src/bootstrap/index.ts`): loads config, creates **persistence** (JSON file under the user data directory, or in-memory when `NODE_ENV=test` / `MCP_IN_MEMORY_PERSISTENCE=true`), registers **plugin loaders** (built-in, path, package, bundle), builds **PluginManager** with registry + **ExecutionPolicy**, then connects **MCP** over **stdio** (`MCPServerAdapter`).
2. **Built-in plugins** are discovered from `BUILTIN_PLUGINS` in `@meewmeew/builtin-plugins`; no per-plugin edits in bootstrap are required for new built-ins.
3. **Persistence** mirrors loaded plugins into `store.json`; **plugin audit** events go to **`{MCP_DATA_DIR}/logs/plugin-audit.log`** via Winston. Domain types live under `apps/server/src/persistence/`.

## Adding a built-in MCP tool plugin

Follow the workspace skill **builtin-tool-plugin** at `.cursor/skills/builtin-tool-plugin/SKILL.md`: one folder under `packages/builtin-plugins/src/<name>/` (`manifest.ts`, `plugin.ts`, `index.ts`), append to `BUILTIN_PLUGINS` in `packages/builtin-plugins/src/index.ts`, then build `@meewmeew/builtin-plugins`. Use existing `file-system` / `node-sandbox` as templates; prefer `.js` extensions in relative imports inside packages (ESM).

## Web app (`apps/web`)

Next.js **16** with React **19** and Tailwind **4**. App routes live in `apps/web/src/app/`. **Do not assume older Next.js APIs** — for UI work, read `apps/web/AGENTS.md` (and local `node_modules/next/dist/docs/` when in doubt).

## Conventions for agents

- Prefer **focused changes**; match existing import/style in the touched package.
- Server packages use **type: module** and ESM-style paths where the codebase already uses `.js` in TS imports.
- After changing workspace packages consumed by `apps/server`, ensure the dependent **build** runs so `dist` is up to date if your workflow relies on built output.
