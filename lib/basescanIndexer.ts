import { ethers } from 'ethers';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const BASE_RPC = 'https://mainnet.base.org';

// ABI for checking pack status on-chain
const BOOSTER_DROP_ABI = [
  'function getTokenRarity(uint256 tokenId) view returns (uint8 rarity, uint256 randomValue, uint256 tokenSpecificRandomness)',
];

/**
 * Fetch unopened packs using Alchemy API + on-chain verification
 * Alchemy metadata can be stale, so we verify on-chain with getTokenRarity()
 */
export async function getUnopenedPacksFromBaseScan(ownerAddress: string) {
  console.log('📦 Fetching unopened packs using Alchemy + on-chain verification');
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

    // Filter to only Vibe Market packs (by description)
    const vibePacks = allNfts.filter((nft: any) => {
      const description = nft.raw?.metadata?.description?.toLowerCase() || '';
      return description.includes('vibe.market');
    });

    console.log(`📊 Found ${vibePacks.length} Vibe Market packs`);

    if (vibePacks.length === 0) {
      return [];
    }

    // Group by contract for batch on-chain verification
    const byContract = new Map<string, any[]>();
    vibePacks.forEach((nft: any) => {
      const addr = nft.contract?.address;
      if (addr) {
        if (!byContract.has(addr)) byContract.set(addr, []);
        byContract.get(addr)!.push(nft);
      }
    });

    // Verify on-chain: getTokenRarity() throws = unopened, returns = opened
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const unopenedPacks: any[] = [];

    for (const [contractAddr, nfts] of byContract) {
      console.log(`🔍 Verifying ${nfts.length} packs on ${contractAddr.slice(0, 10)}...`);
      const contract = new ethers.Contract(contractAddr, BOOSTER_DROP_ABI, provider);

      const results = await Promise.all(
        nfts.map(async (nft: any) => {
          try {
            // If getTokenRarity succeeds with rarity > 0, pack is OPENED
            const result = await contract.getTokenRarity(nft.tokenId);
            const rarity = Number(result[0]);
            // Rarity 0 means unopened, rarity 1-5 means opened
            const isOpened = rarity > 0;
            console.log(`    Token ${nft.tokenId}: rarity=${rarity} -> ${isOpened ? 'OPENED' : 'UNOPENED'}`);
            return { nft, unopened: !isOpened };
          } catch (err: any) {
            // Revert means pack is UNOPENED (no rarity assigned yet)
            // But also check if it's a real revert vs network error
            const errMsg = err?.message || '';
            const isRevert = errMsg.includes('revert') || errMsg.includes('CALL_EXCEPTION') || err?.code === 'CALL_EXCEPTION';
            console.log(`    Token ${nft.tokenId}: ${isRevert ? 'REVERTED (unopened)' : 'ERROR: ' + errMsg.slice(0, 50)}`);
            return { nft, unopened: isRevert };
          }
        })
      );

      const unopened = results.filter(r => r.unopened);
      console.log(`  ✅ ${unopened.length}/${nfts.length} are truly unopened`);

      unopened.forEach(({ nft }) => {
        unopenedPacks.push({
          id: `${nft.contract?.address || 'unknown'}-${nft.tokenId || 'unknown'}`,
          tokenId: nft.tokenId || '0',
          contractAddress: nft.contract?.address || '',
          name: nft.raw?.metadata?.name || `Pack #${nft.tokenId || 'Unknown'}`,
          image: nft.image?.cachedUrl || nft.image?.thumbnailUrl || '/vibe.png',
        });
      });
    }

    console.log(`✅ Found ${unopenedPacks.length} verified unopened packs`);
    return unopenedPacks;
  } catch (error) {
    console.error('Failed to fetch unopened packs:', error);
    return [];
  }
}
