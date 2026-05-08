// services/audit.js
// services/audit.js
import fs from 'fs';
import path from 'path';

async function log(event, data = {}) {
  const line = JSON.stringify({ event, data, timestamp: new Date().toISOString() });
  
  // Always log to console
  console.log(line);

  // Only write to file if running locally (not on Vercel)
  if (!process.env.VERCEL) {
    try {
      const dir = path.join(process.cwd(), 'data', 'logs');
      if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
      fs.appendFileSync(path.join(dir, 'audit.log'), line + '\n');
    } catch (e) {
      console.warn('Could not write audit log:', e.message);
    }
  }

  return true;
}

export { log };
