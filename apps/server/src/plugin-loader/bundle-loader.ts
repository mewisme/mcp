import { createHash } from 'node:crypto';
import fs from 'fs-extra';
import path from 'path';
import AdmZip from 'adm-zip';
import { PluginSource } from '@meewmeew/plugin-sdk';
import { PluginLoader } from './index.js';
import { LoadedPluginModule } from './types.js';
import { PathLoader } from './path-loader.js';

export class BundleLoader implements PluginLoader {
  private cacheDir = path.join(process.cwd(), '.plugins-cache');
  private pathLoader = new PathLoader();

  supports(source: PluginSource): boolean {
    return source.type === 'bundle';
  }

  async load(source: PluginSource): Promise<LoadedPluginModule> {
    const bundlePath = path.resolve(source.reference);

    if (!(await fs.pathExists(bundlePath))) {
      throw new Error(`Bundle file not found: ${bundlePath}`);
    }

    await fs.ensureDir(this.cacheDir);

    const stat = await fs.stat(bundlePath);
    const bundleName = path.basename(bundlePath, path.extname(bundlePath));
    const hash = createHash('sha256')
      .update(bundlePath)
      .update(String(stat.mtimeMs))
      .update(String(stat.size))
      .digest('hex')
      .slice(0, 16);
    const extractDir = path.join(this.cacheDir, `${bundleName}-${hash}`);

    try {
      const zip = new AdmZip(bundlePath);
      zip.extractAllTo(extractDir, true);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : String(e);
      throw new Error(`Failed to extract bundle ${bundlePath}: ${message}`);
    }

    return this.pathLoader.load({
      type: 'path',
      reference: extractDir,
    });
  }
}
