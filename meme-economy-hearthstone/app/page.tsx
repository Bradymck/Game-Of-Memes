import { GameProvider } from "@/lib/game-context"
import { GameBoard } from "@/components/game-board"

export default function Home() {
  return (
    <GameProvider>
      <main className="h-screen w-screen overflow-hidden">
        <GameBoard />
      </main>
    </GameProvider>
  )
}
