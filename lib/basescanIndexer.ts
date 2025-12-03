import { createPublicClient, http } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;
const BASESCAN_API_KEY = process.env.NEXT_PUBLIC_BASESCAN_API_KEY || 'demo'; // Using demo key for now

// Known VibeMarket contracts
const VIBEMARKET_CONTRACTS = [
  '0x20306f3C373A445A0C607Bb0eB5Df15d29952FA4',
  '0x3eA4861190176BcB192764B1496EbEB7e38bC366',
  '0xEa6045410D3024b5Fb22AA531c13A31Dae0a56Ea',
  '0xF14C1dC8Ce5fE65413379F76c43fA1460C31E728',
  '0xc0B02E8e9f56A449CcCDc83AE053B887f2E6eBDd',
  '0xfF18ff973337BCc07d4B5a8Fa741b904014a1172',
];

const PACK_ABI = [
  {
    name: 'getTokenRarity',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'tokenId', type: 'uint256' }],
    outputs: [{ name: 'rarity', type: 'uint8' }, { name: 'randomValue', type: 'uint256' }],
  },
] as const;

export async function getUnopenedPacksFromBaseScan(ownerAddress: string) {
  console.log('🔍 Indexing Transfer events from blockchain (viem)...');

  const allPacks: Array<{ contractAddress: string; tokenId: string }> = [];

  const client = createPublicClient({
    chain: base,
    transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
  });

  for (const contract of VIBEMARKET_CONTRACTS) {
    try {
      console.log(`📦 Scanning ${contract}...`);

      // Query Transfer events using viem (no API needed!)
      const transfersTo = await client.getLogs({
        address: contract as `0x${string}`,
        event: { type: 'event', name: 'Transfer', inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' }
        ]},
        args: { to: ownerAddress as `0x${string}` },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      const transfersFrom = await client.getLogs({
        address: contract as `0x${string}`,
        event: { type: 'event', name: 'Transfer', inputs: [
          { indexed: true, name: 'from', type: 'address' },
          { indexed: true, name: 'to', type: 'address' },
          { indexed: true, name: 'tokenId', type: 'uint256' }
        ]},
        args: { from: ownerAddress as `0x${string}` },
        fromBlock: 'earliest',
        toBlock: 'latest',
      });

      // Calculate owned tokens
      const received = new Set(transfersTo.map(log => log.args.tokenId!.toString()));
      const sent = new Set(transfersFrom.map(log => log.args.tokenId!.toString()));
      const owned: string[] = [];
      received.forEach(tokenId => {
        if (!sent.has(tokenId)) {
          owned.push(tokenId);
        }
      });

      console.log(`  Received: ${received.size}, Sent: ${sent.size}, Owned: ${owned.length}`);

      // Check which are unopened
      // Logic: rarity 0 = unopened/minted, rarity 1-5 = opened with assigned rarity
      let unopenedCount = 0;
      for (const tokenId of owned) {
        try {
          const [rarity] = await client.readContract({
            address: contract as `0x${string}`,
            abi: PACK_ABI,
            functionName: 'getTokenRarity',
            args: [BigInt(tokenId)],
          });

          if (Number(rarity) === 0) {
            // Rarity 0 = unopened/minted
            console.log(`  Token ${tokenId}: UNOPENED (rarity=0)`);
            allPacks.push({ contractAddress: contract, tokenId });
            unopenedCount++;
          } else {
            // Rarity 1-5 = opened
            console.log(`  Token ${tokenId}: opened (rarity=${rarity})`);
          }
        } catch {
          // Error = invalid/burned token
          console.log(`  Token ${tokenId}: error (burned or invalid)`);
        }
      }

      console.log(`  ✅ ${unopenedCount} unopened from this contract`);
    } catch (error) {
      console.error(`Error for contract ${contract}:`, error);
    }
  }

  console.log(`✅ Total unopened: ${allPacks.length}`);

  // Fetch metadata
  const packsWithMetadata = [];
  for (const pack of allPacks) {
    try {
      const metaUrl = `https://base-mainnet.g.alchemy.com/nft/v3/${ALCHEMY_KEY}/getNFTMetadata?contractAddress=${pack.contractAddress}&tokenId=${pack.tokenId}`;
      const response = await fetch(metaUrl);
      const data = await response.json();

      packsWithMetadata.push({
        id: `${pack.contractAddress}-${pack.tokenId}`,
        tokenId: pack.tokenId,
        contractAddress: pack.contractAddress,
        name: data.name || `Pack #${pack.tokenId}`,
        image: data.image?.cachedUrl || data.image?.originalUrl || '/placeholder.jpg',
      });
    } catch {
      packsWithMetadata.push({
        id: `${pack.contractAddress}-${pack.tokenId}`,
        tokenId: pack.tokenId,
        contractAddress: pack.contractAddress,
        name: `Pack #${pack.tokenId}`,
        image: '/placeholder.jpg',
      });
    }
  }

  return packsWithMetadata;
}
