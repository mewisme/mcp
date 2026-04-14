import { PluginManifest } from '@meewmeew/plugin-sdk';

export const shellManifest: PluginManifest = {
  id: 'builtin-shell',
  name: 'Shell',
  version: '1.0.0',
  toolPrefix: 'sh',
  description:
    'Runs a shell command on the host (same account as the MCP server). Working directory must not be a blocked system path.',
  executionMode: 'host-direct',
  permissions: ['shell.execute'],
};
