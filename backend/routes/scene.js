'use strict';

const express = require('express');
const router = express.Router();
const { generateSceneGraph } = require('../services/llm');

router.post('/', async (req, res) => {
  const { interpretation, prompt } = req.body;
  if (!interpretation) {
    return res.status(400).json({ error: 'interpretation is required' });
  }
  try {
    const sceneGraph = await generateSceneGraph(interpretation, prompt || '');
    res.json(sceneGraph);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Scene generation failed' });
  }
});

module.exports = router;
