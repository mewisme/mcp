---
name: builtin-tool-plugin
description: Scaffolds a new built-in MCP tool plugin under packages/builtin-plugins (manifest, PluginContract, registerTool) and registers it in BUILTIN_PLUGINS. Use when adding a built-in plugin like file-system or node-sandbox, creating tools with context.registerTool, or extending @meewmeew/builtin-plugins.
---

# Built-in tool plugin (mcp-management)

## When to use

- User asks to add a **built-in** plugin that exposes **tools** (and optionally resources/prompts later).
- Copying the pattern from `packages/builtin-plugins/src/file-system/` or `node-sandbox/`.

## Where this skill is stored (references)

| Location | Role |
|----------|------|
| `.cursor/skills/builtin-tool-plugin/SKILL.md` | This skill — Cursor loads skills from `.cursor/skills/<name>/` for this workspace. |
| Optional | Mention in root `AGENTS.md` or `.cursor/rules/*.mdc` so contributors know to use this workflow when editing `packages/builtin-plugins`. |

No change to `apps/server` bootstrap is required for a new built-in: `PluginManager.loadAllBuiltinPlugins()` reads `BUILTIN_PLUGINS` from `@meewmeew/builtin-plugins` and loads every entry.

## Layout (one plugin = one folder)

Create `packages/builtin-plugins/src/<plugin-folder>/` with:

| File / folder | Purpose |
|---------------|---------|
| `manifest.ts` | Exports a `PluginManifest` (`@meewmeew/plugin-sdk`). |
| `plugin.ts` | Class implements `PluginContract`; imports tool definitions from `tools/` and registers them in `activate()`. |
| `tools/` | One file per tool (or small group), each exporting a factory like `createXxxTool(...): RegisteredTool` from `@meewmeew/plugin-sdk`. Optional shared helpers (`helpers.ts`, path validation module, etc.). Re-export from `tools/index.ts` for clean imports in `plugin.ts`. |
| `index.ts` | Exports `{ manifest, module }` as `<Name>PluginDefinition`. |

Use **kebab-case** for `<plugin-folder>` (e.g. `node-sandbox`, `file-system`).

## manifest.ts

- Import `PluginManifest` from `@meewmeew/plugin-sdk`.
- Set:
  - `id`: stable string, convention `builtin-<short-id>` (e.g. `builtin-file-system`).
  - `name`, `version`, `description`.
  - `toolPrefix`: short prefix for tool namespacing (e.g. `fs`, `ns`).
  - `executionMode`: `sandbox` (default isolation) or `host-direct` (host access; policy auto-allows built-ins that declare this in `loadAllBuiltinPlugins`).
  - `permissions`: descriptive capability strings (e.g. `plugin-id.action`); keep consistent with what the plugin actually does.

## plugin.ts

- Import `PluginContract`, `PluginContext`, `PluginActivationResult` from `@meewmeew/plugin-sdk`.
- Export `class <Name>Plugin implements PluginContract`.
- `activate(context)`:
  - Log via `context.logger`.
  - Import tool factories from `./tools/index.js` (or individual `./tools/<name>.js` files) and call `context.registerTool(...)` for each.
  - Tool shape: `RegisteredTool` — `name`, `description`, `inputSchema`, `handler` (see `packages/builtin-plugins/src/file-system/tools/` for examples).
  - `inputSchema`: JSON Schema object (`type`, `properties`, `required`).
  - `handler`: async; return `ToolResult` — `{ content: [...] }` with `text` / `image` / etc., optional `isError: true`.
- Return `{ metadata: { activatedAt: Date.now() } }` from `activate` when returning structured activation metadata.
- `deactivate(context)`: optional cleanup; log at minimum.

Match existing style: `.js` extensions in relative imports inside the package (TypeScript ESM).

## index.ts

```ts
import { myPluginManifest } from './manifest.js';
import { MyPlugin } from './plugin.js';

export const MyPluginDefinition = {
  manifest: myPluginManifest,
  module: MyPlugin
};
```

## Register the plugin

1. **Export** from `packages/builtin-plugins/src/index.ts`: import the definition and append it to `BUILTIN_PLUGINS`.
2. **Build** the package (`pnpm --filter @meewmeew/builtin-plugins build`) so `apps/server` resolves the updated `dist` via workspace dependency.

Do **not** add per-plugin entries in `apps/server/src/bootstrap` or `BuiltinLoader` — discovery is driven entirely by `BUILTIN_PLUGINS` and `definition.manifest.id`.

## Runtime wiring (read-only context)

- `apps/server/src/plugin-loader/builtin-loader.ts` resolves `source.reference` to `manifest.id` against `BUILTIN_PLUGINS`.
- `apps/server/src/plugin-manager/index.ts` loads all built-ins and grants `host-direct` policy for built-ins that declare `executionMode: 'host-direct'`.

## Checklist

- [ ] New folder under `packages/builtin-plugins/src/<name>/` with `manifest.ts`, `plugin.ts`, `tools/` (tool modules + `index.ts`), `index.ts`
- [ ] Unique `manifest.id` and appropriate `executionMode` / `permissions`
- [ ] Tools registered only inside `activate` via `context.registerTool`
- [ ] Definition imported and added to `BUILTIN_PLUGINS` in `packages/builtin-plugins/src/index.ts`
- [ ] Package builds cleanly

## See also

- Reference implementations: `packages/builtin-plugins/src/file-system/`, `packages/builtin-plugins/src/node-sandbox/`
- Types: `packages/plugin-sdk/src/manifest.ts`, `packages/plugin-sdk/src/lifecycle.ts`, `packages/plugin-sdk/src/capabilities.ts`
