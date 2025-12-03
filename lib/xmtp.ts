import { Client } from '@xmtp/browser-sdk';

let xmtpClient: Client | null = null;
let gameConversation: any = null;
let currentGameId: string | null = null;

/**
 * Initialize XMTP client with wallet
 * TODO: Fix browser-sdk initialization - currently disabled
 */
export async function initializeXMTP(): Promise<Client | null> {
  // Temporarily disabled due to SDK API issues
  // Will fix in next session with proper SDK version
  return null as any;
}

/**
 * Start a new game session (creates game ID and conversation)
 */
export async function startGameSession(playerAddress: string): Promise<string> {
  const client = await initializeXMTP();
  currentGameId = `game_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  // Create or get conversation (self-conversation for solo, or with opponent for PVP)
  gameConversation = await client.conversations.newConversation(playerAddress);

  // Post game start
  await gameConversation.send(JSON.stringify({
    type: 'game_start',
    gameId: currentGameId,
    timestamp: Date.now(),
    player: playerAddress,
  }));

  return currentGameId;
}

/**
 * Log a game action (real-time audit trail)
 * TODO: Will use XMTP when SDK is fixed, currently localStorage
 */
export function logGameAction(action: {
  type: 'play_card' | 'attack_minion' | 'attack_hero' | 'end_turn' | 'card_draw' | 'minion_death';
  actor: string;
  data: any;
}, playerAddress: string) {
  try {
    const message = {
      timestamp: Date.now(),
      ...action,
    };

    // Save to localStorage for real-time display (keep last 100 messages max)
    const key = `game_history_${playerAddress}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    history.push(message);

    // Keep only last 100 messages to prevent bloat
    const trimmed = history.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));

    console.log('🎮 Action logged:', message);
  } catch (error) {
    console.error('Failed to log game action:', error);
  }
}

/**
 * Post game result to XMTP (personal feed or group chat)
 */
export async function postGameResult(params: {
  playerWon: boolean;
  playerHealth: number;
  opponentHealth: number;
  cardsPlayed: number;
  damageDealt: number;
  txHash: string;
  playerAddress: string;
}) {
  try {
    // Message content for the game result
    const message = {
      type: 'game_of_memes_result',
      timestamp: Date.now(),
      result: params.playerWon ? 'VICTORY' : 'DEFEAT',
      stats: {
        playerHealth: params.playerHealth,
        opponentHealth: params.opponentHealth,
        cardsPlayed: params.cardsPlayed,
        damageDealt: params.damageDealt,
      },
      txHash: params.txHash,
      player: params.playerAddress,
      soulsEarned: params.playerWon ? 0 : 1,
    };

    // Temporary: Save to localStorage until XMTP is working (keep last 100)
    const key = `game_history_${params.playerAddress}`;
    const existing = localStorage.getItem(key);
    const history = existing ? JSON.parse(existing) : [];
    history.push(message);
    const trimmed = history.slice(-100);
    localStorage.setItem(key, JSON.stringify(trimmed));

    console.log('✅ Game result saved:', message);
    return message;
  } catch (error) {
    console.error('Failed to save game result:', error);
    // Don't throw - logging is optional, shouldn't break game
  }
}

/**
 * Get game history from XMTP (all messages - game actions, chat, results)
 * TODO: Currently using localStorage, will use XMTP when SDK is fixed
 */
export async function getGameHistory(playerAddress: string) {
  try {
    // Temporary: Use localStorage until XMTP is working
    const stored = localStorage.getItem(`game_history_${playerAddress}`);
    if (!stored) return [];
    return JSON.parse(stored);
  } catch (error) {
    console.error('Failed to get game history:', error);
    return [];
  }
}
