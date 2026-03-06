import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { getOnChainStats } from '@/lib/cdp-wallet';
import { authenticateVoiceRequest } from '@/lib/voice-auth';

// GET /api/voice/player/stats?deviceId=xxx&speakerId=yyy
export async function GET(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const { searchParams } = new URL(req.url);
    const deviceId = searchParams.get('deviceId');
    const speakerId = searchParams.get('speakerId') || 'default';

    if (!deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const { data: player } = await supabaseAdmin
      .from('voice_players')
      .select('*')
      .eq('device_id', deviceId)
      .eq('speaker_id', speakerId)
      .single();

    if (!player) {
      return NextResponse.json({ error: 'Player not found' }, { status: 404 });
    }

    // On-chain stats
    let chainStats = { souls: 0, matches: 0, wins: 0, losses: 0, winRate: 0 };
    try {
      chainStats = await getOnChainStats(player.cdp_wallet_address);
    } catch {
      // Fallback to defaults
    }

    // Recent sessions
    const { data: sessions } = await supabaseAdmin
      .from('voice_game_sessions')
      .select('id, status, result, turns_played, sand_dollars_earned, moonstones_earned, started_at')
      .eq('player_id', player.id)
      .order('started_at', { ascending: false })
      .limit(10);

    // Map state
    const { data: mapState } = await supabaseAdmin
      .from('voice_map_state')
      .select('*')
      .eq('player_id', player.id)
      .single();

    return NextResponse.json({
      playerId: player.id,
      walletAddress: player.cdp_wallet_address,
      displayName: player.display_name,
      moonstones: player.moonstones,
      sandDollars: player.sand_dollars,
      totalGames: player.total_games,
      onChain: chainStats,
      recentSessions: sessions || [],
      map: mapState ? {
        position: { x: mapState.position_x, y: mapState.position_y },
        exploredTiles: mapState.explored_tiles,
        shipName: mapState.ship_name,
      } : null,
    });
  } catch (error) {
    console.error('[Voice Stats] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
