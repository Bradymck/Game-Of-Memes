import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

const PACK_ABI = [
  {
    name: 'getTokenRarity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'rarity', type: 'uint8' }, { name: 'randomValue', type: 'uint256' }],
  },
] as const;

export interface OpenedCard {
  id: string;
  tokenId: string;
  contractAddress: string;
  name: string;
  image: string;
  rarity: number;
}

/**
 * Get OPENED cards by fetching all VibeMarket NFTs and checking on-chain rarity
 * Rarity 0 = unopened pack, Rarity 1-5 = opened card
 */
export async function getOpenedCards(ownerAddress: string): Promise<OpenedCard[]> {
  console.log('🎴 Fetching opened cards for:', ownerAddress);

  const client = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  // Step 1: Fetch ALL NFTs from Alchemy
  let allNfts: any[] = [];
  let pageKey: string | undefined;

  do {
    const url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${ownerAddress}&withMetadata=true&pageSize=100${pageKey ? `&pageKey=${pageKey}` : ''}`;
    const response = await fetch(url);
    const data = await response.json();
    allNfts = [...allNfts, ...data.ownedNfts];
    pageKey = data.pageKey;
  } while (pageKey);

  console.log(`📦 Found ${allNfts.length} total NFTs, filtering for VibeMarket...`);

  // Step 2: Filter for VibeMarket NFTs (check description for vibe.market)
  const vibeMarketNfts = allNfts.filter((nft: any) => {
    const description = nft.raw?.metadata?.description || nft.description || '';
    return description.toLowerCase().includes('vibe.market');
  });

  console.log(`🎯 Found ${vibeMarketNfts.length} VibeMarket NFTs, checking rarity on-chain...`);

  // Step 3: Check on-chain rarity for each NFT - only include opened cards (rarity 1-5)
  const openedCards: OpenedCard[] = [];

  for (const nft of vibeMarketNfts) {
    const contractAddress = nft.contract.address;
    const tokenId = nft.tokenId;

    try {
      // Check on-chain rarity (this is the source of truth)
      const [rarity] = await client.readContract({
        address: contractAddress as `0x${string}`,
        abi: PACK_ABI,
        functionName: 'getTokenRarity',
        args: [BigInt(tokenId)],
      });

      const rarityNum = Number(rarity);

      // Only include opened cards (rarity 1-5)
      // Rarity 0 = unopened pack, skip it
      if (rarityNum >= 1 && rarityNum <= 5) {
        openedCards.push({
          id: `${contractAddress}-${tokenId}`,
          tokenId,
          contractAddress,
          name: nft.name || nft.title || `Card #${tokenId}`,
          image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.image?.thumbnailUrl || '/placeholder.jpg',
          rarity: rarityNum,
        });
        console.log(`✅ Card ${tokenId}: rarity ${rarityNum} (opened)`);
      } else {
        console.log(`⏭️ Pack ${tokenId}: rarity ${rarityNum} (unopened, skipping)`);
      }
    } catch (error) {
      // If getTokenRarity fails, check metadata attributes as fallback
      const statusAttr = nft.raw?.metadata?.attributes?.find(
        (a: any) => a.trait_type?.toLowerCase() === 'status'
      );
      const rarityAttr = nft.raw?.metadata?.attributes?.find(
        (a: any) => a.trait_type?.toLowerCase() === 'rarity'
      );

      // If status is 'minted' (unopened) or rarity is 'unopened', skip
      const isMinted = statusAttr?.value?.toLowerCase() === 'minted';
      const isUnopened = rarityAttr?.value?.toLowerCase() === 'unopened';

      if (!isMinted && !isUnopened) {
        // Assume it's an opened card if we can't check on-chain and metadata doesn't say unopened
        const rarityValue = parseInt(rarityAttr?.value) || 1;
        openedCards.push({
          id: `${contractAddress}-${tokenId}`,
          tokenId,
          contractAddress,
          name: nft.name || nft.title || `Card #${tokenId}`,
          image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.image?.thumbnailUrl || '/placeholder.jpg',
          rarity: rarityValue,
        });
        console.log(`⚠️ Card ${tokenId}: using metadata fallback, assumed opened`);
      } else {
        console.log(`⏭️ Pack ${tokenId}: metadata indicates unopened, skipping`);
      }
    }
  }

  console.log(`✅ Found ${openedCards.length} opened cards out of ${vibeMarketNfts.length} VibeMarket NFTs`);
  return openedCards;
}
