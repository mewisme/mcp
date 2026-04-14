import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createEditFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'edit_file',
    description: 'Replace content in a file (simple string replace)',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string' },
        target: { type: 'string', description: 'String to find' },
        replacement: { type: 'string', description: 'Replacement string' }
      },
      required: ['basePath', 'path', 'target', 'replacement']
    },
    handler: async (args) => {
      try {
        const relPath = String(args.path);
        const fullPath = await guard.validatePath(String(args.basePath), relPath);
        const content = await fs.readFile(fullPath, 'utf-8');
        const target = String(args.target);
        if (!content.includes(target)) {
          return toolError(`Target content not found in ${relPath}`);
        }
        const newContent = content.replace(target, String(args.replacement));
        await fs.writeFile(fullPath, newContent);
        return toolSuccess(`File edited: ${relPath}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
