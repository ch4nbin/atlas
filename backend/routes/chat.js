'use strict';

const express = require('express');
const router = express.Router();
const { generateChatResponse } = require('../services/llm');

router.post('/', async (req, res) => {
  const { sceneGraph, focusedElement, question, experimentState, history } = req.body;
  if (!question || typeof question !== 'string') {
    return res.status(400).json({ error: 'question (string) is required' });
  }

  const sanitizedHistory = Array.isArray(history)
    ? history
        .filter((m) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
        .map((m) => ({ role: m.role, content: m.content }))
    : [];

  try {
    const response = await generateChatResponse(sceneGraph || null, focusedElement || null, question.trim(), {
      experimentState: experimentState || null,
      history: sanitizedHistory,
    });
    res.json({ response });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err?.message || 'Chat response failed' });
  }
});

module.exports = router;
