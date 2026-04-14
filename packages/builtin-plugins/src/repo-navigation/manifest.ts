import { PluginManifest } from '@meewmeew/plugin-sdk';

export const repoNavigationManifest: PluginManifest = {
  id: 'builtin-repo-navigation',
  name: 'Repo navigation',
  version: '1.0.0',
  toolPrefix: 'repo',
  description:
    'Read-only Git and search tools. Workspace must not be a blocked system directory. Uses git grep or ripgrep when available.',
  executionMode: 'host-direct',
  permissions: ['repo.read', 'repo.search'],
};
