import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';

import agentRoutes from './routes/agent.js';

dotenv.config();
const app = express();

// Allow only your frontend origin
app.use(cors({
  origin: "http://127.0.0.1:5500"
}));

app.use(express.json());

app.get('/', (req, res) => {
  res.send('TechFix backend is running ');
});

app.use('/agent', agentRoutes);

app.get('/health', (_, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Backend agent running on http://127.0.0.1:${PORT}`);
});
const path = require('path');

// Add this line — point it to wherever your HTML files are
app.use(express.static(path.join(__dirname, 'frontend')));

// Add this so your index.html loads on the root URL
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'frontend', 'index.html'));
});