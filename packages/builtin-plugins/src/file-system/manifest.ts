import { PluginManifest } from '@meewmeew/plugin-sdk';

export const fileSystemManifest: PluginManifest = {
  id: 'builtin-file-system',
  name: 'File System',
  version: '1.1.1',
  toolPrefix: 'fs',
  description:
    'File system tools for agents: read/write/edit, glob, grep, tree/list, move/delete. Any base path is allowed except blocked OS system directories (e.g. Program Files, /etc).',
  executionMode: 'host-direct',
  permissions: ['file-system.read', 'file-system.write']
};
