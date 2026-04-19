'use client';

import { useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { SceneViewer } from '@/components/atlas/SceneViewer';
import { PromptInput } from '@/components/atlas/PromptInput';
import { AuroraBackground } from '@/components/atlas/AuroraBackground';
import { useSceneStore } from '@/state/sceneStore';
import { checkHealth } from '@/lib/atlas/api';
import '@/styles/atlas.css';

export default function ExplorePage() {
  const { setBackendOnline, loadWorldById } = useSceneStore();
  const [mode, setMode] = useState<'checking' | 'live' | 'backend_only' | 'offline'>('checking');
  const searchParams = useSearchParams();
  const hydratedFromQuery = useRef(false);

  useEffect(() => {
    checkHealth().then((h) => {
      const online = h.status === 'ok';
      setBackendOnline(online);
      if (!online) setMode('offline');
      else if (h.worldLabsEnabled) setMode('live');
      else setMode('backend_only');
    });
  }, [setBackendOnline]);

  useEffect(() => {
    if (hydratedFromQuery.current) return;
    const worldId = searchParams.get('worldId');
    if (!worldId) return;
    const label = searchParams.get('label') || undefined;
    const accountRaw = (searchParams.get('account') || 'default').toLowerCase();
    const account =
      accountRaw === 'stem' || accountRaw === 'humanities'
        ? accountRaw
        : 'default';
    hydratedFromQuery.current = true;
    void loadWorldById(worldId, label, { account });
  }, [loadWorldById, searchParams]);

  return (
    <div className="atlas-root">
      <AuroraBackground />
      <PromptInput />
      <SceneViewer />
    </div>
  );
}
