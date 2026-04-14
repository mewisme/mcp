import * as fs from 'fs/promises';
import type { FileSystemPathGuard } from '../path-guard.js';

export type FindReplaceResult =
  | { ok: true }
  | { ok: false; message: string };

export async function applyFindReplace(
  guard: FileSystemPathGuard,
  basePath: string,
  relPath: string,
  target: string,
  replacement: string,
  replaceAll: boolean
): Promise<FindReplaceResult> {
  const fullPath = await guard.validatePath(basePath, relPath);
  const content = await fs.readFile(fullPath, 'utf-8');
  if (!content.includes(target)) {
    return { ok: false, message: `Search text not found in ${relPath}` };
  }
  const newContent = replaceAll
    ? content.split(target).join(replacement)
    : content.replace(target, replacement);
  await fs.writeFile(fullPath, newContent);
  return { ok: true };
}
