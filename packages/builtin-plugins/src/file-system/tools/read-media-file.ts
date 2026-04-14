import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import * as path from 'path';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolError, toolSuccess } from './helpers.js';

const mimeMap: Record<string, string> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
  svg: 'image/svg+xml'
};

export function createReadMediaFileTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'read_media_file',
    description: 'Read a media file (image) from the host filesystem',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string', description: 'Mandatory base path' },
        path: { type: 'string', description: 'Path to the file relative to base path' }
      },
      required: ['basePath', 'path']
    },
    handler: async (args) => {
      try {
        const fullPath = await guard.validatePath(String(args.basePath), String(args.path));
        const buffer = await fs.readFile(fullPath);
        const ext = path.extname(fullPath).toLowerCase().replace('.', '');

        if (mimeMap[ext]) {
          return {
            content: [
              {
                type: 'image',
                data: buffer.toString('base64'),
                mimeType: mimeMap[ext]
              }
            ]
          };
        }

        return toolSuccess(`File read successfully (base64 encoded): ${buffer.toString('base64').substring(0, 100)}...`);
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
