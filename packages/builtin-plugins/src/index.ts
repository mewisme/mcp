import { NodeSandboxPluginDefinition } from './node-sandbox/index.js';
import { FileSystemPluginDefinition } from './file-system/index.js';
import { RepoNavigationPluginDefinition } from './repo-navigation/index.js';
import { TestQualityPluginDefinition } from './test-quality/index.js';
import { PackageManagerPluginDefinition } from './package-manager/index.js';
import { HttpFetchPluginDefinition } from './http-fetch/index.js';

export const BUILTIN_PLUGINS = [
  NodeSandboxPluginDefinition,
  FileSystemPluginDefinition,
  RepoNavigationPluginDefinition,
  TestQualityPluginDefinition,
  PackageManagerPluginDefinition,
  HttpFetchPluginDefinition,
];
