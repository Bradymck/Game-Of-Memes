'use client'

import { useState, useEffect } from 'react'
import { VRF_LORE_LINES } from '@/lib/pack-opening-types'

interface VRFWaitingStateProps {
  packName: string
  onComplete?: () => void
}

export function VRFWaitingState({ packName, onComplete }: VRFWaitingStateProps) {
  const [visibleLines, setVisibleLines] = useState<number>(0)
  const [pulseIntensity, setPulseIntensity] = useState(0)

  // Reveal lore lines one by one
  useEffect(() => {
    if (visibleLines < VRF_LORE_LINES.length) {
      const timer = setTimeout(() => {
        setVisibleLines(prev => prev + 1)
      }, 600)
      return () => clearTimeout(timer)
    }
  }, [visibleLines])

  // Pulse intensity increases over time
  useEffect(() => {
    const interval = setInterval(() => {
      setPulseIntensity(prev => Math.min(prev + 0.1, 1))
    }, 200)
    return () => clearInterval(interval)
  }, [])

  return (
    <div className="fixed inset-0 bg-black flex flex-col items-center justify-center overflow-hidden">
      {/* Background particles - use deterministic positions based on index to avoid hydration mismatch */}
      <div className="absolute inset-0 overflow-hidden">
        {Array.from({ length: 20 }).map((_, i) => (
          <div
            key={i}
            className="absolute w-1 h-1 bg-amber-400/30 rounded-full animate-float"
            style={{
              left: `${(i * 17 + 5) % 100}%`,
              top: `${(i * 23 + 10) % 100}%`,
              animationDelay: `${(i * 0.15) % 3}s`,
              animationDuration: `${3 + (i % 5) * 0.4}s`,
            }}
          />
        ))}
      </div>

      {/* Central orb with rotating rings */}
      <div className="relative mb-12">
        {/* Outer rotating ring */}
        <div 
          className="absolute inset-0 w-48 h-48 -m-6 border-2 border-amber-500/30 rounded-full animate-spin-slow"
          style={{ animationDuration: '8s' }}
        />
        
        {/* Middle rotating ring (opposite direction) */}
        <div 
          className="absolute inset-0 w-40 h-40 -m-2 border border-purple-500/40 rounded-full"
          style={{ 
            animation: 'spin 6s linear infinite reverse',
          }}
        />

        {/* Inner pulsing orb */}
        <div 
          className="w-36 h-36 rounded-full bg-gradient-to-br from-amber-500 via-orange-500 to-purple-600 flex items-center justify-center shadow-2xl"
          style={{
            boxShadow: `0 0 ${40 + pulseIntensity * 60}px ${20 + pulseIntensity * 30}px rgba(245, 158, 11, ${0.3 + pulseIntensity * 0.3})`,
            animation: 'pulse 1.5s ease-in-out infinite',
          }}
        >
          {/* Pack icon */}
          <div className="text-6xl animate-bounce" style={{ animationDuration: '2s' }}>
            🎴
          </div>
        </div>

        {/* Radial progress ring */}
        <svg 
          className="absolute inset-0 w-48 h-48 -m-6 -rotate-90"
          viewBox="0 0 100 100"
        >
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="rgba(245, 158, 11, 0.2)"
            strokeWidth="2"
          />
          <circle
            cx="50"
            cy="50"
            r="45"
            fill="none"
            stroke="url(#gradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray={`${pulseIntensity * 283} 283`}
            className="transition-all duration-200"
          />
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#F59E0B" />
              <stop offset="100%" stopColor="#8B5CF6" />
            </linearGradient>
          </defs>
        </svg>
      </div>

      {/* Pack name */}
      <h1 className="text-2xl md:text-3xl font-bold text-white mb-8 text-center">
        {packName}
      </h1>

      {/* Lore text lines */}
      <div className="space-y-3 text-center min-h-[160px]">
        {VRF_LORE_LINES.slice(0, visibleLines).map((line, i) => (
          <p
            key={i}
            className="text-gray-400 text-lg animate-fade-in"
            style={{
              opacity: i === visibleLines - 1 ? 1 : 0.5,
              animation: 'fadeIn 0.5s ease-out forwards',
            }}
          >
            {line}
          </p>
        ))}
      </div>

      {/* Styles */}
      <style jsx>{`
        @keyframes float {
          0%, 100% { transform: translateY(0) translateX(0); opacity: 0.3; }
          50% { transform: translateY(-20px) translateX(10px); opacity: 0.6; }
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-float {
          animation: float 3s ease-in-out infinite;
        }
        .animate-spin-slow {
          animation: spin 8s linear infinite;
        }
        .animate-fade-in {
          animation: fadeIn 0.5s ease-out forwards;
        }
      `}</style>
    </div>
  )
}
