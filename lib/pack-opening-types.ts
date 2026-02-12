// Pack Opening Ceremony Types

export type PackOpeningState =
  | "LOADING" // Initial load, fetching pack data
  | "VRF_CONFIRMING" // Waiting for Pyth VRF confirmation
  | "READY_TO_REVEAL" // VRF confirmed, ready to show cards
  | "REVEALING" // Cards being revealed one by one
  | "COMPLETE"; // All cards revealed, show summary

export type CardRarity = "common" | "rare" | "epic" | "legendary" | "mythic";

export interface PackCard {
  id: string;
  name: string;
  image: string;
  rarity: CardRarity;
  attack: number;
  health: number;
  mana: number;
  ticker?: string;
  ability?: string;
  isRevealed: boolean;
}

export interface PackData {
  packId: string;
  packName: string;
  packImage?: string;
  cards: PackCard[];
  openedAt?: Date;
  txHash?: string;
}

export interface VRFStatus {
  isConfirmed: boolean;
  randomValue?: bigint;
  confirmationTime?: number;
  error?: string;
}

// Rarity-based celebration config
export const RARITY_CONFIG: Record<
  CardRarity,
  {
    color: string;
    glowColor: string;
    sound: string;
    confettiCount: number;
    celebrationDuration: number;
  }
> = {
  common: {
    color: "#C0C8D4",
    glowColor: "rgba(192, 200, 212, 0.4)",
    sound: "/audio/reveal-common.wav",
    confettiCount: 0,
    celebrationDuration: 500,
  },
  rare: {
    color: "#60A5FA",
    glowColor: "rgba(96, 165, 250, 0.6)",
    sound: "/audio/reveal-rare.wav",
    confettiCount: 20,
    celebrationDuration: 800,
  },
  epic: {
    color: "#A78BFA",
    glowColor: "rgba(167, 139, 250, 0.65)",
    sound: "/audio/reveal-epic.wav",
    confettiCount: 50,
    celebrationDuration: 1200,
  },
  legendary: {
    color: "#FBBF24",
    glowColor: "rgba(251, 191, 36, 0.7)",
    sound: "/audio/reveal-legendary.wav",
    confettiCount: 100,
    celebrationDuration: 2000,
  },
  mythic: {
    color: "#F472B6",
    glowColor: "rgba(244, 114, 182, 0.75)",
    sound: "/audio/reveal-mythic.wav",
    confettiCount: 200,
    celebrationDuration: 3000,
  },
};

// Lore text for VRF waiting phase
export const VRF_LORE_LINES = [
  "Opening your pack...",
  "Consulting the quantum foam...",
  "Pyth Oracle processing randomness...",
  "Sealing your destiny...",
  "Cards materializing...",
];
