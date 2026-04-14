import { LoadedPluginModule } from '../plugin-loader/types.js';

export class PluginRegistry {
  private plugins = new Map<string, LoadedPluginModule>();

  register(pluginId: string, module: LoadedPluginModule): void {
    if (this.plugins.has(pluginId)) {
      throw new Error(`Plugin ${pluginId} is already registered.`);
    }
    this.plugins.set(pluginId, module);
  }

  get(pluginId: string): LoadedPluginModule | undefined {
    return this.plugins.get(pluginId);
  }

  getAll(): LoadedPluginModule[] {
    return Array.from(this.plugins.values());
  }

  updateStatus(pluginId: string, status: LoadedPluginModule['status']): void {
    const plugin = this.plugins.get(pluginId);
    if (!plugin) {
      throw new Error(`Plugin ${pluginId} not found`);
    }
    plugin.status = status;
  }

  remove(pluginId: string): void {
    this.plugins.delete(pluginId);
  }
}
