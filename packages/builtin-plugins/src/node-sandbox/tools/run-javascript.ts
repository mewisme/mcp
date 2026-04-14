import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import { runInTempFile } from './run-in-temp.js';

export function createRunJavascriptTool(): RegisteredTool {
  return {
    name: 'run_javascript',
    description: 'Run JavaScript in a separate Node process (same machine account as the MCP server)',
    inputSchema: {
      type: 'object',
      properties: {
        code: {
          type: 'string',
          description: 'The Javascript code to run'
        }
      },
      required: ['code']
    },
    handler: async (args) => {
      const code = String(args.code);
      return runInTempFile('mcp-node-js-', 'script.js', code, 'javascript');
    },
  };
}
