import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { createHttpFetchTool } from './tools/index.js';

export class HttpFetchPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('HttpFetchPlugin activated');
    context.registerTool(createHttpFetchTool());
    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('HttpFetchPlugin deactivated');
  }
}
