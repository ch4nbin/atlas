"use client"

import Link from "next/link"

interface HeaderProps {
  onAbout: () => void
}

export default function Header({ onAbout }: HeaderProps) {
  return (
    <header className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(20,20,20,0.16)]">
        <div className="flex items-center gap-2 sm:gap-4 px-3 py-2 sm:px-5 min-h-[2.75rem]">
          <Link
            href="/"
            className="shrink-0 text-sm font-semibold tracking-wide text-black/80 hover:text-black transition-colors duration-200 px-1"
          >
            Atlas
          </Link>

          <p className="flex-1 min-w-0 text-center text-[11px] sm:text-xs font-medium text-black/55 tracking-[0.02em] leading-snug pointer-events-none select-none">
            AI-Powered Immersive Learning
          </p>

          <nav className="shrink-0 flex items-center justify-end">
            <button
              type="button"
              onClick={onAbout}
              className="text-black/70 hover:text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-full hover:bg-white/40 transition-colors duration-200 cursor-pointer"
            >
              About
            </button>
          </nav>
        </div>
      </div>
    </header>
  )
}
