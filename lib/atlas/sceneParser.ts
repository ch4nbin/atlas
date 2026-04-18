import type { SceneElement, TimeOfDay } from './types';

export function parsePositionHint(
  hint: string,
  index: number,
  total: number
): [number, number, number] {
  const h = hint.toLowerCase();
  let x = 0, y = 0, z = 0;

  // Scattered / distributed elements
  if (h.includes('distributed') || h.includes('scattered') || h.includes('around')) {
    const angle = (index / total) * Math.PI * 2;
    return [Math.cos(angle) * 7, 0, Math.sin(angle) * 7];
  }

  // Horizontal axis
  if (h.includes('far left')) x = -14;
  else if (h.includes('left')) x = -8;
  else if (h.includes('far right')) x = 14;
  else if (h.includes('right')) x = 8;
  else x = 0;

  // Depth axis (z = positive is toward camera)
  if (h.includes('background') || h.includes('far') || h.includes('distant')) z = -16;
  else if (h.includes('mid-distance') || h.includes('middle distance') || h.includes('mid distance')) z = -8;
  else if (h.includes('foreground') || h.includes('front') || h.includes('near')) z = 6;
  else if (h.includes('center') && !h.includes('background')) z = 0;
  else z = -index * 3;

  // Height
  if (h.includes('above') || h.includes('high') || h.includes('elevated')) y = 8;
  else if (h.includes('ground level') || h.includes('ground')) y = 0;
  else y = 0;

  // Ground level override for environment
  if (h.includes('full width') || h.includes('entire scene')) {
    return [0, y, z];
  }

  return [x, y, z];
}

export function getScaleFromImportance(importance: string): number {
  if (importance === 'high') return 1.4;
  if (importance === 'medium') return 1.0;
  return 0.65;
}

export function normalizeTimeOfDay(raw: string): TimeOfDay {
  const t = raw.toLowerCase();
  if (t.includes('dawn') || t.includes('sunrise')) return 'dawn';
  if (t.includes('morning')) return 'morning';
  if (t.includes('midday') || t.includes('noon') || t.includes('afternoon')) return 'midday';
  if (t.includes('dusk') || t.includes('sunset') || t.includes('evening')) return 'dusk';
  if (t.includes('night') || t.includes('dark')) return 'night';
  return 'midday';
}

export interface SkyConfig {
  topColor: number;
  bottomColor: number;
  ambientIntensity: number;
  ambientColor: number;
  sunColor: number;
  fogColor: number;
  fogNear: number;
  fogFar: number;
}

export function getSkyConfig(timeOfDay: TimeOfDay): SkyConfig {
  switch (timeOfDay) {
    case 'dawn':
      return {
        topColor: 0x1a0a2e,
        bottomColor: 0xff6b35,
        ambientIntensity: 0.4,
        ambientColor: 0xffd4aa,
        sunColor: 0xff8c42,
        fogColor: 0xff6b35,
        fogNear: 30,
        fogFar: 80,
      };
    case 'morning':
      return {
        topColor: 0x87ceeb,
        bottomColor: 0xffd700,
        ambientIntensity: 0.7,
        ambientColor: 0xfff5dc,
        sunColor: 0xffd700,
        fogColor: 0xcce8ff,
        fogNear: 40,
        fogFar: 100,
      };
    case 'midday':
      return {
        topColor: 0x1a6db5,
        bottomColor: 0x87ceeb,
        ambientIntensity: 0.9,
        ambientColor: 0xffffff,
        sunColor: 0xffffff,
        fogColor: 0xb8d8f0,
        fogNear: 50,
        fogFar: 120,
      };
    case 'dusk':
      return {
        topColor: 0x1a0a2e,
        bottomColor: 0xff4500,
        ambientIntensity: 0.45,
        ambientColor: 0xff8c42,
        sunColor: 0xff4500,
        fogColor: 0x8b3a1a,
        fogNear: 25,
        fogFar: 70,
      };
    case 'night':
    default:
      return {
        topColor: 0x000510,
        bottomColor: 0x0a0a1a,
        ambientIntensity: 0.15,
        ambientColor: 0x2244aa,
        sunColor: 0x4466cc,
        fogColor: 0x050510,
        fogNear: 20,
        fogFar: 60,
      };
  }
}

export function getElementColor(element: SceneElement): number {
  const name = element.name.toLowerCase();
  const type = element.type;

  if (name.includes('ship') || name.includes('vessel')) return 0x8b6914;
  if (name.includes('water') || name.includes('harbor') || name.includes('sea')) return 0x0d2b45;
  if (name.includes('dock') || name.includes('wharf') || name.includes('wood')) return 0x5c3d1a;
  if (name.includes('torch') || name.includes('fire') || name.includes('flame')) return 0xff6600;
  if (name.includes('chest') || name.includes('crate') || name.includes('box')) return 0x7a5c2a;
  if (name.includes('stone') || name.includes('church') || name.includes('cathedral')) return 0x8a8a8a;
  if (name.includes('well')) return 0x9e9e9e;
  if (name.includes('stall') || name.includes('market')) return 0xcc6633;
  if (name.includes('tavern') || name.includes('building') || name.includes('alehouse')) return 0x5c4a2a;
  if (name.includes('square') || name.includes('cobblestone')) return 0x6e6e6e;
  if (name.includes('grass') || name.includes('field')) return 0x4a7c3f;

  if (type === 'actor') return 0x8b4513;
  if (type === 'environment') return 0x3d5a3e;
  if (type === 'action') return 0xffdd00;
  return 0x6b8cba;
}
