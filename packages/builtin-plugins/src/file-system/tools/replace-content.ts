import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import type { FileSystemPathGuard } from '../path-guard.js';
import { applyFindReplace } from './find-replace.js';
import { toolError, toolSuccess } from './helpers.js';

export function createReplaceContentTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'replace_content',
    description:
      'Replace text in a file: find `search` and substitute `replacement`. Use replaceAll to change every occurrence. Prefer this over edit_file when the task is explicitly a search-and-replace.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string', description: 'File path relative to basePath' },
        search: { type: 'string', description: 'Exact text to find' },
        replacement: { type: 'string', description: 'Text to insert in place of search' },
        replaceAll: {
          type: 'boolean',
          description: 'Replace every occurrence (default: first occurrence only)',
          default: false
        }
      },
      required: ['basePath', 'path', 'search', 'replacement']
    },
    handler: async (args) => {
      try {
        const relPath = String(args.path);
        const result = await applyFindReplace(
          guard,
          String(args.basePath),
          relPath,
          String(args.search),
          String(args.replacement),
          Boolean(args.replaceAll)
        );
        if (!result.ok) {
          return toolError(result.message);
        }
        return toolSuccess(`Replaced in: ${relPath}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
