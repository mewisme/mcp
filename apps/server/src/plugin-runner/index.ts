import { PluginContext } from '@meewmeew/plugin-sdk';

export interface PluginRunner {
  execute<T>(fn: (context: PluginContext) => Promise<T>, context: PluginContext): Promise<T>;
}

/**
 * Runs plugin lifecycle hooks in the same process as the server.
 * This is not OS-level isolation; use host-direct only with policy, and treat plugin code as trusted.
 */
export class InProcessRunner implements PluginRunner {
  async execute<T>(fn: (context: PluginContext) => Promise<T>, context: PluginContext): Promise<T> {
    try {
      context.logger.debug(`[InProcessRunner] Executing plugin hook in-process`);
      return await fn(context);
    } catch (e) {
      context.logger.error(`[InProcessRunner] Execution failed`);
      throw e;
    }
  }
}

/** @deprecated Use {@link InProcessRunner}. */
export const SandboxRunner = InProcessRunner;

export class HostRunner implements PluginRunner {
  async execute<T>(fn: (context: PluginContext) => Promise<T>, context: PluginContext): Promise<T> {
    context.logger.debug(`[HostRunner] Executing with host-direct privileges`);
    return await fn(context);
  }
}
