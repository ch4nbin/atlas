'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '@/state/sceneStore';

const DEV_SCENE_KEY = 'Han Dynasty Village';
const DEV_SCENE_LABEL = 'Han Dynasty Village';
const DEV_WORLD_ID = '7e486a4a-abe4-4505-b9d9-923ec54ac10b';

export function PromptInput() {
  const { loadWorldById, reset, isLoading, loadingStep, sceneGraph, error, prompt } =
    useSceneStore();
  const [localInput, setLocalInput] = useState('');
  const [showHelp, setShowHelp] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const hasScene = !!sceneGraph;

  useEffect(() => {
    if (!hasScene) inputRef.current?.focus();
  }, [hasScene]);

  const handleExplore = () => {
    if (isLoading) return;
    void loadWorldById(DEV_WORLD_ID, DEV_SCENE_LABEL);
  };

  // ── Compact top bar after a scene is loaded ──────────────────────────────
  if (hasScene) {
    return (
      <>
        <div className="atlas-topbar">
          <Link href="/" className="atlas-topbar-home">
            ← Home
          </Link>
          <Link href="/" className="atlas-topbar-label atlas-home-link">
            ATLAS
          </Link>
          <button
            className="atlas-topbar-btn atlas-topbar-btn-secondary"
            onClick={() => reset()}
            disabled={isLoading}
          >
            Back
          </button>
          <input
            className="atlas-topbar-input"
            defaultValue={prompt}
            key={prompt}
            readOnly
            placeholder={DEV_SCENE_LABEL}
            disabled
          />
          <button
            className="atlas-topbar-btn atlas-topbar-btn-secondary atlas-topbar-help"
            onClick={() => setShowHelp((v) => !v)}
            aria-label="Controls help"
          >
            ?
          </button>
        </div>

        {showHelp && (
          <div className="atlas-help-panel">
            <div className="atlas-help-header">
              <span className="atlas-help-title">Controls</span>
              <button className="atlas-chat-close" onClick={() => setShowHelp(false)}>✕</button>
            </div>
            <ul className="atlas-help-list">
              <li><kbd>W A S D</kbd> Move</li>
              <li><kbd>Mouse</kbd> Look around (click canvas to lock)</li>
              <li><kbd>Space</kbd> / <kbd>Shift</kbd> Up / Down</li>
              <li><kbd>C</kbd> Toggle AI guide</li>
              <li><span className="atlas-help-dot" /> Click a glowing spot to inspect it</li>
              <li><kbd>Esc</kbd> Release pointer lock</li>
            </ul>
          </div>
        )}
      </>
    );
  }

  // ── Full-screen hero overlay ─────────────────────────────────────────────
  return (
    <div className="atlas-hero-overlay">
      <Link href="/" className="atlas-overlay-home">← Atlas</Link>
      <div className="atlas-hero-card">
        <div className="atlas-hero-logo">
          <Link href="/" className="atlas-logo-text atlas-home-link">
            ATLAS
          </Link>
          <span className="atlas-logo-sub">AI Historical Exploration</span>
        </div>

        <p className="atlas-hero-desc">
          Step inside history. For now in development, this view is locked to one curated scene.
        </p>

        {/* ── Single dev scene entry point */}
        <div className="atlas-demo-section">
          <p className="atlas-demo-label">Development Scene</p>
          <div className="atlas-demo-row">
            <button
              className="atlas-demo-btn"
              onClick={() => void loadWorldById(DEV_WORLD_ID, DEV_SCENE_LABEL)}
              disabled={isLoading}
            >
              {DEV_SCENE_LABEL}
            </button>
          </div>
        </div>

        <div className="atlas-divider">
          <span>or use quick launch</span>
        </div>

        {/* ── Kept for future scenes; currently maps to the same dev scene */}
        <div className="atlas-input-row">
          <input
            ref={inputRef}
            className="atlas-main-input"
            value={localInput}
            onChange={(e) => setLocalInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleExplore()}
            placeholder="Han Dynasty Village (World Labs demo)"
            disabled={isLoading}
            autoComplete="off"
          />
          <button
            className="atlas-explore-btn"
            onClick={handleExplore}
            disabled={isLoading}
          >
            {isLoading ? <span className="atlas-loading-dot" /> : 'Enter'}
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
