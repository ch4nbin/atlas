'use strict';

const MOCK_SCENES = {
  photosynthesis_lab: {
    setting: {
      location: "Interactive Plant Cell Lab",
      time_period: "Modern classroom science demo",
      time_of_day: "midday",
    },
    scene_type: "science_experiment",
    elements: [
      {
        id: "sunlight_lamp",
        type: "object",
        name: "Sunlight Simulation Lamp",
        description:
          "A lab light array that delivers photons to power the light-dependent stage of photosynthesis.",
        importance: "high",
        position_hint: "upper left foreground, angled toward chloroplast",
      },
      {
        id: "leaf_section",
        type: "environment",
        name: "Leaf Cross-Section",
        description:
          "A magnified 3D leaf model showing epidermis, mesophyll, and vascular tissues where photosynthesis occurs.",
        importance: "high",
        position_hint: "center background, full width",
      },
      {
        id: "stomata_gate",
        type: "action",
        name: "Stomata Gate",
        description:
          "Guard cells controlling pore openings for carbon dioxide intake and water vapor release.",
        importance: "high",
        position_hint: "left mid-ground on leaf surface",
      },
      {
        id: "chloroplast_model",
        type: "object",
        name: "Chloroplast Reactor",
        description:
          "An enlarged chloroplast showing thylakoids for light reactions and stroma for the Calvin cycle.",
        importance: "high",
        position_hint: "center foreground, floating cutaway model",
      },
      {
        id: "water_channel",
        type: "action",
        name: "Water Transport Channel",
        description:
          "A simplified xylem flow path that delivers water molecules to photosynthetic tissue.",
        importance: "medium",
        position_hint: "right mid-ground, vein pathway",
      },
      {
        id: "oxygen_stream",
        type: "action",
        name: "Oxygen Release Stream",
        description:
          "Visible oxygen bubbles representing O2 released after photolysis of water.",
        importance: "medium",
        position_hint: "upper right, rising from reaction chamber",
      },
    ],
  },
  boston_tea_party: {
    setting: {
      location: "Griffin's Wharf, Boston Harbor, Massachusetts Bay Colony",
      time_period: "December 16, 1773",
      time_of_day: "night",
    },
    scene_type: "historical_event",
    elements: [
      {
        id: "ship",
        type: "object",
        name: "HMS Dartmouth",
        description:
          "A British merchant ship loaded with 114 chests of East India Company tea, anchored at Griffin's Wharf. The colonists board her under cover of darkness.",
        importance: "high",
        position_hint: "center background, on the water",
      },
      {
        id: "dock",
        type: "environment",
        name: "Griffin's Wharf",
        description:
          "Cold wooden planks of the Boston wharf on a December night. Mooring posts and ropes line the edge where the ships are tied.",
        importance: "high",
        position_hint: "foreground, spanning full width",
      },
      {
        id: "protesters",
        type: "actor",
        name: "Sons of Liberty",
        description:
          "116 colonists disguised as Mohawk Indians, organized by Samuel Adams. They methodically haul up tea chests and hurl them into the harbor.",
        importance: "high",
        position_hint: "foreground center, on the dock",
      },
      {
        id: "tea_chests",
        type: "object",
        name: "Tea Chests",
        description:
          "342 chests of premium Bohea and Darjeeling tea valued at £18,000. The protesters split them open with hatchets and dump the contents overboard.",
        importance: "medium",
        position_hint: "center, near the ship",
      },
      {
        id: "torches",
        type: "object",
        name: "Protest Torches",
        description:
          "Wooden torches held aloft by spectators lining the shore, casting flickering orange light over the dramatic scene.",
        importance: "low",
        position_hint: "left and right foreground",
      },
      {
        id: "harbor",
        type: "environment",
        name: "Boston Harbor",
        description:
          "The dark, still waters of Boston Harbor. Tea slowly steeps into the cold December sea as chest after chest is emptied overboard.",
        importance: "medium",
        position_hint: "background, full width",
      },
    ],
  },
  medieval_town_square: {
    setting: {
      location: "Market Town, Central England",
      time_period: "14th Century, circa 1350",
      time_of_day: "midday",
    },
    scene_type: "historical_place",
    elements: [
      {
        id: "market_stalls",
        type: "object",
        name: "Market Stalls",
        description:
          "Wooden stalls draped with colorful cloth, selling bread, produce, cloth, and craftwork. The engine of medieval commerce.",
        importance: "high",
        position_hint: "center, distributed around square",
      },
      {
        id: "church",
        type: "object",
        name: "Parish Church",
        description:
          "A Norman stone church with a square tower dominating the skyline. The spiritual and civic center of the community.",
        importance: "high",
        position_hint: "far background, center",
      },
      {
        id: "merchants",
        type: "actor",
        name: "Medieval Merchants",
        description:
          "Traders and craftsmen hawking their wares — bakers, clothiers, potters, and traveling merchants from distant towns.",
        importance: "high",
        position_hint: "center, around the stalls",
      },
      {
        id: "well",
        type: "object",
        name: "Town Well",
        description:
          "The central stone well — a vital gathering point. Women collect water and exchange news. The social heart of the square.",
        importance: "medium",
        position_hint: "center of the square",
      },
      {
        id: "tavern",
        type: "object",
        name: "The Alehouse",
        description:
          "A timber-framed alehouse with a thatched roof, offering ale and shelter to travelers and locals alike.",
        importance: "medium",
        position_hint: "right side, mid-distance",
      },
      {
        id: "square",
        type: "environment",
        name: "Cobblestone Square",
        description:
          "Uneven cobblestones worn smooth by centuries of foot traffic. Pigeons and chickens wander freely among the stalls.",
        importance: "low",
        position_hint: "ground level, entire scene",
      },
    ],
  },
};

function findMatchingScene(prompt) {
  const p = prompt.toLowerCase();
  if (
    p.includes("photosynthesis") ||
    p.includes("chloroplast") ||
    p.includes("stomata") ||
    p.includes("plant cell")
  ) {
    return MOCK_SCENES.photosynthesis_lab;
  }
  if (
    p.includes("boston") ||
    p.includes("tea party") ||
    p.includes("colonial") ||
    p.includes("1773")
  ) {
    return MOCK_SCENES.boston_tea_party;
  }
  if (
    p.includes("medieval") ||
    p.includes("middle ages") ||
    p.includes("town square") ||
    p.includes("market")
  ) {
    return MOCK_SCENES.medieval_town_square;
  }
  return null;
}

function buildSceneFromInterpretation(interpretation) {
  const { resolved_scene } = interpretation;
  return {
    setting: {
      location: resolved_scene.location || "Unknown Location",
      time_period: resolved_scene.time_period || "Unknown Era",
      time_of_day: resolved_scene.time_of_day || "day",
    },
    scene_type: "historical_place",
    elements: [
      {
        id: "environment",
        type: "environment",
        name: `${resolved_scene.location || "The Scene"}`,
        description: `A ${resolved_scene.scene_scope || "historical"} scene set in ${resolved_scene.location || "an unknown location"} during ${resolved_scene.time_period || "an unknown era"}.`,
        importance: "high",
        position_hint: "background, full width",
      },
      {
        id: "focal_point",
        type: "object",
        name: "Central Feature",
        description: `The defining feature of ${resolved_scene.location || "this scene"} during ${resolved_scene.time_period || "this era"}.`,
        importance: "high",
        position_hint: "center",
      },
      {
        id: "inhabitants",
        type: "actor",
        name: "Historical Inhabitants",
        description: `The people who lived and worked here during ${resolved_scene.time_period || "this era"}.`,
        importance: "medium",
        position_hint: "foreground center",
      },
    ],
  };
}

module.exports = { MOCK_SCENES, findMatchingScene, buildSceneFromInterpretation };
