"use client"

import Link from "next/link"

interface HeaderProps {
  onAbout: () => void
}

export default function Header({ onAbout }: HeaderProps) {
  return (
    <header className="relative z-20 px-4 pt-4 sm:px-6 sm:pt-6">
      <div className="mx-auto w-full max-w-6xl rounded-full border border-white/40 bg-white/20 backdrop-blur-xl shadow-[0_8px_30px_rgba(20,20,20,0.16)]">
        <div className="flex items-center justify-between px-4 py-2 sm:px-5">
          <Link
            href="/"
            className="text-sm font-semibold tracking-wide text-black/80 hover:text-black transition-colors duration-200 px-1"
          >
            Atlas
          </Link>

          <nav className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onAbout}
              className="text-black/70 hover:text-black text-xs sm:text-sm font-medium px-3 py-2 rounded-full hover:bg-white/40 transition-colors duration-200 cursor-pointer"
            >
              About
            </button>
            <Link
              href="/explore"
              className="ml-1 h-8 px-5 rounded-full bg-black/85 text-white text-xs sm:text-sm font-medium hover:bg-black transition-colors duration-200 inline-flex items-center"
            >
              Explore
            </Link>
          </nav>
        </div>
      </div>
    </header>
  )
}
