/**
 * Voice Game Engine — Server-side AquaPrime: The Fading
 *
 * Pure functions for the voice RPG. No React, no browser APIs.
 * Manages exploration, encounters, combat, and loot via deterministic state.
 */

// -- Types -------------------------------------------------------------------

export type Difficulty = 'easy' | 'normal' | 'hard';

export interface VoiceGameState {
  region: Region;
  hp: number;
  sandDollars: number;
  moonstones: number;
  inventory: LootItem[];
  turn: number;
  maxTurns: number;
  encounter: Encounter | null;
  position: { x: number; y: number };
  exploredTiles: string[];
  shipName: string;
  difficulty: Difficulty;
}

export interface Region {
  name: string;
  desc: string;
  danger: number;
  tileType: string;
}

export interface Encounter {
  type: string;
  name: string;
  desc: string;
  difficulty: number;
}

export interface LootItem {
  name: string;
  rarity: 'common' | 'uncommon' | 'rare' | 'legendary';
  effect: string;
}

export interface OnChainAction {
  type: 'record_win' | 'record_loss' | 'award_moonstones' | 'mint_nft';
  params: Record<string, unknown>;
}

export interface ActionResult {
  newState: VoiceGameState;
  narrative: string;
  onChainActions: OnChainAction[];
  gameOver: boolean;
}

// -- Game Data ---------------------------------------------------------------

const REGIONS: Region[] = [
  {
    name: 'The Moonstone Maverick',
    desc: 'The city-sized airship hums beneath your feet. Faction banners snap in the wind.',
    danger: 1,
    tileType: 'hub',
  },
  {
    name: 'The Meme Factory',
    desc: 'Neon screens blast propaganda. Viral content pours from every surface.',
    danger: 2,
    tileType: 'meme_fields',
  },
  {
    name: 'Sand Dollar Exchange',
    desc: 'Traders shout as Sand Dollar values plummet on the tickers. Desperation fills the air.',
    danger: 2,
    tileType: 'city_ruins',
  },
  {
    name: 'The Crypto Vault',
    desc: 'A fortress airship bristling with defenses. The key to economic sovereignty is inside.',
    danger: 4,
    tileType: 'data_ocean',
  },
  {
    name: 'Neon Jungle',
    desc: 'Data vines stretch between derelict server towers. Code pulses through the canopy.',
    danger: 3,
    tileType: 'neon_jungle',
  },
  {
    name: 'City Ruins',
    desc: 'Crumbling vaporwave architecture. Pink marble columns and shattered LCD screens.',
    danger: 2,
    tileType: 'city_ruins',
  },
  {
    name: 'Digital Wasteland',
    desc: 'Corrupted terrain. Broken airship hulls. Moonstones are scarce but valuable.',
    danger: 3,
    tileType: 'digital_wasteland',
  },
  {
    name: 'The Underworld Market',
    desc: 'A hidden bazaar. Black market traders deal in stolen moonstones and forbidden memes.',
    danger: 4,
    tileType: 'city_ruins',
  },
];

const ENCOUNTERS: Encounter[] = [
  { type: 'creature', name: 'Rug Serpent', desc: 'Made of broken promises. Strikes fast.', difficulty: 3 },
  { type: 'creature', name: 'Meme Invader', desc: 'A rogue viral construct. Rewrites reality.', difficulty: 2 },
  { type: 'creature', name: 'Whale Shadow', desc: 'Massive airship silhouette. Ancient and hungry.', difficulty: 5 },
  { type: 'environmental', name: 'Sand Dollar Crash', desc: 'Economy convulses. Prices spike and plummet.', difficulty: 3 },
  { type: 'environmental', name: 'Moonstone Storm', desc: 'Raw energy discharges. Your airship shudders.', difficulty: 4 },
  { type: 'social', name: 'Doge Cult Pilgrim', desc: 'Speaks of balance and the teachings of Doge.', difficulty: 1 },
  { type: 'social', name: 'Faction Recruiter', desc: 'Thieves Guild. Believes in sharing the wealth.', difficulty: 2 },
  { type: 'discovery', name: 'Moonstone Vein', desc: 'Raw moonstone exposed by tectonic activity.', difficulty: 0 },
  { type: 'discovery', name: 'Memory Fragment', desc: 'A memory from someone who faded.', difficulty: 0 },
  { type: 'mystery', name: 'The Signal', desc: 'Repeating signal. Unknown protocol. Says: still here.', difficulty: 1 },
];

const LOOT_TABLE: LootItem[] = [
  { name: 'Moonstone Shard', rarity: 'common', effect: 'refuels your airship' },
  { name: 'Echo Crystal', rarity: 'uncommon', effect: 'preserves one memory from fading' },
  { name: 'Void Token', rarity: 'rare', effect: 'opens a path through the Wasteland' },
  { name: 'Whale Bone Key', rarity: 'rare', effect: 'unlocks the Crypto Vault outer gate' },
  { name: 'Dust of the Faded', rarity: 'uncommon', effect: 'reveals hidden encounters' },
  { name: 'Broken Compass', rarity: 'common', effect: 'points toward the nearest moonstone vein' },
  { name: 'Genesis Fragment', rarity: 'legendary', effect: 'unknown power' },
];

const SKILLS = [
  { name: 'Laser Eyes', type: 'offense' },
  { name: 'FUD', type: 'defense' },
  { name: 'Diamond Hands', type: 'defense' },
  { name: 'Duck-Fu', type: 'offense' },
  { name: 'Moonshot', type: 'offense' },
  { name: 'BS Detector', type: 'explore' },
  { name: 'Sybil Sleuth', type: 'explore' },
  { name: 'Memetic Mimic', type: 'explore' },
];

// -- Helpers -----------------------------------------------------------------

function rollD20(): number {
  return Math.floor(Math.random() * 20) + 1;
}

function rollEncounter(region: Region): Encounter | null {
  if (Math.random() > 0.3 + region.danger * 0.1) return null;
  const eligible = ENCOUNTERS.filter(e => e.difficulty <= region.danger + 1);
  return eligible[Math.floor(Math.random() * eligible.length)] || ENCOUNTERS[0];
}

function rollLoot(): LootItem | null {
  const roll = Math.random();
  let pool: LootItem[];
  if (roll < 0.05) pool = LOOT_TABLE.filter(i => i.rarity === 'legendary');
  else if (roll < 0.20) pool = LOOT_TABLE.filter(i => i.rarity === 'rare');
  else if (roll < 0.45) pool = LOOT_TABLE.filter(i => i.rarity === 'uncommon');
  else pool = LOOT_TABLE.filter(i => i.rarity === 'common');
  return pool.length > 0 ? pool[Math.floor(Math.random() * pool.length)] : null;
}

function detectStance(text: string): { name: string; mult: number } {
  const lower = text.toLowerCase();
  const offensive = ['attack', 'fight', 'strike', 'charge', 'slash', 'hit', 'kill', 'destroy', 'laser', 'moonshot', 'duck-fu'];
  const defensive = ['defend', 'block', 'shield', 'hide', 'dodge', 'evade', 'run', 'flee', 'retreat', 'diamond hands'];
  const explore = ['explore', 'examine', 'investigate', 'look', 'search', 'inspect', 'check', 'study', 'observe', 'detect', 'mimic'];

  if (offensive.some(w => lower.includes(w))) return { name: 'offense', mult: 1.3 };
  if (defensive.some(w => lower.includes(w))) return { name: 'defense', mult: 1.1 };
  if (explore.some(w => lower.includes(w))) return { name: 'explore', mult: 0.9 };
  return { name: 'neutral', mult: 1.0 };
}

function getRegionAtPosition(x: number, y: number): Region {
  const idx = Math.abs((x * 7 + y * 13) % REGIONS.length);
  return REGIONS[idx];
}

function tileKey(x: number, y: number): string {
  return `${x},${y}`;
}

// -- Public API --------------------------------------------------------------

/**
 * Create initial game state for a new session
 */
export function createGameState(
  difficulty: Difficulty = 'normal',
  shipName: string = 'The Moonstone Maverick',
): VoiceGameState {
  const startRegion = REGIONS[0]; // Start at the Maverick
  return {
    region: startRegion,
    hp: 100,
    sandDollars: 50,
    moonstones: 0,
    inventory: [],
    turn: 0,
    maxTurns: 20,
    encounter: null,
    position: { x: 0, y: 0 },
    exploredTiles: [tileKey(0, 0)],
    shipName,
    difficulty,
  };
}

/**
 * Process a player action and return the result
 */
export function processAction(
  state: VoiceGameState,
  actionText: string,
): ActionResult {
  const onChainActions: OnChainAction[] = [];
  const newState = { ...state, inventory: [...state.inventory] };
  newState.turn += 1;

  // Roll for encounter if none active
  if (!newState.encounter) {
    newState.encounter = rollEncounter(newState.region);
  }

  // Resolve mechanics
  const d20 = rollD20();
  const stance = detectStance(actionText);
  let narrativeParts: string[] = [];

  if (newState.encounter) {
    const score = Math.round(d20 * stance.mult);
    const threshold = newState.encounter.difficulty * 4;
    const success = score >= threshold;

    if (success) {
      const sdReward = 10 + Math.floor(Math.random() * (newState.encounter.difficulty * 5 + 1));
      newState.sandDollars += sdReward;
      narrativeParts.push(
        `Rolled ${d20} (${stance.name}, score ${score} vs ${threshold}). Success! +${sdReward} Sand Dollars.`,
      );

      // Mining discovery — award moonstones on discovery encounters
      if (newState.encounter.type === 'discovery') {
        const msReward = 1 + Math.floor(Math.random() * 3);
        newState.moonstones += msReward;
        narrativeParts.push(`Mined ${msReward} moonstone${msReward > 1 ? 's' : ''}!`);
        onChainActions.push({
          type: 'award_moonstones',
          params: { amount: msReward },
        });
      }

      // Loot roll
      if (Math.random() < 0.4) {
        const loot = rollLoot();
        if (loot) {
          newState.inventory.push(loot);
          narrativeParts.push(`Found: ${loot.name} (${loot.rarity}).`);
        }
      }
    } else {
      const hpLoss = 5 + newState.encounter.difficulty * 3;
      newState.hp = Math.max(0, newState.hp - hpLoss);
      narrativeParts.push(
        `Rolled ${d20} (${stance.name}, score ${score} vs ${threshold}). Failed. -${hpLoss} HP.`,
      );
    }

    narrativeParts.unshift(`Encounter: ${newState.encounter.name}. ${newState.encounter.desc}`);
    newState.encounter = null;
  } else {
    narrativeParts.push(`Rolled ${d20}. No encounter this turn.`);
    if (newState.turn % 3 === 0) {
      const skill = SKILLS[Math.floor(Math.random() * SKILLS.length)];
      narrativeParts.push(`Tip: Try using ${skill.name}.`);
    }
  }

  // Region transition every 4 turns
  if (newState.turn > 0 && newState.turn % 4 === 0) {
    const newRegion = REGIONS[Math.floor(Math.random() * REGIONS.length)];
    if (newRegion.name !== newState.region.name) {
      newState.region = newRegion;
      narrativeParts.push(`Your airship drifts into ${newRegion.name}.`);
    }
  }

  // Check death
  let gameOver = false;
  if (newState.hp <= 0) {
    gameOver = true;
    narrativeParts.push(
      `The Fading claims you. 0 HP after ${newState.turn} turns. ` +
      `${newState.sandDollars} Sand Dollars, ${newState.moonstones} moonstones, ` +
      `${newState.inventory.length} items. Your memory dissolves into static.`,
    );
    onChainActions.push({ type: 'record_loss', params: {} });
  }

  // Check max turns
  if (newState.turn >= newState.maxTurns && !gameOver) {
    gameOver = true;
    const items = newState.inventory.map(i => i.name).join(', ') || 'nothing';
    narrativeParts.push(
      `Expedition complete! ${newState.hp} HP, ${newState.sandDollars} Sand Dollars, ` +
      `${newState.moonstones} moonstones. Found: ${items}. ` +
      `The ${newState.shipName} docks. Another day survived.`,
    );
    onChainActions.push({ type: 'record_win', params: {} });
  }

  return {
    newState,
    narrative: narrativeParts.join(' '),
    onChainActions,
    gameOver,
  };
}

/**
 * Move the airship in a direction
 */
export function processExplore(
  state: VoiceGameState,
  direction: 'north' | 'south' | 'east' | 'west',
): ActionResult {
  const newState = { ...state, exploredTiles: [...state.exploredTiles] };
  const dx = direction === 'east' ? 1 : direction === 'west' ? -1 : 0;
  const dy = direction === 'north' ? 1 : direction === 'south' ? -1 : 0;

  newState.position = {
    x: newState.position.x + dx,
    y: newState.position.y + dy,
  };

  const key = tileKey(newState.position.x, newState.position.y);
  const isNew = !newState.exploredTiles.includes(key);
  if (isNew) newState.exploredTiles.push(key);

  newState.region = getRegionAtPosition(newState.position.x, newState.position.y);

  const discoveryBonus = isNew ? ' New territory! +5 Sand Dollars.' : '';
  if (isNew) newState.sandDollars += 5;

  // Trigger encounter on new tiles
  newState.encounter = isNew ? rollEncounter(newState.region) : null;

  const narrative =
    `Your airship moves ${direction}. You arrive at ${newState.region.name}. ` +
    `${newState.region.desc}${discoveryBonus}` +
    (newState.encounter
      ? ` You encounter a ${newState.encounter.name}! ${newState.encounter.desc}`
      : ' The skies are clear for now.');

  return {
    newState,
    narrative,
    onChainActions: [],
    gameOver: false,
  };
}

/**
 * Build the opening narrative context for the LLM
 */
export function getOpeningContext(state: VoiceGameState): string {
  return (
    `New game of AquaPrime: The Fading. ` +
    `The player's airship ${state.shipName} arrives at ${state.region.name}. ` +
    `${state.region.desc} HP: ${state.hp}. Sand Dollars: ${state.sandDollars}. ` +
    `Difficulty: ${state.difficulty}.`
  );
}

/**
 * Build narrative context for the LLM from current state + action result
 */
export function getNarrationContext(
  state: VoiceGameState,
  actionText: string,
  mechanicsResult: string,
): string {
  const items = state.inventory.map(i => i.name).join(', ') || 'empty';
  return (
    `Region: ${state.region.name}. HP: ${state.hp}/100. ` +
    `Sand Dollars: ${state.sandDollars}. Moonstones: ${state.moonstones}. ` +
    `Inventory: ${items}. Turn ${state.turn}/${state.maxTurns}. ` +
    `Mechanics: ${mechanicsResult} Player said: "${actionText}"`
  );
}
