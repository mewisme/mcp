import { PluginManifest } from '@meewmeew/plugin-sdk';

export const nodeSandboxManifest: PluginManifest = {
  id: 'builtin-node-sandbox',
  name: 'Node Sandbox',
  version: '1.0.0',
  toolPrefix: 'ns',
  description: 'A built-in plugin that allows running JS/TS code in a node environment',
  executionMode: 'sandbox',
  permissions: ['node-sandbox.execute']
};
