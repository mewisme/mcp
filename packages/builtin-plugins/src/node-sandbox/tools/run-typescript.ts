import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { runInTempFile } from './run-in-temp.js';

export function createRunTypescriptTool(): RegisteredTool {
  return {
    name: 'run_typescript',
    description: 'Run Typescript code in a Node environment using tsx',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The Typescript code to run'
        }
      },
      required: ['code']
    },
    handler: async (args) => {
      const code = String(args.code);
      return runInTempFile('mcp-node-ts-', 'script.ts', code, 'typescript');
    },
  };
}
