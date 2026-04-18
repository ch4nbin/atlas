'use strict';

require('dotenv').config();

const express = require('express');
const cors = require('cors');

const interpretRouter = require('./routes/interpret');
const sceneRouter = require('./routes/scene');
const chatRouter = require('./routes/chat');
const assetsRouter = require('./routes/assets');

const app = express();
const PORT = process.env.PORT || 3001;
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(express.json({ limit: '1mb' }));

app.use('/api/interpret', interpretRouter);
app.use('/api/scene', sceneRouter);
app.use('/api/chat', chatRouter);
app.use('/api/assets', assetsRouter);

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    aiEnabled: !!process.env.OPENAI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

app.listen(PORT, () => {
  const aiStatus = process.env.OPENAI_API_KEY ? 'OpenAI enabled' : 'Mock mode (no API key)';
  console.log(`Atlas backend on http://localhost:${PORT} — ${aiStatus}`);
});
