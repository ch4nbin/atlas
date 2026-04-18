'use strict';

const express = require('express');
const router = express.Router();

const MOCK_ASSETS = {
  boston_tea_party: {
    sceneId: 'boston_tea_party',
    format: 'spz',
    status: 'placeholder',
    url: null,
    metadata: {
      pointCount: 0,
      boundingBox: { min: [-20, -1, -20], max: [20, 15, 20] },
      generatedAt: null,
      pipeline: 'marble-v1',
    },
  },
  medieval_town_square: {
    sceneId: 'medieval_town_square',
    format: 'spz',
    status: 'placeholder',
    url: null,
    metadata: {
      pointCount: 0,
      boundingBox: { min: [-25, -1, -25], max: [25, 20, 25] },
      generatedAt: null,
      pipeline: 'marble-v1',
    },
  },
};

router.get('/:sceneId', (req, res) => {
  const { sceneId } = req.params;
  const asset = MOCK_ASSETS[sceneId] || {
    sceneId,
    format: 'spz',
    status: 'not_found',
    url: null,
    metadata: null,
  };
  res.json(asset);
});

module.exports = router;
