import { PluginManifest } from '@meewmeew/plugin-sdk';

export const testQualityManifest: PluginManifest = {
  id: 'builtin-test-quality',
  name: 'Test and quality',
  version: '1.0.0',
  toolPrefix: 'qa',
  description:
    'Runs test, lint, and typecheck scripts via the detected package manager (pnpm, npm, yarn, bun). Workspace must not be a blocked system directory.',
  executionMode: 'host-direct',
  permissions: ['quality.run'],
};
