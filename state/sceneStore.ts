import { create } from 'zustand';
import type { SceneGraph, SceneElement, ChatMessage, PromptInterpretation } from '@/lib/atlas/types';
import { interpretPrompt, generateScene, sendChat } from '@/lib/atlas/api';
import { getMockScene, getMockChatResponse } from '@/lib/atlas/mockData';

interface SceneState {
  prompt: string;
  isLoading: boolean;
  loadingStep: string;
  interpretation: PromptInterpretation | null;
  sceneGraph: SceneGraph | null;
  focusedElement: SceneElement | null;
  chatHistory: ChatMessage[];
  isChatLoading: boolean;
  error: string | null;
  backendOnline: boolean;

  setPrompt: (p: string) => void;
  loadScene: (p: string) => Promise<void>;
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
  focusedElement: null,
  chatHistory: [],
  isChatLoading: false,
  error: null,
  backendOnline: false,

  setPrompt: (p) => set({ prompt: p }),
  setBackendOnline: (online) => set({ backendOnline: online }),

  // Bypasses all API calls — instant, zero-dependency
  loadDemoScene: (sceneKey: string) => {
    const sceneGraph = getMockScene(sceneKey);
    set({
      sceneGraph,
      prompt: sceneKey,
      focusedElement: null,
      error: null,
      chatHistory: [welcomeMessage(sceneGraph, [`Demo scene: ${sceneKey}`])],
    });
  },

  loadScene: async (p: string) => {
    set({ isLoading: true, error: null, focusedElement: null, chatHistory: [], prompt: p });
    try {
      set({ loadingStep: 'Interpreting your prompt...' });
      const interpretation = await interpretPrompt(p);

      set({ interpretation, loadingStep: 'Generating scene...' });
      const sceneGraph = await generateScene(interpretation, p);

      set({
        sceneGraph,
        loadingStep: '',
        chatHistory: [welcomeMessage(sceneGraph, interpretation.assumptions)],
      });
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
      focusedElement: null,
      chatHistory: [],
      isChatLoading: false,
      error: null,
    }),
}));
