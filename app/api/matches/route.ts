import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";

interface MatchData {
  playerAddress: string;
  playerWon: boolean;
  playerHealth: number;
  opponentHealth: number;
  cardsPlayed: number;
  damageDealt: number;
  turnCount: number;
  difficulty: string;
  txHash?: string;
  durationSeconds: number;
}

// POST /api/matches - Record a new match result
export async function POST(req: NextRequest) {
  try {
    const body: MatchData = await req.json();

    // Validate required fields
    if (
      !body.playerAddress ||
      typeof body.playerWon !== "boolean" ||
      typeof body.playerHealth !== "number" ||
      typeof body.opponentHealth !== "number"
    ) {
      return NextResponse.json(
        { error: "Missing required fields" },
        { status: 400 },
      );
    }

    // Insert match into Supabase
    const { data, error } = await supabaseAdmin
      .from("game_of_memes_matches")
      .insert({
        player_address: body.playerAddress.toLowerCase(),
        player_won: body.playerWon,
        player_health: body.playerHealth,
        opponent_health: body.opponentHealth,
        cards_played: body.cardsPlayed || 0,
        damage_dealt: body.damageDealt || 0,
        turn_count: body.turnCount || 0,
        difficulty: body.difficulty || "normal",
        tx_hash: body.txHash || null,
        duration_seconds: body.durationSeconds || 0,
      })
      .select("id")
      .single();

    if (error) {
      console.error("[API /matches POST] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to record match", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      matchId: data.id,
    });
  } catch (error) {
    console.error("[API /matches POST] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

// GET /api/matches?player=0x... - Fetch match history for a player
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const playerAddress = searchParams.get("player");

    if (!playerAddress) {
      return NextResponse.json(
        { error: "Missing player address query parameter" },
        { status: 400 },
      );
    }

    // Fetch last 50 matches for this player
    const { data, error } = await supabaseAdmin
      .from("game_of_memes_matches")
      .select("*")
      .eq("player_address", playerAddress.toLowerCase())
      .order("created_at", { ascending: false })
      .limit(50);

    if (error) {
      console.error("[API /matches GET] Supabase error:", error);
      return NextResponse.json(
        { error: "Failed to fetch matches", details: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      matches: data || [],
    });
  } catch (error) {
    console.error("[API /matches GET] Unexpected error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
