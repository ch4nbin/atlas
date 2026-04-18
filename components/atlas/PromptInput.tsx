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

interface MapData {
  id: string;
  title: string;
  track: 'humanities' | 'stem';
  icon: string;
  shortDescription: string;
  longDescription: string;
  worldId: string;
  sceneLabel: string;
}

const LIBRARY_MAPS: MapData[] = [
  {
    id: 'han-dynasty',
    title: 'Han Dynasty Village',
    track: 'humanities',
    icon: '🏮',
    shortDescription: 'Eastern Han village life, 25–220 CE.',
    longDescription: 'Wander through a reconstructed Eastern Han village and interact with market stalls, a Confucian academy, and a riverside dock. Your AI historical guide explains daily routines, social hierarchies, and the administrative innovations that defined the era.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Han Dynasty Village',
  },
  {
    id: 'roman-forum',
    title: 'Roman Forum',
    track: 'humanities',
    icon: '🏛️',
    shortDescription: 'Heart of the Roman Republic, 100 BCE.',
    longDescription: 'Stand at the centre of Roman civic life during the late Republic. Explore the Temple of Saturn, the Rostra, and the Basilica Aemilia while your guide narrates senatorial debates, religious rites, and the commerce that flowed through Rome\'s public square.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Roman Forum',
  },
  {
    id: 'ancient-egypt',
    title: 'Ancient Egypt',
    track: 'humanities',
    icon: '🪬',
    shortDescription: 'New Kingdom Egypt, Thebes circa 1350 BCE.',
    longDescription: 'Walk through a Theban neighbourhood during the reign of Amenhotep III. Visit a scribal house, a temple precinct, and a craftsman\'s workshop. Your guide contextualises hieroglyphic inscriptions, funerary beliefs, and the role of the Nile in shaping Egyptian civilisation.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Ancient Egypt',
  },
  {
    id: 'medieval-castle',
    title: 'Medieval Castle',
    track: 'humanities',
    icon: '🏰',
    shortDescription: 'Norman motte-and-bailey, England 1150 CE.',
    longDescription: 'Explore a Norman castle complex — great hall, chapel, armory, and bailey market — as it would have appeared in the mid-twelfth century. The historical guide covers feudal obligations, medieval warfare, and how castle design evolved from motte-and-bailey to stone keeps.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Medieval Castle',
  },
  {
    id: 'photosynthesis-lab',
    title: 'Photosynthesis Lab',
    track: 'stem',
    icon: '🌿',
    shortDescription: 'Inside a chloroplast — light reactions & Calvin cycle.',
    longDescription: 'Shrink down into a chloroplast and observe the light-dependent reactions on the thylakoid membrane and the Calvin cycle in the stroma. Hotspots highlight photosystem II, ATP synthase, and rubisco. Ask your AI science guide anything as you explore.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Photosynthesis Lab',
  },
  {
    id: 'cellular-respiration',
    title: 'Cellular Respiration',
    track: 'stem',
    icon: '⚡',
    shortDescription: 'Mitochondria — glycolysis, Krebs cycle, ETC.',
    longDescription: 'Tour the mitochondrion and follow glucose through glycolysis in the cytoplasm, into the Krebs cycle in the matrix, and through the electron transport chain on the inner membrane. Your guide explains ATP yield, proton gradients, and why oxygen is the final electron acceptor.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Cellular Respiration',
  },
  {
    id: 'dna-helix',
    title: 'DNA Helix',
    track: 'stem',
    icon: '🧬',
    shortDescription: 'Walk along a double helix and explore replication.',
    longDescription: 'Navigate a giant-scale model of a DNA double helix. Inspect base-pair hydrogen bonds, the sugar-phosphate backbone, and a replication fork in action. Hotspots cover DNA polymerase, Okazaki fragments, and the role of helicase — narrated by your AI science guide.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'DNA Helix',
  },
  {
    id: 'atom-structure',
    title: 'Atom Structure',
    track: 'stem',
    icon: '⚛️',
    shortDescription: 'Electron shells, orbitals, and quantum numbers.',
    longDescription: 'Orbit a carbon atom nucleus and visit each electron shell. Your guide explains the Bohr model versus the quantum mechanical model, how orbital shapes (s, p, d) emerge from wave functions, and how electron configuration drives chemical bonding.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Atom Structure',
  },
];

export function PromptInput() {
  const { loadWorldById, reset, isLoading, loadingStep, sceneGraph, error, prompt } =
    useSceneStore();
  const [showHelp, setShowHelp] = useState(false);
  const [trackView, setTrackView] = useState<'split' | 'humanities' | 'stem'>('split');
  const [humanitiesPromptInput, setHumanitiesPromptInput] = useState('Han Dynasty Village');
  const [stemPromptInput, setStemPromptInput] = useState('Photosynthesis Lab');
  const [showLibrary, setShowLibrary] = useState(false);
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const launchBtnRef = useRef<HTMLButtonElement>(null);
  const humanitiesSelectRef = useRef<HTMLButtonElement>(null);
  const hasScene = !!sceneGraph;

  const currentTrack = trackView === 'humanities' ? 'humanities' : trackView === 'stem' ? 'stem' : null;
  const libraryMaps = currentTrack ? LIBRARY_MAPS.filter((m) => m.track === currentTrack) : [];

  useEffect(() => {
    if (hasScene) return;
    if (trackView === 'split') {
      humanitiesSelectRef.current?.focus();
      return;
    }
    launchBtnRef.current?.focus();
  }, [hasScene, trackView]);

  const handleStartHumanities = (worldId = HUMANITIES_TRACK.worldId, label = HUMANITIES_TRACK.sceneLabel) => {
    if (isLoading) return;
    void loadWorldById(worldId, label);
  };

  const handleStartStem = (worldId = STEM_TRACK.worldId, label = STEM_TRACK.sceneLabel) => {
    if (isLoading) return;
    void loadWorldById(worldId, label, { account: 'stem' });
  };

  const handleEnterMap = (map: MapData) => {
    if (map.track === 'humanities') handleStartHumanities(map.worldId, map.sceneLabel);
    else handleStartStem(map.worldId, map.sceneLabel);
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
            <button
              className="atlas-library-btn"
              onClick={() => { setShowLibrary(true); setSelectedMap(null); }}
              disabled={isLoading}
              type="button"
            >
              Browse Library
            </button>
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
              onClick={() => handleStartHumanities()}
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
            <button
              className="atlas-library-btn"
              onClick={() => { setShowLibrary(true); setSelectedMap(null); }}
              disabled={isLoading}
              type="button"
            >
              Browse Library
            </button>
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
              onClick={() => handleStartStem()}
              disabled={isLoading}
            >
              {STEM_TRACK.launchLabel}
            </button>
          </div>
        )}

        {/* ── Library modal ─────────────────────────────────────────── */}
        {showLibrary && (
          <div className="atlas-library-overlay" onClick={() => { setShowLibrary(false); setSelectedMap(null); }}>
            <div className="atlas-library-modal" onClick={(e) => e.stopPropagation()}>
              {selectedMap ? (
                /* Map detail view */
                <>
                  <div className="atlas-library-modal-header">
                    <button
                      className="atlas-track-back"
                      onClick={() => setSelectedMap(null)}
                      type="button"
                    >
                      ← Back
                    </button>
                    <button
                      className="atlas-chat-close"
                      onClick={() => { setShowLibrary(false); setSelectedMap(null); }}
                      aria-label="Close library"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="atlas-map-detail-icon">{selectedMap.icon}</div>
                  <h3 className="atlas-map-detail-title">{selectedMap.title}</h3>
                  <p className="atlas-map-detail-desc">{selectedMap.longDescription}</p>
                  <button
                    className={`atlas-track-btn${selectedMap.track === 'stem' ? ' atlas-track-btn-stem' : ''}`}
                    onClick={() => handleEnterMap(selectedMap)}
                    disabled={isLoading}
                    type="button"
                  >
                    Enter {selectedMap.title}
                  </button>
                </>
              ) : (
                /* Grid view */
                <>
                  <div className="atlas-library-modal-header">
                    <span className="atlas-library-modal-title">
                      {currentTrack === 'humanities' ? 'Humanities' : 'STEM'} Library
                    </span>
                    <button
                      className="atlas-chat-close"
                      onClick={() => setShowLibrary(false)}
                      aria-label="Close library"
                      type="button"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="atlas-library-grid">
                    {libraryMaps.map((map) => (
                      <button
                        key={map.id}
                        className="atlas-library-card"
                        onClick={() => setSelectedMap(map)}
                        type="button"
                      >
                        <span className="atlas-library-card-icon">{map.icon}</span>
                        <span className="atlas-library-card-title">{map.title}</span>
                        <span className="atlas-library-card-desc">{map.shortDescription}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
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
