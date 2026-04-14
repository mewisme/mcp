import { PluginContract, PluginManifest, PluginSource, PluginStatus } from '@meewmeew/plugin-sdk';

export interface LoadedPluginModule {
  source: PluginSource;
  manifest: PluginManifest;
  contract: PluginContract;
  status: PluginStatus;
}
