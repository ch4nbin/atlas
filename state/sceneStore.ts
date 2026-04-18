import { create } from 'zustand';
import type { SceneGraph, SceneElement, ChatMessage, PromptInterpretation, MarbleWorld } from '@/lib/atlas/types';
import { generateWorld, getWorld, getWorldOperation, sendChat } from '@/lib/atlas/api';
import { getMockScene, getMockChatResponse } from '@/lib/atlas/mockData';

interface SceneState {
  prompt: string;
  isLoading: boolean;
  loadingStep: string;
  interpretation: PromptInterpretation | null;
  sceneGraph: SceneGraph | null;
  world: MarbleWorld | null;
  worldOperationId: string | null;
  focusedElement: SceneElement | null;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  error: string | null;
  backendOnline: boolean;

  setPrompt: (p: string) => void;
  loadScene: (p: string) => Promise<void>;
  loadWorldById: (worldId: string, label?: string) => Promise<void>;
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

  loadWorldById: async (worldId: string, label?: string) => {
    let usedFallback = false;
    set({
      isLoading: true,
      error: null,
      focusedElement: null,
      loadingStep: 'Loading world...',
      world: null,
      worldOperationId: null,
      prompt: label || worldId,
      chatHistory: [],
    });
    try {
      const world = await getWorld(worldId);
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

  loadScene: async (p: string) => {
    const prompt = p.trim();
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
      loadingStep: 'Submitting world generation request...',
    });

    try {
      const operation = await generateWorld(prompt);
      if (!operation.operation_id) {
        throw new Error('World Labs did not return an operation id.');
      }

      set({
        worldOperationId: operation.operation_id,
        loadingStep: 'World generation started...',
      });

      let world: MarbleWorld | null = operation.response || null;
      const maxPollAttempts = 120;
      for (let attempt = 0; attempt < maxPollAttempts; attempt++) {
        const op = await getWorldOperation(operation.operation_id);

        if (op.error) {
          throw new Error(op.error.message || 'World generation failed.');
        }

        const progressDescription = op.metadata?.progress?.description;
        if (progressDescription) {
          set({ loadingStep: progressDescription });
        }

        if (op.done) {
          if (op.response?.world_marble_url) {
            world = op.response;
          } else {
            const worldId = op.metadata?.world_id;
            if (!worldId) throw new Error('World generation completed without a world id.');
            world = await getWorld(worldId);
          }
          break;
        }

        await sleep(2500);
      }

      if (!world || !world.world_marble_url) {
        throw new Error('World generation timed out or returned no marble URL.');
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
      focusedElement: null,
      chatHistory: [],
      isChatLoading: false,
      error: null,
    }),
}));
