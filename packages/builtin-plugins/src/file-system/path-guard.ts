import * as path from 'path';
import { getForbiddenSystemPathPrefixes, isPathUnderForbiddenSystemPath } from '@meewmeew/shared';

/**
 * Validates paths: any non-system path is allowed; common OS system directories are blocked.
 */
export class FileSystemPathGuard {
  constructor() {}

  getForbiddenPaths(): readonly string[] {
    return getForbiddenSystemPathPrefixes();
  }

  private ensureBasePathIsAllowed(basePath: string): string {
    const absoluteBase = path.resolve(basePath);
    if (isPathUnderForbiddenSystemPath(absoluteBase)) {
      throw new Error(`Access denied: base path is a protected system directory`);
    }
    return absoluteBase;
  }

  async validatePath(basePath: string, targetPath: string): Promise<string> {
    const absoluteBase = this.ensureBasePathIsAllowed(basePath);
    const resolvedTarget = path.resolve(absoluteBase, targetPath);

    if (!resolvedTarget.toLowerCase().startsWith(absoluteBase.toLowerCase())) {
      throw new Error(`Access denied: Path ${targetPath} is outside of base path ${basePath}`);
    }

    if (isPathUnderForbiddenSystemPath(resolvedTarget)) {
      throw new Error(`Access denied: Path ${targetPath} is a protected system directory`);
    }

    return resolvedTarget;
  }
}
