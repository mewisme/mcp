import fs from 'fs-extra';
import path from 'path';
import { pathToFileURL } from 'url';
import { PluginSource, PluginManifest } from '@meewmeew/plugin-sdk';
import { PluginLoader } from './index.js';
import { LoadedPluginModule } from './types.js';

export class PathLoader implements PluginLoader {
  supports(source: PluginSource): boolean {
    return source.type === 'path';
  }

  async load(source: PluginSource): Promise<LoadedPluginModule> {
    const pluginDir = path.resolve(source.reference);
    
    if (!await fs.pathExists(pluginDir)) {
      throw new Error(`Plugin directory not found: ${pluginDir}`);
    }

    const manifestPath = path.join(pluginDir, 'plugin.json');
    if (!await fs.pathExists(manifestPath)) {
      throw new Error(`Plugin manifest not found in directory: ${pluginDir}`);
    }

    const manifest: PluginManifest = await fs.readJson(manifestPath);
    
    // Determine entry point
    const entryFile = manifest.entry || 'index.js';
    const entryPath = path.resolve(pluginDir, entryFile);

    if (!await fs.pathExists(entryPath)) {
      throw new Error(`Plugin entry point not found: ${entryPath}`);
    }

    // Dynamic import needs file:// protocol on Windows for absolute paths
    const moduleUrl = pathToFileURL(entryPath).href;
    const module = await import(moduleUrl);

    if (!module.default) {
      throw new Error(`Plugin at ${entryPath} does not have a default export.`);
    }

    return {
      source,
      manifest,
      contract: new module.default(),
      status: 'loaded'
    };
  }
}
