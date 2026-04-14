import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

export function createReadTextFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'read_text_file',
    description:
      'Read a text file from the host filesystem. Optionally return only a line range (1-based inclusive) with line numbers, for large files and precise citations.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Mandatory base path' },
        path: { type: 'string', description: 'Path to the file relative to base path' },
        startLine: {
          type: 'integer',
          description: 'First line to include (1-based). Omit for from start of file.'
        },
        endLine: {
          type: 'integer',
          description: 'Last line to include (1-based). Omit for through end of file.'
        }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const content = await fs.readFile(fullPath, 'utf-8');
        const lines = content.split(/\r?\n/);
        const hasStart = args.startLine !== undefined && args.startLine !== null;
        const hasEnd = args.endLine !== undefined && args.endLine !== null;
        if (!hasStart && !hasEnd) {
          return toolSuccess(content);
        }
        const start = hasStart ? Math.max(1, Number(args.startLine)) : 1;
        const end = hasEnd ? Math.min(lines.length, Math.max(start, Number(args.endLine))) : lines.length;
        const slice = lines.slice(start - 1, end);
        const numbered = slice.map((line, i) => `${String(start + i).padStart(6)}|${line}`).join('\n');
        const header = `Lines ${start}-${end} of ${lines.length} (${args.path})`;
        return toolSuccess(`${header}\n${numbered}`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
