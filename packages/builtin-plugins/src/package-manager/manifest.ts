import { PluginManifest } from '@meewmeew/plugin-sdk';

export const packageManagerManifest: PluginManifest = {
  id: 'builtin-package-manager',
  name: 'Package manager',
  version: '1.0.0',
  toolPrefix: 'pm',
  description:
    'Detects lockfiles and infers package manager (pnpm, npm, yarn, bun). Workspace must not be a blocked system directory.',
  executionMode: 'host-direct',
  permissions: ['package-manager.read'],
};
