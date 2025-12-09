'use client'

import { useState, useCallback } from 'react'
import { usePrivy, useWallets } from '@privy-io/react-auth'
import { ethers } from 'ethers'
import type { VRFStatus, PackCard } from '@/lib/pack-opening-types'

// BoosterDropV2 ABI - just the functions we need
const BOOSTER_DROP_ABI = [
  'function ownerOf(uint256 tokenId) view returns (address)',
  'function getEntropyFee() view returns (uint256)',
  'function open(uint256[] calldata tokenIds) payable',
  'function getTokenRarity(uint256 tokenId) view returns (uint8 rarity, uint256 randomValue, uint256 tokenSpecificRandomness)',
  'function tokenURI(uint256 tokenId) view returns (string)',
]

// Convert IPFS URLs to HTTP gateway URLs
function ipfsToHttp(uri: string): string {
  if (uri.startsWith('ipfs://')) {
    return uri.replace('ipfs://', 'https://ipfs.io/ipfs/')
  }
  return uri
}

interface UsePythVRFOptions {
  packId: string // format: "contractAddress-tokenId"
  onConfirmed?: (cards: PackCard[]) => void
  onError?: (error: string) => void
}

export function usePythVRF({ packId, onConfirmed, onError }: UsePythVRFOptions) {
  const [status, setStatus] = useState<VRFStatus>({ isConfirmed: false })
  const [isPolling, setIsPolling] = useState(false)
  const [cards, setCards] = useState<PackCard[]>([])
  const { user } = usePrivy()
  const { wallets } = useWallets()

  // Get the active wallet address from Privy (same source as useUnopenedPacks)
  const activeWalletAddress = user?.wallet?.address

  // Parse packId into contract address and token IDs
  // Format: "0xABC...123-1,2,3,4" or "0xABC...123-1"
  const parsePackId = (id: string) => {
    const parts = id.split('-')
    if (parts.length >= 2 && parts[0].startsWith('0x')) {
      // Decode URL encoding and split by comma
      const tokenIdsPart = decodeURIComponent(parts[1])
      const tokenIds = tokenIdsPart.split(',').map(t => t.trim())
      return { contractAddress: parts[0], tokenIds }
    }
    return null
  }

  // Start the actual pack opening flow
  const startPolling = useCallback(async () => {
    setIsPolling(true)
    setStatus({ isConfirmed: false })

    const parsed = parsePackId(packId)
    
    // Demo mode - use mock data
    if (!parsed || packId.startsWith('demo-')) {
      console.log('Demo mode - using mock cards')
      const delay = 1500 + Math.random() * 2500
      await new Promise(resolve => setTimeout(resolve, delay))
      const mockCards = generateMockCards(packId)
      setCards(mockCards)
      setStatus({ isConfirmed: true, confirmationTime: Date.now() })
      setIsPolling(false)
      onConfirmed?.(mockCards)
      return
    }

    // Real pack opening
    try {
      // Find the wallet that matches the active Privy wallet address
      // This ensures we use the same wallet that was used to fetch the packs
      console.log('🔍 All connected wallets:', wallets.map(w => ({ address: w.address, type: w.walletClientType })))
      console.log('🔍 Active Privy wallet address:', activeWalletAddress)

      const wallet = wallets.find(w => w.address.toLowerCase() === activeWalletAddress?.toLowerCase()) || wallets[0]
      if (!wallet) {
        throw new Error('No wallet connected')
      }

      console.log('🔑 Selected wallet:', wallet.address, 'Type:', wallet.walletClientType)

      // Get ethers provider from wallet
      const ethereumProvider = await wallet.getEthereumProvider()
      const provider = new ethers.BrowserProvider(ethereumProvider)
      const signer = await provider.getSigner()
      
      // Check network
      const network = await provider.getNetwork()
      console.log('🌐 Network:', Number(network.chainId), network.name)
      
      if (Number(network.chainId) !== 8453) {
        // Try to switch to Base network
        try {
          await ethereumProvider.request({
            method: 'wallet_switchEthereumChain',
            params: [{ chainId: '0x2105' }], // Base = 8453 = 0x2105
          });
          
          // Wait a moment for network to switch
          await new Promise(resolve => setTimeout(resolve, 1000))
          
          // Re-check network
          const newNetwork = await provider.getNetwork()
          if (Number(newNetwork.chainId) !== 8453) {
            throw new Error('Please switch to Base network')
          }
          
          console.log('✅ Switched to Base network')
        } catch (switchError: any) {
          // If switch fails, try to add Base network
          if (switchError.code === 4902) {
            try {
              await ethereumProvider.request({
                method: 'wallet_addEthereumChain',
                params: [{
                  chainId: '0x2105',
                  chainName: 'Base',
                  nativeCurrency: {
                    name: 'Ethereum',
                    symbol: 'ETH',
                    decimals: 18
                  },
                  rpcUrls: ['https://mainnet.base.org'],
                  blockExplorerUrls: ['https://basescan.org']
                }]
              });
              console.log('✅ Added and switched to Base network')
            } catch (addError) {
              throw new Error('Please add Base network to your wallet and try again')
            }
          } else {
            throw new Error('Please switch to Base network to open packs')
          }
        }
      }
      
      // Connect to the pack contract
      const contract = new ethers.Contract(parsed.contractAddress, BOOSTER_DROP_ABI, signer)
      
      console.log('📦 Opening packs:', parsed.contractAddress)
      console.log('🎴 Token IDs:', parsed.tokenIds)
      
      // Verify contract exists
      const code = await provider.getCode(parsed.contractAddress)
      if (code === '0x') {
        throw new Error(`Contract not found at ${parsed.contractAddress} on Base network`)
      }
      
      // Verify ownership of ALL tokens before opening
      const signerAddress = await signer.getAddress()
      console.log('🔍 Verifying ownership for signer:', signerAddress)
      console.log('🔍 Expected wallet (from Privy):', activeWalletAddress)

      // Warn if there's a mismatch
      if (signerAddress.toLowerCase() !== activeWalletAddress?.toLowerCase()) {
        console.warn('⚠️ WALLET MISMATCH! Signer address does not match Privy active wallet!')
        console.warn('   Signer:', signerAddress)
        console.warn('   Privy:', activeWalletAddress)
      }

      console.log('🔍 Checking all', parsed.tokenIds.length, 'tokens...')
      
      const ownershipChecks = await Promise.all(
        parsed.tokenIds.map(async (tokenId) => {
          try {
            const owner = await contract.ownerOf(tokenId)
            const isOwned = owner.toLowerCase() === signerAddress.toLowerCase()
            return { tokenId, owner, isOwned }
          } catch (e) {
            return { tokenId, owner: 'ERROR', isOwned: false }
          }
        })
      )
      
      const notOwned = ownershipChecks.filter(c => !c.isOwned)
      
      if (notOwned.length > 0) {
        const details = notOwned.map(c => `#${c.tokenId} (owner: ${c.owner.slice(0,6)}...)`).join(', ')
        throw new Error(`You don't own ${notOwned.length} of these packs!\n\nNot owned: ${details}\n\nYou're connected as: ${signerAddress.slice(0, 6)}...${signerAddress.slice(-4)}\n\nPlease check which wallet owns these packs.`)
      }
      
      console.log('✅ All', parsed.tokenIds.length, 'tokens verified')
      
      // Get entropy fee
      console.log('💰 Getting entropy fee...')
      const entropyFee = await contract.getEntropyFee()
      console.log('✅ Entropy fee:', ethers.formatEther(entropyFee), 'ETH')
      
      // Call open function with all token IDs
      console.log('🎲 Calling open() with', parsed.tokenIds.length, 'packs...')
      console.log('💵 Sending entropy fee:', ethers.formatEther(entropyFee), 'ETH')
      
      const tx = await contract.open(parsed.tokenIds, { value: entropyFee })
      console.log('✅ Open tx submitted:', tx.hash)
      
      // Wait for transaction
      const receipt = await tx.wait()
      console.log('Open tx confirmed:', receipt.hash)
      
      // Poll for VRF fulfillment for ALL tokens
      let attempts = 0
      const maxAttempts = 60 // 30 seconds max
      
      const revealedCards: PackCard[] = []
      const rarityMap: Record<number, 'common' | 'rare' | 'epic' | 'legendary' | 'mythic'> = {
        1: 'common',
        2: 'rare', 
        3: 'epic',
        4: 'legendary',
        5: 'mythic',
      }
      
      while (attempts < maxAttempts && revealedCards.length < parsed.tokenIds.length) {
        await new Promise(resolve => setTimeout(resolve, 500))
        
        // Check each token
        for (const tokenId of parsed.tokenIds) {
          // Skip if already revealed
          if (revealedCards.some(c => c.id.endsWith(`-${tokenId}`))) continue
          
          try {
            const rarityInfo = await contract.getTokenRarity(tokenId)
            
            // VRF fulfilled for this token! Fetch metadata
            const tokenUri = await contract.tokenURI(tokenId)
            const httpUri = ipfsToHttp(tokenUri)
            const metaResponse = await fetch(httpUri)
            const metadata = await metaResponse.json()
            
            const revealedCard: PackCard = {
              id: `${parsed.contractAddress}-${tokenId}`,
              name: metadata.name || `Card #${tokenId}`,
              image: ipfsToHttp(metadata.image || '/placeholder.jpg'),
              ticker: metadata.attributes?.find((a: any) => a.trait_type === 'Ticker')?.value || '',
              rarity: rarityMap[Number(rarityInfo.rarity)] || 'common',
              attack: 3,
              health: 3,
              mana: 2,
              isRevealed: false,
            }
            
            revealedCards.push(revealedCard)
            console.log(`Card ${tokenId} revealed:`, revealedCard.rarity)
            
          } catch (e) {
            // VRF not fulfilled yet for this token
          }
        }
        
        attempts++
      }
      
      if (revealedCards.length === 0) {
        throw new Error('VRF timeout - no cards revealed')
      }
      
      console.log(`Revealed ${revealedCards.length}/${parsed.tokenIds.length} cards`)
      
      setCards(revealedCards)
      setStatus({
        isConfirmed: true,
        confirmationTime: Date.now(),
      })
      setIsPolling(false)
      onConfirmed?.(revealedCards)
      return
      
    } catch (error: any) {
      console.error('Pack opening error:', error)
      setIsPolling(false)
      
      // Decode common contract errors
      let errorMessage = 'Failed to open pack'
      
      if (error.data) {
        const errorCode = error.data.slice(0, 10)
        
        // Common VibeMarket error codes
        const errorCodes: Record<string, string> = {
          '0x77c9ecc7': 'You don\'t own these packs! Make sure you\'re connected with the correct wallet.',
          '0x118cdaa7': 'These packs have already been opened',
          '0x7939f424': 'Insufficient funds to pay entropy fee',
          '0xd93c0665': 'Pack opening is paused',
        }
        
        if (errorCodes[errorCode]) {
          errorMessage = errorCodes[errorCode]
        } else {
          errorMessage = `Contract error: ${errorCode}`
        }
        
        console.log('❌ Decoded error:', errorMessage)
      } else if (error.message) {
        errorMessage = error.message
      }
      
      onError?.(errorMessage)
    }
  }, [packId, wallets, activeWalletAddress, onConfirmed, onError])

  return {
    status,
    isPolling,
    cards,
    startPolling,
  }
}

// Mock card generation for MVP
function generateMockCards(packId: string): PackCard[] {
  const cardPool = [
    { name: 'Diamond Doge', image: '/shiba-inu-dog-diamond-hands-crypto-meme.jpg', ticker: '$DOGE' },
    { name: 'Sad Pepe', image: '/sad-pepe-frog-meme-crying.jpg', ticker: '$PEPE' },
    { name: 'Wojak', image: '/wojak-meme-face-crying-trader.jpg', ticker: '$WOJ' },
    { name: 'Chad Bull', image: '/chad-muscular-bull-crypto-meme.jpg', ticker: '$CHAD' },
    { name: 'Stonks', image: '/stonks-meme-man-suit-pointing-up.jpg', ticker: '$STONK' },
    { name: 'FUD Bear', image: '/scary-bear-market-crash-meme.jpg', ticker: '$FUD' },
    { name: 'Paper Hands', image: '/nervous-sweating-man-selling-meme.jpg', ticker: '$PAPER' },
  ]

  const rarities: Array<'common' | 'rare' | 'epic' | 'legendary'> = ['common', 'rare', 'epic', 'legendary']
  const rarityWeights = [60, 25, 12, 3] // Percentage weights

  const getRandomRarity = () => {
    const roll = Math.random() * 100
    let cumulative = 0
    for (let i = 0; i < rarities.length; i++) {
      cumulative += rarityWeights[i]
      if (roll < cumulative) return rarities[i]
    }
    return 'common'
  }

  const rarityStats = {
    common: { attack: 2, health: 2, mana: 2 },
    rare: { attack: 3, health: 4, mana: 3 },
    epic: { attack: 5, health: 5, mana: 4 },
    legendary: { attack: 7, health: 6, mana: 5 },
  }

  // Generate 5 cards per pack
  return Array.from({ length: 5 }, (_, i) => {
    const template = cardPool[Math.floor(Math.random() * cardPool.length)]
    const rarity = getRandomRarity()
    const stats = rarityStats[rarity]

    return {
      id: `${packId}-card-${i}`,
      name: template.name,
      image: template.image,
      ticker: template.ticker,
      rarity,
      ...stats,
      isRevealed: false,
    }
  })
}
