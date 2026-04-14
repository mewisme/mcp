import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createReadMultipleFilesTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'read_multiple_files',
    description: 'Read multiple files at once',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Mandatory base path' },
        paths: { type: 'array', items: { type: 'string' }, description: 'Paths relative to base path' }
      },
      required: ['basePath', 'paths']
    },
    handler: async (args) => {
      try {
        const basePath = String(args.basePath);
        const paths = args.paths as string[];
        const results = await Promise.all(
          paths.map(async (p) => {
            const fullPath = await guard.validatePath(basePath, p);
            const content = await fs.readFile(fullPath, 'utf-8');
            return `--- ${p} ---\n${content}\n`;
          })
        );
        return toolSuccess(results.join('\n'));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
