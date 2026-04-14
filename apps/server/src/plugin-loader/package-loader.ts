import { PluginSource } from '@meewmeew/plugin-sdk';
import { PluginLoader } from './index.js';
import { LoadedPluginModule } from './types.js';

export class PackageLoader implements PluginLoader {
  supports(source: PluginSource): boolean {
    return source.type === 'package';
  }

  async load(source: PluginSource): Promise<LoadedPluginModule> {
    const packageName = source.reference;
    
    try {
      // Load the package using dynamic import
      const module = await import(packageName);

      if (!module.manifest) {
        throw new Error(`Package ${packageName} does not export 'manifest'.`);
      }

      if (!module.default) {
        throw new Error(`Package ${packageName} does not have a default export.`);
      }

      return {
        source,
        manifest: module.manifest,
        contract: new module.default(),
        status: 'loaded'
      };
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to load plugin package ${packageName}: ${message}`);
    }
  }
}
