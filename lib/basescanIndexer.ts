import { fetchUnopenedPacksFromVibeMarket } from './vibemarket';
import { ethers } from 'ethers';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const BASE_RPC = 'https://mainnet.base.org';

// Minimal ABI for checking pack status
const BOOSTER_DROP_ABI = [
  'function getTokenRarity(uint256 tokenId) view returns (uint8 rarity, uint256 randomValue, uint256 tokenSpecificRandomness)',
];

/**
 * Fetch unopened packs using Alchemy API + on-chain verification
 * Checks getTokenRarity() on-chain - if it throws, pack is unopened
 */
export async function getUnopenedPacksFromBaseScan(ownerAddress: string) {
  console.log('📦 Fetching packs using Alchemy + on-chain verification');
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

    // Group NFTs by contract address for batch on-chain checking
    const nftsByContract = new Map<string, any[]>();
    allNfts.forEach((nft: any) => {
      const contract = nft.contract?.address;
      if (contract) {
        if (!nftsByContract.has(contract)) {
          nftsByContract.set(contract, []);
        }
        nftsByContract.get(contract)!.push(nft);
      }
    });

    console.log(`📊 Found NFTs from ${nftsByContract.size} contracts`);

    // Check on-chain status for each contract's tokens
    const provider = new ethers.JsonRpcProvider(BASE_RPC);
    const unopenedPacks: any[] = [];

    for (const [contractAddress, nfts] of nftsByContract) {
      console.log(`🔍 Checking ${nfts.length} tokens on contract ${contractAddress.slice(0, 10)}...`);

      const contract = new ethers.Contract(contractAddress, BOOSTER_DROP_ABI, provider);

      // Check each token - if getTokenRarity() throws, it's unopened
      const checks = await Promise.all(
        nfts.map(async (nft: any) => {
          try {
            // If this succeeds, pack is OPENED (has rarity assigned)
            await contract.getTokenRarity(nft.tokenId);
            return { nft, isUnopened: false };
          } catch {
            // If it throws, pack is UNOPENED
            return { nft, isUnopened: true };
          }
        })
      );

      const unopened = checks.filter(c => c.isUnopened);
      console.log(`  ✅ ${unopened.length}/${nfts.length} are unopened`);

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

    console.log(`✅ Found ${unopenedPacks.length} unopened packs out of ${allNfts.length} total NFTs`);
    return unopenedPacks;
  } catch (error) {
    console.error('Failed to fetch unopened packs:', error);
    return [];
  }
}
