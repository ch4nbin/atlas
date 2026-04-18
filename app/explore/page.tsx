'use client';

import { useEffect, useState } from 'react';
import { SceneViewer } from '@/components/atlas/SceneViewer';
import { ChatPanel } from '@/components/atlas/ChatPanel';
import { PromptInput } from '@/components/atlas/PromptInput';
import { useSceneStore } from '@/state/sceneStore';
import { checkHealth } from '@/lib/atlas/api';
import '@/styles/atlas.css';

export default function ExplorePage() {
  const { setBackendOnline, sceneGraph } = useSceneStore();
  const [mode, setMode] = useState<'checking' | 'live' | 'demo'>('checking');

  useEffect(() => {
    checkHealth().then((h) => {
      const online = h.status === 'ok';
      setBackendOnline(online);
      setMode(online ? 'live' : 'demo');
    });
  }, [setBackendOnline]);

  return (
    <div className="atlas-root">
      {mode !== 'checking' && (
        <div className={`atlas-mode-badge atlas-mode-${mode}`}>
          {mode === 'live' ? '● Backend connected' : '◎ Demo mode — no backend needed'}
        </div>
      )}
      <PromptInput />
      <SceneViewer />
      {sceneGraph && <ChatPanel />}
    </div>
  );
}
