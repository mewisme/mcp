import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import { glob } from 'node:fs/promises';
import * as path from 'path';
import type { FileSystemPathGuard } from '../path-guard.js';
import { DEFAULT_GLOB_EXCLUDES } from './defaults.js';
import { toolError, toolSuccess } from './helpers.js';

export function createGlobFilesTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'glob_files',
    description:
      'List file paths under a directory matching glob pattern(s) (e.g. **/*.ts, src/**/*.tsx). Uses Node fs.glob; respects path guard. Omits blocked system paths.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Workspace root / base path' },
        path: { type: 'string', description: 'Subdirectory relative to basePath to search in (use "." for basePath itself)' },
        patterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'One or more glob patterns (e.g. "**/*.ts")'
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Optional extra exclude globs (defaults skip node_modules, .git, dist, etc.)'
        },
        maxResults: {
          type: 'integer',
          description: 'Cap number of paths returned (default 500)',
          default: 500
        }
      },
      required: ['basePath', 'path', 'patterns']
    },
    handler: async (args) => {
      try {
        const baseArg = String(args.basePath);
        const cwd = await guard.validatePath(baseArg, String(args.path));
        const baseAbs = path.resolve(baseArg);
        const patterns = (args.patterns as string[])?.length
          ? (args.patterns as string[])
          : ['**/*'];
        const extra = (args.excludePatterns as string[] | undefined) ?? [];
        const exclude = [...DEFAULT_GLOB_EXCLUDES, ...extra];
        const maxResults = Math.min(Math.max(Number(args.maxResults) || 500, 1), 10_000);

        const seen = new Set<string>();
        outer: for (const pattern of patterns) {
          for await (const rel of glob(pattern, { cwd, exclude })) {
            const full = path.join(cwd, rel);
            const relToBase = path.relative(baseAbs, path.resolve(full));
            if (relToBase.startsWith('..') || path.isAbsolute(relToBase)) {
              continue;
            }
            let st;
            try {
              st = await fs.stat(full);
            } catch {
              continue;
            }
            if (!st.isFile()) {
              continue;
            }
            await guard.validatePath(baseArg, relToBase.split(path.sep).join('/'));
            const posix = rel.split(path.sep).join('/');
            seen.add(posix);
            if (seen.size >= maxResults) break outer;
          }
        }

        const out = [...seen].sort();
        if (out.length === 0) {
          return toolSuccess('No files matched.');
        }
        return toolSuccess([`Matched ${out.length} path(s):`, ...out].join('\n'));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
