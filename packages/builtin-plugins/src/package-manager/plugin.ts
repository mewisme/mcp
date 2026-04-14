import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { createDetectPackageManagerTool, createLockfilePresenceTool } from './tools/index.js';

export class PackageManagerPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('PackageManagerPlugin activated');
    const register = (tool: Parameters<PluginContext['registerTool']>[0]) => context.registerTool(tool);
    register(createDetectPackageManagerTool());
    register(createLockfilePresenceTool());
    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('PackageManagerPlugin deactivated');
  }
}
