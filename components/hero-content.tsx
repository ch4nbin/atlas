"use client"

export default function HeroContent() {
  return (
    <main className="absolute top-24 left-1/2 -translate-x-1/2 z-20 w-[92vw] max-w-2xl px-4">
      <div className="text-center">
        <div
          className="inline-flex items-center px-4 py-1.5 rounded-full border border-white/45 bg-white/18 backdrop-blur-xl mb-4 relative shadow-[0_8px_20px_rgba(20,20,20,0.08)]"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-2 right-2 h-px bg-gradient-to-r from-transparent via-white/80 to-transparent rounded-full" />
          <span className="text-black/70 text-xs sm:text-sm font-medium relative z-10 tracking-[0.01em]">
            AI-Powered Immersive Learning
          </span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-[1.08] tracking-tight font-light text-black/85 mb-4">
          <span className="font-medium italic instrument text-black/90">Step Into</span> History
          <br />
          <span className="font-light tracking-tight text-black/85">With Atlas</span>
        </h1>

        {/* Description */}
        <p className="mx-auto max-w-xl text-sm md:text-base font-normal text-black/65 mb-6 leading-relaxed">
          Explore immersive 3D environments from any place and time period. Type a prompt, step inside, and learn through discovery with your AI guide.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 flex-wrap">
          <button className="min-w-[170px] px-7 py-2.5 rounded-full border border-white/55 bg-white/20 backdrop-blur-xl text-black/80 font-medium text-sm transition-all duration-200 hover:bg-white/35 hover:text-black/90 cursor-pointer shadow-[0_8px_20px_rgba(20,20,20,0.08)]">
            Learn More
          </button>
          <button className="min-w-[190px] px-8 py-2.5 rounded-full border border-white/90 bg-black/90 text-white font-medium text-sm transition-all duration-200 hover:bg-black hover:border-white cursor-pointer shadow-[0_12px_24px_rgba(12,12,12,0.25)]">
            Start Exploring
          </button>
        </div>
      </div>
    </main>
  )
}
