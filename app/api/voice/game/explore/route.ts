import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { authenticateVoiceRequest } from '@/lib/voice-auth';
import { processExplore, type VoiceGameState } from '@/lib/voice-game-engine';

interface ExploreBody {
  sessionId: string;
  deviceId: string;
  speakerId?: string;
  direction: 'north' | 'south' | 'east' | 'west';
}

// POST /api/voice/game/explore — Move the airship
export async function POST(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const body: ExploreBody = await req.json();

    if (!body.sessionId || !body.deviceId || !body.direction) {
      return NextResponse.json(
        { error: 'Missing sessionId, deviceId, or direction' },
        { status: 400 },
      );
    }

    const validDirections = ['north', 'south', 'east', 'west'];
    if (!validDirections.includes(body.direction)) {
      return NextResponse.json(
        { error: 'Invalid direction. Use north, south, east, or west.' },
        { status: 400 },
      );
    }

    // Load session
    const { data: session } = await supabaseAdmin
      .from('voice_game_sessions')
      .select('*, voice_players!inner(id, cdp_wallet_address, device_id)')
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
    const result = processExplore(gameState, body.direction);

    // Update session state
    await supabaseAdmin
      .from('voice_game_sessions')
      .update({ game_state: result.newState })
      .eq('id', body.sessionId);

    // Update map state
    await supabaseAdmin
      .from('voice_map_state')
      .update({
        position_x: result.newState.position.x,
        position_y: result.newState.position.y,
        explored_tiles: result.newState.exploredTiles,
        last_move_at: new Date().toISOString(),
      })
      .eq('player_id', session.voice_players.id);

    return NextResponse.json({
      narrative: result.narrative,
      gameState: {
        region: result.newState.region.name,
        hp: result.newState.hp,
        sandDollars: result.newState.sandDollars,
        moonstones: result.newState.moonstones,
        position: result.newState.position,
        exploredTiles: result.newState.exploredTiles.length,
      },
      encounter: result.newState.encounter ? {
        name: result.newState.encounter.name,
        type: result.newState.encounter.type,
        desc: result.newState.encounter.desc,
      } : null,
    });
  } catch (error) {
    console.error('[Voice Explore] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
