import { RegisteredTool, RegisteredResource, RegisteredPrompt } from '@meewmeew/plugin-sdk';
import { createConsoleLogger } from '@meewmeew/shared';

const logger = createConsoleLogger('MCPRuntime');

function cloneTool(tool: RegisteredTool): RegisteredTool {
  return { ...tool };
}

function cloneResource(resource: RegisteredResource): RegisteredResource {
  return { ...resource };
}

function clonePrompt(prompt: RegisteredPrompt): RegisteredPrompt {
  return { ...prompt };
}

export class MCPRuntimeRegistry {
  private tools = new Map<string, { pluginId: string; tool: RegisteredTool }>();
  private resources = new Map<string, { pluginId: string; resource: RegisteredResource }>();
  private prompts = new Map<string, { pluginId: string; prompt: RegisteredPrompt }>();

  registerTool(pluginId: string, tool: RegisteredTool, overridePrefix?: string): void {
    const t = cloneTool(tool);
    const originalName = t.name;
    const normalizedToolName = originalName.replace(/-/g, '_').toLowerCase();

    const basePrefix = overridePrefix || pluginId.replace(/-/g, '_').toLowerCase();
    const prefix = `${basePrefix}_`;

    if (!originalName.startsWith(prefix)) {
      const prefixedName = `${prefix}${normalizedToolName}`;
      logger.info(`Tool name '${originalName}' from plugin '${pluginId}' converted to '${prefixedName}'.`);
      t.name = prefixedName;
    }

    if (this.tools.has(t.name)) {
      throw new Error(`Tool ${t.name} already registered`);
    }
    this.tools.set(t.name, { pluginId, tool: t });
    logger.debug(`Registered tool: ${t.name} from plugin: ${pluginId}`);
  }

  registerResource(pluginId: string, resource: RegisteredResource, overridePrefix?: string): void {
    const r = cloneResource(resource);
    const originalName = r.name;
    const normalizedName = originalName.replace(/-/g, '_').toLowerCase();

    const basePrefix = overridePrefix || pluginId.replace(/-/g, '_').toLowerCase();
    const prefix = `${basePrefix}_`;

    if (!originalName.startsWith(prefix)) {
      const prefixedName = `${prefix}${normalizedName}`;
      logger.info(`Resource name '${originalName}' from plugin '${pluginId}' converted to '${prefixedName}'.`);
      r.name = prefixedName;
    }

    if (this.resources.has(r.name)) {
      throw new Error(`Resource ${r.name} already registered`);
    }
    this.resources.set(r.name, { pluginId, resource: r });
    logger.debug(`Registered resource: ${r.name} from plugin: ${pluginId}`);
  }

  registerPrompt(pluginId: string, prompt: RegisteredPrompt, overridePrefix?: string): void {
    const p = clonePrompt(prompt);
    const originalName = p.name;
    const normalizedName = originalName.replace(/-/g, '_').toLowerCase();

    const basePrefix = overridePrefix || pluginId.replace(/-/g, '_').toLowerCase();
    const prefix = `${basePrefix}_`;

    if (!originalName.startsWith(prefix)) {
      const prefixedName = `${prefix}${normalizedName}`;
      logger.info(`Prompt name '${originalName}' from plugin '${pluginId}' converted to '${prefixedName}'.`);
      p.name = prefixedName;
    }

    if (this.prompts.has(p.name)) {
      throw new Error(`Prompt ${p.name} already registered`);
    }
    this.prompts.set(p.name, { pluginId, prompt: p });
    logger.debug(`Registered prompt: ${p.name} from plugin: ${pluginId}`);
  }

  cleanupPluginCapabilities(pluginId: string): void {
    logger.debug(`Cleaning up capabilities for plugin: ${pluginId}`);

    for (const [name, data] of this.tools.entries()) {
      if (data.pluginId === pluginId) {
        this.tools.delete(name);
        logger.debug(`Removed tool: ${name}`);
      }
    }

    for (const [name, data] of this.resources.entries()) {
      if (data.pluginId === pluginId) {
        this.resources.delete(name);
        logger.debug(`Removed resource: ${name}`);
      }
    }

    for (const [name, data] of this.prompts.entries()) {
      if (data.pluginId === pluginId) {
        this.prompts.delete(name);
        logger.debug(`Removed prompt: ${name}`);
      }
    }
  }

  getTools(): RegisteredTool[] {
    return Array.from(this.tools.values()).map((t) => t.tool);
  }

  getResources(): RegisteredResource[] {
    return Array.from(this.resources.values()).map((r) => r.resource);
  }

  getPrompts(): RegisteredPrompt[] {
    return Array.from(this.prompts.values()).map((p) => p.prompt);
  }
}
