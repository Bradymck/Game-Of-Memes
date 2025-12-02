import { Client } from '@xmtp/browser-sdk';

let xmtpClient: Client | null = null;

/**
 * Initialize XMTP client with wallet
 */
export async function initializeXMTP(): Promise<Client> {
  if (xmtpClient) return xmtpClient;

  const ethereum = (window as any).ethereum;
  if (!ethereum) throw new Error('No wallet found');

  // Create XMTP client
  xmtpClient = await Client.create(ethereum, {
    env: 'production', // Use 'dev' for testing
  });

  return xmtpClient;
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
    const client = await initializeXMTP();

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

    // Post to your own XMTP stream (personal game history)
    // Later: can post to group chats, game rooms, etc.
    const conversation = await client.conversations.newConversation(params.playerAddress);
    await conversation.send(JSON.stringify(message, null, 2));

    console.log('✅ Game result posted to XMTP:', message);
    return message;
  } catch (error) {
    console.error('Failed to post game result to XMTP:', error);
    // Don't throw - XMTP posting is optional, shouldn't break game
  }
}

/**
 * Get game history from XMTP
 */
export async function getGameHistory(playerAddress: string) {
  try {
    const client = await initializeXMTP();
    const conversation = await client.conversations.newConversation(playerAddress);
    const messages = await conversation.messages();

    // Filter for game result messages
    const gameResults = messages
      .map((msg) => {
        try {
          return JSON.parse(msg.content);
        } catch {
          return null;
        }
      })
      .filter((msg) => msg?.type === 'game_of_memes_result');

    return gameResults;
  } catch (error) {
    console.error('Failed to get game history from XMTP:', error);
    return [];
  }
}
