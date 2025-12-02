"use client"

import { useState } from "react"
import { usePrivy } from "@privy-io/react-auth"
import { cn } from "@/lib/utils"
import { Settings, Wallet, Database, Zap, LogOut, User } from "lucide-react"
import { SoulCounter } from "@/components/soul-counter"

export function ArcadeWalletButton() {
  const { user, login, logout, authenticated } = usePrivy()
  const [isPressed, setIsPressed] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)

  const handlePress = () => {
    setIsPressed(true)
    setTimeout(() => setIsPressed(false), 150)

    if (!authenticated) {
      login()
    } else {
      setMenuOpen(!menuOpen)
    }
  }

  return (
    <>
      {/* Arcade Button - Bottom Right */}
      <div className="fixed bottom-8 right-8 z-50">
        {!authenticated ? (
          // START Button - Before Connection
          <button
            onClick={handlePress}
            className="relative group"
          >
            {/* 3D Button Base (shadow/depth) */}
            <div className={cn(
              "absolute inset-0 rounded-2xl bg-gradient-to-b from-red-950 to-red-950 blur-sm",
              "transition-all duration-150",
              isPressed ? "translate-y-1" : "translate-y-2"
            )} />

            {/* Button Body */}
            <div className={cn(
              "relative w-32 h-32 rounded-2xl",
              "bg-gradient-to-b from-red-500 via-red-600 to-red-800",
              "border-4 border-red-400",
              "shadow-2xl",
              "flex flex-col items-center justify-center gap-2",
              "transition-all duration-150",
              "group-hover:from-red-400 group-hover:via-red-500 group-hover:to-red-700",
              isPressed ? "translate-y-1 shadow-xl" : "translate-y-0 shadow-2xl"
            )}>
              {/* Inner shine */}
              <div className="absolute inset-2 rounded-xl bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />

              {/* START Text */}
              <div className="relative text-white font-black text-2xl drop-shadow-lg tracking-wider">
                START
              </div>

              {/* Pulse animation */}
              <div className="absolute inset-0 rounded-2xl border-4 border-red-300 animate-ping opacity-20" />
            </div>

            {/* Bottom ridge for 3D effect */}
            <div className={cn(
              "absolute -bottom-1 left-2 right-2 h-2 rounded-b-xl bg-gradient-to-b from-red-950 to-black",
              "transition-all duration-150",
              isPressed && "opacity-50"
            )} />
          </button>
        ) : (
          // Gear Icon - After Connection
          <button
            onClick={handlePress}
            className="relative group"
          >
            {/* 3D Button Base */}
            <div className={cn(
              "absolute inset-0 rounded-full bg-gradient-to-b from-amber-950 to-amber-950 blur-sm",
              "transition-all duration-150",
              isPressed ? "translate-y-1" : "translate-y-2"
            )} />

            {/* Button Body */}
            <div className={cn(
              "relative w-20 h-20 rounded-full",
              "bg-gradient-to-b from-amber-500 via-amber-600 to-amber-800",
              "border-4 border-amber-400",
              "shadow-2xl",
              "flex items-center justify-center",
              "transition-all duration-150",
              "group-hover:from-amber-400 group-hover:via-amber-500 group-hover:to-amber-700",
              isPressed ? "translate-y-1 shadow-xl" : "translate-y-0 shadow-2xl",
              menuOpen && "ring-4 ring-amber-400/50"
            )}>
              <div className="absolute inset-2 rounded-full bg-gradient-to-b from-white/20 to-transparent pointer-events-none" />
              <Settings className={cn(
                "w-10 h-10 text-white drop-shadow-lg transition-transform duration-300",
                menuOpen && "rotate-90"
              )} />
            </div>

            {/* Bottom ridge */}
            <div className={cn(
              "absolute -bottom-1 left-2 right-2 h-2 rounded-b-full bg-gradient-to-b from-amber-950 to-black",
              "transition-all duration-150",
              isPressed && "opacity-50"
            )} />

            {/* Connected indicator */}
            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 border-3 border-white rounded-full shadow-lg animate-pulse" />
          </button>
        )}

        {/* Dropdown Menu */}
        {authenticated && (
          <div className={cn(
            "absolute bottom-24 right-0 w-72",
            "bg-gradient-to-b from-slate-800 to-slate-900",
            "border-3 border-amber-600 rounded-2xl shadow-2xl",
            "transition-all duration-300 origin-bottom-right",
            "overflow-hidden",
            menuOpen ? "scale-100 opacity-100" : "scale-95 opacity-0 pointer-events-none"
          )}>
            {/* Header with Soul Counter */}
            <div className="bg-gradient-to-r from-amber-700 to-amber-800 px-4 py-3 border-b-2 border-amber-600">
              <div className="flex items-center justify-between mb-2">
                <span className="text-amber-100 font-bold text-sm">Account</span>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="text-amber-200 hover:text-white transition-colors"
                >
                  ✕
                </button>
              </div>
              <SoulCounter />
            </div>

            {/* Menu Items */}
            <div className="p-2 space-y-1">
              {/* Wallet Address */}
              <div className="px-4 py-3 rounded-lg bg-slate-700/50 border border-slate-600">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <User className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-amber-100 font-semibold text-xs mb-1">
                      {user?.wallet?.address ? (
                        <>
                          {user.wallet.address.slice(0, 6)}...{user.wallet.address.slice(-4)}
                        </>
                      ) : (
                        "Connected"
                      )}
                    </div>
                    <div className="text-amber-300/60 text-xs">
                      {user?.email?.address || user?.google?.email || "Wallet User"}
                    </div>
                  </div>
                </div>
              </div>

              {/* Menu Buttons */}
              <button className="w-full px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700 transition-colors border border-slate-600/50 flex items-center gap-3 group">
                <Wallet className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                <span className="text-amber-100 font-medium text-sm">Wallet</span>
              </button>

              <button className="w-full px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700 transition-colors border border-slate-600/50 flex items-center gap-3 group">
                <Database className="w-5 h-5 text-blue-400 group-hover:scale-110 transition-transform" />
                <span className="text-amber-100 font-medium text-sm">My Data</span>
              </button>

              <button className="w-full px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700 transition-colors border border-slate-600/50 flex items-center gap-3 group">
                <Zap className="w-5 h-5 text-yellow-400 group-hover:scale-110 transition-transform" />
                <span className="text-amber-100 font-medium text-sm">Features</span>
              </button>

              <button className="w-full px-4 py-3 rounded-lg bg-slate-700/30 hover:bg-slate-700 transition-colors border border-slate-600/50 flex items-center gap-3 group">
                <Settings className="w-5 h-5 text-gray-400 group-hover:scale-110 transition-transform" />
                <span className="text-amber-100 font-medium text-sm">Settings</span>
              </button>

              {/* Divider */}
              <div className="h-px bg-slate-600 my-2" />

              {/* Logout */}
              <button
                onClick={() => {
                  setMenuOpen(false)
                  logout()
                }}
                className="w-full px-4 py-3 rounded-lg bg-red-900/30 hover:bg-red-900/50 transition-colors border border-red-600/50 flex items-center gap-3 group"
              >
                <LogOut className="w-5 h-5 text-red-400 group-hover:scale-110 transition-transform" />
                <span className="text-red-200 font-medium text-sm">Disconnect</span>
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Click outside to close */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40"
          onClick={() => setMenuOpen(false)}
        />
      )}
    </>
  )
}
