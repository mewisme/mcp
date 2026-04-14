import { PluginContract, PluginContext, PluginActivationResult } from '@meewmeew/plugin-sdk';
import { FileSystemPathGuard } from './path-guard.js';
import {
  createAppendFileTool,
  createCreateDirectoryTool,
  createDeleteFileTool,
  createDirectoryTreeTool,
  createEditFileTool,
  createGetFileInfoTool,
  createGlobFilesTool,
  createGrepContentTool,
  createListAllowedDirectoriesTool,
  createListDirectoryTool,
  createListDirectoryWithSizesTool,
  createMoveFileTool,
  createReadMediaFileTool,
  createReadMultipleFilesTool,
  createReadTextFileTool,
  createRemoveDirectoryTool,
  createReplaceContentTool,
  createSearchFilesTool,
  createWriteFileTool
} from './tools/index.js';

export class FileSystemPlugin implements PluginContract {
  async activate(context: PluginContext): Promise<PluginActivationResult> {
    context.logger.info('FileSystemPlugin activated');

    const guard = new FileSystemPathGuard();
    const register = (tool: Parameters<PluginContext['registerTool']>[0]) => context.registerTool(tool);

    register(createReadTextFileTool(guard));
    register(createReadMediaFileTool(guard));
    register(createReadMultipleFilesTool(guard));
    register(createListDirectoryTool(guard));
    register(createListDirectoryWithSizesTool(guard));
    register(createDirectoryTreeTool(guard));
    register(createSearchFilesTool(guard));
    register(createGlobFilesTool(guard));
    register(createGrepContentTool(guard));
    register(createGetFileInfoTool(guard));
    register(createListAllowedDirectoriesTool(guard));
    register(createCreateDirectoryTool(guard));
    register(createWriteFileTool(guard));
    register(createEditFileTool(guard));
    register(createReplaceContentTool(guard));
    register(createAppendFileTool(guard));
    register(createMoveFileTool(guard));
    register(createDeleteFileTool(guard));
    register(createRemoveDirectoryTool(guard));

    return { metadata: { activatedAt: Date.now() } };
  }

  async deactivate(context: PluginContext): Promise<void> {
    context.logger.info('FileSystemPlugin deactivated');
  }
}
