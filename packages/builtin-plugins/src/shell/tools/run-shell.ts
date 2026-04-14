import { exec } from 'node:child_process';
import { promisify } from 'node:util';

import type { RegisteredTool, ToolResult } from '@meewmeew/plugin-sdk';

import { validateWorkspaceRoot } from '../../_lib/workspace-guard.js';
import { toolError, toolSuccess } from '../../_lib/tool-result.js';

const execAsync = promisify(exec);

const DEFAULT_TIMEOUT_MS = 120_000;
const MAX_BUFFER = 16 * 1024 * 1024;
const MAX_OUTPUT_CHARS = 512_000;

function truncate(text: string): string {
  if (text.length <= MAX_OUTPUT_CHARS) {
    return text;
  }
  return `${text.slice(0, MAX_OUTPUT_CHARS)}\n\n[Output truncated to ${MAX_OUTPUT_CHARS} characters]`;
}

function formatRunResult(stdout: string, stderr: string, exitCode: number | null): ToolResult {
  const parts: string[] = [];
  if (stdout) {
    parts.push(`--- stdout ---\n${truncate(stdout)}`);
  }
  if (stderr) {
    parts.push(`--- stderr ---\n${truncate(stderr)}`);
  }
  parts.push(`--- exit code: ${exitCode === null || exitCode === undefined ? 'unknown' : String(exitCode)} ---`);
  const text = parts.join('\n\n');
  const base = toolSuccess(text);
  if (exitCode !== 0) {
    return { ...base, isError: true };
  }
  return base;
}

type ExecError = Error & { code?: number; stdout?: string; stderr?: string; killed?: boolean; signal?: string };

export function createRunShellTool(): RegisteredTool {
  return {
    name: 'run_shell',
    description:
      'Execute a shell command on the host. Uses the system shell (cmd on Windows, /bin/sh on Unix). cwd is validated and must not be under blocked OS system directories.',
    inputSchema: {
      type: 'object',
      properties: {
        command: { type: 'string', description: 'Shell command line to run' },
        cwd: {
          type: 'string',
          description: 'Working directory for the command (absolute or resolved path; validated like workspace tools)',
        },
        timeoutMs: {
          type: 'integer',
          description: `Optional timeout in milliseconds (default ${String(DEFAULT_TIMEOUT_MS)}). Process is killed on expiry.`,
        },
      },
      required: ['command', 'cwd'],
    },
    handler: async (args) => {
      const command = String(args.command);
      const cwd = validateWorkspaceRoot(process.env, String(args.cwd));
      const timeoutMs =
        args.timeoutMs !== undefined && args.timeoutMs !== null
          ? Math.max(1, Number(args.timeoutMs))
          : DEFAULT_TIMEOUT_MS;

      try {
        const { stdout, stderr } = await execAsync(command, {
          cwd,
          timeout: timeoutMs,
          maxBuffer: MAX_BUFFER,
          windowsHide: true,
        });
        return formatRunResult(stdout ?? '', stderr ?? '', 0);
      } catch (err: unknown) {
        const e = err as ExecError;
        if (e.killed || e.signal) {
          return toolError(
            `Command timed out or was killed (${e.signal ?? 'signal unknown'}) after ${String(timeoutMs)}ms`,
          );
        }
        if ('stdout' in e || 'stderr' in e) {
          const code = typeof e.code === 'number' ? e.code : 1;
          return formatRunResult(String(e.stdout ?? ''), String(e.stderr ?? ''), code);
        }
        return toolError(e instanceof Error ? e.message : String(err));
      }
    },
  };
}
