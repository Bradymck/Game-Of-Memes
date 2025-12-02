import { createPublicClient, createWalletClient, custom, http } from 'viem';
import { base } from 'viem/chains';

/**
 * Soul Contract Integration
 *
 * Deployed at: 0x3Ab0e6481b8E91AfA24Ec4a158201034125b9F73
 * Network: Base Mainnet
 *
 * The Reverse Loop:
 * - Lose match → Earn soul (future voting power)
 * - Win match → No soul (winners don't suffer!)
 * - Fully on-chain, zero centralization
 */

const SOUL_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_SOUL_CONTRACT_ADDRESS as `0x${string}`;

const SOUL_CONTRACT_ABI = [
  {
    name: 'recordLoss',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'recordWin',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [{ name: 'gameId', type: 'bytes32' }],
    outputs: [],
  },
  {
    name: 'getSouls',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
  {
    name: 'getStats',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: 'player', type: 'address' }],
    outputs: [
      { name: 'soulBalance', type: 'uint256' },
      { name: 'totalMatches', type: 'uint256' },
      { name: 'totalWins', type: 'uint256' },
      { name: 'totalLosses', type: 'uint256' },
      { name: 'winRate', type: 'uint256' },
    ],
  },
  {
    name: 'souls',
    type: 'function',
    stateMutability: 'view',
    inputs: [{ name: '', type: 'address' }],
    outputs: [{ type: 'uint256' }],
  },
] as const;

/**
 * Get soul balance for an address
 */
export async function getSoulBalance(address: string): Promise<bigint> {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const balance = await client.readContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'getSouls',
    args: [address as `0x${string}`],
  });

  return balance;
}

/**
 * Get player stats (souls, wins, losses, win rate)
 */
export async function getPlayerStats(address: string) {
  const client = createPublicClient({
    chain: base,
    transport: http(),
  });

  const [soulBalance, totalMatches, totalWins, totalLosses, winRate] = await client.readContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'getStats',
    args: [address as `0x${string}`],
  });

  return {
    souls: Number(soulBalance),
    matches: Number(totalMatches),
    wins: Number(totalWins),
    losses: Number(totalLosses),
    winRate: Number(winRate) / 100, // Convert from basis points to percentage
  };
}

/**
 * Record a loss and earn a soul
 */
export async function recordLoss(gameId: string = '0x0'): Promise<string> {
  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum),
  });

  const [account] = await walletClient.getAddresses();

  // Convert gameId to bytes32 (pad with zeros if needed)
  const gameIdBytes32 = gameId.padEnd(66, '0') as `0x${string}`;

  const hash = await walletClient.writeContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'recordLoss',
    args: [gameIdBytes32],
    account,
  });

  return hash;
}

/**
 * Record a win (no soul earned)
 */
export async function recordWin(gameId: string = '0x0'): Promise<string> {
  const walletClient = createWalletClient({
    chain: base,
    transport: custom((window as any).ethereum),
  });

  const [account] = await walletClient.getAddresses();

  const gameIdBytes32 = gameId.padEnd(66, '0') as `0x${string}`;

  const hash = await walletClient.writeContract({
    address: SOUL_CONTRACT_ADDRESS,
    abi: SOUL_CONTRACT_ABI,
    functionName: 'recordWin',
    args: [gameIdBytes32],
    account,
  });

  return hash;
}
