// services/audit.js
import fs from 'fs';
import path from 'path';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function log(event, data = {}) {
  const dir = path.join(process.cwd(), 'data', 'logs');
  ensureDir(dir);
  const line = JSON.stringify({ event, data, timestamp: new Date().toISOString() }) + '\n';
  fs.appendFileSync(path.join(dir, 'audit.log'), line);
  return true;
}

export { log };   // ✅ ESM named export
