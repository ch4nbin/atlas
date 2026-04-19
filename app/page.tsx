"use client"

import { useState } from "react"
import Link from "next/link"
import { AuroraBackground } from "@/components/atlas/AuroraBackground"
import '@/styles/atlas.css'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

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
      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="border border-white/40 bg-white/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(20,20,20,0.15)]">
          {modal === "how-it-works" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-black/90">How It Works</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-black/70 leading-relaxed">
                {[
                  { n: 1, title: 'Pick a track', body: 'Choose Humanities for historical walkthroughs or STEM for interactive science experiments.' },
                  { n: 2, title: 'Step inside', body: 'Atlas loads an immersive 3D environment you can explore freely in your browser.' },
                  { n: 3, title: 'Learn through discovery', body: 'Your AI guide answers questions in context as you explore — click anything to learn more.' },
                ].map(({ n, title, body }) => (
                  <div key={n} className="flex gap-3">
                    <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold text-black/70">{n}</span>
                    <div>
                      <p className="font-medium text-black/85 mb-0.5">{title}</p>
                      <p>{body}</p>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}
          {modal === "about" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-black/90">About Atlas</DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-black/70 leading-relaxed">
                <p>Atlas is an AI-powered immersive learning platform that brings history and science to life through interactive 3D environments.</p>
                <p>We believe the best way to understand the world is to experience it. By combining generative 3D scene creation with a contextual AI guide, Atlas lets you explore any moment in history — or any system in science — the way you&apos;d explore a real place.</p>
                <p>Built for students, educators, and curious minds. No VR headset required.</p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
