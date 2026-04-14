import { spawn } from 'child_process';
import * as fs from 'fs/promises';
import * as path from 'path';
import * as os from 'os';
import type { ToolResult } from '@meewmeew/plugin-sdk';
import { toolError, toolSuccess } from './helpers.js';

const DEFAULT_TIMEOUT_MS = 60_000;

function spawnAsync(
  command: string,
  args: string[],
  options: { cwd?: string; timeoutMs?: number },
): Promise<{ stdout: string; stderr: string; code: number | null }> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      shell: false,
      windowsHide: true,
    });
    let stdout = '';
    let stderr = '';
    child.stdout?.on('data', (d: Buffer) => {
      stdout += d.toString();
    });
    child.stderr?.on('data', (d: Buffer) => {
      stderr += d.toString();
    });
    const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    const timer = setTimeout(() => {
      child.kill('SIGTERM');
      reject(new Error(`Execution timed out after ${timeoutMs}ms`));
    }, timeoutMs);
    child.on('error', (err) => {
      clearTimeout(timer);
      reject(err);
    });
    child.on('close', (code) => {
      clearTimeout(timer);
      resolve({ stdout, stderr, code });
    });
  });
}

export async function runInTempFile(
  tmpPrefix: string,
  fileName: string,
  code: string,
  runMode: 'javascript' | 'typescript',
): Promise<ToolResult> {
  try {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), tmpPrefix));
    const filePath = path.join(tmpDir, fileName);
    await fs.writeFile(filePath, code);

    try {
      const cwd = process.cwd();
      let result: { stdout: string; stderr: string; code: number | null };
      if (runMode === 'javascript') {
        result = await spawnAsync(process.execPath, [filePath], { cwd, timeoutMs: DEFAULT_TIMEOUT_MS });
      } else {
        result = await spawnAsync(process.execPath, ['--import', 'tsx', filePath], {
          cwd,
          timeoutMs: DEFAULT_TIMEOUT_MS,
        });
      }

      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});

      const output = result.stdout || result.stderr;
      if (result.code !== 0) {
        return toolError(
          `Execution failed (exit ${result.code}): ${output || result.stderr || 'no output'}`,
        );
      }
      return toolSuccess(output || 'Code executed successfully with no output.');
    } catch (err: unknown) {
      await fs.rm(tmpDir, { recursive: true, force: true }).catch(() => {});
      const e = err as { message?: string; stdout?: string; stderr?: string };
      return toolError(`Execution failed: ${e.message ?? err}\n${e.stdout ?? ''}\n${e.stderr ?? ''}`);
    }
  } catch (err: unknown) {
    return toolError(`Failed to setup execution environment: ${err instanceof Error ? err.message : String(err)}`);
  }
}
