import { Suspense } from "react"
import { GameProvider } from "@/lib/game-context"
import { GameBoard } from "@/components/game-board"

function GameContent() {
  return (
    <GameProvider>
      <main className="h-screen w-screen overflow-hidden">
        <GameBoard />
      </main>
    </GameProvider>
  )
}

export default function Home() {
  return (
    <Suspense fallback={
      <main className="h-screen w-screen overflow-hidden bg-black flex items-center justify-center">
        <div className="text-white text-2xl animate-pulse">Loading game...</div>
      </main>
    }>
      <GameContent />
    </Suspense>
  )
}
