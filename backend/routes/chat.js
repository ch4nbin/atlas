'use strict';

const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../services/llm');

router.post('/', async (req, res) => {
  const { sceneGraph, focusedElement, question } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question (string) is required' });
  }
  try {
    const response = await generateChatResponse(sceneGraph || null, focusedElement || null, question.trim());
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Chat response failed' });
  }
});

module.exports = router;
