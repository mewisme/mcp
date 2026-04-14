import * as path from 'path';
import { isPathUnderForbiddenSystemPath } from '@meewmeew/shared';

function isPathWithinRoot(candidate: string, root: string): boolean {
  const resolvedRoot = path.resolve(root);
  const resolvedCandidate = path.resolve(candidate);
  const rel = path.relative(resolvedRoot, resolvedCandidate);
  return rel === '' || (!rel.startsWith('..') && !path.isAbsolute(rel));
}

/**
 * Resolves and validates that `workspaceRoot` is not under a blocked system directory.
 * All other directories are allowed.
 */
export function validateWorkspaceRoot(_env: NodeJS.ProcessEnv, workspaceRoot: string): string {
  const absolute = path.resolve(workspaceRoot);
  if (isPathUnderForbiddenSystemPath(absolute)) {
    throw new Error('Access denied: workspace is a protected system directory');
  }
  return absolute;
}

/**
 * Resolves `relativePath` against `workspaceRoot` and ensures the result stays under the workspace.
 */
export function resolvePathWithinWorkspace(workspaceRoot: string, relativePath: string): string {
  const base = path.resolve(workspaceRoot);
  const resolved = path.resolve(base, relativePath);
  if (!isPathWithinRoot(resolved, base)) {
    throw new Error(`Access denied: path escapes workspace: ${relativePath}`);
  }
  return resolved;
}
