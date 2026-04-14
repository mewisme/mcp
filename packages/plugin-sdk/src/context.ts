import { RegisteredTool, RegisteredResource, RegisteredPrompt } from './capabilities.js';

/**
 * The PluginContext is provided to the plugin during its lifecycle phases (e.g. activation).
 * It represents the rigid security boundary scoped strictly for this plugin instance.
 */
export interface PluginContext {
  pluginId: string;
  
  logger: {
    info: (message: string, meta?: any) => void;
    warn: (message: string, meta?: any) => void;
    error: (message: string, meta?: any) => void;
    debug: (message: string, meta?: any) => void;
  };

  /**
   * Capability registration bound automatically to this pluginId.
   */
  registerTool: (tool: RegisteredTool) => void;
  registerResource: (resource: RegisteredResource) => void;
  registerPrompt: (prompt: RegisteredPrompt) => void;
}
