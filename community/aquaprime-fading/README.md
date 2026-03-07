# AquaPrime: The Fading

A voice-controlled on-chain RPG for OpenHome speakers. Explore a floating world of meme factions aboard city-sized airships, with game results recorded on the Base blockchain.

## How It Works

1. **First play**: An embedded CDP wallet is created on Base — this is your identity
2. **Explore**: Sail your airship across 8 regions — meme factories, crystal caves, sand dollar exchanges
3. **Encounter**: D20-based combat and skill checks against pirates, memory fragments, and faction NPCs
4. **Earn**: Collect moonstones and sand dollars as you explore
5. **Record**: Game wins/losses are recorded on the Soul Token contract on Base

One device = one player. Your wallet address is your identity in the AquaPrime world.

## Voice Commands

- **Actions**: "attack the pirate", "search the ruins", "talk to the merchant"
- **Movement**: "go north", "sail east", "fly west", "head south"
- **Stats**: "check my stats", "how am I doing", "show inventory"
- **Exit**: "stop", "end game", "quit"

## Trigger Words

- "play AquaPrime"
- "play the fading"
- "start AquaPrime"
- "play a game"

## API

The ability calls the Game_Of_Memes API deployed on Vercel:

- `POST /api/voice/register` — Create player + embedded wallet
- `POST /api/voice/game/start` — Start expedition
- `POST /api/voice/game/action` — Combat, search, interact
- `POST /api/voice/game/explore` — Move airship (north/south/east/west)
- `POST /api/voice/game/end` — End expedition, record on-chain
- `GET /api/voice/player/stats` — View stats, moonstones, map
