'use client';

import { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '@/state/sceneStore';

const DEMO_SCENES = [
  { label: 'Boston Tea Party', key: 'Boston Tea Party' },
  { label: 'Medieval Town Square', key: 'Medieval town square' },
  { label: 'Roman Forum', key: 'Roman Forum' },
];

export function PromptInput() {
  const { loadScene, loadDemoScene, isLoading, loadingStep, sceneGraph, error, prompt } =
    useSceneStore();
  const [localInput, setLocalInput] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);
  const hasScene = !!sceneGraph;

  useEffect(() => {
    if (!hasScene) inputRef.current?.focus();
  }, [hasScene]);

  const handleExplore = () => {
    const p = localInput.trim();
    if (!p || isLoading) return;
    loadScene(p);
  };

  // ── Compact top bar after a scene is loaded ──────────────────────────────
  if (hasScene) {
    return (
      <div className="atlas-topbar">
        <span className="atlas-topbar-label">ATLAS</span>
        <input
          className="atlas-topbar-input"
          defaultValue={prompt}
          key={prompt}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              const v = (e.target as HTMLInputElement).value.trim();
              if (v) loadScene(v);
            }
          }}
          placeholder="Explore another scene…"
          disabled={isLoading}
        />
        <button
          className="atlas-topbar-btn"
          onClick={(e) => {
            const input = (e.currentTarget.previousSibling as HTMLInputElement);
            const v = input?.value?.trim();
            if (v) loadScene(v);
          }}
          disabled={isLoading}
        >
          {isLoading ? '…' : '→'}
        </button>
      </div>
    );
  }

  // ── Full-screen hero overlay ─────────────────────────────────────────────
  return (
    <div className="atlas-hero-overlay">
      <div className="atlas-hero-card">
        <div className="atlas-hero-logo">
          <span className="atlas-logo-text">ATLAS</span>
          <span className="atlas-logo-sub">AI Historical Exploration</span>
        </div>

        <p className="atlas-hero-desc">
          Step inside history. Enter a moment, place, or event below.
        </p>

        {/* ── Instant demo buttons (no backend, no wait) */}
        <div className="atlas-demo-section">
          <p className="atlas-demo-label">Jump in instantly →</p>
          <div className="atlas-demo-row">
            {DEMO_SCENES.map(({ label, key }) => (
              <button
                key={key}
                className="atlas-demo-btn"
                onClick={() => loadDemoScene(key)}
                disabled={isLoading}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        <div className="atlas-divider">
          <span>or describe your own scene</span>
        </div>

        {/* ── Custom prompt input */}
        <div className="atlas-input-row">
          <input
            ref={inputRef}
            className="atlas-main-input"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
            placeholder="e.g. ancient Egyptian marketplace, 1300 BC…"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            className="atlas-explore-btn"
            onClick={handleExplore}
            disabled={isLoading || !localInput.trim()}
          >
            {isLoading ? <span className="atlas-loading-dot" /> : 'Explore'}
          </button>
        </div>

        {isLoading && (
          <div className="atlas-loading-bar">
            <div className="atlas-loading-fill" />
            <span className="atlas-loading-step">{loadingStep || 'Loading…'}</span>
          </div>
        )}

        {error && <div className="atlas-error">{error}</div>}
      </div>
    </div>
  );
}
