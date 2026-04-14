import { PluginSource } from '@meewmeew/plugin-sdk';
import { PluginLoader } from './index.js';
import { LoadedPluginModule } from './types.js';
import { BUILTIN_PLUGINS } from '@meewmeew/builtin-plugins';

export class BuiltinLoader implements PluginLoader {
  supports(source: PluginSource): boolean {
    return source.type === 'builtin';
  }

  async load(source: PluginSource): Promise<LoadedPluginModule> {
    const builtin = BUILTIN_PLUGINS.find(p => p.manifest.id === source.reference);
    
    if (!builtin) {
      throw new Error(`Builtin plugin not found: ${source.reference}`);
    }

    return {
      source,
      manifest: builtin.manifest,
      contract: new builtin.module(),
      status: 'loaded'
    };
  }
}
