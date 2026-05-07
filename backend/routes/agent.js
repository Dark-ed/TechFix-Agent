import express from 'express';
import { upgradeNode, openFirewall, setEnv } from '../services/executor.js';
import { rollback } from '../services/snapshot.js';
import { log } from '../services/audit.js';
import { run, pingHost } from '../utils/shell.js';
import { runAll } from '../services/diagnostics.js';

const router = express.Router();
const AGENT_PORT = Number(process.env.PORT || 5000);

// --- PLAN ---
router.post('/plan', async (req, res) => {
  try {
    const { message = '' } = req.body;
    const plan = [];
    const msg = message.toLowerCase();

    if (msg.includes('node')) {
      plan.push({ action: 'upgrade_node', args: {} });
    }
    if (msg.includes('firewall')) {
      plan.push({ action: 'open_firewall', args: { port: AGENT_PORT } });
    }
    if (msg.includes('token')) {
      plan.push({ action: 'set_env', args: { HF_TOKEN: 'PASTE_TOKEN' } });
    }
    if (msg.includes('wifi') || msg.includes('diagnostics')) {
      plan.push({ action: 'diagnostics', args: { port: AGENT_PORT } });
    }

    await log('plan:proposed', { message, plan });

    res.json({
      plan,
      needs_permission: plan.length > 0,
      permission_prompt: plan.length > 0 ? "Do you approve running these actions?" : null
    });
  } catch (e) {
    console.error('[plan] error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- EXECUTE ---
router.post('/execute', async (req, res) => {
  try {
    const { tool, args = {}, permission } = req.body;
    if (!permission) {
      return res.status(403).json({ error: 'Permission required' });
    }

    let result;
    switch (tool) {
      case 'ping':
        result = await pingHost(args.host || '8.8.8.8', args.count || 4);
        break;
      case 'tasklist':
        if (process.platform !== 'win32') {
          result = { error: 'tasklist is Windows-only' };
        } else {
          result = await run('tasklist', { timeoutMs: 5000 });
        }
        break;
      case 'nslookup':
        result = await run(`nslookup ${args.domain || 'example.com'}`, {
          timeoutMs: 8000,
          ignoreExitCode: true
        });
        break;
      case 'upgrade_node':
        result = await upgradeNode();
        break;
      case 'open_firewall':
        result = await openFirewall(args.port || AGENT_PORT);
        break;
      case 'set_env':
        result = await setEnv(args);
        break;
      case 'diagnostics': {
        const port = Number(args.port || AGENT_PORT);
        const { summary, results } = await runAll({ port });
        result = { summary, results };
        break;
      }
      default:
        result = { error: `Unknown tool requested: ${tool}` };
    }

    await log('execute:completed', { tool, args });

    console.log('[execute] tool:', tool, 'args:', args, 'result:', result);
    res.json(result || { error: 'No result returned' });
  } catch (e) {
    console.error('[execute] error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- ROLLBACK ---
router.post('/rollback', async (req, res) => {
  try {
    const { snapshotId } = req.body;
    const result = await rollback(snapshotId);
    await log('rollback:attempt', { snapshotId, result });
    res.json(result || { error: 'No rollback result' });
  } catch (e) {
    console.error('[rollback] error:', e);
    res.status(500).json({ error: e.message });
  }
});

// --- DIAGNOSTICS ---
router.post('/diagnostics', async (req, res) => {
  try {
    const port = Number(req.body.port || AGENT_PORT);
    const { summary, results } = await runAll({ port });
    console.log('[diagnostics] summary:', summary);
    res.json({ summary, results });
  } catch (e) {
    console.error('[diagnostics] error:', e);
    res.status(500).json({ error: e.message });
  }
});

export default router;
