import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { createRunShellTool } from './tools/index.js';

export class ShellPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('ShellPlugin activated');
    context.registerTool(createRunShellTool());
    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('ShellPlugin deactivated');
  }
}
