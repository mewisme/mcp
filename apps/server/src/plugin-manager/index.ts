import { PluginSource, PluginContext } from '@meewmeew/plugin-sdk';
import { BUILTIN_PLUGINS } from '@meewmeew/builtin-plugins';
import { PluginLoaderRegistry } from '../plugin-loader/index.js';
import { PluginRegistry } from '../plugin-registry/index.js';
import { ExecutionPolicy } from '../security/policy.js';
import { MCPRuntimeRegistry } from '../mcp-runtime/index.js';
import { PluginRunner, InProcessRunner, HostRunner } from '../plugin-runner/index.js';
import { PluginExecutionError, createConsoleLogger } from '@meewmeew/shared';
import type { PlatformPersistence } from '../persistence/repository.js';
import { ensurePluginInstallation } from '../persistence/plugin-records.js';

const logger = createConsoleLogger('PluginManager');

export class PluginManager {
  private inProcessRunner = new InProcessRunner();
  private hostRunner = new HostRunner();
  /** Maps manifest plugin id -> DB plugin_installations.id when persistence is enabled */
  private installationIds = new Map<string, string>();

  constructor(
    private loaderRegistry: PluginLoaderRegistry,
    private pluginRegistry: PluginRegistry,
    private runtimeRegistry: MCPRuntimeRegistry,
    private executionPolicy: ExecutionPolicy,
    private persistence?: PlatformPersistence,
    private onCapabilitiesChanged?: () => void | Promise<void>,
  ) {}

  async loadPlugin(source: PluginSource): Promise<string> {
    logger.info(`Loading plugin from source: ${source.reference}`);
    const module = await this.loaderRegistry.load(source);

    this.pluginRegistry.register(module.manifest.id, module);

    await this.validatePlugin(module.manifest.id);
    await this.activatePlugin(module.manifest.id);

    return module.manifest.id;
  }

  /**
   * Loads every built-in plugin exported by `@meewmeew/builtin-plugins`.
   *
   * This is the single entry-point for built-in plugin discovery.
   * Bootstrap must call this method instead of enumerating individual plugins.
   * To add a new built-in plugin, register it in `@meewmeew/builtin-plugins` — no
   * change to bootstrap or this method is required.
   */
  async loadAllBuiltinPlugins(): Promise<string[]> {
    const sources: PluginSource[] = BUILTIN_PLUGINS.map((definition) => ({
      type: 'builtin' as const,
      reference: definition.manifest.id,
    }));

    const hostDirectIds = BUILTIN_PLUGINS.filter((d) => d.manifest.executionMode === 'host-direct').map(
      (d) => d.manifest.id,
    );

    if (hostDirectIds.length > 0) {
      this.executionPolicy.allowHostDirectForBuiltins(hostDirectIds);
      logger.info(`Granted host-direct policy to built-in plugin(s): ${hostDirectIds.join(', ')}`);
    }

    logger.info(`Discovered ${sources.length} built-in plugin(s): ${sources.map((s) => s.reference).join(', ')}`);

    const pluginIds = await Promise.all(sources.map((source) => this.loadPlugin(source)));
    return pluginIds;
  }

  async validatePlugin(pluginId: string): Promise<void> {
    this.pluginRegistry.updateStatus(pluginId, 'validating');
    const module = this.pluginRegistry.get(pluginId)!;

    if (this.persistence) {
      try {
        const { installationId } = await ensurePluginInstallation(this.persistence, module);
        this.installationIds.set(pluginId, installationId);
      } catch (e: unknown) {
        const message = e instanceof Error ? e.message : String(e);
        logger.error(`Failed to mirror plugin ${pluginId} to persistence: ${message}`);
        this.pluginRegistry.updateStatus(pluginId, 'error');
        throw e;
      }
    }

    try {
      this.executionPolicy.validate(module.manifest);
      this.pluginRegistry.updateStatus(pluginId, 'validated');
      if (this.persistence) {
        const iid = this.installationIds.get(pluginId);
        if (iid) {
          await this.persistence.pluginInstallations.updateStatus(iid, 'validated');
        }
      }
      logger.info(`Plugin ${pluginId} validated successfully.`);
    } catch (e: unknown) {
      this.pluginRegistry.updateStatus(pluginId, 'error');
      const message = e instanceof Error ? e.message : String(e);
      logger.error(`Plugin ${pluginId} validation failed: ${message}`);
      await this.recordActivationFailure(pluginId, message);
      throw e;
    }
  }

  async activatePlugin(pluginId: string): Promise<void> {
    this.pluginRegistry.updateStatus(pluginId, 'activating');
    const module = this.pluginRegistry.get(pluginId)!;

    try {
      const runner = this.getRunnerForMode(module.manifest.executionMode);
      const context = this.createPluginContext(pluginId);

      await runner.execute((ctx) => module.contract.activate(ctx), context);

      this.pluginRegistry.updateStatus(pluginId, 'active');
      if (this.persistence) {
        const iid = this.installationIds.get(pluginId);
        if (iid) {
          await this.persistence.pluginInstallations.updateStatus(iid, 'active');
          await this.persistence.pluginInstallations.setEnabled(iid, true);
        }
      }
      logger.info(`Plugin ${pluginId} activated successfully.`);
      await this.emitCapabilitiesChanged();
    } catch (e: unknown) {
      this.pluginRegistry.updateStatus(pluginId, 'error');
      this.runtimeRegistry.cleanupPluginCapabilities(pluginId);
      const message = e instanceof Error ? e.message : String(e);
      logger.error(`Plugin ${pluginId} activation failed: ${message}`);
      await this.recordActivationFailure(pluginId, message);
      throw new PluginExecutionError(`Activation failed: ${message}`);
    }
  }

  async deactivatePlugin(pluginId: string): Promise<void> {
    this.pluginRegistry.updateStatus(pluginId, 'deactivating');
    const module = this.pluginRegistry.get(pluginId)!;

    try {
      const runner = this.getRunnerForMode(module.manifest.executionMode);
      const context = this.createPluginContext(pluginId);

      await runner.execute((ctx) => module.contract.deactivate(ctx), context);

      this.runtimeRegistry.cleanupPluginCapabilities(pluginId);
      this.pluginRegistry.updateStatus(pluginId, 'loaded');
      if (this.persistence) {
        const iid = this.installationIds.get(pluginId);
        if (iid) {
          await this.persistence.pluginInstallations.setEnabled(iid, false);
          await this.persistence.pluginInstallations.updateStatus(iid, 'inactive');
        }
      }
      logger.info(`Plugin ${pluginId} deactivated successfully.`);
      await this.emitCapabilitiesChanged();
    } catch (e: unknown) {
      this.pluginRegistry.updateStatus(pluginId, 'error');
      const message = e instanceof Error ? e.message : String(e);
      logger.error(`Plugin ${pluginId} deactivation failed: ${message}`);
      throw new PluginExecutionError(`Deactivation failed: ${message}`);
    }
  }

  private async recordActivationFailure(pluginId: string, message: string): Promise<void> {
    if (!this.persistence) return;
    const iid = this.installationIds.get(pluginId);
    if (iid) {
      await this.persistence.pluginInstallations.updateStatus(iid, 'error', message);
      await this.persistence.pluginAuditLogs.create({
        pluginInstallationId: iid,
        eventType: 'plugin_activation_failed',
        payloadJson: { message, pluginId },
        actor: 'server',
      });
    }
  }

  private async emitCapabilitiesChanged(): Promise<void> {
    if (this.onCapabilitiesChanged) {
      await this.onCapabilitiesChanged();
    }
  }

  private getRunnerForMode(mode?: string): PluginRunner {
    if (mode === 'host-direct') {
      return this.hostRunner;
    }
    return this.inProcessRunner;
  }

  private createPluginContext(pluginId: string): PluginContext {
    const module = this.pluginRegistry.get(pluginId)!;
    const prefix = module.manifest.toolPrefix;

    return {
      pluginId,
      logger: createConsoleLogger(`Plugin[${pluginId}]`),
      registerTool: (tool) => this.runtimeRegistry.registerTool(pluginId, tool, prefix),
      registerResource: (resource) => this.runtimeRegistry.registerResource(pluginId, resource, prefix),
      registerPrompt: (prompt) => this.runtimeRegistry.registerPrompt(pluginId, prompt, prefix),
    };
  }
}
