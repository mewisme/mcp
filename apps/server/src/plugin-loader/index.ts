import { PluginSource } from '@meewmeew/plugin-sdk';
import { LoadedPluginModule } from './types.js';

export interface PluginLoader {
  supports(source: PluginSource): boolean;
  load(source: PluginSource): Promise<LoadedPluginModule>;
}

export class PluginLoaderRegistry {
  private loaders: PluginLoader[] = [];

  constructor(private readonly allowExternalPlugins = false) {}

  registerLoader(loader: PluginLoader): void {
    this.loaders.push(loader);
  }

  async load(source: PluginSource): Promise<LoadedPluginModule> {
    if (source.type !== 'builtin' && !this.allowExternalPlugins) {
      throw new Error(
        'External plugin sources (path, package, bundle) are disabled. Set MCP_ALLOW_EXTERNAL_PLUGINS=true to enable.',
      );
    }
    const loader = this.loaders.find((l) => l.supports(source));
    if (!loader) {
      throw new Error(`No loader found for source type: ${source.type}`);
    }
    return loader.load(source);
  }
}
