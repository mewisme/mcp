export interface PluginManifest {
  id: string;
  name: string;
  version: string;
  description?: string;
  
  /**
   * Optional short prefix to use for tools, resources, and prompts.
   * If not provided, the normalized plugin ID will be used.
   */
  toolPrefix?: string;
  
  /**
   * Defines how the plugin should be executed.
   * `sandbox` (default): lifecycle runs in-process via the platform runner (not an OS sandbox).
   * `host-direct`: same process with explicit policy approval for elevated/trusted plugins.
   */
  executionMode?: 'sandbox' | 'host-direct';
  
  /**
   * Required permissions metadata.
   */
  permissions?: string[];

  /**
   * Optional entry point for the plugin (e.g., "dist/index.js").
   * Defaults to "index.js" or "main" in package.json.
   */
  entry?: string;
}
