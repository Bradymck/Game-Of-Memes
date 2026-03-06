-- Voice Game Tables for AquaPrime: The Fading
-- Supports multi-player per device via speaker diarization

CREATE TABLE IF NOT EXISTS voice_players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  device_id TEXT NOT NULL,
  speaker_id TEXT NOT NULL DEFAULT 'default',
  display_name TEXT,
  cdp_wallet_address TEXT NOT NULL,
  cdp_account_id TEXT NOT NULL,
  privy_address TEXT,
  moonstones BIGINT DEFAULT 0,
  sand_dollars BIGINT DEFAULT 0,
  total_games INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_active TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(device_id, speaker_id)
);

CREATE TABLE IF NOT EXISTS voice_game_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID REFERENCES voice_players(id) ON DELETE CASCADE,
  game_state JSONB NOT NULL,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'abandoned')),
  difficulty TEXT DEFAULT 'normal',
  started_at TIMESTAMPTZ DEFAULT NOW(),
  ended_at TIMESTAMPTZ,
  result TEXT CHECK (result IN ('win', 'loss', NULL)),
  tx_hash TEXT,
  turns_played INTEGER DEFAULT 0,
  sand_dollars_earned INTEGER DEFAULT 0,
  moonstones_earned INTEGER DEFAULT 0
);

CREATE TABLE IF NOT EXISTS voice_map_state (
  player_id UUID REFERENCES voice_players(id) ON DELETE CASCADE PRIMARY KEY,
  position_x INTEGER DEFAULT 0,
  position_y INTEGER DEFAULT 0,
  explored_tiles JSONB DEFAULT '[]'::jsonb,
  ship_name TEXT DEFAULT 'The Moonstone Maverick',
  last_move_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_voice_players_device ON voice_players(device_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_player ON voice_game_sessions(player_id);
CREATE INDEX IF NOT EXISTS idx_voice_sessions_status ON voice_game_sessions(status);
