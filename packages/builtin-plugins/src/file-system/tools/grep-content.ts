import type { RegisteredTool } from '@meewmeew/plugin-sdk';
import * as fs from 'fs/promises';
import { createReadStream } from 'fs';
import { glob } from 'node:fs/promises';
import * as readline from 'readline';
import * as path from 'path';
import type { FileSystemPathGuard } from '../path-guard.js';
import { DEFAULT_GLOB_EXCLUDES } from './defaults.js';
import { toolError, toolSuccess } from './helpers.js';

const BINARY_PROBE = 8192;
const DEFAULT_MAX_FILE_BYTES = 512 * 1024;
const DEFAULT_MAX_MATCHES = 200;
const MAX_LINE_DISPLAY = 2000;

async function isProbablyBinary(filePath: string): Promise<boolean> {
  const fh = await fs.open(filePath, 'r');
  try {
    const buf = Buffer.alloc(BINARY_PROBE);
    const { bytesRead } = await fh.read(buf, 0, BINARY_PROBE, 0);
    const slice = buf.subarray(0, bytesRead);
    return slice.includes(0);
  } finally {
    await fh.close();
  }
}

export function createGrepContentTool(guard: FileSystemPathGuard): RegisteredTool {
  return {
    name: 'grep',
    description:
      'Search file contents under a directory (ripgrep-like). Returns path:line: text for each match. Skips large and binary files by default; excludes node_modules, .git, etc. Use for code/text search before reading whole files.',
    inputSchema: {
      type: 'object',
      properties: {
        basePath: { type: 'string' },
        path: { type: 'string', description: 'Subdirectory relative to basePath to search (use "." for entire base)' },
        pattern: { type: 'string', description: 'Literal substring to find, unless isRegex is true' },
        isRegex: {
          type: 'boolean',
          description: 'If true, pattern is a JavaScript regex (use with care; invalid regex returns an error)',
          default: false
        },
        caseInsensitive: { type: 'boolean', default: false },
        maxMatches: { type: 'integer', description: 'Stop after this many matches total (default 200)', default: 200 },
        maxFileBytes: {
          type: 'integer',
          description: 'Skip files larger than this (default 524288)',
          default: DEFAULT_MAX_FILE_BYTES
        },
        excludePatterns: {
          type: 'array',
          items: { type: 'string' },
          description: 'Extra glob exclude patterns (defaults already skip common junk dirs)'
        },
        fileGlob: {
          type: 'string',
          description: 'Optional filter: only search files matching this glob under path (e.g. "**/*.{ts,tsx}")'
        }
      },
      required: ['basePath', 'path', 'pattern']
    },
    handler: async (args) => {
      try {
        const cwd = await guard.validatePath(String(args.basePath), String(args.path));
        const baseAbs = path.resolve(String(args.basePath));
        const rawPattern = String(args.pattern);
        const isRegex = Boolean(args.isRegex);
        const caseInsensitive = Boolean(args.caseInsensitive);
        const maxMatches = Math.min(Math.max(Number(args.maxMatches) || DEFAULT_MAX_MATCHES, 1), 10_000);
        const maxFileBytes = Math.min(Math.max(Number(args.maxFileBytes) || DEFAULT_MAX_FILE_BYTES, 1024), 10 * 1024 * 1024);
        const extraExcludes = (args.excludePatterns as string[] | undefined) ?? [];
        const exclude = [...DEFAULT_GLOB_EXCLUDES, ...extraExcludes];
        const fileGlob = args.fileGlob ? String(args.fileGlob) : '**/*';

        let matcher: (line: string) => boolean;
        if (isRegex) {
          let re: RegExp;
          try {
            re = new RegExp(rawPattern, caseInsensitive ? 'i' : undefined);
          } catch {
            return toolError('Invalid regular expression in pattern');
          }
          matcher = (line: string) => re.test(line);
        } else {
          const needle = caseInsensitive ? rawPattern.toLowerCase() : rawPattern;
          matcher = (line: string) =>
            caseInsensitive ? line.toLowerCase().includes(needle) : line.includes(rawPattern);
        }

        const linesOut: string[] = [];
        let matchCount = 0;

        fileLoop: for await (const rel of glob(fileGlob, { cwd, exclude })) {
          if (matchCount >= maxMatches) break;
          const full = path.join(cwd, rel);
          const relToBase = path.relative(baseAbs, path.resolve(full));
          if (relToBase.startsWith('..') || path.isAbsolute(relToBase)) {
            continue;
          }
          await guard.validatePath(String(args.basePath), relToBase.split(path.sep).join('/'));

          let st;
          try {
            st = await fs.stat(full);
          } catch {
            continue;
          }
          if (!st.isFile() || st.size > maxFileBytes) {
            continue;
          }

          if (await isProbablyBinary(full)) {
            continue;
          }

          const stream = createReadStream(full, { encoding: 'utf8' });
          const rl = readline.createInterface({ input: stream, crlfDelay: Infinity });
          let lineNum = 0;
          for await (const line of rl) {
            lineNum++;
            if (matcher(line)) {
              const display =
                line.length > MAX_LINE_DISPLAY ? `${line.slice(0, MAX_LINE_DISPLAY)}…` : line;
              const relPosix = rel.split(path.sep).join('/');
              linesOut.push(`${relPosix}:${lineNum}:${display}`);
              matchCount++;
              if (matchCount >= maxMatches) {
                break fileLoop;
              }
            }
          }
        }

        if (linesOut.length === 0) {
          return toolSuccess('No matches found.');
        }
        const header = `Matches (${linesOut.length}${matchCount >= maxMatches ? `, capped at ${maxMatches}` : ''}):`;
        return toolSuccess([header, ...linesOut].join('\n'));
      } catch (err: unknown) {
        return toolError(err instanceof Error ? err.message : String(err));
      }
    }
  };
}
