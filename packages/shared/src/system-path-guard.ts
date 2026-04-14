import * as os from 'os';
import * as path from 'path';

/**
 * Normalized absolute path prefixes that are blocked for filesystem and workspace tools.
 * Matches prior FileSystemPathGuard behavior: OS-specific system locations only.
 */
export function getForbiddenSystemPathPrefixes(): string[] {
  const platform = os.platform();
  if (platform === 'win32') {
    const systemRoot = process.env.SystemRoot || 'C:\\Windows';
    const programFiles = process.env.ProgramFiles || 'C:\\Program Files';
    const programFilesX86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
    const programData = process.env.ProgramData || 'C:\\ProgramData';

    return [
      path.normalize(systemRoot).toLowerCase(),
      path.normalize(programFiles).toLowerCase(),
      path.normalize(programFilesX86).toLowerCase(),
      path.normalize(programData).toLowerCase(),
    ];
  }

  return ['/etc', '/bin', '/sbin', '/usr', '/boot', '/dev', '/proc', '/sys', '/var/run'].map((p) =>
    path.normalize(p).toLowerCase(),
  );
}

/**
 * Returns true if `resolvedAbsolutePath` lies on or under a forbidden system prefix.
 */
export function isPathUnderForbiddenSystemPath(resolvedAbsolutePath: string): boolean {
  const normalized = path.normalize(path.resolve(resolvedAbsolutePath));
  const key = normalized.toLowerCase();
  const sep = path.sep;
  for (const forbidden of getForbiddenSystemPathPrefixes()) {
    if (key === forbidden || key.startsWith(forbidden + sep)) {
      return true;
    }
  }
  return false;
}
