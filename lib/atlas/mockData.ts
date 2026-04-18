import type { PromptInterpretation, SceneGraph } from './types';

export function getMockInterpretation(prompt: string): PromptInterpretation {
  const p = prompt.toLowerCase();
  if (p.includes('han') || p.includes('dynasty') || p.includes('village')) {
    return {
      prompt_type: 'place',
      resolved_scene: {
        location: 'Han Dynasty Village, Northern China',
        time_period: 'Eastern Han Dynasty, circa 120 CE',
        time_of_day: 'late afternoon',
        scene_scope: 'village center and fields',
      },
      assumptions: ['Interpreted as a rural Han Dynasty village setting'],
    };
  }
  if (p.includes('boston') || p.includes('tea party') || p.includes('1773')) {
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
  if (p.includes('medieval') || p.includes('middle ages') || p.includes('town square') || p.includes('market')) {
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
  if (p.includes('roman') || p.includes('rome') || p.includes('forum')) {
    return {
      prompt_type: 'place',
      resolved_scene: {
        location: 'Roman Forum, Rome',
        time_period: '1st Century BC, circa 44 BC',
        time_of_day: 'midday',
        scene_scope: 'forum civic space',
      },
      assumptions: ['Interpreted as the Roman Forum during the late Republic'],
    };
  }
  // Generic fallback — map the prompt directly
  return {
    prompt_type: 'ambiguous',
    resolved_scene: {
      location: prompt,
      time_period: 'Historical era',
      time_of_day: 'midday',
      scene_scope: 'bounded historical scene',
    },
    assumptions: [`Showing a representative scene for: "${prompt}"`],
  };
}

export function getMockScene(prompt: string): SceneGraph {
  const p = prompt.toLowerCase();

  if (p.includes('han') || p.includes('dynasty') || p.includes('village')) {
    return HAN_DYNASTY_VILLAGE;
  }
  if (p.includes('boston') || p.includes('tea party') || p.includes('1773')) {
    return BOSTON_TEA_PARTY;
  }
  if (p.includes('medieval') || p.includes('middle ages') || p.includes('town') || p.includes('market')) {
    return MEDIEVAL_TOWN;
  }
  if (p.includes('roman') || p.includes('rome') || p.includes('forum')) {
    return ROMAN_FORUM;
  }
  // Generic fallback
  return {
    setting: {
      location: prompt,
      time_period: 'Historical era',
      time_of_day: 'midday',
    },
    scene_type: 'historical_place',
    elements: [
      {
        id: 'ground',
        type: 'environment',
        name: 'The Ground',
        description: `The landscape of ${prompt}.`,
        importance: 'high',
        position_hint: 'ground level, entire scene',
      },
      {
        id: 'structure',
        type: 'object',
        name: 'Central Structure',
        description: `The defining feature of ${prompt}.`,
        importance: 'high',
        position_hint: 'center background',
      },
      {
        id: 'people',
        type: 'actor',
        name: 'Historical Inhabitants',
        description: `The people of ${prompt}.`,
        importance: 'medium',
        position_hint: 'foreground center',
      },
    ],
  };
}

export function getMockChatResponse(
  question: string,
  focusedElement: { name: string; description: string; importance: string } | null,
  sceneGraph: SceneGraph | null
): string {
  if (!sceneGraph) return 'No scene is currently loaded.';
  const { setting } = sceneGraph;
  const q = question.toLowerCase();

  if (focusedElement) {
    if (q.includes('what') || q.includes('tell') || q.includes('describe') || q.includes('about')) {
      return `${focusedElement.name}: ${focusedElement.description}`;
    }
    if (q.includes('why') || q.includes('important') || q.includes('significance')) {
      return `${focusedElement.name} was ${focusedElement.importance === 'high' ? 'central' : 'significant'} to this moment. ${focusedElement.description.split('.')[0]}.`;
    }
  }

  if (q.includes('when') || q.includes('time') || q.includes('date') || q.includes('year')) {
    return `This scene takes place on ${setting.time_period}, during the ${setting.time_of_day}. You are at ${setting.location}.`;
  }
  if (q.includes('where') || q.includes('location') || q.includes('place')) {
    return `You are exploring ${setting.location}, as it appeared during ${setting.time_period}.`;
  }
  if (q.includes('who') || q.includes('people') || q.includes('person')) {
    const actors = sceneGraph.elements.filter((e) => e.type === 'actor');
    if (actors.length > 0) return `${actors[0].name}: ${actors[0].description}`;
  }
  if (q.includes('what') || q.includes('see') || q.includes('around')) {
    const names = sceneGraph.elements.map((e) => e.name).join(', ');
    return `You can see: ${names}. Click on any object to focus on it and ask me more.`;
  }

  return `You are at ${setting.location}, ${setting.time_period}. Click any object to focus on it, then ask me about it.`;
}

// ─── Hardcoded scenes ─────────────────────────────────────────────────────────

const HAN_DYNASTY_VILLAGE: SceneGraph = {
  setting: {
    location: 'Han Dynasty Village, Northern China',
    time_period: 'Eastern Han Dynasty, circa 120 CE',
    time_of_day: 'late afternoon',
  },
  scene_type: 'historical_place',
  elements: [
    {
      id: 'courtyard_houses',
      type: 'object',
      name: 'Earthen Courtyard Houses',
      description:
        'Ram-earth homes with timber frames and tiled roofs arranged around shared family courtyards.',
      importance: 'high',
      position_hint: 'center and mid-ground, clustered settlement',
    },
    {
      id: 'millet_fields',
      type: 'environment',
      name: 'Millet and Wheat Fields',
      description:
        'Cultivated strips of millet and wheat surrounding the village, worked by families and ox-drawn plows.',
      importance: 'high',
      position_hint: 'background and left side, beyond homes',
    },
    {
      id: 'village_well',
      type: 'object',
      name: 'Village Well',
      description:
        'A stone-lined communal well where villagers gather for water, conversation, and local news.',
      importance: 'medium',
      position_hint: 'foreground center, open square',
    },
    {
      id: 'scholar_scribe',
      type: 'actor',
      name: 'Local Han Scribe',
      description:
        'A literate villager maintaining bamboo-slip records of grain tax, births, and clan obligations.',
      importance: 'medium',
      position_hint: 'right foreground, near a writing table',
    },
    {
      id: 'ox_cart',
      type: 'object',
      name: 'Wooden Ox Cart',
      description:
        'A heavy two-wheeled cart used to transport grain, tools, and clay jars between fields and homes.',
      importance: 'low',
      position_hint: 'left foreground, near field path',
    },
    {
      id: 'shrine',
      type: 'object',
      name: 'Ancestral Shrine',
      description:
        'A modest ancestral shrine with incense offerings where families honor lineage and household spirits.',
      importance: 'medium',
      position_hint: 'right mid-ground, beside courtyard homes',
    },
  ],
};

const BOSTON_TEA_PARTY: SceneGraph = {
  setting: {
    location: "Griffin's Wharf, Boston Harbor",
    time_period: 'December 16, 1773',
    time_of_day: 'night',
  },
  scene_type: 'historical_event',
  elements: [
    {
      id: 'ship',
      type: 'object',
      name: 'HMS Dartmouth',
      description:
        "A British merchant ship loaded with 114 chests of East India Company tea, anchored at Griffin's Wharf. The colonists board her under cover of darkness.",
      importance: 'high',
      position_hint: 'center background, on the water',
    },
    {
      id: 'dock',
      type: 'environment',
      name: "Griffin's Wharf",
      description:
        'Cold wooden planks of the Boston wharf on a December night. Mooring posts and ropes line the edge.',
      importance: 'high',
      position_hint: 'foreground, spanning full width',
    },
    {
      id: 'protesters',
      type: 'actor',
      name: 'Sons of Liberty',
      description:
        '116 colonists disguised as Mohawk Indians, organized by Samuel Adams. They haul up tea chests and hurl them into the harbor.',
      importance: 'high',
      position_hint: 'foreground center, on the dock',
    },
    {
      id: 'tea_chests',
      type: 'object',
      name: 'Tea Chests',
      description:
        '342 chests of premium Bohea and Darjeeling tea valued at £18,000. Being split open with hatchets and emptied overboard.',
      importance: 'medium',
      position_hint: 'center, near the ship',
    },
    {
      id: 'torches',
      type: 'object',
      name: 'Protest Torches',
      description:
        'Wooden torches held aloft by spectators lining the shore, casting flickering orange light over the dramatic scene.',
      importance: 'low',
      position_hint: 'left and right foreground',
    },
    {
      id: 'harbor',
      type: 'environment',
      name: 'Boston Harbor',
      description:
        'The dark, still waters of Boston Harbor on a cold December night. Tea slowly steeps into the sea.',
      importance: 'medium',
      position_hint: 'background, full width',
    },
  ],
};

const MEDIEVAL_TOWN: SceneGraph = {
  setting: {
    location: 'Market Town, Central England',
    time_period: '14th Century, circa 1350',
    time_of_day: 'midday',
  },
  scene_type: 'historical_place',
  elements: [
    {
      id: 'market_stalls',
      type: 'object',
      name: 'Market Stalls',
      description:
        'Wooden stalls draped with colorful cloth, selling bread, produce, cloth, and craftwork.',
      importance: 'high',
      position_hint: 'center, distributed around square',
    },
    {
      id: 'church',
      type: 'object',
      name: 'Parish Church',
      description:
        'A Norman stone church with a square tower dominating the skyline — the spiritual and civic center of the community.',
      importance: 'high',
      position_hint: 'far background, center',
    },
    {
      id: 'merchants',
      type: 'actor',
      name: 'Medieval Merchants',
      description:
        'Traders and craftsmen hawking their wares — bakers, clothiers, potters, and traveling merchants from distant towns.',
      importance: 'high',
      position_hint: 'center, around the stalls',
    },
    {
      id: 'well',
      type: 'object',
      name: 'Town Well',
      description:
        'The central stone well — a vital gathering point. Women collect water and share news here.',
      importance: 'medium',
      position_hint: 'center of the square',
    },
    {
      id: 'tavern',
      type: 'object',
      name: 'The Alehouse',
      description:
        'A timber-framed alehouse with a thatched roof, offering ale and shelter to travelers and locals alike.',
      importance: 'medium',
      position_hint: 'right side, mid-distance',
    },
    {
      id: 'square',
      type: 'environment',
      name: 'Cobblestone Square',
      description:
        'Uneven cobblestones worn smooth by centuries of foot traffic. Pigeons and chickens wander freely.',
      importance: 'low',
      position_hint: 'ground level, entire scene',
    },
  ],
};

const ROMAN_FORUM: SceneGraph = {
  setting: {
    location: 'Roman Forum, Rome',
    time_period: '1st Century BC, circa 44 BC',
    time_of_day: 'midday',
  },
  scene_type: 'historical_place',
  elements: [
    {
      id: 'temple',
      type: 'object',
      name: 'Temple of Saturn',
      description:
        'A magnificent Ionic temple dedicated to Saturn, housing the Roman treasury. Its massive columns rise against the Roman sky.',
      importance: 'high',
      position_hint: 'far background, left',
    },
    {
      id: 'rostra',
      type: 'object',
      name: 'The Rostra',
      description:
        'The great speaker\'s platform decorated with the prows of captured enemy ships. Where orators addressed the Roman people.',
      importance: 'high',
      position_hint: 'center, slightly left',
    },
    {
      id: 'citizens',
      type: 'actor',
      name: 'Roman Citizens',
      description:
        'Senators in togas, merchants, slaves, and freedmen going about the business of the Republic.',
      importance: 'high',
      position_hint: 'center, distributed around forum',
    },
    {
      id: 'basilica',
      type: 'object',
      name: 'Basilica Julia',
      description:
        "Julius Caesar's great law court and public hall, its colonnaded facade defining the southern edge of the Forum.",
      importance: 'medium',
      position_hint: 'right side, background',
    },
    {
      id: 'via_sacra',
      type: 'environment',
      name: 'Via Sacra',
      description:
        'The Sacred Way — the main road through the Forum, paved with large irregular stones worn smooth by centuries of feet.',
      importance: 'medium',
      position_hint: 'ground level, center path',
    },
    {
      id: 'arch',
      type: 'object',
      name: 'Triumphal Arch',
      description:
        'A monumental arch commemorating Roman military victories, its reliefs depicting conquered peoples and war spoils.',
      importance: 'low',
      position_hint: 'far background, right',
    },
  ],
};
