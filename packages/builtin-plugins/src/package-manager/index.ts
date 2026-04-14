import { packageManagerManifest } from './manifest.js';
import { PackageManagerPlugin } from './plugin.js';

export const PackageManagerPluginDefinition = {
  manifest: packageManagerManifest,
  module: PackageManagerPlugin,
};
