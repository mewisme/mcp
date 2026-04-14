import { PluginManifest } from '@meewmeew/plugin-sdk';
import { SecurityPolicyError } from '@meewmeew/shared';

export class ExecutionPolicy {
  // Explicit allowlist of plugin IDs approved for host-direct execution.
  private allowedHostPlugins = new Set<string>();

  /**
   * Grant a single plugin explicit host-direct execution rights.
   * Use this for externally-sourced plugins that require manual approval.
   */
  allowHostDirectExecution(pluginId: string): void {
    this.allowedHostPlugins.add(pluginId);
  }

  /**
   * Grant host-direct execution rights to a set of built-in plugin IDs.
   *
   * Built-in plugins ship alongside the server binary and are trusted at the
   * platform level. The plugin manager calls this automatically when loading
   * the built-in source, so bootstrap never needs to enumerate plugin IDs.
   */
  allowHostDirectForBuiltins(pluginIds: string[]): void {
    for (const id of pluginIds) {
      this.allowedHostPlugins.add(id);
    }
  }

  validate(manifest: PluginManifest): void {
    if (manifest.executionMode === 'host-direct') {
      if (!this.allowedHostPlugins.has(manifest.id)) {
        throw new SecurityPolicyError(
          `Plugin ${manifest.id} requested host-direct execution but it is not allowed by policy.`
        );
      }
    }
  }
}
