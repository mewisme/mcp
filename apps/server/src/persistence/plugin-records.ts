import type { LoadedPluginModule } from '../plugin-loader/types.js';
import type { PlatformPersistence, ExecutionMode } from './repository.js';

function toExecutionMode(manifest: LoadedPluginModule['manifest']): ExecutionMode {
  return manifest.executionMode === 'host-direct' ? 'host-direct' : 'sandbox';
}

/**
 * Ensures plugin, version, and installation rows exist. Runtime remains authoritative;
 * the DB mirrors catalog state for ops and future admin UI.
 */
export async function ensurePluginInstallation(
  persistence: PlatformPersistence,
  module: LoadedPluginModule,
): Promise<{ installationId: string }> {
  const { manifest, source } = module;
  const pluginKey = manifest.id;

  let plugin = await persistence.plugins.findByKey(pluginKey);
  if (!plugin) {
    plugin = await persistence.plugins.create({
      pluginKey,
      name: manifest.name,
      description: manifest.description,
      sourceType: source.type,
      sourceRef: source.reference,
      manifestJson: manifest,
    });
  }

  let version = await persistence.pluginVersions.findByPluginIdAndVersion(plugin.id, manifest.version);
  if (!version) {
    version = await persistence.pluginVersions.create({
      pluginId: plugin.id,
      version: manifest.version,
      manifestJson: manifest,
    });
  }

  const existingInstalls = await persistence.pluginInstallations.findByVersionId(version.id);
  const mode = toExecutionMode(manifest);
  if (existingInstalls.length > 0) {
    return { installationId: existingInstalls[0]!.id };
  }

  const installation = await persistence.pluginInstallations.create({
    pluginVersionId: version.id,
    requestedExecutionMode: mode,
    effectiveExecutionMode: mode,
  });

  return { installationId: installation.id };
}
