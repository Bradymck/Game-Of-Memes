import { NextRequest, NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';
import { createPlayerWallet, getOnChainStats } from '@/lib/cdp-wallet';
import { authenticateVoiceRequest } from '@/lib/voice-auth';

interface RegisterBody {
  deviceId: string;
  speakerId?: string;
  displayName?: string;
}

// POST /api/voice/register — Register or retrieve a voice player
export async function POST(req: NextRequest) {
  const authError = authenticateVoiceRequest(req);
  if (authError) return authError;

  try {
    const body: RegisterBody = await req.json();

    if (!body.deviceId) {
      return NextResponse.json({ error: 'Missing deviceId' }, { status: 400 });
    }

    const speakerId = body.speakerId || 'default';

    // Check if player exists
    const { data: existing } = await supabaseAdmin
      .from('voice_players')
      .select('*')
      .eq('device_id', body.deviceId)
      .eq('speaker_id', speakerId)
      .single();

    if (existing) {
      // Update last_active
      await supabaseAdmin
        .from('voice_players')
        .update({ last_active: new Date().toISOString() })
        .eq('id', existing.id);

      // Get on-chain stats
      let stats = { souls: 0, matches: 0, wins: 0, losses: 0, winRate: 0 };
      try {
        stats = await getOnChainStats(existing.cdp_wallet_address);
      } catch {
        // On-chain read may fail, use defaults
      }

      return NextResponse.json({
        playerId: existing.id,
        walletAddress: existing.cdp_wallet_address,
        isNew: false,
        displayName: existing.display_name,
        moonstones: existing.moonstones,
        sandDollars: existing.sand_dollars,
        stats,
      });
    }

    // Create new CDP wallet
    const wallet = await createPlayerWallet();

    // Insert player record
    const { data: player, error } = await supabaseAdmin
      .from('voice_players')
      .insert({
        device_id: body.deviceId,
        speaker_id: speakerId,
        display_name: body.displayName || null,
        cdp_wallet_address: wallet.address,
        cdp_account_id: wallet.accountId,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[Voice Register] Supabase error:', error);
      return NextResponse.json({ error: 'Failed to create player' }, { status: 500 });
    }

    // Create map state
    await supabaseAdmin.from('voice_map_state').insert({
      player_id: player.id,
    });

    return NextResponse.json({
      playerId: player.id,
      walletAddress: wallet.address,
      isNew: true,
      displayName: body.displayName || null,
      moonstones: 0,
      sandDollars: 0,
      stats: { souls: 0, matches: 0, wins: 0, losses: 0, winRate: 0 },
    });
  } catch (error) {
    console.error('[Voice Register] Error:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
