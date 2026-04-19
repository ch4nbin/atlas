'use client';

import Link from 'next/link';
import { useState, useRef, useEffect, useMemo } from 'react';
import { useSceneStore } from '@/state/sceneStore';

/* ─── Map data ─────────────────────────────────────────────────────── */

interface MapData {
  id: string;
  title: string;
  track: 'humanities' | 'stem';
  account?: 'default' | 'stem' | 'humanities';
  icon: string;
  shortDescription: string;
  longDescription: string;
  worldId: string;
  sceneLabel: string;
  wash: string;
  era: string;
  region: string;
}

const LIBRARY_MAPS: MapData[] = [
  // ── Humanities ──────────────────────────────────────────────────────
  { id: 'han-dynasty', title: 'Han Dynasty Village', track: 'humanities', icon: '🏮', era: '25–220 CE', region: 'Eastern China', shortDescription: 'Eastern Han village life.', longDescription: 'Wander a reconstructed Eastern Han village — market stalls, a Confucian academy, and a riverside dock. Your guide explains daily routines, social hierarchies, and the administrative innovations that defined the era.', worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Han Dynasty Village', wash: 'linear-gradient(135deg,#c7a97a,#8e6a3f 55%,#4a3020)' },
  { id: 'roman-forum', title: 'Roman Forum', track: 'humanities', icon: '🏛️', era: '100 BCE', region: 'Rome, Italy', shortDescription: 'Heart of the late Republic.', longDescription: "Stand at the centre of Roman civic life. Explore the Temple of Saturn, the Rostra, and the Basilica Aemilia while your guide narrates senatorial debates, religious rites, and commerce.", worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Roman Forum', wash: 'linear-gradient(135deg,#d9c49a,#a98b5c 60%,#5b3a1f)' },
  { id: 'ancient-egypt', title: 'Ancient Egypt', track: 'humanities', icon: '🏺', era: '1350 BCE', region: 'Thebes', shortDescription: 'New Kingdom Thebes.', longDescription: "Walk a Theban neighbourhood under Amenhotep III. Visit a scribal house, a temple precinct, and a craftsman's workshop.", worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Ancient Egypt', wash: 'linear-gradient(135deg,#f1d99a,#c69a4a 55%,#6e4415)' },
  { id: 'medieval-castle', title: 'Medieval Castle', track: 'humanities', account: 'humanities', icon: '🏰', era: '1150 CE', region: 'England', shortDescription: 'Norman motte-and-bailey.', longDescription: 'Explore a Norman castle — great hall, chapel, armory, bailey market — as it appeared in the mid-twelfth century.', worldId: '7dedbd85-3dbd-49b3-8750-9280aaca1da5', sceneLabel: 'Medieval Castle', wash: 'linear-gradient(135deg,#9aa4b0,#5b6775 55%,#2b3540)' },
  { id: 'viking-settlement', title: 'Viking Settlement', track: 'humanities', icon: '⚔️', era: '900 CE', region: 'Scandinavia', shortDescription: 'Coastal Norse village.', longDescription: 'Step into a coastal Norse settlement at the height of the Viking Age. Timber longhouse, boatyard, Thing assembly ground.', worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Viking Settlement', wash: 'linear-gradient(135deg,#b7c6cf,#6f8694 55%,#2e4252)' },
  { id: 'aztec-temple', title: 'Aztec Temple', track: 'humanities', icon: '🦅', era: '1450 CE', region: 'Tenochtitlán', shortDescription: 'Templo Mayor district.', longDescription: 'Ascend the Templo Mayor — twin shrines of Huitzilopochtli and Tlaloc, the ritual precinct, and the Tlatelolco market.', worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Aztec Temple', wash: 'linear-gradient(135deg,#e6a98a,#a55a3c 55%,#53200f)' },
  { id: 'ancient-greece', title: 'Ancient Greece', track: 'humanities', icon: '🏟️', era: '450 BCE', region: 'Athens', shortDescription: 'Classical Athenian Agora.', longDescription: 'Walk the Athenian Agora during the Golden Age of Pericles. Stoa of Zeus, law courts, and the climb to the Acropolis.', worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Ancient Greece', wash: 'linear-gradient(135deg,#e2d8c3,#a89677 55%,#50422a)' },
  { id: 'silk-road-market', title: 'Silk Road Market', track: 'humanities', icon: '🐫', era: '800 CE', region: 'Central Asia', shortDescription: 'Sogdian caravanserai.', longDescription: 'Arrive at a Sogdian caravanserai on the steppe. Silk, spices, glassware, and manuscripts trade between empires.', worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Silk Road Market', wash: 'linear-gradient(135deg,#deb97a,#a07434 55%,#4c2e10)' },
  { id: 'byzantine-constantinople', title: 'Byzantine Constantinople', track: 'humanities', icon: '⛪', era: '500 CE', region: 'Constantinople', shortDescription: 'Justinian-era capital.', longDescription: "Wander the streets of Constantinople at the height of Justinian's reign. Hagia Sophia, Hippodrome, Golden Horn harbour.", worldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b', sceneLabel: 'Byzantine Constantinople', wash: 'linear-gradient(135deg,#c8b5e2,#6f5ba4 55%,#2a1f4a)' },
  { id: 'japanese-edo', title: 'Japanese Edo Period', track: 'humanities', account: 'humanities', icon: '⛩️', era: '1700 CE', region: 'Edo (Tokyo)', shortDescription: 'Tokugawa-era street life.', longDescription: 'Explore Edo under the Tokugawa shogunate. Kabuki theatre, woodblock workshop, samurai estate, merchant quarter.', worldId: '6396d2c0-d8be-448d-9a5f-2ca643e10a3c', sceneLabel: 'Japanese Edo Period', wash: 'linear-gradient(135deg,#d1b0b8,#8a4d5a 55%,#3e1a25)' },
  // ── STEM ────────────────────────────────────────────────────────────
  { id: 'photosynthesis-lab', title: 'Photosynthesis Lab', track: 'stem', icon: '🌿', era: 'Microscale', region: 'Chloroplast', shortDescription: 'Light reactions & Calvin cycle.', longDescription: 'Shrink into a chloroplast and observe light-dependent reactions on the thylakoid membrane and the Calvin cycle in the stroma.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Photosynthesis Lab', wash: 'linear-gradient(135deg,#b4e2b4,#58a06b 55%,#1f4a2e)' },
  { id: 'cellular-respiration', title: 'Cellular Respiration', track: 'stem', icon: '⚡', era: 'Microscale', region: 'Mitochondrion', shortDescription: 'Glycolysis → Krebs → ETC.', longDescription: 'Tour the mitochondrion. Follow glucose through glycolysis, the Krebs cycle in the matrix, and the electron transport chain.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Cellular Respiration', wash: 'linear-gradient(135deg,#f0b3b0,#c26a70 55%,#5e2530)' },
  { id: 'dna-helix', title: 'DNA Helix', track: 'stem', icon: '🧬', era: 'Nanoscale', region: 'Nucleus', shortDescription: 'Replication fork & base pairs.', longDescription: 'Navigate a giant-scale DNA double helix. Inspect hydrogen bonds, the sugar-phosphate backbone, and a replication fork in action.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'DNA Helix', wash: 'linear-gradient(135deg,#b4c5e8,#5c7ab4 55%,#1e2f5a)' },
  { id: 'atom-structure', title: 'Atom Structure', track: 'stem', icon: '⚛️', era: 'Subatomic', region: 'Carbon atom', shortDescription: 'Shells, orbitals, quantum.', longDescription: 'Orbit a carbon nucleus and visit each electron shell. Bohr vs. quantum mechanical model, orbital shapes, electron configuration.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Atom Structure', wash: 'linear-gradient(135deg,#d2b5e2,#8663b5 55%,#362048)' },
  { id: 'water-cycle', title: 'Water Cycle', track: 'stem', icon: '💧', era: 'Planetary', region: 'Earth systems', shortDescription: 'Evaporation → rain → runoff.', longDescription: "Fly through a cross-section of Earth's water cycle. Follow a molecule from ocean to cloud to rain to river and back.", worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Water Cycle', wash: 'linear-gradient(135deg,#a8cce6,#4f7aa8 55%,#17325a)' },
  { id: 'solar-system', title: 'Solar System', track: 'stem', icon: '🪐', era: 'Astronomical', region: 'Heliosphere', shortDescription: 'Sun to Kuiper Belt.', longDescription: "Zoom through a scale model of the solar system. Visit each planet, inspect the asteroid belt, reach the Kuiper Belt.", worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Solar System', wash: 'linear-gradient(135deg,#1a1633,#2d2a55 55%,#050413)' },
  { id: 'human-heart', title: 'Human Heart Anatomy', track: 'stem', icon: '❤️', era: 'Anatomical', region: 'Thoracic cavity', shortDescription: 'Chambers, valves, blood flow.', longDescription: 'Fly through a life-size human heart. Trace oxygenated and deoxygenated blood through all four chambers.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Human Heart Anatomy', wash: 'linear-gradient(135deg,#e8a5ab,#ba4d5a 55%,#501821)' },
  { id: 'plant-cell', title: 'Plant Cell Cross-Section', track: 'stem', icon: '🌱', era: 'Microscale', region: 'Mesophyll', shortDescription: 'Organelles and cell wall.', longDescription: 'Explore a cross-section of a plant cell. Cell wall, central vacuole, chloroplasts, nucleus, plasmodesmata.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Plant Cell Cross-Section', wash: 'linear-gradient(135deg,#bfe4b8,#6ba868 55%,#254d25)' },
  { id: 'periodic-table', title: 'The Periodic Table', track: 'stem', icon: '🧪', era: 'Chemical', region: '3-D hall', shortDescription: 'Elements by atomic number.', longDescription: 'Walk through a three-dimensional periodic table. Each block glows and can be inspected. Learn recurring chemical properties.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'The Periodic Table', wash: 'linear-gradient(135deg,#c8d0e2,#6872a4 55%,#22274a)' },
  { id: 'protein-folding', title: 'Protein Folding', track: 'stem', icon: '🔬', era: 'Nanoscale', region: 'Cytoplasm', shortDescription: 'Primary to quaternary.', longDescription: 'Watch a polypeptide emerge from a ribosome and fold. Alpha helices, beta sheets, and hydrophobic-driven tertiary folding.', worldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b', sceneLabel: 'Protein Folding', wash: 'linear-gradient(135deg,#e2c5b0,#a47456 55%,#4a2a1a)' },
];

const TRACK_DATA = {
  humanities: {
    name: 'Humanities',
    kicker: 'Track · Culture & History',
    blurb: 'History and culture walkthroughs with a contextual AI guide.',
    wash: 'linear-gradient(135deg, rgba(255,230,195,0.55), rgba(210,150,110,0.35) 55%, rgba(90,55,25,0.30))',
    defaultWorldId: '7e486a4a-abe4-4505-b9d9-923ec54ac10b',
    defaultSceneLabel: 'Han Dynasty Village',
  },
  stem: {
    name: 'STEM',
    kicker: 'Track · Science & Systems',
    blurb: 'Interactive science experiments inside living systems and scientific models.',
    wash: 'linear-gradient(135deg, rgba(200,220,255,0.55), rgba(130,170,220,0.35) 55%, rgba(30,70,120,0.30))',
    defaultWorldId: 'c20e8e3b-9631-41ff-808a-6dc4e75e025b',
    defaultSceneLabel: 'Photosynthesis Lab',
  },
} as const;

/* ─── Sub-components ───────────────────────────────────────────────── */

function TileWash({ wash, region }: { wash: string; region: string }) {
  return (
    <div className="atlas-tile-image">
      <div className="atlas-tile-wash-img" style={{ background: wash }} />
      <div className="atlas-tile-grain-overlay" />
      <div className="atlas-tile-stripe" />
      <div className="atlas-tile-region">▢ {region}</div>
    </div>
  );
}

function LibraryTile({ map, onSelect, index }: { map: MapData; onSelect: (m: MapData) => void; index: number }) {
  return (
    <button
      className="atlas-tile atlas-fade-in"
      style={{ animationDelay: `${Math.min(index, 12) * 30}ms` }}
      onClick={() => onSelect(map)}
      type="button"
    >
      <TileWash wash={map.wash} region={map.region} />
      <div className="atlas-tile-info-new">
        <div className="atlas-tile-name-row">
          <span className="atlas-tile-title-new">{map.title}</span>
          <span className="atlas-tile-era">{map.era}</span>
        </div>
        <p className="atlas-tile-short">{map.shortDescription}</p>
      </div>
      <div className="atlas-tile-track-badge atlas-chip-glass">
        {map.track === 'stem' ? '◎ STEM' : '◈ Hum'}
      </div>
    </button>
  );
}

/* ─── World matching ───────────────────────────────────────────────── */

// Aliases map common synonyms / concepts onto world IDs for better matching.
const ALIASES: Record<string, string[]> = {
  'han-dynasty':            ['china', 'chinese', 'han', 'confucius', 'dynasty', 'emperor', 'silk', 'marketplace'],
  'roman-forum':            ['rome', 'roman', 'senate', 'julius', 'caesar', 'gladiator', 'colosseum', 'latin', 'republic'],
  'ancient-egypt':          ['egypt', 'egyptian', 'pharaoh', 'pyramid', 'nile', 'hieroglyph', 'mummy', 'sphinx', 'thebes'],
  'medieval-castle':        ['medieval', 'castle', 'knight', 'king', 'feudal', 'england', 'norman', 'siege', 'armour'],
  'viking-settlement':      ['viking', 'norse', 'scandinavia', 'longship', 'odin', 'fjord', 'raid', 'nordic'],
  'aztec-temple':           ['aztec', 'maya', 'mayan', 'mesoamerica', 'sacrifice', 'mexico', 'tenochtitlan', 'tlaloc'],
  'ancient-greece':         ['greece', 'greek', 'athens', 'sparta', 'socrates', 'plato', 'agora', 'democracy', 'olympus'],
  'silk-road-market':       ['silk road', 'trade', 'merchant', 'caravan', 'spice', 'central asia', 'persia', 'tang'],
  'byzantine-constantinople': ['byzantine', 'constantinople', 'ottoman', 'justinian', 'hagia sophia', 'eastern roman'],
  'japanese-edo':           ['japan', 'japanese', 'samurai', 'edo', 'shogun', 'tokyo', 'ninja', 'kimono', 'kabuki'],
  'photosynthesis-lab':     ['photosynthesis', 'plant', 'chloroplast', 'leaf', 'sunlight', 'glucose', 'calvin', 'biology'],
  'cellular-respiration':   ['respiration', 'mitochondria', 'atp', 'glycolysis', 'krebs', 'oxygen', 'cell energy'],
  'dna-helix':              ['dna', 'gene', 'genetics', 'chromosome', 'nucleotide', 'helix', 'replication', 'mutation'],
  'atom-structure':         ['atom', 'electron', 'proton', 'neutron', 'nucleus', 'quantum', 'orbital', 'chemistry', 'element'],
  'water-cycle':            ['water', 'rain', 'evaporation', 'cloud', 'cycle', 'hydrological', 'precipitation', 'weather'],
  'solar-system':           ['solar', 'planet', 'space', 'mars', 'jupiter', 'saturn', 'orbit', 'sun', 'moon', 'galaxy', 'asteroid'],
  'human-heart':            ['heart', 'cardiac', 'blood', 'vein', 'artery', 'pulse', 'anatomy', 'cardiovascular'],
  'plant-cell':             ['cell', 'organelle', 'vacuole', 'chloroplast', 'cell wall', 'membrane', 'nucleus', 'microscope'],
  'periodic-table':         ['periodic', 'element', 'chemistry', 'compound', 'metal', 'hydrogen', 'carbon', 'oxygen atom'],
  'protein-folding':        ['protein', 'amino acid', 'ribosome', 'folding', 'enzyme', 'antibody', 'helix', 'biology'],
};

function findClosestWorld(query: string): MapData {
  const q = query.toLowerCase().trim();
  if (!q) return LIBRARY_MAPS[0];

  const tokens = q.split(/[\s,./!?]+/).filter(t => t.length > 1);

  const scores = LIBRARY_MAPS.map(map => {
    // Build a searchable text blob for this world
    const blob = [map.title, map.shortDescription, map.longDescription, map.era, map.region, map.track]
      .join(' ')
      .toLowerCase();

    let score = 0;

    // Full phrase match in title (very strong signal)
    if (map.title.toLowerCase().includes(q)) score += 20;

    // Check alias keywords
    const aliases = ALIASES[map.id] || [];
    for (const alias of aliases) {
      if (q.includes(alias)) score += 8;
      for (const token of tokens) {
        if (alias.includes(token)) score += 3;
      }
    }

    // Token match against blob
    for (const token of tokens) {
      if (blob.includes(token)) score += 2;
    }

    // Track affinity keywords
    const scienceTerms = ['biology', 'chemistry', 'physics', 'science', 'lab', 'molecule', 'cell', 'experiment'];
    const historyTerms = ['history', 'historical', 'ancient', 'civilization', 'culture', 'war', 'empire'];
    if (map.track === 'stem' && scienceTerms.some(t => q.includes(t))) score += 4;
    if (map.track === 'humanities' && historyTerms.some(t => q.includes(t))) score += 4;

    return { map, score };
  });

  scores.sort((a, b) => b.score - a.score);

  // If nothing scored, fall back to a random world so the demo always works
  if (scores[0].score === 0) {
    return LIBRARY_MAPS[Math.floor(Math.random() * LIBRARY_MAPS.length)];
  }
  return scores[0].map;
}

/* ─── Main component ───────────────────────────────────────────────── */

export function PromptInput() {
  const { loadWorldById, reset, isLoading, loadingStep, sceneGraph, error, prompt } =
    useSceneStore();
  const [aboutOpen, setAboutOpen] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [trackView, setTrackView] = useState<'split' | 'humanities' | 'stem'>('split');
  const [selectedMap, setSelectedMap] = useState<MapData | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [promptInput, setPromptInput] = useState('');
  const launchBtnRef = useRef<HTMLButtonElement>(null);
  const hasScene = !!sceneGraph;

  const currentTrack = trackView === 'humanities' ? 'humanities' : trackView === 'stem' ? 'stem' : null;
  const libraryMaps = useMemo(
    () => (currentTrack ? LIBRARY_MAPS.filter((m) => m.track === currentTrack) : []),
    [currentTrack]
  );
  const filteredMaps = useMemo(
    () =>
      libraryMaps.filter((m) =>
        (m.title + ' ' + m.era + ' ' + m.region + ' ' + m.shortDescription)
          .toLowerCase()
          .includes(searchQuery.toLowerCase())
      ),
    [libraryMaps, searchQuery]
  );

  useEffect(() => {
    if (!hasScene && trackView !== 'split') {
      launchBtnRef.current?.focus();
    }
  }, [hasScene, trackView]);

  const handleEnterMap = (map: MapData) => {
    if (isLoading) return;
    if (map.track === 'humanities') {
      void loadWorldById(map.worldId, map.sceneLabel, { account: map.account === 'humanities' ? 'humanities' : 'default' });
    } else {
      void loadWorldById(map.worldId, map.sceneLabel, { account: 'stem' });
    }
  };

  const handleEnterTrack = (key: 'humanities' | 'stem') => {
    if (isLoading) return;
    const t = TRACK_DATA[key];
    if (key === 'humanities') void loadWorldById(t.defaultWorldId, t.defaultSceneLabel);
    else void loadWorldById(t.defaultWorldId, t.defaultSceneLabel, { account: 'stem' });
  };

  const goTrack = (key: 'humanities' | 'stem') => {
    setTrackView(key);
    setSearchQuery('');
    setSelectedMap(null);
  };
  const goSplit = () => { setTrackView('split'); setSelectedMap(null); setSearchQuery(''); };

  const handlePromptSubmit = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = promptInput.trim();
    if (!q || isLoading) return;
    const match = findClosestWorld(q);
    setSelectedMap(match);
  };

  /* ── Scene chrome: shown when a world is loaded ─────────────────── */
  if (hasScene) {
    return (
      <>
        <div
          className="atlas-topbar"
          style={{
            background: 'rgba(255,255,255,0.14)',
            border: '1px solid rgba(255,255,255,0.58)',
            backdropFilter: 'blur(30px) saturate(1.22)',
            WebkitBackdropFilter: 'blur(30px) saturate(1.22)',
            boxShadow: '0 30px 80px rgba(8,10,18,0.45)',
          }}
        >
          <button
            className="atlas-topbar-btn atlas-topbar-btn-secondary atlas-topbar-back"
            onClick={() => reset()}
            disabled={isLoading}
            aria-label="Back to library"
          >
            Back
          </button>
          <input
            className="atlas-topbar-input"
            defaultValue={prompt}
            key={prompt}
            readOnly
            disabled
            aria-label="Current world"
          />
          <button
            className="atlas-topbar-btn atlas-topbar-btn-secondary atlas-topbar-help"
            onClick={() => setShowHelp(v => !v)}
            aria-label="Controls"
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
              <li><kbd>Mouse</kbd> Look (click canvas to lock)</li>
              <li><kbd>Space</kbd> / <kbd>Shift</kbd> Up / Down</li>
              <li><kbd>C</kbd> Toggle AI guide</li>
              <li><span className="atlas-help-dot" /> Click glowing spot to inspect</li>
              <li><kbd>Esc</kbd> Release pointer lock</li>
            </ul>
          </div>
        )}

      </>
    );
  }

  /* ── Pre-scene UI: header + hero/library ─────────────────────────── */
  return (
    <>
      {/* Header pill */}
      <header className="atlas-header">
        <div className="atlas-header-pill atlas-glass" style={{ maxWidth: '72rem', margin: '0 auto' }}>
          <Link href="/" className="atlas-header-logo" style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
            <span style={{ opacity: 0.5, fontSize: '0.75rem' }}>←</span> Home
          </Link>
          <p className="atlas-header-center">AI-Powered Immersive Learning — Explore</p>
          <nav>
            <button
              type="button"
              onClick={() => setAboutOpen(true)}
              className="atlas-header-about"
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {/* Main content */}
      <div className="atlas-content-area">
        {trackView === 'split' && (
          <main className="atlas-hero-main">
            <div className="atlas-hero-inner">
              {/* Title block */}
              <div className="atlas-fade-in" style={{ textAlign: 'center', maxWidth: '42rem' }}>
                <p className="atlas-hero-kicker">Immersive Learning · Pick a Track</p>
                <h1 className="atlas-hero-title">
                  <span className="atlas-instrument" style={{ fontStyle: 'italic', fontWeight: 500 }}>Where</span>
                  {' '}do you want to{' '}
                  <span className="atlas-instrument" style={{ fontStyle: 'italic', fontWeight: 500 }}>step</span>
                  {' '}in today?
                </h1>
                <p className="atlas-hero-subtitle">
                  Each track opens a curated library of worlds. Pick one, step inside, and learn through conversation with your AI guide.
                </p>
              </div>

              {/* Track cards */}
              <div className="atlas-track-cards">
                {(['humanities', 'stem'] as const).map((key) => {
                  const t = TRACK_DATA[key];
                  const count = LIBRARY_MAPS.filter(m => m.track === key).length;
                  return (
                    <button
                      key={key}
                      className="atlas-track-card-new atlas-glass-strong"
                      onClick={() => goTrack(key)}
                      disabled={isLoading}
                      type="button"
                    >
                      <div className="atlas-track-wash" style={{ background: t.wash }} />
                      <div className="atlas-track-wash-overlay" />
                      <div className="atlas-track-content">
                        <div className="atlas-track-header">
                          <span className="atlas-mono" style={{ color: 'rgba(0,0,0,0.60)', textTransform: 'uppercase', letterSpacing: '0.18em' }}>
                            {t.kicker}
                          </span>
                          <span className="atlas-track-count-chip atlas-chip-glass">{count} worlds</span>
                        </div>
                        <div className="atlas-track-footer">
                          <h2 className="atlas-track-name atlas-instrument">{t.name}</h2>
                          <p className="atlas-track-blurb">{t.blurb}</p>
                          <div className="atlas-track-cta">
                            <span>Browse library</span>
                            <span className="atlas-track-cta-arrow">→</span>
                          </div>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>

              {/* Prompt search */}
              <form className="atlas-prompt-footer-new" onSubmit={handlePromptSubmit}>
                <div className="atlas-prompt-row-new atlas-glass">
                  <input
                    value={promptInput}
                    onChange={e => setPromptInput(e.target.value)}
                    placeholder="Or describe a world, topic, or time period…"
                    className="atlas-prompt-disabled-input"
                    disabled={isLoading}
                  />
                  <button
                    type="submit"
                    className="atlas-map-enter-btn atlas-btn-dark"
                    disabled={isLoading || !promptInput.trim()}
                    style={{ flexShrink: 0, padding: '0.5rem 1.25rem', fontSize: '0.8125rem' }}
                  >
                    Find World →
                  </button>
                </div>
              </form>

              {error && <div className="atlas-error">{error}</div>}
            </div>
          </main>
        )}

        {(trackView === 'humanities' || trackView === 'stem') && (() => {
          const key = trackView as 'humanities' | 'stem';
          const t = TRACK_DATA[key];
          return (
            <main className="atlas-library-view-new atlas-fade-in">
              <div className="atlas-library-inner">
                {/* Library header */}
                <div className="atlas-library-header-new">
                  <button className="atlas-library-back atlas-btn-light" onClick={goSplit} disabled={isLoading} type="button">
                    ← Tracks
                  </button>
                  <div className="atlas-library-title-block">
                    <span className="atlas-library-track-kicker atlas-mono">{t.kicker}</span>
                    <h2 className="atlas-library-heading">
                      {t.name} <span style={{ color: 'rgba(0,0,0,0.55)', fontWeight: 300 }}>Library</span>
                    </h2>
                  </div>
                  <div className="atlas-library-search-row atlas-glass atlas-library-search-visible">
                    <span style={{ color: 'rgba(0,0,0,0.50)', fontSize: '0.875rem' }}>⌕</span>
                    <input
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Search worlds…"
                      className="atlas-library-search-input"
                    />
                  </div>
                </div>

                {/* Grid */}
                <div className="atlas-library-grid-new">
                  <div className="atlas-tile-grid">
                    {filteredMaps.map((m, i) => (
                      <LibraryTile key={m.id} map={m} onSelect={setSelectedMap} index={i} />
                    ))}
                  </div>
                  {filteredMaps.length === 0 && (
                    <p style={{ textAlign: 'center', padding: '4rem 0', fontSize: '0.875rem', color: 'rgba(0,0,0,0.55)' }}>
                      No worlds match &ldquo;{searchQuery}&rdquo;.
                    </p>
                  )}
                </div>

                {error && <div className="atlas-error" style={{ marginTop: '0.5rem' }}>{error}</div>}
              </div>
            </main>
          );
        })()}
      </div>

      {/* Map detail modal */}
      {selectedMap && !isLoading && (
        <div className="atlas-map-overlay atlas-fade-in">
          <div className="atlas-map-backdrop" onClick={() => setSelectedMap(null)} />
          <div className="atlas-map-modal-new atlas-glass-strong">
            <div className="atlas-map-grid">
              {/* Image panel */}
              <div className="atlas-map-image-new">
                <div className="atlas-map-wash" style={{ background: selectedMap.wash }} />
                <div className="atlas-map-image-grain" />
                <div className="atlas-map-image-stripe" />
                <div className="atlas-map-image-label">
                  <span className="atlas-map-image-caption atlas-mono">▢ preview · {selectedMap.region}</span>
                  <span className="atlas-map-image-note">Generated 3-D world. Walk freely; click hotspots to learn.</span>
                </div>
              </div>
              {/* Info panel */}
              <div className="atlas-map-info-new">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="atlas-map-track-label atlas-mono">
                    {selectedMap.track === 'stem' ? 'STEM · Experiment' : 'Humanities · Walkthrough'}
                  </span>
                  <button className="atlas-map-close-btn" onClick={() => setSelectedMap(null)}>✕</button>
                </div>
                <h2 className="atlas-map-title-new">{selectedMap.title}</h2>
                <div className="atlas-map-chips-row">
                  {[selectedMap.era, selectedMap.region, 'AI Guide'].map(c => (
                    <span key={c} className="atlas-map-chip-new atlas-chip-glass">{c}</span>
                  ))}
                </div>
                <p className="atlas-map-desc-new">{selectedMap.longDescription}</p>
                <div className="atlas-map-actions-new">
                  <button
                    ref={launchBtnRef}
                    className="atlas-map-enter-btn atlas-btn-dark"
                    onClick={() => handleEnterMap(selectedMap)}
                    disabled={isLoading}
                    type="button"
                  >
                    Enter {selectedMap.title} →
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Loading overlay */}
      {isLoading && (
        <div className="atlas-loading-new atlas-fade-in">
          <div className="atlas-loading-backdrop" />
          <div className="atlas-loading-card-new atlas-glass-strong">
            <div className="atlas-loading-header-row">
              <span className="atlas-loading-dot-new atlas-pulse-dot" />
              <span className="atlas-loading-label atlas-mono">Building · World Labs</span>
            </div>
            <h3 className="atlas-loading-title-new">Compiling your world</h3>
            <p className="atlas-loading-step-new">{loadingStep || 'Preparing world assets…'}</p>
            <div className="atlas-loading-bar-new">
              <div className="atlas-shimmer-fill" />
            </div>
            <p className="atlas-loading-note atlas-mono">
              This may take a few minutes · 3-D assets stream in progressively
            </p>
          </div>
        </div>
      )}

      {aboutOpen && (
        <div className="atlas-map-overlay atlas-fade-in">
          <div className="atlas-map-backdrop" onClick={() => setAboutOpen(false)} />
          <div style={{
            position: 'relative', width: '100%', maxWidth: '30rem',
            borderRadius: '1.75rem', overflow: 'hidden',
            background: 'rgba(255,255,255,0.92)',
            border: '1px solid rgba(255,255,255,0.70)',
            backdropFilter: 'blur(32px) saturate(1.2)',
            WebkitBackdropFilter: 'blur(32px) saturate(1.2)',
            boxShadow: '0 32px 80px rgba(10,10,20,0.28)',
          }}>
            <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg,#fcd5e0,#e8789a 55%,#b83865)', filter: 'blur(2px) saturate(1.1)', transform: 'scale(1.04)' }} />
              <div style={{
                position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.22,
                backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
                backgroundSize: '3px 3px',
              }} />
              <div style={{
                position: 'absolute', inset: 0,
                background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 16px, rgba(0,0,0,0.04) 16px 32px)',
                mixBlendMode: 'soft-light',
              }} />
              <div style={{ position: 'absolute', top: '1.1rem', left: '1.5rem', right: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span className="atlas-mono" style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.6rem' }}>
                  Atlas · About
                </span>
                <button onClick={() => setAboutOpen(false)} style={{
                  background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.35)',
                  borderRadius: '9999px', width: '1.75rem', height: '1.75rem',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem',
                  backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                  transition: 'background 0.15s',
                }}>✕</button>
              </div>
              <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', right: '1.5rem' }}>
                <h2 style={{
                  fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em',
                  color: '#fff', margin: 0,
                  textShadow: '0 1px 12px rgba(0,0,0,0.18)',
                }}>
                  About Atlas
                </h2>
              </div>
            </div>

            <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {[
                  'Atlas is an AI-powered immersive learning platform that brings history and science to life through interactive 3D environments.',
                  'By combining generative 3D scene creation with a contextual AI guide, Atlas lets you explore any moment in history — or any system in science — the way you\'d explore a real place.',
                  'Built for students, educators, and curious minds. No VR headset required.',
                ].map((p, i) => (
                  <p key={i} style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.62)', lineHeight: 1.7, margin: 0 }}>{p}</p>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
