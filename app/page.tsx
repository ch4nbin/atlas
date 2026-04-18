"use client"

import { useState } from "react"
import Header from "@/components/header"
import HeroContent from "@/components/hero-content"
import ShaderBackground from "@/components/shader-background"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

type ModalType = "how-it-works" | "about" | null

export default function ShaderShowcase() {
  const [modal, setModal] = useState<ModalType>(null)

  return (
    <ShaderBackground>
      <Header onAbout={() => setModal("about")} />
      <HeroContent onHowItWorks={() => setModal("how-it-works")} />

      <Dialog open={modal !== null} onOpenChange={(open) => !open && setModal(null)}>
        <DialogContent className="border border-white/40 bg-white/80 backdrop-blur-2xl shadow-[0_20px_60px_rgba(20,20,20,0.15)]">
          {modal === "how-it-works" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-black/90">
                  How It Works
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4 text-sm text-black/70 leading-relaxed">
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold text-black/70">1</span>
                  <div>
                    <p className="font-medium text-black/85 mb-0.5">Type a prompt</p>
                    <p>Describe any place and time period — &ldquo;Ancient Rome, 50 BC&rdquo; or &ldquo;Han Dynasty marketplace.&rdquo;</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold text-black/70">2</span>
                  <div>
                    <p className="font-medium text-black/85 mb-0.5">Step inside</p>
                    <p>Atlas generates an immersive 3D environment you can explore freely in your browser.</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-black/10 flex items-center justify-center text-xs font-semibold text-black/70">3</span>
                  <div>
                    <p className="font-medium text-black/85 mb-0.5">Learn through discovery</p>
                    <p>Your AI historical guide answers questions in context as you explore — click anything to learn more.</p>
                  </div>
                </div>
              </div>
            </>
          )}

          {modal === "about" && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl font-medium text-black/90">
                  About Atlas
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-3 text-sm text-black/70 leading-relaxed">
                <p>
                  Atlas is an AI-powered immersive learning platform that brings history to life through interactive 3D environments.
                </p>
                <p>
                  We believe the best way to understand the past is to experience it. By combining generative 3D scene creation with a contextual AI guide, Atlas lets you explore historical moments the way you&apos;d explore a real place.
                </p>
                <p>
                  Built for students, educators, and curious minds — no VR headset required.
                </p>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </ShaderBackground>
  )
}
