# AquaPrime: The Fading

A voice-controlled on-chain RPG for OpenHome speakers. Explore a floating world of meme factions aboard city-sized airships, with game results recorded on the Base blockchain.

## Setup

### 1. Deploy the API

The voice API runs on the Game_Of_Memes Next.js project (Vercel):

- `POST /api/voice/register` — Create player + CDP wallet
- `POST /api/voice/game/start` — Start expedition
- `POST /api/voice/game/action` — Combat, search, interact
- `POST /api/voice/game/explore` — Move airship (north/south/east/west)
- `POST /api/voice/game/end` — End expedition, record on-chain
- `GET /api/voice/player/stats` — View stats, moonstones, map

### 2. Configure Device Environment

Set these env vars on your OpenHome device:

```
AQUAPRIME_API_URL=https://your-deployment.vercel.app
AQUAPRIME_API_KEY=your-voice-api-secret
```

### 3. Install the Ability

Upload this folder as an OpenHome ability. The trigger words are:
- "play AquaPrime"
- "play the fading"
- "start AquaPrime"
- "play a game"

## How It Works

1. **Register**: First play creates a CDP agent wallet on Base (gas-free)
2. **Explore**: Sail your airship across 8 regions — meme factories, crystal caves, sand dollar exchanges
3. **Encounter**: D20-based combat and skill checks against pirates, memory fragments, and faction NPCs
4. **Earn**: Collect moonstones and sand dollars as you explore
5. **Record**: Game wins/losses are recorded on the Soul Token contract on Base

## Voice Commands

- **Actions**: "attack the pirate", "search the ruins", "talk to the merchant"
- **Movement**: "go north", "sail east", "fly west", "head south"
- **Stats**: "check my stats", "how am I doing", "show inventory"
- **Exit**: "stop", "end game", "quit"

## Multi-Player

Supports multiple players per device via OpenHome speaker diarization. Each voice gets its own wallet and game state.
