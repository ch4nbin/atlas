"use client"

export default function Header() {
  return (
    <header className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(20,20,20,0.16)]">
        <div className="flex items-center justify-between px-3 py-2 sm:px-4">
          <nav className="flex items-center gap-1 sm:gap-2">
            <a
              href="#"
              className="text-black/80 hover:text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-full hover:bg-white/40 transition-colors duration-200"
            >
              Explore
            </a>
            <a
              href="#"
              className="text-black/80 hover:text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-full hover:bg-white/40 transition-colors duration-200"
            >
              How It Works
            </a>
            <a
              href="#"
              className="text-black/80 hover:text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-full hover:bg-white/40 transition-colors duration-200"
            >
              About
            </a>
          </nav>

          <button className="h-9 px-6 rounded-full bg-black/90 text-white text-xs sm:text-sm font-medium hover:bg-black transition-colors duration-200 cursor-pointer">
            Begin
          </button>
        </div>
      </div>
    </header>
  )
}
