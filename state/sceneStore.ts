import { create } from 'zustand';
import type {
  SceneGraph,
  SceneElement,
  ChatMessage,
  PromptInterpretation,
  MarbleWorld,
  StemExperimentState,
} from '@/lib/atlas/types';
import { generateWorld, getWorld, getWorldOperation, sendChat } from '@/lib/atlas/api';
import { getMockScene } from '@/lib/atlas/mockData';

type WorldLabsAccount = 'default' | 'stem' | 'humanities';
const STEM_STEP_ORDER = [
  { id: 'sunlight_lamp', label: 'Sunlight Simulation Lamp' },
  { id: 'water_channel', label: 'Water Transport Channel' },
  { id: 'stomata_gate', label: 'Stomata CO2 Intake Gate' },
  { id: 'chloroplast_core', label: 'Chloroplast Reactor' },
  { id: 'glucose_meter', label: 'Glucose Output Meter' },
] as const;

interface SceneState {
  prompt: string;
  isLoading: boolean;
  loadingStep: string;
  interpretation: PromptInterpretation | null;
  sceneGraph: SceneGraph | null;
  world: MarbleWorld | null;
  worldOperationId: string | null;
  worldLabsAccount: WorldLabsAccount;
  stemExperiment: StemExperimentState | null;
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
  triggerStemInteraction: (element: SceneElement) => void;
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

function sanitizeErrorMessage(input: string): string {
  let msg = input || 'Unknown error';
  // Redact common env assignment leaks.
  msg = msg.replace(
    /(WORLDLABS(?:_STEM)?_API_KEY\s*=\s*)([^\s]+)/gi,
    '$1[REDACTED]'
  );
  msg = msg.replace(/(GEMINI_API_KEY\s*=\s*)([^\s]+)/gi, '$1[REDACTED]');
  msg = msg.replace(/(OPENAI_API_KEY\s*=\s*)([^\s]+)/gi, '$1[REDACTED]');
  // Redact long token-like strings.
  msg = msg.replace(/[A-Za-z0-9_\-]{24,}/g, '[REDACTED]');
  return msg;
}

function welcomeMessage(sceneGraph: SceneGraph, assumptions: string[]): ChatMessage {
  return {
    id: makeId(),
    role: 'assistant',
    content: `Welcome to ${sceneGraph.setting.location} — ${sceneGraph.setting.time_period}. Click on any object to focus on it, then ask me about it.${assumptions[0] ? ` (${assumptions[0]})` : ''}`,
    timestamp: Date.now(),
  };
}

function isStemScene(sceneGraph: SceneGraph | null): boolean {
  if (!sceneGraph) return false;
  if (sceneGraph.scene_type === 'science_experiment') return true;
  const p = `${sceneGraph.setting.location} ${sceneGraph.setting.time_period}`.toLowerCase();
  return p.includes('plant cell') || p.includes('photosynthesis');
}

function stemTipForStep(stepIndex: number): string {
  if (stepIndex === 0) return 'Start by activating the sunlight source.';
  if (stepIndex === 1) return 'Great. Now add water transport to the plant.';
  if (stepIndex === 2) return 'Next, open stomata to intake CO2.';
  if (stepIndex === 3) return 'Now trigger the chloroplast reaction center.';
  if (stepIndex === 4) return 'Finally, inspect glucose output to complete the cycle.';
  return 'Cycle complete. Ask the guide why each step mattered.';
}

function makeStemExperimentState(): StemExperimentState {
  return {
    isActive: true,
    currentStep: 0,
    totalSteps: STEM_STEP_ORDER.length,
    nextTargetId: STEM_STEP_ORDER[0].id,
    nextTargetLabel: STEM_STEP_ORDER[0].label,
    completedStepIds: [],
    resources: { light: false, water: false, co2: false },
    plantGrowth: 0,
    oxygenLevel: 0,
    lastAction: null,
    tip: stemTipForStep(0),
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
  stemExperiment: null,
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
        stemExperiment: isStemScene(sceneGraph) ? makeStemExperimentState() : null,
        chatHistory: [welcomeMessage(sceneGraph, ['Loaded from World Labs world ID'])],
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Unknown error';
      set({ error: sanitizeErrorMessage(msg) });
    } finally {
      set({ isLoading: false, loadingStep: '' });
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
      stemExperiment: isStemScene(sceneGraph) ? makeStemExperimentState() : null,
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
      set({ error: sanitizeErrorMessage(msg) });
    } finally {
      set({ isLoading: false, loadingStep: '' });
    }
  },

  triggerStemInteraction: (element: SceneElement) => {
    set((state) => {
      const exp = state.stemExperiment;
      if (!exp || !exp.isActive) return state;

      const expected = STEM_STEP_ORDER[exp.currentStep];
      const now = Date.now();
      if (!expected) return state;

      if (element.id !== expected.id) {
        const guidance: ChatMessage = {
          id: makeId(),
          role: 'assistant',
          content: `Try this next: ${expected.label}. ${exp.tip}`,
          timestamp: now,
        };
        return { ...state, chatHistory: [...state.chatHistory, guidance] };
      }

      const nextStep = exp.currentStep + 1;
      const completedStepIds = [...exp.completedStepIds, element.id];
      const resources = { ...exp.resources };
      if (element.id === 'sunlight_lamp') resources.light = true;
      if (element.id === 'water_channel') resources.water = true;
      if (element.id === 'stomata_gate') resources.co2 = true;

      const growthByStep = [4, 9, 15, 22, 30];
      const oxygenByStep = [0, 2, 5, 9, 14];
      const plantGrowth = growthByStep[Math.min(nextStep - 1, growthByStep.length - 1)];
      const oxygenLevel = oxygenByStep[Math.min(nextStep - 1, oxygenByStep.length - 1)];
      const nextTarget = STEM_STEP_ORDER[nextStep] || null;
      const tip = nextTarget ? stemTipForStep(nextStep) : 'Cycle complete. Ask the guide to explain the result.';

      const updated: StemExperimentState = {
        ...exp,
        currentStep: Math.min(nextStep, exp.totalSteps),
        nextTargetId: nextTarget?.id || null,
        nextTargetLabel: nextTarget?.label || null,
        completedStepIds,
        resources,
        plantGrowth,
        oxygenLevel,
        lastAction: element.id,
        tip,
      };

      const progressMsg: ChatMessage = {
        id: makeId(),
        role: 'assistant',
        content: nextTarget
          ? `Nice. ${element.name} activated. Plant growth is now ${plantGrowth}%. ${tip}`
          : `Excellent. You completed the photosynthesis cycle. Plant growth is ${plantGrowth}% and oxygen release is ${oxygenLevel}%.`,
        timestamp: now,
      };

      return {
        ...state,
        stemExperiment: updated,
        chatHistory: [...state.chatHistory, progressMsg],
      };
    });
  },

  setFocusedElement: (el) => set({ focusedElement: el }),

  sendChatMessage: async (msg: string) => {
    const { sceneGraph, focusedElement, chatHistory } = get();
    const { stemExperiment } = get();
    const userMsg: ChatMessage = { id: makeId(), role: 'user', content: msg, timestamp: Date.now() };
    set((s) => ({ chatHistory: [...s.chatHistory, userMsg], isChatLoading: true }));

    try {
      const { response, audioBase64 } = await sendChat(sceneGraph, focusedElement, msg, stemExperiment, [
        ...chatHistory.map((m) => ({ role: m.role, content: m.content })),
        { role: 'user', content: msg },
      ]);
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { id: makeId(), role: 'assistant', content: response, audioBase64, timestamp: Date.now() },
        ],
      }));
    } catch (err: unknown) {
      const failureMsg =
        err instanceof Error && err.message
          ? `Chat unavailable: ${sanitizeErrorMessage(err.message)}`
          : 'Chat unavailable: Gemini/backend is currently unavailable.';
      set((s) => ({
        chatHistory: [
          ...s.chatHistory,
          { id: makeId(), role: 'assistant', content: failureMsg, timestamp: Date.now() },
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
      stemExperiment: null,
      focusedElement: null,
      chatHistory: [],
      isChatLoading: false,
      error: null,
    }),
}));
