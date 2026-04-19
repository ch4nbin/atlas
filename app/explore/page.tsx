'use client';

import { useEffect, useState } from 'react';
import { SceneViewer } from '@/components/atlas/SceneViewer';
import { PromptInput } from '@/components/atlas/PromptInput';
import { AuroraBackground } from '@/components/atlas/AuroraBackground';
import { useSceneStore } from '@/state/sceneStore';
import { checkHealth } from '@/lib/atlas/api';
import '@/styles/atlas.css';

export default function ExplorePage() {
  const { setBackendOnline } = useSceneStore();
  const [mode, setMode] = useState<'checking' | 'live' | 'backend_only' | 'offline'>('checking');

  useEffect(() => {
    checkHealth().then((h) => {
      const online = h.status === 'ok';
      setBackendOnline(online);
      if (!online) setMode('offline');
      else if (h.worldLabsEnabled) setMode('live');
      else setMode('backend_only');
    });
  }, [setBackendOnline]);

  return (
    <div className="atlas-root">
      <AuroraBackground />
      <PromptInput />
      <SceneViewer />
    </div>
  );
}
