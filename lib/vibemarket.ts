const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

export interface VibeMarketCard {
  tokenId: string;
  contractAddress: string;
  metadata: {
    name: string;
    image: string;
    attributes: {
      trait_type: string;
      value: string;
    }[];
  };
}

// Fetch cards owned by user using Alchemy NFT API
export async function fetchUserCards(address: string): Promise<VibeMarketCard[]> {
  try {
    const url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${address}&withMetadata=true`;
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch NFTs');
    const data = await response.json();

    // Filter for VibeMarket NFTs only (check description for vibe.market)
    // AND exclude unopened packs
    const vibeMarketNFTs = data.ownedNfts.filter((nft: any) => {
      const description = nft.raw?.metadata?.description || nft.description || '';
      const isVibeMarket = description.toLowerCase().includes('vibe.market');

      // Check if it's an unopened pack
      const rarityAttr = nft.raw?.metadata?.attributes?.find(
        (a: any) => a.trait_type?.toLowerCase() === 'rarity'
      );
      const isUnopened = rarityAttr?.value?.toLowerCase() === 'unopened';

      return isVibeMarket && !isUnopened;
    });

    console.log('Filtered VibeMarket NFTs:', vibeMarketNFTs.length, 'of', data.ownedNfts.length);

    // Convert Alchemy NFT format to VibeMarket format
    return vibeMarketNFTs.map((nft: any) => ({
      tokenId: nft.tokenId,
      contractAddress: nft.contract.address,
      metadata: {
        name: nft.name || nft.title || `Card #${nft.tokenId}`,
        image: nft.image?.cachedUrl || nft.image?.originalUrl || nft.image?.thumbnailUrl || '/placeholder.jpg',
        attributes: nft.raw?.metadata?.attributes || [],
      },
    }));
  } catch (error) {
    console.error('Error fetching cards:', error);
    return [];
  }
}

// Get pack contract info (includes ERC20 token address)
export async function getPackInfo(contractAddress: string) {
  try {
    const response = await fetch(`${VIBEMARKET_API}/contractAddress/${contractAddress}`);
    if (!response.ok) throw new Error('Failed to fetch pack info');
    return await response.json();
  } catch (error) {
    console.error('Error fetching pack info:', error);
    return null;
  }
}
