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
  account?: 'default' | 'stem' | 'humanities';
  icon: string;
  previewImage: string;
  shortDescription: string;
  longDescription: string;
  worldId: string;
  sceneLabel: string;
}

const LIBRARY_MAPS: MapData[] = [
  // ── Humanities ──────────────────────────────────────────────────────────
  {
    id: 'han-dynasty',
    title: 'Han Dynasty Village',
    track: 'humanities',
    icon: '🏮',
    previewImage: '🏮',
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
    previewImage: '🏛️',
    shortDescription: 'Heart of the Roman Republic, 100 BCE.',
    longDescription: "Stand at the centre of Roman civic life during the late Republic. Explore the Temple of Saturn, the Rostra, and the Basilica Aemilia while your guide narrates senatorial debates, religious rites, and the commerce that flowed through Rome's public square.",
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Roman Forum',
  },
  {
    id: 'ancient-egypt',
    title: 'Ancient Egypt',
    track: 'humanities',
    icon: '🏺',
    previewImage: '🏺',
    shortDescription: 'New Kingdom Egypt, Thebes circa 1350 BCE.',
    longDescription: "Walk through a Theban neighbourhood during the reign of Amenhotep III. Visit a scribal house, a temple precinct, and a craftsman's workshop. Your guide contextualises hieroglyphic inscriptions, funerary beliefs, and the role of the Nile in shaping Egyptian civilisation.",
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Ancient Egypt',
  },
  {
    id: 'medieval-castle',
    title: 'Medieval Castle',
    track: 'humanities',
    account: 'humanities',
    icon: '🏰',
    previewImage: '🏰',
    shortDescription: 'Norman motte-and-bailey, England 1150 CE.',
    longDescription: 'Explore a Norman castle complex — great hall, chapel, armory, and bailey market — as it would have appeared in the mid-twelfth century. The historical guide covers feudal obligations, medieval warfare, and how castle design evolved from motte-and-bailey to stone keeps.',
    worldId: '7dedbd85-3dbd-49b3-8750-9280aaca1da5',
    sceneLabel: 'Medieval Castle',
  },
  {
    id: 'viking-settlement',
    title: 'Viking Settlement',
    track: 'humanities',
    icon: '⚔️',
    previewImage: '⚔️',
    shortDescription: 'Norse longhouse village, Scandinavia 900 CE.',
    longDescription: 'Step into a coastal Norse settlement at the height of the Viking Age. Explore a timber longhouse, a boatyard under construction, and a Thing assembly ground. Your guide covers Norse mythology, seafaring technology, trade networks across the North Atlantic, and the social structures of jarls and thralls.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Viking Settlement',
  },
  {
    id: 'aztec-temple',
    title: 'Aztec Temple',
    track: 'humanities',
    icon: '🦅',
    previewImage: '🦅',
    shortDescription: 'Tenochtitlán temple district, 1450 CE.',
    longDescription: 'Ascend the steps of the Templo Mayor in the Aztec capital Tenochtitlán. Explore the twin shrines of Huitzilopochtli and Tlaloc, the surrounding ritual precinct, and the bustling market of Tlatelolco. Your AI guide explains Aztec cosmology, tribute systems, and the chinampas agriculture that sustained the island city.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Aztec Temple',
  },
  {
    id: 'ancient-greece',
    title: 'Ancient Greece',
    track: 'humanities',
    icon: '🏟️',
    previewImage: '🏟️',
    shortDescription: 'Classical Athens, the Agora, 450 BCE.',
    longDescription: 'Walk the Athenian Agora during the Golden Age of Pericles. Visit the Stoa of Zeus, the mint, and the law courts, then climb to the Acropolis. Your guide illuminates direct democracy, Socratic philosophy, the role of drama in Athenian life, and the tensions that would eventually bring down the city-state.',
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Ancient Greece',
  },
  {
    id: 'silk-road-market',
    title: 'Silk Road Market',
    track: 'humanities',
    icon: '🐫',
    previewImage: '🐫',
    shortDescription: 'Central Asian trading post, 800 CE.',
    longDescription: "Arrive at a Sogdian caravanserai on the Central Asian steppe during the Tang Dynasty. Browse stalls selling silk, spices, glassware, and manuscripts, and meet merchants from China, Persia, and the Byzantine Empire. Your guide explains the exchange of goods, faiths, and ideas that made the Silk Road the ancient world's information superhighway.",
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Silk Road Market',
  },
  {
    id: 'byzantine-constantinople',
    title: 'Byzantine Constantinople',
    track: 'humanities',
    icon: '⛪',
    previewImage: '⛪',
    shortDescription: 'Eastern Roman capital, 500 CE.',
    longDescription: "Wander the streets of Constantinople at the height of Justinian's reign. Marvel at the Hagia Sophia under construction, explore the Hippodrome during a chariot race, and visit the bustling Golden Horn harbour. Your guide covers Byzantine theology, the Justinianic Code, and how the Eastern Empire preserved Greco-Roman knowledge through the Dark Ages.",
    worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    sceneLabel: 'Byzantine Constantinople',
  },
  {
    id: 'japanese-edo',
    title: 'Japanese Edo Period',
    track: 'humanities',
    account: 'humanities',
    icon: '⛩️',
    previewImage: '⛩️',
    shortDescription: 'Edo city life, Japan 1700 CE.',
    longDescription: 'Explore the streets of Edo (modern-day Tokyo) during the Tokugawa shogunate. Visit a kabuki theatre, a woodblock print workshop, a samurai estate, and a merchant quarter in the shitamachi district. Your guide explains the four-estate caste system, sakoku isolation policy, the rise of ukiyo-e art, and how peace transformed a warrior culture.',
    worldId: '6396d2c0-d8be-448d-9a5f-2ca643e10a3c',
    sceneLabel: 'Japanese Edo Period',
  },
  // ── STEM ────────────────────────────────────────────────────────────────
  {
    id: 'photosynthesis-lab',
    title: 'Photosynthesis Lab',
    track: 'stem',
    icon: '🌿',
    previewImage: '🌿',
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
    previewImage: '⚡',
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
    previewImage: '🧬',
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
    previewImage: '⚛️',
    shortDescription: 'Electron shells, orbitals, and quantum numbers.',
    longDescription: 'Orbit a carbon atom nucleus and visit each electron shell. Your guide explains the Bohr model versus the quantum mechanical model, how orbital shapes (s, p, d) emerge from wave functions, and how electron configuration drives chemical bonding.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Atom Structure',
  },
  {
    id: 'water-cycle',
    title: 'Water Cycle',
    track: 'stem',
    icon: '💧',
    previewImage: '💧',
    shortDescription: 'Evaporation, condensation, and precipitation.',
    longDescription: "Fly through an animated cross-section of Earth's water cycle. Follow a water molecule as it evaporates from the ocean, rises into a cloud, condenses, precipitates, and flows back via rivers and groundwater. Hotspots explain latent heat, the Coriolis effect, and how deforestation disrupts hydrological balance.",
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Water Cycle',
  },
  {
    id: 'solar-system',
    title: 'Solar System',
    track: 'stem',
    icon: '🪐',
    previewImage: '🪐',
    shortDescription: 'Our solar neighborhood, from Sun to Kuiper Belt.',
    longDescription: "Zoom through a scale model of the solar system. Visit each planet in order, inspect the asteroid belt, and reach the Kuiper Belt. Your guide covers orbital mechanics, Kepler's laws, the differences between terrestrial and gas-giant planets, and current missions exploring our neighbourhood.",
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Solar System',
  },
  {
    id: 'human-heart',
    title: 'Human Heart Anatomy',
    track: 'stem',
    icon: '❤️',
    previewImage: '❤️',
    shortDescription: 'Cardiac chambers, valves, and blood flow.',
    longDescription: 'Fly through a life-size human heart and trace oxygenated and deoxygenated blood through all four chambers. Observe the atrioventricular and semilunar valves in action, the electrical conduction system, and the coronary arteries. Your guide explains heart rate regulation, common cardiac conditions, and how the heart develops in the embryo.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Human Heart Anatomy',
  },
  {
    id: 'plant-cell',
    title: 'Plant Cell Cross-Section',
    track: 'stem',
    icon: '🌱',
    previewImage: '🌱',
    shortDescription: 'Organelles, cell wall, and chloroplasts.',
    longDescription: 'Explore a giant cross-section of a plant cell. Inspect the rigid cellulose cell wall, the central vacuole under turgor pressure, chloroplasts performing photosynthesis, the nucleus and endoplasmic reticulum network, and the plasmodesmata connecting neighbouring cells. Your AI guide contrasts plant and animal cell structures throughout.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Plant Cell Cross-Section',
  },
  {
    id: 'periodic-table',
    title: 'The Periodic Table',
    track: 'stem',
    icon: '🧪',
    previewImage: '🧪',
    shortDescription: 'Elements arranged by atomic number and properties.',
    longDescription: 'Walk through a three-dimensional periodic table where each element block glows and can be inspected. Learn why periods and groups reveal recurring chemical properties, how atomic radius and electronegativity change across the table, and the stories behind notable elements — from hydrogen to oganesson.',
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'The Periodic Table',
  },
  {
    id: 'protein-folding',
    title: 'Protein Folding',
    track: 'stem',
    icon: '🔬',
    previewImage: '🔬',
    shortDescription: 'Primary to quaternary protein structure.',
    longDescription: "Watch a polypeptide chain emerge from a ribosome and fold into its final 3-D shape. Observe secondary structures (alpha helices and beta sheets) form, tertiary folding driven by hydrophobic interactions, and quaternary assembly of multiple subunits. Your guide explains how misfolding leads to diseases like Alzheimer's and how AlphaFold is revolutionising biology.",
    worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    sceneLabel: 'Protein Folding',
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

  const handleStartHumanities = (
    worldId: string = HUMANITIES_TRACK.worldId,
    label: string = HUMANITIES_TRACK.sceneLabel,
    account: 'default' | 'humanities' = 'default'
  ) => {
    if (isLoading) return;
    void loadWorldById(worldId, label, { account });
  };

  const handleStartStem = (worldId: string = STEM_TRACK.worldId, label: string = STEM_TRACK.sceneLabel) => {
    if (isLoading) return;
    void loadWorldById(worldId, label, { account: 'stem' });
  };

  const handleEnterMap = (map: MapData) => {
    if (map.track === 'humanities') handleStartHumanities(map.worldId, map.sceneLabel, map.account === 'humanities' ? 'humanities' : 'default');
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
                  <div className="atlas-map-detail-content">
                    <div className="atlas-map-detail-image">
                      {selectedMap.previewImage}
                    </div>
                    <div className="atlas-map-detail-info">
                      <h3 className="atlas-map-detail-title">{selectedMap.title}</h3>
                      <p className="atlas-map-detail-short">{selectedMap.shortDescription}</p>
                      <p className="atlas-map-detail-desc">{selectedMap.longDescription}</p>
                      <div className="atlas-map-detail-actions">
                        <button
                          className={`atlas-track-btn${selectedMap.track === 'stem' ? ' atlas-track-btn-stem' : ''}`}
                          onClick={() => handleEnterMap(selectedMap)}
                          disabled={isLoading}
                          type="button"
                        >
                          Enter {selectedMap.title}
                        </button>
                        <button
                          className="atlas-track-back"
                          onClick={() => setSelectedMap(null)}
                          type="button"
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
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
