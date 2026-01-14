// services/executor.js
import { run } from '../utils/shell.js';
import * as snapshot from './snapshot.js';
import * as audit from './audit.js';
import fs from 'fs';
import path from 'path';

async function upgradeNode() {
  const snapId = await snapshot.capture('node_upgrade', { files: [], note: 'Pre Node upgrade' });
  const plan = {
    steps: [
      'Install Node 20 via nvm or official installer',
      'Set default to Node 20',
      'Verify node -v'
    ],
    commands: process.platform === 'win32'
      ? ['winget install OpenJS.NodeJS.LTS', 'refreshenv', 'node -v']
      : ['bash -lc "source ~/.nvm/nvm.sh && nvm install 20 && nvm alias default 20"', 'node -v']
  };
  await audit.log('executor:upgrade_node', { snapId, plan, dryRun: true });
  return { snapId, plan, requiresManualConfirm: true };
}

async function freePort(port) {
  const snapId = await snapshot.capture('port_free', { note: `Attempt free port ${port}` });
  const cmd = process.platform === 'win32'
    ? `for /f "tokens=5" %a in ('netstat -ano ^| findstr :${port}') do taskkill /PID %a /F`
    : `lsof -ti :${port} | xargs -r kill -9`;
  await audit.log('executor:free_port', { snapId, port, cmd });
  const res = await run(cmd, { shell: true });
  return { snapId, port, output: res.stdout };
}

async function openFirewall(port = 5000) {
  const snapId = await snapshot.capture('firewall_open', { note: `Open firewall for port ${port}` });
  const cmd = process.platform === 'win32'
    ? `powershell -Command "New-NetFirewallRule -DisplayName 'AgentPort${port}' -Direction Inbound -Action Allow -Protocol TCP -LocalPort ${port}"`
    : `sudo ufw allow ${port}/tcp`;
  await audit.log('executor:open_firewall', { snapId, port, cmd });
  const res = await run(cmd, { shell: true });
  return { snapId, port, output: res.stdout || res.stderr };
}

async function setEnv(updates = {}) {
  const snapId = await snapshot.capture('env_update', { note: 'Set missing env vars', data: Object.keys(updates) });
  const envPath = path.join(process.cwd(), '.env');
  const existing = fs.existsSync(envPath) ? fs.readFileSync(envPath, 'utf8') : '';
  const lines = existing.split('\n').filter(Boolean);
  const kv = Object.fromEntries(lines.map(l => l.split('=')));
  for (const [k, v] of Object.entries(updates)) {
    if (!kv[k]) kv[k] = v;
  }
  const rendered = Object.entries(kv).map(([k, v]) => `${k}=${v}`).join('\n');
  fs.writeFileSync(envPath, rendered);
  await audit.log('executor:set_env', { snapId, updated: Object.keys(updates) });
  return { snapId, updated: Object.keys(updates) };
}

export { upgradeNode, freePort, openFirewall, setEnv };
