import os from 'os';
import { run } from '../utils/shell.js';
import * as config from '../utils/config.js';

console.log(config.PORT);

async function checkNodeVersion() {
  const { stdout } = await run('node -v');
  const version = stdout.trim().replace('v', '');
  const [major] = version.split('.');
  const ok = Number(major) >= 20;
  return {
    id: 'node_version',
    ok,
    current: version,
    required: '>=20',
    impact: ok ? 'none' : 'Hugging Face compatibility may fail',
    fix: ok ? null : 'executor:upgrade_node'
  };
}

async function checkPortConflict(port) {
  const cmd = process.platform === 'win32'
    ? `netstat -ano | findstr :${port}`
    : `lsof -i :${port} -P -n || true`;
  const { stdout } = await run(cmd, { shell: true, ignoreExitCode: true });
  const conflict = stdout.trim().length > 0;
  return {
    id: 'port_conflict',
    ok: !conflict,
    port,
    impact: conflict ? `Port ${port} in use` : 'none',
    fix: conflict ? 'executor:free_port' : null
  };
}

async function checkFirewall() {
  try {
    const { stdout } = await run(
      'curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:5000 || echo 000',
      { shell: true, ignoreExitCode: true }
    );
    const ok = stdout.trim() === '200' || stdout.trim() === '000';
    return {
      id: 'firewall_basic',
      ok,
      impact: ok ? 'none' : 'Local requests blocked',
      fix: ok ? null : 'executor:open_firewall'
    };
  } catch (err) {
    return { id: 'firewall_basic', ok: false, error: err.message, impact: 'Check failed', fix: null };
  }
}

async function checkEnvVars(required = ['HF_TOKEN']) {
  const missing = required.filter(k => !process.env[k]);
  return {
    id: 'env_vars',
    ok: missing.length === 0,
    missing,
    impact: missing.length
      ? 'Model integration will fail without required tokens/config'
      : 'none',
    fix: missing.length ? 'executor:set_env' : null
  };
}

async function checkCPU() {
  const cpus = os.cpus();
  return {
    id: 'cpu_stats',
    ok: true,
    cores: cpus.length,
    model: cpus[0].model,
    speedMHz: cpus[0].speed,
    load: os.loadavg()
  };
}

async function checkMemory() {
  const total = os.totalmem();
  const free = os.freemem();
  return {
    id: 'memory_stats',
    ok: true,
    totalMB: Math.round(total / 1024 / 1024),
    freeMB: Math.round(free / 1024 / 1024),
    usedMB: Math.round((total - free) / 1024 / 1024),
    usagePercent: Math.round(((total - free) / total) * 100)
  };
}

async function checkNetwork() {
  const interfaces = os.networkInterfaces();
  return {
    id: 'network_stats',
    ok: true,
    interfaces
  };
}

// Safe wrapper so one failing check doesn’t kill all
function safe(checkFn, id, ...args) {
  return checkFn(...args).catch(err => ({
    id,
    ok: false,
    error: err.message,
    impact: 'Check failed',
    fix: null
  }));
}

async function runAll({ port = 5000 } = {}) {
  const results = await Promise.all([
    safe(checkNodeVersion, 'node_version'),
    safe(checkPortConflict, 'port_conflict', port),
    safe(checkFirewall, 'firewall_basic'),
    safe(checkEnvVars, 'env_vars'),
    safe(checkCPU, 'cpu_stats'),
    safe(checkMemory, 'memory_stats'),
    safe(checkNetwork, 'network_stats'),
  ]);

  const summary = {
    ok: results.every(r => r.ok),
    issues: results.filter(r => !r.ok),
    timestamp: new Date().toISOString()
  };
  return { summary, results };
}

export { runAll, checkCPU, checkMemory, checkNetwork };
