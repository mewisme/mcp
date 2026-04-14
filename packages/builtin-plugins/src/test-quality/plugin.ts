import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { createCheckTypesTool, createRunLintTool, createRunTestsTool } from './tools/index.js';

export class TestQualityPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('TestQualityPlugin activated');
    const register = (tool: Parameters<PluginContext['registerTool']>[0]) => context.registerTool(tool);
    register(createRunTestsTool());
    register(createRunLintTool());
    register(createCheckTypesTool());
    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('TestQualityPlugin deactivated');
  }
}
