'use strict';

const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');

/**
 * Load .env files into process.env.
 * - Reads repo root .env then backend/.env (backend wins for duplicate keys).
 * - Uses override: true so values from files win over empty inherited env (e.g. WORLDLABS_API_KEY="").
 * - Strips UTF-8 BOM so the first line parses correctly.
 */
function loadEnvFiles() {
  const paths = [
    path.join(__dirname, '..', '.env'),
    path.join(__dirname, '..', '.env.local'),
    path.join(__dirname, '.env'),
  ];
  const loaded = [];
  for (const envPath of paths) {
    if (!fs.existsSync(envPath)) continue;
    let src = fs.readFileSync(envPath, 'utf8');
    if (src.charCodeAt(0) === 0xfeff) {
      src = src.slice(1);
    }
    const parsed = dotenv.parse(src);
    dotenv.populate(process.env, parsed, { override: true });
    loaded.push(path.relative(path.join(__dirname, '..'), envPath) || path.basename(envPath));
  }
  if (process.env.NODE_ENV !== 'production' && loaded.length) {
    console.log(`[Atlas backend] Loaded env: ${loaded.join(', ')}`);
  }
}

loadEnvFiles();

const express = require('express');
const cors = require('cors');

const interpretRouter = require('./routes/interpret');
const sceneRouter = require('./routes/scene');
const chatRouter = require('./routes/chat');
const assetsRouter = require('./routes/assets');
const worldsRouter = require('./routes/worlds');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/interpret', interpretRouter);
app.use('/api/scene', sceneRouter);
app.use('/api/chat', chatRouter);
app.use('/api/assets', assetsRouter);
app.use('/api/worlds', worldsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: !!process.env.GEMINI_API_KEY,
    aiModel: process.env.GEMINI_MODEL || 'gemini-2.5-flash',
    worldLabsEnabled: !!(
      process.env.WORLDLABS_API_KEY || process.env.WORLDLABS_STEM_API_KEY
    ),
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  const geminiStatus = process.env.GEMINI_API_KEY
    ? `Gemini enabled (${process.env.GEMINI_MODEL || 'gemini-2.5-flash'})`
    : 'Gemini disabled (mock mode)';
  const worldLabsStatus =
    process.env.WORLDLABS_API_KEY || process.env.WORLDLABS_STEM_API_KEY
      ? 'World Labs enabled'
      : 'World Labs disabled';
  console.log(`Atlas backend on http://localhost:${PORT} — ${geminiStatus}, ${worldLabsStatus}`);
});
