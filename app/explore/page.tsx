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
  const [mode, setMode] = useState<'checking' | 'live' | 'backend_only' | 'offline'>('checking');

  useEffect(() => {
    checkHealth().then((h) => {
      const online = h.status === 'ok';
      setBackendOnline(online);
      if (!online) {
        setMode('offline');
      } else if (h.worldLabsEnabled) {
        setMode('live');
      } else {
        setMode('backend_only');
      }
    });
  }, [setBackendOnline]);

  return (
    <div className="atlas-root">
      {mode !== 'checking' && (
        <div className={`atlas-mode-badge atlas-mode-${mode}`}>
          {mode === 'live' && '● World Labs connected'}
          {mode === 'backend_only' && '◎ Backend connected, WORLDLABS_API_KEY missing'}
          {mode === 'offline' && '◎ Backend offline'}
        </div>
      )}
      <PromptInput />
      <SceneViewer />
      {sceneGraph && <ChatPanel />}
    </div>
  );
}
