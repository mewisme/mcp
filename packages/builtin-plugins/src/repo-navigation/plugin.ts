import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import {
  createGitDiffTool,
  createGitLogTool,
  createGrepContentTool,
  createGitStatusTool,
} from './tools/index.js';

export class RepoNavigationPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('RepoNavigationPlugin activated');
    const register = (tool: Parameters<PluginContext['registerTool']>[0]) => context.registerTool(tool);
    register(createGitStatusTool());
    register(createGitDiffTool());
    register(createGitLogTool());
    register(createGrepContentTool());
    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('RepoNavigationPlugin deactivated');
  }
}
