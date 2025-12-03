'use client'

import { useState, useEffect } from 'react'
import { usePrivy } from '@privy-io/react-auth'
import { getOpenedCards, type OpenedCard } from '@/lib/openedCards'

export function useOpenedCards() {
  const { authenticated, user } = usePrivy()
  const [cards, setCards] = useState<OpenedCard[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const walletAddress = user?.wallet?.address

  const refetch = async () => {
    if (!walletAddress) return

    setLoading(true)
    setError(null)

    try {
      const result = await getOpenedCards(walletAddress)
      setCards(result)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (authenticated && walletAddress) {
      refetch()
    } else {
      setCards([])
    }
  }, [authenticated, walletAddress])

  return { cards, loading, error, refetch }
}
