export type ElementType = 'object' | 'actor' | 'action' | 'environment';
export type Importance = 'low' | 'medium' | 'high';
export type TimeOfDay = 'dawn' | 'morning' | 'midday' | 'afternoon' | 'dusk' | 'night';

export interface SceneElement {
  id: string;
  type: ElementType;
  name: string;
  description: string;
  importance: Importance;
  position_hint: string;
}

export interface SceneSetting {
  location: string;
  time_period: string;
  time_of_day: string;
}

export interface SceneGraph {
  setting: SceneSetting;
  scene_type: string;
  elements: SceneElement[];
}

export interface PromptInterpretation {
  prompt_type: 'place' | 'event' | 'ambiguous';
  resolved_scene: {
    location: string;
    time_period: string;
    time_of_day: string;
    scene_scope: string;
  };
  assumptions: string[];
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
}
