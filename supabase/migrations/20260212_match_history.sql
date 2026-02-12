-- Game of Memes Match History Table
-- This migration creates a table to store detailed match results alongside on-chain recording
-- NOTE: This file is documentation only. The agent cannot apply it.
--       A human with Supabase access must run this manually via the Supabase dashboard or CLI.

CREATE TABLE IF NOT EXISTS game_of_memes_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_address TEXT NOT NULL,
  player_won BOOLEAN NOT NULL,
  player_health INT NOT NULL,
  opponent_health INT NOT NULL,
  cards_played INT NOT NULL DEFAULT 0,
  damage_dealt INT NOT NULL DEFAULT 0,
  turn_count INT NOT NULL DEFAULT 0,
  difficulty TEXT NOT NULL DEFAULT 'normal',
  tx_hash TEXT, -- Nullable: on-chain transaction hash from SoulTokenV2
  duration_seconds INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes for query performance
CREATE INDEX IF NOT EXISTS idx_game_of_memes_matches_player
  ON game_of_memes_matches(player_address);

CREATE INDEX IF NOT EXISTS idx_game_of_memes_matches_created
  ON game_of_memes_matches(created_at DESC);

-- Enable Row Level Security
ALTER TABLE game_of_memes_matches ENABLE ROW LEVEL SECURITY;

-- Public read policy (anyone can read match history)
CREATE POLICY "Anyone can read match history"
  ON game_of_memes_matches
  FOR SELECT
  USING (true);

-- Service role insert policy (only server can insert via service key)
CREATE POLICY "Service role can insert matches"
  ON game_of_memes_matches
  FOR INSERT
  WITH CHECK (true);

-- Comments for documentation
COMMENT ON TABLE game_of_memes_matches IS 'Detailed match history for Game of Memes. Complements on-chain SoulTokenV2 recording with per-match stats.';
COMMENT ON COLUMN game_of_memes_matches.player_address IS 'Ethereum wallet address (lowercase)';
COMMENT ON COLUMN game_of_memes_matches.tx_hash IS 'On-chain transaction hash from SoulTokenV2.recordWin() or recordLoss()';
COMMENT ON COLUMN game_of_memes_matches.difficulty IS 'AI difficulty: easy, normal, or hard';
