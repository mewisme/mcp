import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import type { FileSystemPathGuard } from '../path-guard.js';
import { toolSuccess } from './helpers.js';

export function createListAllowedDirectoriesTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'list_allowed_directories',
    description: 'Describes filesystem policy: all paths are allowed except blocked system directories',
    inputSchema: { type: 'object', properties: {} },
    handler: async () => {
      const forbidden = guard.getForbiddenPaths().join(', ');
      return toolSuccess(
        `Policy: any path may be used as a base except under blocked system directories. Blocked prefixes: ${forbidden}`,
      );
    },
  };
}
