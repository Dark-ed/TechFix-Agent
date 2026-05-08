// utils/shell.js
// utils/shell.js
import { spawn } from 'child_process';

export function run(command, opts = {}) {
  // Block system commands on Vercel
  if (process.env.VERCEL) {
    return Promise.resolve({
      code: 0,
      stdout: '⚠️ System commands are not available on the cloud version. Please run locally for full functionality.',
      stderr: ''
    });
  }

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

export function pingHost(host, count = 4) {
  // Use HTTP check on Vercel instead of ping
  if (process.env.VERCEL) {
    return Promise.resolve({
      code: 0,
      stdout: '⚠️ Ping is not available on cloud. Please run locally for network diagnostics.',
      stderr: ''
    });
  }

  const cmd = process.platform === 'win32'
    ? `ping -n ${count} ${host}`
    : `ping -c ${count} ${host}`;
  return run(cmd, { timeoutMs: 8000 });
}
