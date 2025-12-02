"use client"

import { useSouls } from "@/hooks/useSouls"
import { cn } from "@/lib/utils"

export function SoulCounter() {
  const { souls, loading } = useSouls();

  if (loading) {
    return (
      <div className="flex items-center gap-2 px-3 py-2 bg-purple-900/30 border border-purple-500/30 rounded-lg">
        <span className="text-purple-300 text-sm animate-pulse">Loading...</span>
      </div>
    );
  }

  return (
    <div className="group relative flex items-center gap-2 px-3 py-2 bg-purple-900/40 border border-purple-500/50 rounded-lg hover:bg-purple-900/60 transition-all">
      {/* Ghost icon */}
      <span className="text-2xl">👻</span>

      {/* Soul count */}
      <div className="flex flex-col">
        <span className="text-purple-200 font-bold text-lg leading-none">{souls}</span>
        <span className="text-purple-400/70 text-xs leading-none">Souls</span>
      </div>

      {/* Tooltip on hover */}
      <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
        <div className="bg-black/95 text-purple-200 text-xs px-3 py-2 rounded-lg whitespace-nowrap border border-purple-500/30 shadow-xl">
          <div className="font-semibold mb-1">More lives than a cat, eh?</div>
          <div className="text-purple-300/70">Future voting power</div>
        </div>
        {/* Arrow */}
        <div className="absolute top-full left-1/2 -translate-x-1/2 -mt-1">
          <div className="border-4 border-transparent border-t-black/95" />
        </div>
      </div>
    </div>
  );
}
