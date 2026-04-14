import { describe, it, expect } from 'vitest';
import { MCPRuntimeRegistry } from './index.js';
import type { RegisteredTool } from '@meewmeew/plugin-sdk';

describe('MCPRuntimeRegistry', () => {
  it('prefixes tool names and cleans up by plugin', () => {
    const reg = new MCPRuntimeRegistry();
    const tool: RegisteredTool = {
      name: 'do_thing',
      description: 't',
      inputSchema: { type: 'object' },
      handler: async () => ({ content: [] }),
    };
    reg.registerTool('my-plugin', { ...tool });
    const tools = reg.getTools();
    expect(tools[0]?.name).toBe('my_plugin_do_thing');
    reg.cleanupPluginCapabilities('my-plugin');
    expect(reg.getTools().length).toBe(0);
  });
});
