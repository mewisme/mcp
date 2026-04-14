import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createDirectoryTreeTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'directory_tree',
    description: 'Get a recursive directory tree',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string' },
        depth: { type: 'number', default: 3 }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const maxDepth = typeof args.depth === 'number' ? args.depth : 3;

        const buildTree = async (currentPath: string, currentDepth: number): Promise<string> => {
          if (currentDepth > maxDepth) return '';
          const entries = await fs.readdir(currentPath, { withFileTypes: true });
          let result = '';
          for (const entry of entries) {
            const indent = '  '.repeat(maxDepth - currentDepth);
            result += `${indent}${entry.isDirectory() ? '📂' : '📄'} ${entry.name}\n`;
            if (entry.isDirectory()) {
              result += await buildTree(path.join(currentPath, entry.name), currentDepth + 1);
            }
          }
          return result;
        };

        const tree = await buildTree(fullPath, 0);
        return toolSuccess(tree || 'Empty or too deep');
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
