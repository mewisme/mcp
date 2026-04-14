import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createDeleteFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'delete_file',
    description:
      'Delete a single file (not a directory). Use remove_directory for folders. Fails if the path is a directory.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string', description: 'File path relative to basePath' }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const relPath = String(args.path);
        const fullPath = await guard.validatePath(String(args.basePath), relPath);
        const st = await fs.stat(fullPath);
        if (st.isDirectory()) {
          return toolError(`Path is a directory; use remove_directory instead: ${relPath}`);
        }
        await fs.unlink(fullPath);
        return toolSuccess(`File deleted: ${relPath}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
