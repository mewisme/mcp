import { repoNavigationManifest } from './manifest.js';
import { RepoNavigationPlugin } from './plugin.js';

export const RepoNavigationPluginDefinition = {
  manifest: repoNavigationManifest,
  module: RepoNavigationPlugin,
};
