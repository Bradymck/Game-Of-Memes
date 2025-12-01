"use client"

import { createContext, useContext, useState, useCallback, type ReactNode } from "react"

export interface MemeCardData {
  id: string
  name: string
  image: string
  rarity: "common" | "rare" | "epic" | "legendary"
  attack: number
  health: number
  mana: number
  ticker: string
  ability?: string
  canAttack?: boolean
}

interface GameState {
  playerHand: MemeCardData[]
  playerField: MemeCardData[]
  opponentField: MemeCardData[]
  playerMana: number
  maxPlayerMana: number
  opponentMana: number
  maxOpponentMana: number
  playerHealth: number
  opponentHealth: number
  selectedCard: string | null
  selectedAttacker: string | null
  isPlayerTurn: boolean
  turnNumber: number
}

interface GameContextType extends GameState {
  playCard: (cardId: string) => void
  selectCard: (cardId: string | null) => void
  selectAttacker: (cardId: string | null) => void
  attackTarget: (targetId: string | null) => void
  attackHero: () => void
  endTurn: () => void
}

const initialPlayerHand: MemeCardData[] = [
  {
    id: "h1",
    name: "Diamond Doge",
    image: "/shiba-inu-dog-diamond-hands-crypto-meme.jpg",
    rarity: "legendary",
    attack: 8,
    health: 6,
    mana: 7,
    ticker: "$DOGE",
    ability: "HODL: Immune for 1 turn",
  },
  {
    id: "h2",
    name: "Sad Pepe",
    image: "/sad-pepe-frog-meme-crying.jpg",
    rarity: "rare",
    attack: 4,
    health: 5,
    mana: 3,
    ticker: "$PEPE",
  },
  {
    id: "h3",
    name: "Wojak",
    image: "/wojak-meme-face-crying-trader.jpg",
    rarity: "common",
    attack: 2,
    health: 3,
    mana: 2,
    ticker: "$WOJ",
  },
  {
    id: "h4",
    name: "Chad Bull",
    image: "/chad-muscular-bull-crypto-meme.jpg",
    rarity: "epic",
    attack: 6,
    health: 5,
    mana: 5,
    ticker: "$CHAD",
    ability: "Bull Run: +2 Attack",
  },
]

const initialPlayerField: MemeCardData[] = [
  {
    id: "p1",
    name: "Stonks",
    image: "/stonks-meme-man-suit-pointing-up.jpg",
    rarity: "rare",
    attack: 4,
    health: 4,
    mana: 3,
    ticker: "$STONK",
    canAttack: true,
  },
]

const initialOpponentField: MemeCardData[] = [
  {
    id: "o1",
    name: "FUD Bear",
    image: "/scary-bear-market-crash-meme.jpg",
    rarity: "epic",
    attack: 5,
    health: 6,
    mana: 4,
    ticker: "$FUD",
  },
  {
    id: "o2",
    name: "Paper Hands",
    image: "/nervous-sweating-man-selling-meme.jpg",
    rarity: "common",
    attack: 3,
    health: 2,
    mana: 2,
    ticker: "$PAPER",
  },
]

const GameContext = createContext<GameContextType | null>(null)

export function GameProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<GameState>({
    playerHand: initialPlayerHand,
    playerField: initialPlayerField,
    opponentField: initialOpponentField,
    playerMana: 5,
    maxPlayerMana: 5,
    opponentMana: 4,
    maxOpponentMana: 4,
    playerHealth: 30,
    opponentHealth: 22,
    selectedCard: null,
    selectedAttacker: null,
    isPlayerTurn: true,
    turnNumber: 5,
  })

  const playCard = useCallback((cardId: string) => {
    setState((prev) => {
      const card = prev.playerHand.find((c) => c.id === cardId)
      if (!card || card.mana > prev.playerMana || prev.playerField.length >= 7) return prev

      return {
        ...prev,
        playerHand: prev.playerHand.filter((c) => c.id !== cardId),
        playerField: [...prev.playerField, { ...card, canAttack: false }],
        playerMana: prev.playerMana - card.mana,
        selectedCard: null,
      }
    })
  }, [])

  const selectCard = useCallback((cardId: string | null) => {
    setState((prev) => ({ ...prev, selectedCard: cardId, selectedAttacker: null }))
  }, [])

  const selectAttacker = useCallback((cardId: string | null) => {
    setState((prev) => {
      const card = prev.playerField.find((c) => c.id === cardId)
      if (cardId && card && !card.canAttack) return prev
      return { ...prev, selectedAttacker: cardId, selectedCard: null }
    })
  }, [])

  const attackTarget = useCallback((targetId: string | null) => {
    setState((prev) => {
      if (!prev.selectedAttacker || !targetId) return prev

      const attacker = prev.playerField.find((c) => c.id === prev.selectedAttacker)
      const target = prev.opponentField.find((c) => c.id === targetId)
      if (!attacker || !target) return prev

      const newTargetHealth = target.health - attacker.attack
      const newAttackerHealth = attacker.health - target.attack

      return {
        ...prev,
        playerField:
          newAttackerHealth <= 0
            ? prev.playerField.filter((c) => c.id !== attacker.id)
            : prev.playerField.map((c) =>
                c.id === attacker.id ? { ...c, health: newAttackerHealth, canAttack: false } : c,
              ),
        opponentField:
          newTargetHealth <= 0
            ? prev.opponentField.filter((c) => c.id !== target.id)
            : prev.opponentField.map((c) => (c.id === target.id ? { ...c, health: newTargetHealth } : c)),
        selectedAttacker: null,
      }
    })
  }, [])

  const attackHero = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedAttacker) return prev
      const attacker = prev.playerField.find((c) => c.id === prev.selectedAttacker)
      if (!attacker) return prev

      return {
        ...prev,
        opponentHealth: prev.opponentHealth - attacker.attack,
        playerField: prev.playerField.map((c) => (c.id === attacker.id ? { ...c, canAttack: false } : c)),
        selectedAttacker: null,
      }
    })
  }, [])

  const endTurn = useCallback(() => {
    setState((prev) => ({
      ...prev,
      isPlayerTurn: false,
      selectedCard: null,
      selectedAttacker: null,
    }))

    // Simulate opponent turn
    setTimeout(() => {
      setState((prev) => {
        const newMaxMana = Math.min(10, prev.maxPlayerMana + 1)
        return {
          ...prev,
          isPlayerTurn: true,
          playerMana: newMaxMana,
          maxPlayerMana: newMaxMana,
          turnNumber: prev.turnNumber + 1,
          playerField: prev.playerField.map((c) => ({ ...c, canAttack: true })),
        }
      })
    }, 1500)
  }, [])

  return (
    <GameContext.Provider
      value={{
        ...state,
        playCard,
        selectCard,
        selectAttacker,
        attackTarget,
        attackHero,
        endTurn,
      }}
    >
      {children}
    </GameContext.Provider>
  )
}

export function useGame() {
  const context = useContext(GameContext)
  if (!context) throw new Error("useGame must be used within a GameProvider")
  return context
}
