import type { PromptInterpretation, SceneGraph, SceneElement, MarbleOperation, MarbleWorld } from './types';
import { getMockInterpretation, getMockScene, getMockChatResponse } from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001';

// Start offline so first button press is instant. Flip to 'online' only after
// a successful health check — which runs in the background on page load.
let backendStatus: 'offline' | 'online' = 'offline';

async function post<T>(path: string, body: unknown): Promise<T> {
  const controller = new AbortController();
  // 1.5s is enough; if the port is closed the OS rejects immediately anyway.
  const timer = setTimeout(() => controller.abort(), 1500);
  try {
    const res = await fetch(`${BASE_URL}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    clearTimeout(timer);
    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: res.statusText }));
      throw new Error(err.error || 'Request failed');
    }
    return res.json();
  } catch (e) {
    clearTimeout(timer);
    backendStatus = 'offline';
    throw e;
  }
}

export async function interpretPrompt(prompt: string): Promise<PromptInterpretation> {
  if (backendStatus === 'offline') return getMockInterpretation(prompt);
  try {
    return await post('/api/interpret', { prompt });
  } catch {
    return getMockInterpretation(prompt);
  }
}

export async function generateScene(
  interpretation: PromptInterpretation,
  prompt: string
): Promise<SceneGraph> {
  if (backendStatus === 'offline') return getMockScene(prompt);
  try {
    return await post('/api/scene', { interpretation, prompt });
  } catch {
    return getMockScene(prompt);
  }
}

export async function sendChat(
  sceneGraph: SceneGraph | null,
  focusedElement: SceneElement | null,
  question: string
): Promise<string> {
  if (backendStatus === 'offline') return getMockChatResponse(question, focusedElement, sceneGraph);
  try {
    const { response } = await post<{ response: string }>('/api/chat', {
      sceneGraph,
      focusedElement,
      question,
    });
    return response;
  } catch {
    return getMockChatResponse(question, focusedElement, sceneGraph);
  }
}

export async function generateWorld(
  prompt: string,
  model: string = 'marble-1.1'
): Promise<MarbleOperation> {
  return post('/api/worlds/generate', { prompt, model });
}

export async function getWorldOperation(operationId: string): Promise<MarbleOperation> {
  const res = await fetch(`${BASE_URL}/api/worlds/operations/${operationId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Operation request failed');
  }
  return res.json();
}

export async function getWorld(worldId: string): Promise<MarbleWorld> {
  const res = await fetch(`${BASE_URL}/api/worlds/${worldId}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'World request failed');
  }
  return res.json();
}

export async function checkHealth(): Promise<{ status: string; aiEnabled: boolean; worldLabsEnabled: boolean; offline: boolean }> {
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 2000);
    const res = await fetch(`${BASE_URL}/api/health`, { signal: controller.signal });
    clearTimeout(timer);
    const data = await res.json();
    backendStatus = 'online';
    return { ...data, worldLabsEnabled: !!data.worldLabsEnabled, offline: false };
  } catch {
    backendStatus = 'offline';
    return { status: 'offline', aiEnabled: false, worldLabsEnabled: false, offline: true };
  }
}
