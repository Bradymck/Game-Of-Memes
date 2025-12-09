import { NextRequest, NextResponse } from 'next/server';

const WIELD_API_KEY = process.env.WIELD_API_KEY;
const ALCHEMY_API_KEY = process.env.ALCHEMY_API_KEY;

// Cache for collection metadata to avoid repeated API calls
const collectionCache = new Map<string, { name: string; image: string }>();

async function getCollectionMetadata(contractAddress: string, tokenId: string): Promise<{ name: string; image: string }> {
  // Check cache first
  if (collectionCache.has(contractAddress)) {
    return collectionCache.get(contractAddress)!;
  }

  // Fetch from Alchemy - try the given token first, then fall back to token #1
  const tokensToTry = [tokenId, '1'];

  for (const tryTokenId of tokensToTry) {
    try {
      const url = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_API_KEY}/getNFTMetadata?contractAddress=${contractAddress}&tokenId=${tryTokenId}&refreshCache=false`;
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        // Try multiple image sources - some tokens may not have cached images
        const image = data.image?.cachedUrl
          || data.image?.thumbnailUrl
          || data.image?.originalUrl
          || data.raw?.metadata?.image
          || null;

        if (image) {
          const metadata = {
            name: data.contract?.name || data.raw?.metadata?.name?.replace(/#\d+$/, '').trim() || 'Unknown Pack',
            image,
          };
          collectionCache.set(contractAddress, metadata);
          console.log(`✅ Got metadata for ${contractAddress} from token ${tryTokenId}:`, metadata.name);
          return metadata;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch metadata for token ${tryTokenId}:`, e);
    }
  }

  console.log(`⚠️ No image found for ${contractAddress}, using placeholder`);
  return { name: 'Unknown Pack', image: '/vibe.png' };
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const ownerAddress = searchParams.get('owner');

  if (!ownerAddress) {
    return NextResponse.json({ error: 'Missing owner address' }, { status: 400 });
  }

  if (!WIELD_API_KEY) {
    return NextResponse.json({ error: 'API key not configured' }, { status: 500 });
  }

  console.log('📦 API: Fetching unopened packs from Vibe Market for', ownerAddress);

  try {
    // Use Vibe Market API with status=minted to get ONLY unopened packs
    const url = `https://build.wield.xyz/vibe/boosterbox/owner/${ownerAddress}?status=minted&chainId=8453&limit=200`;

    console.log('🔍 Vibe Market API URL:', url);

    const response = await fetch(url, {
      headers: {
        'API-KEY': WIELD_API_KEY,
        'Accept': 'application/json',
      },
      cache: 'no-store'
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Vibe Market API error:', response.status, errorText);
      return NextResponse.json({ error: `API error: ${response.status}` }, { status: response.status });
    }

    const data = await response.json();

    // Vibe Market API returns { success: true, boxes: [...] }
    const items = data?.boxes || [];

    if (!Array.isArray(items)) {
      console.log('⚠️ boxes is not an array:', typeof items);
      return NextResponse.json({ packs: [] });
    }

    // Get unique contract addresses and fetch their metadata
    const uniqueContracts = [...new Set(items.map((item: any) => item.contractAddress))];
    console.log('📦 Unique contracts:', uniqueContracts);

    // Fetch metadata for each unique contract (using first token as sample)
    for (const contract of uniqueContracts) {
      const sampleItem = items.find((item: any) => item.contractAddress === contract);
      if (sampleItem) {
        await getCollectionMetadata(contract as string, String(sampleItem.tokenId));
      }
    }

    // Map the response to our format with collection metadata
    const packs = items.map((item: any) => {
      const collectionMeta = collectionCache.get(item.contractAddress) || { name: 'Unknown Pack', image: '/vibe.png' };
      return {
        id: `${item.contractAddress}-${item.tokenId}`,
        tokenId: String(item.tokenId),
        contractAddress: item.contractAddress,
        name: `${collectionMeta.name} #${item.tokenId}`,
        image: collectionMeta.image,
      };
    });

    console.log(`✅ Found ${packs.length} unopened packs from Vibe Market`);
    return NextResponse.json({ packs });

  } catch (error: any) {
    console.error('Failed to fetch packs:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
