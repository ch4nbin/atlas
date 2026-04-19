'use strict';

const express = require('express');
const router = express.Router();
const { synthesizeSpeech } = require('../services/llm');

router.post('/', async (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.status(400).json({ error: 'text (string) is required' });
  }

  const audioBase64 = await synthesizeSpeech(text.trim());
  if (!audioBase64) {
    return res.status(503).json({ error: 'TTS unavailable: ELEVENLABS_API_KEY or ELEVENLABS_VOICE_ID not configured' });
  }

  res.json({ audioBase64 });
});

module.exports = router;
