import { shellManifest } from './manifest.js';
import { ShellPlugin } from './plugin.js';

export const ShellPluginDefinition = {
  manifest: shellManifest,
  module: ShellPlugin,
};
