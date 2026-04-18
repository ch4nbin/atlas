'use strict';

const { findMatchingScene, buildSceneFromInterpretation } = require('./sceneGraph');

let openaiClient = null;

function getOpenAI() {
  if (!process.env.OPENAI_API_KEY) return null;
  if (!openaiClient) {
    const { default: OpenAI } = require('openai');
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openaiClient;
}

async function interpretPrompt(prompt) {
  const openai = getOpenAI();

  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an educational 3D scene interpreter for humanities and STEM prompts. Given a user prompt, return ONLY valid JSON matching this schema:
{
  "prompt_type": "place | event | ambiguous",
  "resolved_scene": {
    "location": "",
    "time_period": "",
    "time_of_day": "",
    "scene_scope": ""
  },
  "assumptions": []
}
Be concise. If the prompt is ambiguous, choose the most educational interpretation.`,
          },
          { role: 'user', content: prompt },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 300,
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.error('OpenAI interpret error:', err.message);
    }
  }

  return mockInterpret(prompt);
}

async function generateSceneGraph(interpretation, prompt) {
  const openai = getOpenAI();

  const matchedScene = findMatchingScene(prompt || '');
  if (matchedScene) return matchedScene;

  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an educational scene designer. Generate a bounded 3D scene graph from the given interpretation. Return ONLY valid JSON:
{
  "setting": { "location": "", "time_period": "", "time_of_day": "" },
  "scene_type": "",
  "elements": [
    {
      "id": "",
      "type": "object | actor | action | environment",
      "name": "",
      "description": "",
      "importance": "low | medium | high",
      "position_hint": ""
    }
  ]
}
Rules:
- Include 5-8 elements total
- Always include at least one environment element
- Use specific spatial hints (e.g. "foreground left", "center background", "right side mid-distance")
- Elements must be domain-accurate (historical for humanities prompts, scientifically accurate for STEM prompts)
- Scene represents a single bounded moment in time`,
          },
          {
            role: 'user',
            content: `Generate scene graph for: ${JSON.stringify(interpretation)}`,
          },
        ],
        response_format: { type: 'json_object' },
        max_tokens: 800,
      });
      return JSON.parse(res.choices[0].message.content);
    } catch (err) {
      console.error('OpenAI scene error:', err.message);
    }
  }

  return buildSceneFromInterpretation(interpretation);
}

async function generateChatResponse(sceneGraph, focusedElement, question) {
  const openai = getOpenAI();

  const sceneContext = buildSceneContext(sceneGraph, focusedElement);

  if (openai) {
    try {
      const res = await openai.chat.completions.create({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `You are an expert educational guide for an immersive 3D scene.
Scene context: ${sceneContext}
Rules:
- Answer in 1-3 sentences only
- Only reference elements present in the scene
- Be accurate and specific for the scene domain (history or science)
- If asked about a focused element, prioritize that in your answer
- Never hallucinate objects or people not mentioned in the scene`,
          },
          { role: 'user', content: question },
        ],
        max_tokens: 200,
      });
      return res.choices[0].message.content;
    } catch (err) {
      console.error('OpenAI chat error:', err.message);
    }
  }

  return mockChatResponse(sceneGraph, focusedElement, question);
}

function buildSceneContext(sceneGraph, focusedElement) {
  if (!sceneGraph) return 'No scene loaded.';
  const { setting, elements } = sceneGraph;
  const lines = [
    `Location: ${setting.location}`,
    `Time: ${setting.time_period}, ${setting.time_of_day}`,
    `Elements present: ${elements.map((e) => e.name).join(', ')}`,
  ];
  if (focusedElement) {
    lines.push(`User is currently looking at: ${focusedElement.name} — ${focusedElement.description}`);
  }
  return lines.join('\n');
}

function mockInterpret(prompt) {
  const p = prompt.toLowerCase();
  if (p.includes('boston') || p.includes('tea')) {
    return {
      prompt_type: 'event',
      resolved_scene: {
        location: "Griffin's Wharf, Boston Harbor",
        time_period: 'December 16, 1773',
        time_of_day: 'night',
        scene_scope: 'bounded wharf scene',
      },
      assumptions: ['Interpreted as the Boston Tea Party protest event'],
    };
  }
  if (p.includes('medieval') || p.includes('town')) {
    return {
      prompt_type: 'place',
      resolved_scene: {
        location: 'Medieval English Market Town',
        time_period: '14th Century, circa 1350',
        time_of_day: 'midday',
        scene_scope: 'town market square',
      },
      assumptions: ['Interpreted as a 14th-century English market town'],
    };
  }
  return {
    prompt_type: 'ambiguous',
    resolved_scene: {
      location: prompt,
      time_period: 'Historical period',
      time_of_day: 'day',
      scene_scope: 'bounded historical scene',
    },
    assumptions: [`Showing a representative scene for: "${prompt}"`],
  };
}

function mockChatResponse(sceneGraph, focusedElement, question) {
  if (!sceneGraph) return "No scene is loaded yet. Please enter a prompt to explore a scene.";

  const { setting } = sceneGraph;
  const q = question.toLowerCase();

  if (focusedElement) {
    if (q.includes('what') || q.includes('tell') || q.includes('describe')) {
      return `${focusedElement.name}: ${focusedElement.description}`;
    }
    if (q.includes('why') || q.includes('important')) {
      return `${focusedElement.name} was ${focusedElement.importance === 'high' ? 'central' : 'significant'} to this moment in ${setting.time_period}. ${focusedElement.description.split('.')[0]}.`;
    }
  }

  if (q.includes('when') || q.includes('time')) {
    return `This scene takes place on ${setting.time_period}, during the ${setting.time_of_day}. It is set at ${setting.location}.`;
  }
  if (q.includes('where') || q.includes('location')) {
    return `You are exploring ${setting.location}, depicted here as it appeared during ${setting.time_period}.`;
  }
  if (q.includes('who') || q.includes('people')) {
    const actors = sceneGraph.elements.filter((e) => e.type === 'actor');
    if (actors.length > 0) {
      return `${actors[0].name}: ${actors[0].description}`;
    }
    return `This scene from ${setting.time_period} would have been populated by people typical of the era and location.`;
  }

  return `This is ${setting.location}, ${setting.time_period}. Look around to explore the scene — click on any object to learn more about it.`;
}

module.exports = { interpretPrompt, generateSceneGraph, generateChatResponse };
