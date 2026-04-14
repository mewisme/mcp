import { fileSystemManifest } from './manifest.js';
import { FileSystemPlugin } from './plugin.js';

export const FileSystemPluginDefinition = {
  manifest: fileSystemManifest,
  module: FileSystemPlugin
};
