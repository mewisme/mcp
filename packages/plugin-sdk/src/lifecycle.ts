import { PluginContext } from './context.js';

export interface PluginActivationResult {
  metadata?: Record<string, unknown>;
}

export interface PluginContract {
  /**
   * Called to activate the plugin. The plugin receives a context with bounded capabilities.
   */
  activate(context: PluginContext): Promise<PluginActivationResult | void>;
  
  /**
   * Called to gracefully deactivate the plugin.
   */
  deactivate(context: PluginContext): Promise<void>;
}
