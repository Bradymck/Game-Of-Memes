import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateVoiceRequest } from '@/lib/voice-auth';
import {
  processAction,
  getNarrationContext,
  type VoiceGameState,
} from '@/lib/voice-game-engine';
import { recordGameResult } from '@/lib/cdp-wallet';

interface ActionBody {
  sessionId: string;
  deviceId: string;
  speakerId?: string;
  action: string;
}

// POST /api/voice/game/action — Process a player action
export async function POST(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const body: ActionBody = await req.json();

    if (!body.sessionId || !body.deviceId || !body.action) {
      return NextResponse.json(
        { error: 'Missing sessionId, deviceId, or action' },
        { status: 400 },
      );
    }

    // Load session
    const { data: session } = await supabaseAdmin
      .from('voice_game_sessions')
      .select('*, voice_players!inner(id, cdp_wallet_address, cdp_account_id, device_id, speaker_id)')
      .eq('id', body.sessionId)
      .eq('status', 'active')
      .single();

    if (!session) {
      return NextResponse.json({ error: 'Session not found or not active' }, { status: 404 });
    }

    // Verify player owns this session
    const player = session.voice_players;
    if (player.device_id !== body.deviceId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const gameState = session.game_state as VoiceGameState;

    // Process the action
    const result = processAction(gameState, body.action);

    // Execute on-chain actions
    let txHash: string | null = null;
    for (const chainAction of result.onChainActions) {
      try {
        if (chainAction.type === 'record_win' || chainAction.type === 'record_loss') {
          txHash = await recordGameResult(
            player.cdp_wallet_address,
            player.cdp_account_id,
            chainAction.type === 'record_win',
          );
        }
        if (chainAction.type === 'award_moonstones') {
          // Off-chain for MVP — update Supabase balance
          const amount = chainAction.params.amount as number;
          await supabaseAdmin
            .from('voice_players')
            .update({
              moonstones: gameState.moonstones + amount,
            })
            .eq('id', player.id);
        }
      } catch (err) {
        console.error('[Voice Action] On-chain error:', err);
        // Continue — don't fail the game over a tx error
      }
    }

    // Update session
    const updateData: Record<string, unknown> = {
      game_state: result.newState,
      turns_played: result.newState.turn,
    };

    if (result.gameOver) {
      const won = result.newState.hp > 0;
      updateData.status = 'completed';
      updateData.ended_at = new Date().toISOString();
      updateData.result = won ? 'win' : 'loss';
      updateData.tx_hash = txHash;
      updateData.sand_dollars_earned = result.newState.sandDollars - 50; // minus starting amount
      updateData.moonstones_earned = result.newState.moonstones;

      // Update player totals
      await supabaseAdmin
        .from('voice_players')
        .update({
          total_games: (session.voice_players as any).total_games + 1,
          sand_dollars: result.newState.sandDollars,
          moonstones: result.newState.moonstones,
          last_active: new Date().toISOString(),
        })
        .eq('id', player.id);
    }

    await supabaseAdmin
      .from('voice_game_sessions')
      .update(updateData)
      .eq('id', body.sessionId);

    // Build narration context for the LLM on the device
    const narrationContext = getNarrationContext(
      result.newState,
      body.action,
      result.narrative,
    );

    return NextResponse.json({
      narrative: result.narrative,
      narrationContext,
      gameState: {
        region: result.newState.region.name,
        hp: result.newState.hp,
        sandDollars: result.newState.sandDollars,
        moonstones: result.newState.moonstones,
        turn: result.newState.turn,
        maxTurns: result.newState.maxTurns,
        inventoryCount: result.newState.inventory.length,
      },
      gameOver: result.gameOver,
      txHash,
    });
  } catch (error) {
    console.error('[Voice Action] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
