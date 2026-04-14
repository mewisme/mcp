import { PluginManifest } from '@meewmeew/plugin-sdk';

export const httpFetchManifest: PluginManifest = {
  id: 'builtin-http-fetch',
  name: 'HTTP fetch',
  version: '1.0.0',
  toolPrefix: 'http',
  description: 'HTTP(S) fetch to any URL using only http or https schemes.',
  executionMode: 'host-direct',
  permissions: ['http.fetch'],
};
