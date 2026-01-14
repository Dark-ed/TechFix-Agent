import fs from 'fs';
import path from 'path';

function ensureDir(p) {
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
}

async function capture(kind, meta = {}) {
  const id = `${kind}-${Date.now()}`;
  const dir = path.join(process.cwd(), 'data', 'snapshots', id);
  ensureDir(dir);
  const payload = { id, kind, meta, timestamp: new Date().toISOString() };
  fs.writeFileSync(path.join(dir, 'snapshot.json'), JSON.stringify(payload, null, 2));
  return id;
}

async function rollback(id) {
  const dir = path.join(process.cwd(), 'data', 'snapshots', id);
  if (!fs.existsSync(dir)) throw new Error(`Snapshot not found: ${id}`);
  // Implement concrete rollback routines per kind; for now, just return payload
  const payload = JSON.parse(fs.readFileSync(path.join(dir, 'snapshot.json'), 'utf8'));
  return { restored: true, payload };
}

export { capture, rollback };
