import { PluginManifest } from '@meewmeew/plugin-sdk';

export const fileSystemManifest: PluginManifest = {
  id: 'builtin-file-system',
  name: 'File System',
  version: '1.0.0',
  toolPrefix: 'fs',
  description:
    'File system tools: any base path is allowed except blocked OS system directories (e.g. Program Files, /etc).',
  executionMode: 'host-direct',
  permissions: ['file-system.read', 'file-system.write']
};
