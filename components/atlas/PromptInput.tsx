'use client';

import Link from 'next/link';
import { useState, useRef, useEffect } from 'react';
import { useSceneStore } from '@/state/sceneStore';

const HUMANITIES_TRACK = {
  subtitle: 'Han Dynasty Village',
  description: 'Explore Eastern Han village life with contextual historical guidance.',
  launchLabel: 'Enter Han Dynasty',
  worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
  sceneLabel: 'Han Dynasty Village',
} as const;

const STEM_TRACK = {
  subtitle: 'Photosynthesis Lab',
  description: 'Walk through an interactive chloroplast demo and ask your AI science guide questions.',
  launchLabel: 'Start STEM Experiment',
  worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
  sceneLabel: 'Photosynthesis Lab',
} as const;

export function PromptInput() {
  const { loadWorldById, reset, isLoading, loadingStep, sceneGraph, error, prompt } =
    useSceneStore();
  const [showHelp, setShowHelp] = useState(false);
  const [trackView, setTrackView] = useState<'split' | 'humanities' | 'stem'>('split');
  const [humanitiesPromptInput, setHumanitiesPromptInput] = useState('Han Dynasty Village');
  const [stemPromptInput, setStemPromptInput] = useState('Photosynthesis Lab');
  const launchBtnRef = useRef<HTMLButtonElement>(null);
  const humanitiesSelectRef = useRef<HTMLButtonElement>(null);
  const hasScene = !!sceneGraph;

  useEffect(() => {
    if (hasScene) return;
    if (trackView === 'split') {
      humanitiesSelectRef.current?.focus();
      return;
    }
    launchBtnRef.current?.focus();
  }, [hasScene, trackView]);

  const handleStartHumanities = () => {
    if (isLoading) return;
    void loadWorldById(HUMANITIES_TRACK.worldId, HUMANITIES_TRACK.sceneLabel);
  };

  const handleStartStem = () => {
    if (isLoading) return;
    void loadWorldById(STEM_TRACK.worldId, STEM_TRACK.sceneLabel, { account: 'stem' });
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
            placeholder="Selected learning track"
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
          <span className="atlas-logo-sub">Immersive Learning Tracks</span>
        </div>

        {trackView === 'split' && (
          <>
            <p className="atlas-hero-desc">
              Choose a track first. Each track opens its own selection view before launch.
            </p>

            <div className="atlas-track-split">
              <button
                ref={humanitiesSelectRef}
                className="atlas-track-pane atlas-track-pane-humanities"
                onClick={() => setTrackView('humanities')}
                disabled={isLoading}
              >
                <span className="atlas-track-pane-kicker">Track</span>
                <span className="atlas-track-pane-title">Humanities</span>
                <span className="atlas-track-pane-subtitle">History and culture walkthroughs</span>
              </button>

              <button
                className="atlas-track-pane atlas-track-pane-stem"
                onClick={() => setTrackView('stem')}
                disabled={isLoading}
              >
                <span className="atlas-track-pane-kicker">Track</span>
                <span className="atlas-track-pane-title">STEM</span>
                <span className="atlas-track-pane-subtitle">Interactive science experiments</span>
              </button>
            </div>
          </>
        )}

        {trackView === 'humanities' && (
          <div className="atlas-track-detail">
            <button
              className="atlas-track-back"
              onClick={() => setTrackView('split')}
              disabled={isLoading}
            >
              ← Back to Tracks
            </button>
            <p className="atlas-track-kicker">Humanities</p>
            <h3 className="atlas-track-detail-title">Prompt</h3>
            <p className="atlas-track-desc">{HUMANITIES_TRACK.description}</p>
            <input
              className="atlas-track-input"
              value={humanitiesPromptInput}
              onChange={(e) => setHumanitiesPromptInput(e.target.value)}
              placeholder="Describe a humanities scene"
              disabled={isLoading}
            />
            <p className="atlas-track-note">
              Prompt customization is coming soon. Current launch uses the curated Han Dynasty world.
            </p>
            <button
              ref={launchBtnRef}
              className="atlas-track-btn"
              onClick={handleStartHumanities}
              disabled={isLoading}
            >
              {HUMANITIES_TRACK.launchLabel}
            </button>
          </div>
        )}

        {trackView === 'stem' && (
          <div className="atlas-track-detail">
            <button
              className="atlas-track-back"
              onClick={() => setTrackView('split')}
              disabled={isLoading}
            >
              ← Back to Tracks
            </button>
            <p className="atlas-track-kicker">STEM</p>
            <h3 className="atlas-track-detail-title">Prompt</h3>
            <p className="atlas-track-desc">{STEM_TRACK.description}</p>
            <input
              className="atlas-track-input"
              value={stemPromptInput}
              onChange={(e) => setStemPromptInput(e.target.value)}
              placeholder="Describe a STEM experiment"
              disabled={isLoading}
            />
            <p className="atlas-track-note">
              Prompt customization is coming soon. Current launch uses a fixed STEM demo world.
            </p>
            <button
              ref={launchBtnRef}
              className="atlas-track-btn atlas-track-btn-stem"
              onClick={handleStartStem}
              disabled={isLoading}
            >
              {STEM_TRACK.launchLabel}
            </button>
          </div>
        )}

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
