import { fetchUnopenedPacksFromVibeMarket } from './vibemarket';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

/**
 * Fetch unopened packs using Alchemy API
 * Note: Vibe Market API is rate-limited, so we're using Alchemy directly for now
 */
export async function getUnopenedPacksFromBaseScan(ownerAddress: string) {
  // Use Alchemy directly due to Vibe Market rate limiting
  console.log('📦 Fetching packs using Alchemy (Vibe Market API is rate-limited)');
  return getUnopenedPacksFromAlchemy(ownerAddress);
}

/**
 * Fetch unopened packs using Alchemy NFT API
 * Simple, fast, uses their indexing
 */
async function getUnopenedPacksFromAlchemy(ownerAddress: string) {
  console.log('🔍 Fetching unopened packs from Alchemy NFT API for:', ownerAddress);

  if (!ALCHEMY_KEY) {
    console.error('❌ ALCHEMY_KEY is not set');
    return [];
  }

  try {
    let allNfts: any[] = [];
    let pageKey: string | undefined = undefined;
    let pageCount = 0;
    const MAX_PAGES = 50; // Safety limit to prevent infinite loops

    // Paginate through ALL NFTs
    do {
      // Safety check to prevent infinite loops
      if (pageCount >= MAX_PAGES) {
        console.warn(`⚠️ Reached max page limit (${MAX_PAGES}), stopping pagination`);
        break;
      }

      const url: string = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTsForOwner?owner=${ownerAddress}&withMetadata=true&refreshCache=true${pageKey ? `&pageKey=${pageKey}` : ''}`;
      console.log(`Alchemy API URL (page ${pageCount + 1}):`, url);

      const response: Response = await fetch(url, {
        method: 'GET',
        headers: { 'Accept': 'application/json' },
        cache: 'no-store'
      });

      // Check for HTTP errors
      if (!response.ok) {
        console.error(`❌ Alchemy API returned ${response.status}: ${response.statusText}`);
        break;
      }

      const data: any = await response.json();

      // Validate response structure
      if (!data || typeof data !== 'object') {
        console.error('❌ Invalid response from Alchemy API');
        break;
      }

      if (Array.isArray(data.ownedNfts)) {
        allNfts = [...allNfts, ...data.ownedNfts];
        pageKey = data.pageKey; // Will be undefined when no more pages
        pageCount++;
        console.log(`📄 Page ${pageCount}: Got ${data.ownedNfts.length} NFTs, total so far: ${allNfts.length}`);
      } else {
        console.log('📄 No more NFTs to fetch');
        break;
      }
    } while (pageKey);

    console.log(`📊 Alchemy returned ${allNfts.length} total NFTs across ${pageCount} pages`);

    if (allNfts.length === 0) {
      console.warn('No NFTs found');
      return [];
    }

    // Filter for unopened packs (rarity attribute === 'unopened')
    const unopenedPacks = allNfts
      .filter((nft: any) => {
        // Safety checks for nested properties
        if (!nft?.raw?.metadata?.attributes) return false;

        const rarityAttr = nft.raw.metadata.attributes.find(
          (attr: any) => attr?.trait_type?.toLowerCase() === 'rarity'
        );
        const isUnopened = rarityAttr?.value?.toLowerCase() === 'unopened';

        return isUnopened;
      })
      .map((nft: any) => ({
        id: `${nft.contract?.address || 'unknown'}-${nft.tokenId || 'unknown'}`,
        tokenId: nft.tokenId || '0',
        contractAddress: nft.contract?.address || '',
        name: nft.raw?.metadata?.name || `Pack #${nft.tokenId || 'Unknown'}`,
        image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || '/vibe.png',
      }));

    console.log(`✅ Found ${unopenedPacks.length} unopened packs out of ${allNfts.length} total NFTs`);
    return unopenedPacks;
  } catch (error) {
    console.error('Failed to fetch unopened packs:', error);
    return [];
  }
}
