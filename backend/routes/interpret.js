'use strict';

const express = require('express');
const router = express.Router();
const { interpretPrompt } = require('../services/llm');

router.post('/', async (req, res) => {
  const { prompt } = req.body;
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required' });
  }
  try {
    const result = await interpretPrompt(prompt.trim());
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Interpretation failed' });
  }
});

module.exports = router;
