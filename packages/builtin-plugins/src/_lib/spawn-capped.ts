import { spawn } from 'child_process';

export interface SpawnCappedResult {
  code: number | null;
  stdout: string;
  stderr: string;
  truncated: boolean;
}

/**
 * Runs a command with argv only (no shell), capturing stdout/stderr up to maxBytes total.
 */
export function spawnCapped(
  command: string,
  args: string[],
  options: { cwd: string; maxBytes: number },
): Promise<SpawnCappedResult> {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: options.cwd,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
    });

    let out = '';
    let err = '';
    let truncated = false;
    const max = options.maxBytes;

    const append = (chunk: Buffer, which: 'out' | 'err') => {
      if (truncated) return;
      const s = chunk.toString('utf8');
      const combined = out.length + err.length + s.length;
      if (combined > max) {
        const take = Math.max(0, max - (out.length + err.length));
        const slice = s.slice(0, take);
        if (which === 'out') out += slice;
        else err += slice;
        truncated = true;
        child.kill('SIGTERM');
        return;
      }
      if (which === 'out') out += s;
      else err += s;
    };

    child.stdout?.on('data', (c: Buffer) => append(c, 'out'));
    child.stderr?.on('data', (c: Buffer) => append(c, 'err'));

    child.on('error', reject);
    child.on('close', (code) => {
      resolve({ code, stdout: out, stderr: err, truncated });
    });
  });
}
