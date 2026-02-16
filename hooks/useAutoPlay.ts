'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useGame } from '@/lib/game-context'

export function useAutoPlay(initialEnabled = false) {
  const [enabled, setEnabled] = useState(initialEnabled)
  const timeoutsRef = useRef<NodeJS.Timeout[]>([])
  const isPlayingRef = useRef(false)

  const {
    isPlayerTurn,
    gameOver,
    playerHand,
    playerField,
    playerMana,
    opponentField,
    playCard,
    selectAttacker,
    attackTarget,
    attackHero,
    endTurn,
  } = useGame()

  const clearAllTimeouts = useCallback(() => {
    timeoutsRef.current.forEach(clearTimeout)
    timeoutsRef.current = []
    isPlayingRef.current = false
  }, [])

  const addTimeout = useCallback((callback: () => void, delay: number) => {
    const timeout = setTimeout(callback, delay)
    timeoutsRef.current.push(timeout)
    return timeout
  }, [])

  const autoPlay = useCallback(() => {
    if (!enabled || !isPlayerTurn || gameOver || isPlayingRef.current) return

    isPlayingRef.current = true
    let delay = 1000

    // Phase 1: Play affordable cards (highest mana first)
    const affordable = [...playerHand]
      .filter(card => card.mana <= playerMana)
      .sort((a, b) => b.mana - a.mana)

    let playedCount = 0
    affordable.forEach((card) => {
      if (playerField.length + playedCount >= 7) return
      addTimeout(() => playCard(card.id), delay)
      delay += 600
      playedCount++
    })

    // Phase 2: Attack with available minions
    delay += 800
    const attackers = playerField.filter(m => m.canAttack)

    attackers.forEach((attacker) => {
      addTimeout(() => {
        selectAttacker(attacker.id)

        addTimeout(() => {
          if (opponentField.length === 0) {
            attackHero()
          } else if (Math.random() < 0.7) {
            // Go face — but must kill a blocker first (game enforces taunt)
            const weakest = opponentField.reduce((min, t) =>
              t.health < min.health ? t : min, opponentField[0])
            attackTarget(weakest.id)
          } else {
            // Trade favorably
            const favorable = opponentField.find(
              t => t.attack < attacker.health
            ) || opponentField[0]
            attackTarget(favorable.id)
          }
        }, 200)
      }, delay)
      delay += 700
    })

    // Phase 3: End turn
    delay += 500
    addTimeout(() => {
      endTurn()
      isPlayingRef.current = false
    }, delay)
  }, [
    enabled, isPlayerTurn, gameOver,
    playerHand, playerField, playerMana, opponentField,
    playCard, selectAttacker, attackTarget, attackHero, endTurn,
    addTimeout,
  ])

  // Trigger auto-play when turn starts
  useEffect(() => {
    if (enabled && isPlayerTurn && !gameOver) {
      autoPlay()
    }
  }, [enabled, isPlayerTurn, gameOver, autoPlay])

  // Cleanup on unmount or disable
  useEffect(() => {
    if (!enabled) clearAllTimeouts()
    return clearAllTimeouts
  }, [enabled, clearAllTimeouts])

  const toggle = useCallback(() => setEnabled(prev => !prev), [])

  return { enabled, toggle }
}
