import { httpFetchManifest } from './manifest.js';
import { HttpFetchPlugin } from './plugin.js';

export const HttpFetchPluginDefinition = {
  manifest: httpFetchManifest,
  module: HttpFetchPlugin,
};
