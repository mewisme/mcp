/** Default glob exclude patterns for heavy / non-text trees (Node glob `exclude`). */
export const DEFAULT_GLOB_EXCLUDES = [
  '**/node_modules/**',
  '**/.git/**',
  '**/dist/**',
  '**/.next/**',
  '**/build/**',
  '**/.turbo/**',
  '**/coverage/**'
] as const;
