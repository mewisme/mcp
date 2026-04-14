import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { createRunJavascriptTool, createRunTypescriptTool } from './tools/index.js';

export class NodeSandboxPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('NodeSandboxPlugin activated');

    context.registerTool(createRunJavascriptTool());
    context.registerTool(createRunTypescriptTool());

    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('NodeSandboxPlugin deactivated');
  }
}
