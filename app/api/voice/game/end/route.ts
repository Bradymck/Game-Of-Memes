import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateVoiceRequest } from '@/lib/voice-auth';
import { recordGameResult } from '@/lib/cdp-wallet';
import { type VoiceGameState } from '@/lib/voice-game-engine';

interface EndBody {
  sessionId: string;
  deviceId: string;
  speakerId?: string;
}

// POST /api/voice/game/end — End a game session early (player quits)
export async function POST(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const body: EndBody = await req.json();

    if (!body.sessionId || !body.deviceId) {
      return NextResponse.json(
        { error: 'Missing sessionId or deviceId' },
        { status: 400 },
      );
    }

    // Load session
    const { data: session } = await supabaseAdmin
      .from('voice_game_sessions')
      .select('*, voice_players!inner(id, cdp_wallet_address, cdp_account_id, device_id, total_games)')
      .eq('id', body.sessionId)
      .eq('status', 'active')
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found or not active' }, { status: 404 });
    }

    if (session.voice_players.device_id !== body.deviceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const gameState = session.game_state as VoiceGameState;
    const survived = gameState.hp > 0;

    // Record on-chain
    let txHash: string | null = null;
    try {
      txHash = await recordGameResult(
        session.voice_players.cdp_wallet_address,
        session.voice_players.cdp_account_id,
        survived,
      );
    } catch (err) {
      console.error('[Voice End] On-chain recording failed:', err);
    }

    // Complete the session
    await supabaseAdmin
      .from('voice_game_sessions')
      .update({
        status: 'completed',
        ended_at: new Date().toISOString(),
        result: survived ? 'win' : 'loss',
        tx_hash: txHash,
        turns_played: gameState.turn,
        sand_dollars_earned: gameState.sandDollars - 50,
        moonstones_earned: gameState.moonstones,
      })
      .eq('id', body.sessionId);

    // Update player totals
    await supabaseAdmin
      .from('voice_players')
      .update({
        total_games: session.voice_players.total_games + 1,
        sand_dollars: gameState.sandDollars,
        moonstones: gameState.moonstones,
        last_active: new Date().toISOString(),
      })
      .eq('id', session.voice_players.id);

    const items = gameState.inventory.map(i => i.name).join(', ') || 'nothing';

    return NextResponse.json({
      result: survived ? 'win' : 'loss',
      narrative:
        `The expedition ends. You survived ${gameState.turn} turns with ` +
        `${gameState.hp} HP, ${gameState.sandDollars} Sand Dollars, ` +
        `${gameState.moonstones} moonstones, and collected ${items}. ` +
        `The ${gameState.shipName} docks. Until next time.`,
      stats: {
        turns: gameState.turn,
        hp: gameState.hp,
        sandDollars: gameState.sandDollars,
        moonstones: gameState.moonstones,
        items: gameState.inventory.length,
      },
      txHash,
    });
  } catch (error) {
    console.error('[Voice End] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
