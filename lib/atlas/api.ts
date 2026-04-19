import type {
  PromptInterpretation,
  SceneGraph,
  SceneElement,
  MarbleOperation,
  MarbleWorld,
  StemExperimentState,
} from './types';
import { getMockInterpretation, getMockScene } from './mockData';

const BASE_URL = process.env.NEXT_PUBLIC_BACKEND_URL ?? 'http://localhost:3001';
type WorldLabsAccount = 'default' | 'stem' | 'humanities';

// Start offline so first button press is instant. Flip to 'online' only after
// a successful health check — which runs in the background on page load.
let backendStatus: 'offline' | 'online' = 'offline';

async function post<T>(path: string, body: unknown, timeoutMs = 1500): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
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
    if (controller.signal.aborted) {
      throw new Error(`Request timed out after ${Math.round(timeoutMs / 1000)}s`);
    }
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
  question: string,
  experimentState: StemExperimentState | null = null,
  history: { role: 'user' | 'assistant'; content: string }[] = []
): Promise<string> {
  // Always attempt chat even if backendStatus is 'offline' — a prior scene/interpret
  // failure shouldn't permanently suppress chat. Reset so post() will try.
  backendStatus = 'online';
  try {
    const { response } = await post<{ response: string }>('/api/chat', {
      sceneGraph,
      focusedElement,
      question,
      experimentState,
      history,
    }, 15000);
    return response;
  } catch (err) {
    backendStatus = 'online';
    throw err;
  }
}

export async function generateWorld(
  prompt: string,
  model: string = 'marble-1.1',
  account: WorldLabsAccount = 'default'
): Promise<MarbleOperation> {
  // World generation can take significantly longer than lightweight endpoints.
  // Do not force-abort this request client-side.
  const res = await fetch(`${BASE_URL}/api/worlds/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, model, account }),
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'World generation request failed');
  }
  return res.json();
}

export async function getWorldOperation(
  operationId: string,
  account: WorldLabsAccount = 'default'
): Promise<MarbleOperation> {
  const qs = new URLSearchParams({ account });
  const res = await fetch(`${BASE_URL}/api/worlds/operations/${operationId}?${qs.toString()}`);
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Operation request failed');
  }
  return res.json();
}

export async function getWorld(
  worldId: string,
  account: WorldLabsAccount = 'default'
): Promise<MarbleWorld> {
  const qs = new URLSearchParams({ account });
  const res = await fetch(`${BASE_URL}/api/worlds/${worldId}?${qs.toString()}`);
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
