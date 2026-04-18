'use strict';

const express = require('express');
const router = express.Router();

const WORLDLABS_BASE_URL = 'https://api.worldlabs.ai/marble/v1';

function getWorldLabsApiKey(account = 'default') {
  const normalized = String(account || 'default').toLowerCase();
  if (normalized === 'stem') {
    return process.env.WORLDLABS_STEM_API_KEY || null;
  }
  return process.env.WORLDLABS_API_KEY || null;
}

async function worldLabsRequest(path, init = {}, account = 'default') {
  const apiKey = getWorldLabsApiKey(account);
  if (!apiKey) {
    const err = new Error(
      account === 'stem'
        ? 'WORLDLABS_STEM_API_KEY is not configured on the backend'
        : 'WORLDLABS_API_KEY is not configured on the backend'
    );
    err.status = 503;
    throw err;
  }

  const res = await fetch(`${WORLDLABS_BASE_URL}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'WLT-Api-Key': apiKey,
      ...(init.headers || {}),
    },
  });

  const data = await res.json().catch(() => null);
  if (!res.ok) {
    const providerMsg =
      (data && (data.error || data.message || data.detail)) || null;
    const err = new Error(
      providerMsg || `World Labs request failed (${res.status})`
    );
    err.status = res.status;
    err.details = data;
    throw err;
  }
  return data;
}

router.post('/generate', async (req, res) => {
  const { prompt, displayName, model, account } = req.body || {};
  if (!prompt || typeof prompt !== 'string') {
    return res.status(400).json({ error: 'prompt (string) is required' });
  }

  try {
    const operation = await worldLabsRequest('/worlds:generate', {
      method: 'POST',
      body: JSON.stringify({
        display_name: displayName || 'Han Dynasty Village',
        model: model || 'marble-1.1',
        world_prompt: {
          type: 'text',
          text_prompt: prompt.trim(),
        },
      }),
    }, account || 'default');
    return res.json(operation);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      error: err.message || 'World generation failed',
      details: err.details || null,
    });
  }
});

router.get('/operations/:operationId', async (req, res) => {
  const { operationId } = req.params;
  const { account } = req.query;
  try {
    const operation = await worldLabsRequest(
      `/operations/${operationId}`,
      { method: 'GET' },
      account || 'default'
    );
    return res.json(operation);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      error: err.message || 'Operation lookup failed',
      details: err.details || null,
    });
  }
});

router.get('/:worldId', async (req, res) => {
  const { worldId } = req.params;
  const { account } = req.query;
  try {
    const worldResponse = await worldLabsRequest(
      `/worlds/${worldId}`,
      { method: 'GET' },
      account || 'default'
    );
    if (worldResponse && worldResponse.world) return res.json(worldResponse.world);
    return res.json(worldResponse);
  } catch (err) {
    console.error(err);
    return res.status(err.status || 500).json({
      error: err.message || 'World lookup failed',
      details: err.details || null,
    });
  }
});

module.exports = router;
