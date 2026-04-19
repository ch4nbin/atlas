"use client"

import { useState } from "react"
import Link from "next/link"
import { AuroraBackground } from "@/components/atlas/AuroraBackground"
import '@/styles/atlas.css'

type ModalType = "how-it-works" | "about" | null

export default function LandingPage() {
  const [modal, setModal] = useState<ModalType>(null)

  return (
    <div style={{ position: 'fixed', inset: 0, overflow: 'hidden', fontFamily: "var(--font-figtree, 'Figtree', sans-serif)", color: 'rgba(0,0,0,0.85)' }}>
      <AuroraBackground />

      {/* Header pill — same as explore */}
      <header className="atlas-header">
        <div
          className="atlas-header-pill atlas-glass"
          style={{ maxWidth: '72rem', margin: '0 auto' }}
        >
          <span className="atlas-header-logo" style={{ textDecoration: 'none' }}>Atlas</span>
          <p className="atlas-header-center">AI-Powered Immersive Learning</p>
          <nav style={{ flexShrink: 0 }}>
            <button
              type="button"
              onClick={() => setModal("about")}
              className="atlas-header-about"
            >
              About
            </button>
          </nav>
        </div>
      </header>

      {/* Hero content */}
      <main style={{
        position: 'absolute', top: '50%', left: '50%',
        transform: 'translate(-50%, -50%)',
        zIndex: 20, width: '92vw', maxWidth: '42rem',
        textAlign: 'center',
      }}>
        <p style={{
          fontSize: '10px', letterSpacing: '0.22em', textTransform: 'uppercase',
          color: 'rgba(0,0,0,0.55)', fontWeight: 500, marginBottom: '1rem',
        }}>
          Immersive Learning · Powered by AI
        </p>

        <h1 style={{
          fontSize: 'clamp(2.6rem, 5.5vw, 4rem)', lineHeight: 1.04,
          letterSpacing: '-0.02em', fontWeight: 300, color: 'rgba(0,0,0,0.85)',
          margin: '0 0 1rem',
        }}>
          <span className="atlas-instrument" style={{ fontStyle: 'italic', fontWeight: 500 }}>Step Into</span>
          {' '}History
          <br />
          <span style={{ fontWeight: 300, color: 'rgba(0,0,0,0.85)' }}>With Atlas</span>
        </h1>

        <p style={{
          maxWidth: '36rem', margin: '0 auto 2rem',
          fontSize: '0.9375rem', color: 'rgba(0,0,0,0.65)', lineHeight: 1.65,
        }}>
          Explore immersive 3D environments from any place and time period. Step inside, and learn through discovery with your AI guide.
        </p>

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            onClick={() => setModal("how-it-works")}
            style={{
              minWidth: '140px', padding: '0.625rem 1.75rem',
              borderRadius: '9999px',
              background: 'rgba(255,255,255,0.25)', color: 'rgba(0,0,0,0.80)',
              border: '1px solid rgba(255,255,255,0.60)',
              backdropFilter: 'blur(14px)', WebkitBackdropFilter: 'blur(14px)',
              fontWeight: 500, fontSize: '0.875rem', cursor: 'pointer',
              fontFamily: 'inherit',
              transition: 'background 0.2s, color 0.2s',
            }}
            onMouseEnter={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.45)'; }}
            onMouseLeave={e => { (e.target as HTMLElement).style.background = 'rgba(255,255,255,0.25)'; }}
          >
            How It Works
          </button>
          <Link
            href="/explore"
            style={{
              minWidth: '160px', padding: '0.625rem 2rem',
              borderRadius: '9999px',
              background: 'rgba(0,0,0,0.90)', color: '#fff',
              border: '1px solid rgba(255,255,255,0.90)',
              fontWeight: 500, fontSize: '0.875rem',
              boxShadow: '0 12px 24px rgba(12,12,12,0.25)',
              textDecoration: 'none', display: 'inline-flex', alignItems: 'center', justifyContent: 'center',
              fontFamily: 'inherit',
            }}
          >
            Start Exploring →
          </Link>
        </div>
      </main>

      {/* Modals */}
      {modal !== null && (() => {
        const isAbout = modal === 'about';
        const wash = isAbout
          ? 'linear-gradient(135deg,#fcd5e0,#e8789a 55%,#b83865)'
          : 'linear-gradient(135deg,#c8e8f8,#78b8e8 55%,#3070b8)';
        return (
          <div className="atlas-map-overlay atlas-fade-in">
            <div className="atlas-map-backdrop" onClick={() => setModal(null)} />
            <div style={{
              position: 'relative', width: '100%', maxWidth: '30rem',
              borderRadius: '1.75rem', overflow: 'hidden',
              background: 'rgba(255,255,255,0.92)',
              border: '1px solid rgba(255,255,255,0.70)',
              backdropFilter: 'blur(32px) saturate(1.2)',
              WebkitBackdropFilter: 'blur(32px) saturate(1.2)',
              boxShadow: '0 32px 80px rgba(10,10,20,0.28)',
            }}>
              {/* Gradient header — styled like the track cards */}
              <div style={{ position: 'relative', height: '160px', overflow: 'hidden' }}>
                <div style={{ position: 'absolute', inset: 0, background: wash, filter: 'blur(2px) saturate(1.1)', transform: 'scale(1.04)' }} />
                {/* grain */}
                <div style={{
                  position: 'absolute', inset: 0, mixBlendMode: 'overlay', opacity: 0.22,
                  backgroundImage: 'radial-gradient(rgba(255,255,255,0.55) 1px, transparent 1px)',
                  backgroundSize: '3px 3px',
                }} />
                {/* diagonal stripe */}
                <div style={{
                  position: 'absolute', inset: 0,
                  background: 'repeating-linear-gradient(135deg, rgba(255,255,255,0.04) 0 16px, rgba(0,0,0,0.04) 16px 32px)',
                  mixBlendMode: 'soft-light',
                }} />
                {/* kicker + close */}
                <div style={{ position: 'absolute', top: '1.1rem', left: '1.5rem', right: '1.25rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <span className="atlas-mono" style={{ color: 'rgba(255,255,255,0.70)', fontSize: '0.6rem' }}>
                    {isAbout ? 'Atlas · About' : 'Atlas · Guide'}
                  </span>
                  <button onClick={() => setModal(null)} style={{
                    background: 'rgba(255,255,255,0.20)', border: '1px solid rgba(255,255,255,0.35)',
                    borderRadius: '9999px', width: '1.75rem', height: '1.75rem',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', color: 'rgba(255,255,255,0.85)', fontSize: '0.75rem',
                    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
                    transition: 'background 0.15s',
                  }}>✕</button>
                </div>
                {/* title overlaid at bottom of header */}
                <div style={{ position: 'absolute', bottom: '1.25rem', left: '1.5rem', right: '1.5rem' }}>
                  <h2 style={{
                    fontSize: '1.75rem', fontWeight: 500, letterSpacing: '-0.02em',
                    color: '#fff', margin: 0,
                    textShadow: '0 1px 12px rgba(0,0,0,0.18)',
                  }}>
                    {isAbout ? 'About Atlas' : 'How It Works'}
                  </h2>
                </div>
              </div>

              {/* Content area */}
              <div style={{ padding: '1.5rem 1.75rem 1.75rem' }}>
                {isAbout ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    {[
                      'Atlas is an AI-powered immersive learning platform that brings history and science to life through interactive 3D environments.',
                      'By combining generative 3D scene creation with a contextual AI guide, Atlas lets you explore any moment in history — or any system in science — the way you\'d explore a real place.',
                      'Built for students, educators, and curious minds. No VR headset required.',
                    ].map((p, i) => (
                      <p key={i} style={{ fontSize: '0.875rem', color: 'rgba(0,0,0,0.62)', lineHeight: 1.7, margin: 0 }}>{p}</p>
                    ))}
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    {[
                      { title: 'Pick a track', body: 'Choose Humanities for historical walkthroughs or STEM for interactive science experiments.' },
                      { title: 'Step inside', body: 'Atlas loads an immersive 3D environment you can explore freely in your browser.' },
                      { title: 'Learn through discovery', body: 'Your AI guide answers questions in context as you explore — click anything to learn more.' },
                    ].map(({ title, body }, i) => (
                      <div key={title}>
                        {i > 0 && <div style={{ height: '1px', background: 'rgba(0,0,0,0.07)', margin: '0.9rem 0' }} />}
                        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'rgba(0,0,0,0.85)', margin: '0 0 0.25rem' }}>{title}</p>
                        <p style={{ fontSize: '0.8125rem', color: 'rgba(0,0,0,0.58)', lineHeight: 1.65, margin: 0 }}>{body}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        );
      })()}
    </div>
  )
}
