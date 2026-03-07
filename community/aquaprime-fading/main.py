import json
import os
import requests
from src.agent.capability import MatchingCapability
from src.main import AgentWorker
from src.agent.capability_worker import CapabilityWorker

# =============================================================================
# AquaPrime: The Fading — On-Chain Voice RPG
#
# A voice-controlled RPG where players explore a floating world of meme factions
# aboard city-sized airships. Actions are recorded on Base via CDP agent wallets.
#
# Pattern: Register → Start Game → Loop (Listen → Action/Explore) → End Game
#
# Requires AQUAPRIME_API_URL and AQUAPRIME_API_KEY env vars on the device,
# pointing to the deployed Game_Of_Memes Vercel API.
# =============================================================================

API_BASE = os.environ.get("AQUAPRIME_API_URL", "https://gameofmemes.vercel.app")
API_KEY = os.environ.get("AQUAPRIME_API_KEY", "")

EXIT_WORDS = {"stop", "exit", "quit", "done", "cancel", "bye", "goodbye", "leave", "end game"}
DIRECTION_WORDS = {
    "north": "north", "up": "north", "forward": "north",
    "south": "south", "down": "south", "back": "south",
    "east": "east", "right": "east",
    "west": "west", "left": "west",
}


def api_headers():
    return {
        "Content-Type": "application/json",
        "Authorization": f"Bearer {API_KEY}",
    }


def detect_direction(text: str):
    """Check if the user wants to move/explore in a direction."""
    lower = text.lower()
    move_prefixes = ["go ", "move ", "sail ", "fly ", "head ", "travel ", "explore "]
    for prefix in move_prefixes:
        if lower.startswith(prefix):
            remainder = lower[len(prefix):].strip()
            for word, direction in DIRECTION_WORDS.items():
                if remainder.startswith(word):
                    return direction
    for word, direction in DIRECTION_WORDS.items():
        if lower == word:
            return direction
    return None


def detect_stats_request(text: str) -> bool:
    """Check if the user is asking for their stats."""
    lower = text.lower()
    return any(kw in lower for kw in [
        "stats", "status", "score", "how am i doing",
        "my stats", "check stats", "show stats",
        "inventory", "moonstones", "sand dollars",
    ])


class AquaPrimeFadingCapability(MatchingCapability):
    worker: AgentWorker = None
    capability_worker: CapabilityWorker = None
    device_id: str = ""
    speaker_id: str = "default"
    session_id: str = ""
    player_name: str = ""

    @classmethod
    def register_capability(cls) -> "MatchingCapability":
        with open(
            os.path.join(os.path.dirname(os.path.abspath(__file__)), "config.json")
        ) as file:
            data = json.load(file)
        return cls(
            unique_name=data["unique_name"],
            matching_hotwords=data["matching_hotwords"],
        )

    def call(self, worker: AgentWorker):
        self.worker = worker
        self.capability_worker = CapabilityWorker(self.worker)
        self.device_id = getattr(self.worker, "device_id", "unknown-device")
        self.speaker_id = getattr(self.worker, "speaker_id", "default")
        self.worker.session_tasks.create(self.run())

    def api_post(self, path: str, body: dict) -> dict | None:
        """Make a POST request to the voice API."""
        try:
            resp = requests.post(
                f"{API_BASE}/api/voice{path}",
                json=body,
                headers=api_headers(),
                timeout=30,
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                self.worker.editor_logging_handler.error(
                    f"[AquaPrime] {path} returned {resp.status_code}: {resp.text}"
                )
                return None
        except Exception as e:
            self.worker.editor_logging_handler.error(f"[AquaPrime] {path} error: {e}")
            return None

    def api_get(self, path: str, params: dict) -> dict | None:
        """Make a GET request to the voice API."""
        try:
            resp = requests.get(
                f"{API_BASE}/api/voice{path}",
                params=params,
                headers=api_headers(),
                timeout=15,
            )
            if resp.status_code == 200:
                return resp.json()
            else:
                return None
        except Exception as e:
            self.worker.editor_logging_handler.error(f"[AquaPrime] {path} error: {e}")
            return None

    async def narrate(self, context: str, player_action: str = "") -> str:
        """Use the device LLM to generate immersive narration from game context."""
        prompt = (
            "You are the narrator of AquaPrime: The Fading, a voice RPG set in a "
            "floating world of meme factions and city-sized airships. "
            "Narrate the following game event in 2-3 vivid sentences for a voice speaker. "
            "Be dramatic but concise. Use second person ('you'). "
            "Do not repeat game stats — just describe what happens narratively.\n\n"
            f"Game context: {context}"
        )
        if player_action:
            prompt += f"\nThe player said: \"{player_action}\""
        return self.capability_worker.text_to_text_response(prompt)

    async def run(self):
        if not API_KEY:
            await self.capability_worker.speak(
                "AquaPrime is not configured. The API key is missing. "
                "Please set AQUAPRIME_API_KEY in the device settings."
            )
            self.capability_worker.resume_normal_flow()
            return

        # --- Step 1: Register / retrieve player ---
        await self.capability_worker.speak(
            "Welcome to AquaPrime: The Fading. Connecting to the blockchain..."
        )
        reg = self.api_post("/register", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
        })
        if not reg:
            await self.capability_worker.speak(
                "I couldn't connect to the AquaPrime server. Please try again later."
            )
            self.capability_worker.resume_normal_flow()
            return

        self.player_name = reg.get("displayName") or "Captain"
        is_new = reg.get("isNew", False)
        moonstones = reg.get("moonstones", 0)
        sand_dollars = reg.get("sandDollars", 0)

        if is_new:
            await self.capability_worker.speak(
                f"A new soul emerges. Your wallet has been forged on the Base blockchain. "
                f"Welcome aboard, {self.player_name}."
            )
            # Ask for a name
            await self.capability_worker.speak("What shall we call you, Captain?")
            name_input = await self.capability_worker.user_response()
            if name_input and name_input.strip():
                self.player_name = name_input.strip()
        else:
            await self.capability_worker.speak(
                f"Welcome back, {self.player_name}. "
                f"You have {moonstones} moonstones and {sand_dollars} sand dollars."
            )

        # --- Step 2: Start game session ---
        await self.capability_worker.speak("Launching your airship. Stand by...")
        start = self.api_post("/game/start", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
        })
        if not start:
            await self.capability_worker.speak(
                "Failed to launch the airship. The winds are too strong. Try again later."
            )
            self.capability_worker.resume_normal_flow()
            return

        self.session_id = start["sessionId"]
        narrative = start.get("narrative", "")

        # Narrate the opening with LLM flair
        opening = await self.narrate(start.get("openingContext", narrative))
        await self.capability_worker.speak(opening)
        await self.capability_worker.speak("What do you do?")

        # --- Step 3: Game loop ---
        while True:
            user_input = await self.capability_worker.user_response()
            if not user_input:
                continue

            # Check for exit
            if any(word in user_input.lower() for word in EXIT_WORDS):
                await self.end_game()
                break

            # Check for stats request
            if detect_stats_request(user_input):
                await self.speak_stats()
                continue

            # Check for directional movement
            direction = detect_direction(user_input)
            if direction:
                game_over = await self.do_explore(direction)
            else:
                game_over = await self.do_action(user_input)

            if game_over:
                break

            await self.capability_worker.speak("What do you do next?")

        self.capability_worker.resume_normal_flow()

    async def do_action(self, action: str) -> bool:
        """Process a game action (attack, search, talk, etc.)."""
        result = self.api_post("/game/action", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
            "sessionId": self.session_id,
            "action": action,
        })
        if not result:
            await self.capability_worker.speak(
                "The mana storms interfere. I couldn't process that action. Try something else."
            )
            return False

        # Use LLM to narrate the game mechanics
        narration = await self.narrate(
            result.get("narrationContext", result.get("narrative", "")),
            action,
        )
        await self.capability_worker.speak(narration)

        if result.get("gameOver"):
            await self.end_game()
            return True

        return False

    async def do_explore(self, direction: str) -> bool:
        """Move the airship in a direction."""
        result = self.api_post("/game/explore", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
            "sessionId": self.session_id,
            "direction": direction,
        })
        if not result:
            await self.capability_worker.speak(
                "The navigation charts are scrambled. Try a different direction."
            )
            return False

        # Build narration context
        gs = result.get("gameState", {})
        encounter = result.get("encounter")
        context = result.get("narrative", "")
        if encounter:
            context += f" Encounter: {encounter.get('name', 'unknown')} — {encounter.get('desc', '')}."

        narration = await self.narrate(context, f"sail {direction}")
        await self.capability_worker.speak(narration)
        return False

    async def speak_stats(self):
        """Read out the player's current stats."""
        stats = self.api_get("/player/stats", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
        })
        if not stats:
            await self.capability_worker.speak("I couldn't retrieve your stats right now.")
            return

        moonstones = stats.get("moonstones", 0)
        sand_dollars = stats.get("sandDollars", 0)
        total_games = stats.get("totalGames", 0)
        on_chain = stats.get("onChain", {})
        wins = on_chain.get("wins", 0)
        losses = on_chain.get("losses", 0)
        map_data = stats.get("map")
        explored = 0
        if map_data:
            tiles = map_data.get("exploredTiles", [])
            explored = len(tiles) if isinstance(tiles, list) else tiles

        await self.capability_worker.speak(
            f"Here are your stats, {self.player_name}. "
            f"You have {moonstones} moonstones and {sand_dollars} sand dollars. "
            f"{total_games} expeditions completed with {wins} wins and {losses} losses. "
            f"You've explored {explored} regions of the map."
        )

    async def end_game(self):
        """End the current game session and report results."""
        await self.capability_worker.speak("Docking the airship...")
        result = self.api_post("/game/end", {
            "deviceId": self.device_id,
            "speakerId": self.speaker_id,
            "sessionId": self.session_id,
        })
        if not result:
            await self.capability_worker.speak(
                "The expedition log couldn't be saved. Your progress may be lost."
            )
            return

        stats = result.get("stats", {})
        outcome = result.get("result", "unknown")
        turns = stats.get("turns", 0)
        moonstones = stats.get("moonstones", 0)
        sand_dollars = stats.get("sandDollars", 0)

        # Use LLM for a dramatic ending
        context = (
            f"The expedition ends. Result: {outcome}. "
            f"Survived {turns} turns. Earned {moonstones} moonstones and {sand_dollars} sand dollars. "
            f"HP: {stats.get('hp', 0)}. Items collected: {stats.get('items', 0)}."
        )
        if result.get("txHash"):
            context += " The result was recorded on the Base blockchain."

        ending = await self.narrate(context)
        await self.capability_worker.speak(ending)
        await self.capability_worker.speak(
            "Until next time, Captain. Say 'play AquaPrime' to set sail again."
        )
