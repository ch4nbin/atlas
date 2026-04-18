import { create } from 'zustand';
import type { SceneGraph, SceneElement, ChatMessage, PromptInterpretation, MarbleWorld } from '@/lib/atlas/types';
import { generateWorld, getWorld, getWorldOperation, sendChat } from '@/lib/atlas/api';
import { getMockScene, getMockChatResponse } from '@/lib/atlas/mockData';

type WorldLabsAccount = 'default' | 'stem';

interface SceneState {
  prompt: string;
  isLoading: boolean;
  loadingStep: string;
  interpretation: PromptInterpretation | null;
  sceneGraph: SceneGraph | null;
  world: MarbleWorld | null;
  worldOperationId: string | null;
  worldLabsAccount: WorldLabsAccount;
  focusedElement: SceneElement | null;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  error: string | null;
  backendOnline: boolean;

  setPrompt: (p: string) => void;
  loadScene: (p: string, options?: { account?: WorldLabsAccount }) => Promise<void>;
  loadWorldById: (worldId: string, label?: string, options?: { account?: WorldLabsAccount }) => Promise<void>;
  refreshCurrentWorld: () => Promise<void>;
  loadDemoScene: (sceneKey: string) => void;
  setFocusedElement: (el: SceneElement | null) => void;
  sendChatMessage: (msg: string) => Promise<void>;
  setBackendOnline: (online: boolean) => void;
  reset: () => void;
}

let msgCounter = 0;
function makeId() {
  return `msg_${++msgCounter}_${Date.now()}`;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatElapsed(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  if (mins <= 0) return `${secs}s`;
  return `${mins}m ${secs}s`;
}

function hasRenderableSplat(world: MarbleWorld | null): boolean {
  if (!world) return false;
  const spz = world.assets?.splats?.spz_urls;
  return !!(spz?.['500k'] || spz?.['100k'] || spz?.full_res);
}

function welcomeMessage(sceneGraph: SceneGraph, assumptions: string[]): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    content: `Welcome to ${sceneGraph.setting.location} — ${sceneGraph.setting.time_period}. Click on any object to focus on it, then ask me about it.${assumptions[0] ? ` (${assumptions[0]})` : ''}`,
    timestamp: Date.now(),
  };
}

export const useSceneStore = create<SceneState>((set, get) => ({
  prompt: '',
  isLoading: false,
  loadingStep: '',
  interpretation: null,
  sceneGraph: null,
  world: null,
  worldOperationId: null,
  worldLabsAccount: 'default',
  focusedElement: null,
  chatHistory: [],
  isChatLoading: false,
  error: null,
  backendOnline: false,

  setPrompt: (p) => set({ prompt: p }),
  setBackendOnline: (online) => set({ backendOnline: online }),

  loadDemoScene: (sceneKey: string) => {
    void get().loadScene(sceneKey);
  },

  refreshCurrentWorld: async () => {
    const { world, worldLabsAccount } = get();
    const worldId = world?.id || world?.world_id;
    if (!worldId) return;
    try {
      const refreshed = await getWorld(worldId, worldLabsAccount);
      set({ world: refreshed });
    } catch {
      // Silent background retry; UI already has fallback action.
    }
  },

  loadWorldById: async (worldId: string, label?: string, options?: { account?: WorldLabsAccount }) => {
    const account = options?.account || 'default';
    let usedFallback = false;
    set({
      isLoading: true,
      error: null,
      focusedElement: null,
      loadingStep: 'Loading world...',
      world: null,
      worldOperationId: null,
      worldLabsAccount: account,
      prompt: label || worldId,
      chatHistory: [],
    });
    try {
      let world = await getWorld(worldId, account);

      // Keep behavior consistent with curated Humanities load: wait briefly for SPZ
      // assets to become available so the in-app Spark viewer can start.
      if (!hasRenderableSplat(world)) {
        set({ loadingStep: 'Preparing world assets for in-app viewer...' });
        const maxAssetPolls = 30;
        for (let i = 0; i < maxAssetPolls; i++) {
          await sleep(2000);
          world = await getWorld(worldId, account);
          if (hasRenderableSplat(world)) break;
        }
      }

      const sceneGraph = getMockScene(label || world.display_name || 'Han Dynasty Village');
      set({
        world,
        sceneGraph,
        chatHistory: [welcomeMessage(sceneGraph, ['Loaded from World Labs world ID'])],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      if (msg.includes('World not found') && label) {
        usedFallback = true;
        await get().loadScene(label);
        return;
      }
      set({ error: msg });
    } finally {
      if (!usedFallback) {
        set({ isLoading: false, loadingStep: '' });
      }
    }
  },

  loadScene: async (p: string, options?: { account?: WorldLabsAccount }) => {
    const prompt = p.trim();
    const account = options?.account || 'default';
    const sceneGraph = getMockScene(prompt);
    set({
      isLoading: true,
      error: null,
      focusedElement: null,
      chatHistory: [welcomeMessage(sceneGraph, [`Using World Labs generation for: ${prompt}`])],
      prompt,
      sceneGraph,
      world: null,
      worldOperationId: null,
      worldLabsAccount: account,
      loadingStep: 'Submitting world generation request...',
    });

    try {
      const operation = await generateWorld(prompt, 'marble-1.1', account);
      if (!operation.operation_id) {
        throw new Error('World Labs did not return an operation id.');
      }

      set({
        worldOperationId: operation.operation_id,
        loadingStep: 'World generation started... this can take a few minutes.',
      });

      let world: MarbleWorld | null = operation.response || null;
      const pollIntervalMs = 2500;
      const maxPollAttempts = 240;
      const startedAt = Date.now();
      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        const op = await getWorldOperation(operation.operation_id, account);

        if (op.error) {
          throw new Error(op.error.message || 'World generation failed.');
        }

        const progressDescription = op.metadata?.progress?.description;
        if (progressDescription) {
          set({ loadingStep: progressDescription });
        } else if (attempt % 4 === 0) {
          const elapsedSeconds = Math.floor((Date.now() - startedAt) / 1000);
          set({
            loadingStep: `World generation in progress... (${formatElapsed(elapsedSeconds)} elapsed)`,
          });
        }

        if (op.done) {
          if (op.response?.world_marble_url) {
            world = op.response;
          } else {
            const worldId = op.metadata?.world_id;
            if (!worldId) throw new Error('World generation completed without a world id.');
            world = await getWorld(worldId, account);
          }
          break;
        }

        // Some providers expose world_id before done=true. Try early fetch so UI
        // doesn't appear stuck when the world is actually already available.
        const provisionalWorldId = op.metadata?.world_id;
        if (provisionalWorldId && attempt % 3 === 0) {
          try {
            const provisionalWorld = await getWorld(provisionalWorldId, account);
            if (provisionalWorld?.world_marble_url) {
              world = provisionalWorld;
              set({ loadingStep: 'World ready.' });
              break;
            }
          } catch {
            // Keep polling until the world becomes available.
          }
        }

        await sleep(pollIntervalMs);
      }

      if (!world || !world.world_marble_url) {
        throw new Error(
          `World generation timed out after ${Math.round(
            (maxPollAttempts * pollIntervalMs) / 60000
          )} minutes (operation: ${operation.operation_id}).`
        );
      }

      set({ world, loadingStep: 'World ready.' });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: msg });
    } finally {
      set({ isLoading: false, loadingStep: '' });
    }
  },

  setFocusedElement: (el) => set({ focusedElement: el }),

  sendChatMessage: async (msg: string) => {
    const { sceneGraph, focusedElement } = get();
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: msg, timestamp: Date.now() };
    set((s) => ({ chatHistory: [...s.chatHistory, userMsg], isChatLoading: true }));

    try {
      const response = await sendChat(sceneGraph, focusedElement, msg);
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { id: makeId(), role: 'assistant', content: response, timestamp: Date.now() },
        ],
      }));
    } catch {
      const fallback = getMockChatResponse(msg, focusedElement, sceneGraph);
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { id: makeId(), role: 'assistant', content: fallback, timestamp: Date.now() },
        ],
      }));
    } finally {
      set({ isChatLoading: false });
    }
  },

  reset: () =>
    set({
      prompt: '',
      isLoading: false,
      loadingStep: '',
      interpretation: null,
      sceneGraph: null,
      world: null,
      worldOperationId: null,
      worldLabsAccount: 'default',
      focusedElement: null,
      chatHistory: [],
      isChatLoading: false,
      error: null,
    }),
}));
