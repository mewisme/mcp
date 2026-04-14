import { testQualityManifest } from './manifest.js';
import { TestQualityPlugin } from './plugin.js';

export const TestQualityPluginDefinition = {
  manifest: testQualityManifest,
  module: TestQualityPlugin,
};
