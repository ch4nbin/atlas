"use client"

export default function HeroContent() {
  return (
    <main className="absolute top-24 left-1/2 -translate-x-1/2 z-20 max-w-lg">
      <div className="text-center">
        <div
          className="inline-flex items-center px-3 py-1 rounded-full bg-black/5 backdrop-blur-sm mb-4 relative"
          style={{
            filter: "url(#glass-effect)",
          }}
        >
          <div className="absolute top-0 left-1 right-1 h-px bg-gradient-to-r from-transparent via-black/20 to-transparent rounded-full" />
          <span className="text-black/90 text-xs font-light relative z-10">AI-Powered Immersive Learning</span>
        </div>

        {/* Main Heading */}
        <h1 className="text-5xl md:text-6xl md:leading-16 tracking-tight font-light text-black mb-4">
          <span className="font-medium italic instrument">Step Into</span> History
          <br />
          <span className="font-light tracking-tight text-black">With Atlas</span>
        </h1>

        {/* Description */}
        <p className="text-xs font-light text-black/70 mb-4 leading-relaxed">
          Explore immersive 3D environments from any place and time period. Type a prompt, step inside, and learn through curiosity-driven discovery with your AI guide.
        </p>

        {/* Buttons */}
        <div className="flex items-center justify-center gap-4 flex-wrap">
          <button className="px-8 py-3 rounded-full bg-transparent border border-black/30 text-black font-normal text-xs transition-all duration-200 hover:bg-black/10 hover:border-black/50 cursor-pointer">
            Learn More
          </button>
          <button className="px-8 py-3 rounded-full bg-black text-white font-normal text-xs transition-all duration-200 hover:bg-black/90 cursor-pointer">
            Start Exploring
          </button>
        </div>
      </div>
    </main>
  )
}
