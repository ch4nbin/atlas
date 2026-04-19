import { Spectrum } from 'spectrum-ts';
import { imessage } from 'spectrum-ts/providers/imessage';

const REQUIRED_ENV = ['SPECTRUM_PROJECT_ID', 'SPECTRUM_PROJECT_SECRET'];
for (const key of REQUIRED_ENV) {
  if (!process.env[key]) {
    console.error(`Missing required env: ${key}`);
    process.exit(1);
  }
}

const APP_BASE_URL = (process.env.ATLAS_APP_URL || 'http://localhost:3000').replace(/\/$/, '');

const WORLDS = [
  {
    id: 'han-dynasty',
    title: 'Han Dynasty Village',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    account: 'default',
    label: 'Han Dynasty Village',
    aliases: ['han', 'dynasty', 'china', 'chinese', 'confucius', 'silk'],
  },
  {
    id: 'medieval-castle',
    title: 'Medieval Castle',
    worldId: '7dedbd85-3dbd-49b3-8750-9280aaca1da5',
    account: 'humanities',
    label: 'Medieval Castle',
    aliases: ['medieval', 'castle', 'knight', 'feudal', 'norman', 'england'],
  },
  {
    id: 'japanese-edo',
    title: 'Japanese Edo Period',
    worldId: '6396d2c0-d8be-448d-9a5f-2ca643e10a3c',
    account: 'humanities',
    label: 'Japanese Edo Period',
    aliases: ['edo', 'japan', 'japanese', 'tokugawa', 'samurai', 'tokyo', 'kabuki'],
  },
  {
    id: 'photosynthesis-lab',
    title: 'Photosynthesis Lab',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    account: 'stem',
    label: 'Photosynthesis Lab',
    aliases: ['photosynthesis', 'stem', 'science', 'chloroplast', 'plant', 'biology', 'lab'],
  },
];

function scoreWorld(query, world) {
  const q = query.toLowerCase();
  let score = 0;
  for (const alias of world.aliases) {
    if (q.includes(alias)) score += alias.length > 4 ? 6 : 4;
  }
  if (q.includes(world.title.toLowerCase())) score += 20;
  return score;
}

function recommendWorld(text) {
  const cleaned = (text || '').trim().toLowerCase();
  if (!cleaned) return WORLDS[0];

  const ranked = WORLDS
    .map((w) => ({ world: w, score: scoreWorld(cleaned, w) }))
    .sort((a, b) => b.score - a.score);

  return ranked[0].score > 0 ? ranked[0].world : WORLDS[0];
}

function makeExploreLink(world) {
  const qs = new URLSearchParams({
    worldId: world.worldId,
    account: world.account,
    label: world.label,
  });
  return `${APP_BASE_URL}/explore?${qs.toString()}`;
}

function parseUserText(message) {
  if (message.content?.type === 'text') return message.content.text || '';
  return '';
}

const app = await Spectrum({
  projectId: process.env.SPECTRUM_PROJECT_ID,
  projectSecret: process.env.SPECTRUM_PROJECT_SECRET,
  providers: [imessage.config()],
});

console.log('[spectrum] iMessage recommender started');

for await (const [space, message] of app.messages) {
  const text = parseUserText(message);
  if (!text.trim()) continue;

  // Ignore obvious self-echo content by checking sender id against optional bot id.
  if (process.env.SPECTRUM_BOT_USER_ID && message.sender?.id === process.env.SPECTRUM_BOT_USER_ID) {
    continue;
  }

  const world = recommendWorld(text);
  const link = makeExploreLink(world);

  const response = `Recommended world: ${world.title}\nOpen in Atlas: ${link}`;

  await space.responding(async () => {
    await message.reply(response);
  });
}
