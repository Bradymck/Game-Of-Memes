import { createPublicClient, http, parseAbiItem } from 'viem';
import { base } from 'viem/chains';

const ALCHEMY_KEY = process.env.NEXT_PUBLIC_ALCHEMY_API_KEY;

/**
 * Simple Transfer event indexer - gets ACCURATE ownership by querying events
 * This is how BaseScan and OpenSea work!
 */

export async function getOwnedTokenIdsFromTransfers(
  contractAddress: string,
  ownerAddress: string
): Promise<string[]> {
  try {
    const client = createPublicClient({
      chain: base,
      transport: http(`https://base-mainnet.g.alchemy.com/v2/${ALCHEMY_KEY}`),
    });

    console.log(`🔍 Indexing Transfer events for ${contractAddress}...`);

    // Get all Transfer events TO this address
    const transfersTo = await client.getLogs({
      address: contractAddress as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        to: ownerAddress as `0x${string}`,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    // Get all Transfer events FROM this address (sold/burned)
    const transfersFrom = await client.getLogs({
      address: contractAddress as `0x${string}`,
      event: parseAbiItem('event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'),
      args: {
        from: ownerAddress as `0x${string}`,
      },
      fromBlock: 'earliest',
      toBlock: 'latest',
    });

    // Calculate current ownership
    const received = new Set(transfersTo.map(log => log.args.tokenId!.toString()));
    const sent = new Set(transfersFrom.map(log => log.args.tokenId!.toString()));

    // Tokens you currently own = received - sent
    const owned: string[] = [];
    received.forEach(tokenId => {
      if (!sent.has(tokenId)) {
        owned.push(tokenId);
      }
    });

    console.log(`✅ Transfer indexing: received ${received.size}, sent ${sent.size}, currently own ${owned.length}`);
    return owned;
  } catch (error) {
    console.error('Error indexing transfers:', error);
    return [];
  }
}
