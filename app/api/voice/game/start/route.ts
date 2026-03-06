import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateVoiceRequest } from '@/lib/voice-auth';
import { createGameState, getOpeningContext, type Difficulty } from '@/lib/voice-game-engine';

interface StartBody {
  deviceId: string;
  speakerId?: string;
  difficulty?: Difficulty;
}

// POST /api/voice/game/start — Start a new game session
export async function POST(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const body: StartBody = await req.json();

    if (!body.deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const speakerId = body.speakerId || 'default';
    const difficulty = body.difficulty || 'normal';

    // Look up player
    const { data: player } = await supabaseAdmin
      .from('voice_players')
      .select('id')
      .eq('device_id', body.deviceId)
      .eq('speaker_id', speakerId)
      .single();

    if (!player) {
      return NextResponse.json(
        { error: 'Player not found. Call /register first.' },
        { status: 404 },
      );
    }

    // Check for existing active session
    const { data: active } = await supabaseAdmin
      .from('voice_game_sessions')
      .select('id')
      .eq('player_id', player.id)
      .eq('status', 'active')
      .single();

    if (active) {
      // Abandon the old session
      await supabaseAdmin
        .from('voice_game_sessions')
        .update({ status: 'abandoned', ended_at: new Date().toISOString() })
        .eq('id', active.id);
    }

    // Get map state for ship name
    const { data: mapState } = await supabaseAdmin
      .from('voice_map_state')
      .select('ship_name')
      .eq('player_id', player.id)
      .single();

    const shipName = mapState?.ship_name || 'The Moonstone Maverick';

    // Create game state
    const gameState = createGameState(difficulty, shipName);
    const openingContext = getOpeningContext(gameState);

    // Save session
    const { data: session, error } = await supabaseAdmin
      .from('voice_game_sessions')
      .insert({
        player_id: player.id,
        game_state: gameState,
        difficulty,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Voice Start] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to start game' }, { status: 500 });
    }

    return NextResponse.json({
      sessionId: session.id,
      gameState: {
        region: gameState.region.name,
        hp: gameState.hp,
        sandDollars: gameState.sandDollars,
        moonstones: gameState.moonstones,
        difficulty,
      },
      openingContext,
      narrative: `Welcome to AquaPrime: The Fading. Your airship ${shipName} hovers above ${gameState.region.name}. ${gameState.region.desc} What do you do?`,
    });
  } catch (error) {
    console.error('[Voice Start] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
