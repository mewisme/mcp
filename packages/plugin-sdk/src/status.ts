export type PluginStatus =
  | 'unloaded'   // Initial state, not loaded yet
  | 'loaded'     // Resolved by Loader, stored as LoadedPluginModule
  | 'validating' // During validation phase
  | 'validated'  // Validation and Policy Checks passed
  | 'activating' // Currently running activate()
  | 'active'     // activate() succeeded, system fully integrated
  | 'deactivating' // Currently running deactivate()
  | 'error';     // Permanent or recoverable failure state
