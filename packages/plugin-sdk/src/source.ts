export type PluginSourceType = 'builtin' | 'path' | 'package' | 'bundle';

export interface PluginSource {
  type: PluginSourceType;
  /**
   * Depending on the source type, this might be a package name, file path, etc.
   */
  reference: string;
}
