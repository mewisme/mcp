import { nodeSandboxManifest } from './manifest.js';
import { NodeSandboxPlugin } from './plugin.js';

export const NodeSandboxPluginDefinition = {
  manifest: nodeSandboxManifest,
  module: NodeSandboxPlugin
};
