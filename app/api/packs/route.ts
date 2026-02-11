import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const WIELD_API_KEY = process.env.WIELD_API_KEY;
const BASE_RPC = 'https://mainnet.base.org';
const TOKEN_URI_SELECTOR = '0xc87b56dd'; // tokenURI(uint256)

// Cache for collection metadata to avoid repeated API calls
const collectionCache = new Map<string, { name: string; image: string }>();

async function getTokenURI(contractAddress: string, tokenId: string): Promise<string | null> {
  try {
    const paddedId = BigInt(tokenId).toString(16).padStart(64, '0');
    const response = await fetch(BASE_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        method: 'eth_call',
        params: [{ to: contractAddress, data: `${TOKEN_URI_SELECTOR}${paddedId}` }, 'latest'],
        id: 1,
      }),
    });
    const data = await response.json();
    if (!data.result || data.result === '0x') return null;

    // Decode ABI-encoded string
    const hex = data.result.slice(2);
    const offset = parseInt(hex.slice(0, 64), 16) * 2;
    const length = parseInt(hex.slice(offset, offset + 64), 16);
    const strHex = hex.slice(offset + 64, offset + 64 + length * 2);
    return Buffer.from(strHex, 'hex').toString('utf-8');
  } catch (e) {
    console.error(`Failed to read tokenURI for ${contractAddress}/${tokenId}:`, e);
    return null;
  }
}

async function getCollectionMetadata(contractAddress: string, tokenId: string): Promise<{ name: string; image: string }> {
  if (collectionCache.has(contractAddress)) {
    return collectionCache.get(contractAddress)!;
  }

  // Read tokenURI directly from on-chain
  const uri = await getTokenURI(contractAddress, tokenId);
  if (uri) {
    try {
      const metaResponse = await fetch(uri);
      if (metaResponse.ok) {
        const meta = await metaResponse.json();
        const image = meta.image || meta.imageUrl || null;
        const name = meta.name?.replace(/#\d+$/, '').trim() || 'Unknown Pack';
        if (image) {
          const metadata = { name, image };
          collectionCache.set(contractAddress, metadata);
          console.log(`✅ Got metadata for ${contractAddress} via tokenURI:`, metadata.name, metadata.image);
          return metadata;
        }
      }
    } catch (e) {
      console.error(`Failed to fetch tokenURI metadata for ${contractAddress}:`, e);
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
    // Fetch ALL tokens for this owner, filter unopened locally (more reliable than status=minted)
    const url = `https://build.wield.xyz/vibe/boosterbox/owner/${ownerAddress}?chainId=8453&limit=200`;

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

    // API may return { boxes: [...] } or { data: [...] } depending on endpoint version
    const allItems = data?.boxes || data?.data || [];

    if (!Array.isArray(allItems)) {
      console.log('⚠️ Response items not an array:', typeof allItems, 'keys:', Object.keys(data));
      return NextResponse.json({ packs: [] });
    }

    console.log(`📦 Wield API returned ${allItems.length} total tokens`);

    // Filter to unopened only: rarity === 0 means unopened
    const items = allItems.filter((item: any) => {
      const rarity = item.rarity ?? -1;
      return rarity === 0;
    });

    console.log(`📦 ${items.length} unopened packs (rarity === 0) of ${allItems.length} total`);

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
