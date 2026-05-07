// utils/shell.js
import { spawn } from 'child_process';

export function run(command, opts = {}) {
  const { ignoreExitCode = false, timeoutMs } = opts;
  return new Promise((resolve, reject) => {
    const proc = spawn(command, { shell: true });
    let stdout = '', stderr = '';
    let timedOut = false;

    if (timeoutMs) {
      const t = setTimeout(() => {
        timedOut = true;
        proc.kill('SIGTERM');
        reject(new Error(`Command timed out after ${timeoutMs}ms: ${command}`));
      }, timeoutMs);
      proc.on('close', () => clearTimeout(t));
    }

    proc.stdout.on('data', d => stdout += d.toString());
    proc.stderr.on('data', d => stderr += d.toString());
    proc.on('error', err => reject(err));
    proc.on('close', code => {
      if (timedOut) return;
      if (code === 0 || ignoreExitCode) resolve({ code, stdout, stderr });
      else reject(new Error(`Command failed (${code}): ${stderr || stdout}`));
    });
  });
}

// Optional helpers
export function pingHost(host, count = 4) {
  const cmd = process.platform === 'win32'
    ? `ping -n ${count} ${host}`
    : `ping -c ${count} ${host}`;
  return run(cmd, { timeoutMs: 8000 });
}
