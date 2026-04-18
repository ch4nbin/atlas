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

export interface MarbleWorld {
  id: string;
  world_id?: string;
  display_name?: string;
  world_marble_url: string;
  assets?: {
    caption?: string;
    thumbnail_url?: string;
    splats?: {
      spz_urls?: {
        ['100k']?: string;
        ['500k']?: string;
        full_res?: string;
      };
    };
    mesh?: {
      collider_mesh_url?: string;
    };
    imagery?: {
      pano_url?: string;
    };
  };
  created_at?: string | null;
  updated_at?: string | null;
  model?: string | null;
}

export interface MarbleOperation {
  operation_id: string;
  done: boolean;
  error: { message?: string; code?: string } | null;
  metadata?: {
    world_id?: string;
    progress?: {
      status?: string;
      description?: string;
    };
  } | null;
  response?: MarbleWorld | null;
}
