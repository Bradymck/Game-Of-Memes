"use client";

<<<<<<< HEAD
import { createContext, useContext, useState, useCallback, useEffect, useRef, type ReactNode } from "react"
import { useSearchParams } from "next/navigation"
import { useVibeMarketCards } from "@/hooks/useVibeMarketCards"
import { logGameAction } from "@/lib/xmtp"
import { usePrivy } from "@privy-io/react-auth"

export interface MemeCardData {
  id: string
  name: string
  image: string
  rarity: "common" | "rare" | "epic" | "legendary" | "mythic"
  attack: number
  health: number
  mana: number
  ticker: string
  ability?: string
  canAttack?: boolean
}

interface GameState {
  playerHand: MemeCardData[]
  playerField: MemeCardData[]
  playerDeck: MemeCardData[]
  playerGraveyard: MemeCardData[]
  opponentHand: MemeCardData[]
  opponentField: MemeCardData[]
  opponentDeck: MemeCardData[]
  opponentGraveyard: MemeCardData[]
  playerMana: number
  maxPlayerMana: number
  opponentMana: number
  maxOpponentMana: number
  playerHealth: number
  opponentHealth: number
  selectedCard: string | null
  selectedAttacker: string | null
  isPlayerTurn: boolean
  turnNumber: number
  gameOver: boolean
  playerWon: boolean | null
  cardsPlayed: number
  damageDealt: number
  lastDamage: { targetId: string | null; amount: number; timestamp: number } | null
  dyingMinions: string[]
=======
import {
  createContext,
  useContext,
  useState,
  useCallback,
  useEffect,
  useRef,
  type ReactNode,
} from "react";
import { useVibeMarketCards } from "@/hooks/useVibeMarketCards";
import { logGameAction } from "@/lib/xmtp";
import { usePrivy } from "@privy-io/react-auth";
import { getAIActions, type Difficulty } from "@/lib/aiOpponent";

export interface MemeCardData {
  id: string;
  name: string;
  image: string;
  rarity: "common" | "rare" | "epic" | "legendary";
  attack: number;
  health: number;
  mana: number;
  ticker: string;
  ability?: string;
  canAttack?: boolean;
  marketData?: {
    price: number;
    priceChange24h: number;
    marketCap: number;
  };
}

interface GameState {
  playerHand: MemeCardData[];
  playerField: MemeCardData[];
  playerDeck: MemeCardData[];
  playerGraveyard: MemeCardData[];
  opponentHand: MemeCardData[];
  opponentField: MemeCardData[];
  opponentDeck: MemeCardData[];
  opponentGraveyard: MemeCardData[];
  playerMana: number;
  maxPlayerMana: number;
  opponentMana: number;
  maxOpponentMana: number;
  playerHealth: number;
  opponentHealth: number;
  selectedCard: string | null;
  selectedAttacker: string | null;
  isPlayerTurn: boolean;
  turnNumber: number;
  gameOver: boolean;
  playerWon: boolean | null;
  cardsPlayed: number;
  damageDealt: number;
  lastDamage: {
    targetId: string | null;
    amount: number;
    timestamp: number;
  } | null;
  dyingMinions: string[];
  difficulty: Difficulty;
  matchStartTime: number;
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
}

interface GameContextType extends GameState {
  playCard: (cardId: string) => void;
  selectCard: (cardId: string | null) => void;
  selectAttacker: (cardId: string | null) => void;
  attackTarget: (targetId: string | null) => void;
  attackHero: () => void;
  endTurn: () => void;
  resetGame: () => void;
  setDifficulty: (difficulty: Difficulty) => void;
  aiCollectionName: string;
  playerPackImage: string;
  aiPackImage: string;
}

const GameContext = createContext<GameContextType | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
<<<<<<< HEAD
  const searchParams = useSearchParams();
  const { cards: userCards, loading: cardsLoading } = useVibeMarketCards();
=======
  const {
    cards: userCards,
    packImage: userPackImage,
    contractAddresses: playerContracts,
  } = useVibeMarketCards();
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
  const { user } = usePrivy();
  const gameInitialized = useRef(false);

  // AI deck from top VibeMarket collections
  const [aiCards, setAiCards] = useState<MemeCardData[]>([]);
  const [aiCollectionName, setAiCollectionName] = useState<string>("");
  const [aiPackImage, setAiPackImage] = useState<string>("");
  const [playerPackImage, setPlayerPackImage] = useState<string>("");

  const fetchAiDeck = useCallback(async (excludeContract?: string) => {
    try {
      const url = excludeContract
        ? `/api/ai-deck?exclude=${excludeContract}`
        : "/api/ai-deck";
      const res = await fetch(url);
      const data = await res.json();
      if (data.cards?.length > 0) {
        setAiCards(data.cards);
        setAiCollectionName(data.collectionName || "");
        if (data.packImage) {
          setAiPackImage(data.packImage);
          localStorage.setItem("gom:aiPackImage", data.packImage);
        }
        console.log(
          `🤖 AI deck loaded: ${data.cards.length} cards from "${data.collectionName}"`,
        );
      }
    } catch (e) {
      console.error("Failed to fetch AI deck:", e);
    }
  }, []);

  // Ghost loading cards (ethereal placeholders while NFTs load)
  const ghostCards: MemeCardData[] = Array.from({ length: 4 }, (_, i) => ({
    id: `ghost-${i}`,
    name: "Summoning...",
    image: "", // Empty = shows mystical ghost
    rarity: "common" as const,
    attack: 0,
    health: 0,
    mana: 0,
    ticker: "👻",
  }));

  const [state, setState] = useState<GameState>({
    playerHand: ghostCards, // Start with ghost cards!
    playerField: [],
    playerDeck: [], // Will be populated when cards load
    playerGraveyard: [],
    opponentHand: [],
    opponentField: [],
    opponentDeck: [],
    opponentGraveyard: [],
    playerMana: 1,
    maxPlayerMana: 1,
    opponentMana: 1,
    maxOpponentMana: 1,
    playerHealth: 30,
    opponentHealth: 30,
    selectedCard: null,
    selectedAttacker: null,
    isPlayerTurn: true,
    turnNumber: 1,
    gameOver: false,
    playerWon: null,
    cardsPlayed: 0,
    damageDealt: 0,
    lastDamage: null,
    dyingMinions: [],
    difficulty: "normal",
    matchStartTime: Date.now(),
  });

<<<<<<< HEAD
  // Initialize game with cards - check drafted cards first, then user cards
  useEffect(() => {
    // Skip on server (no sessionStorage)
    if (typeof window === 'undefined') return;
    if (gameInitialized.current) return;

    // Check for drafted cards from pack opening (stored in sessionStorage)
    const source = searchParams.get('source');
    console.log('🔍 Game init - source param:', source);

    // Try to load drafted cards regardless of URL param (in case URL param got lost)
    try {
      const draftedCardsJson = sessionStorage.getItem('draftedCards');
      console.log('🔍 sessionStorage draftedCards exists:', !!draftedCardsJson);

      if (draftedCardsJson) {
        console.log('🔍 draftedCardsJson preview:', draftedCardsJson?.slice(0, 200) + '...');
        const draftedCards = JSON.parse(draftedCardsJson) as MemeCardData[];
        console.log('🎴 Parsed drafted cards:', draftedCards.length);
        console.log('🎴 First card:', draftedCards[0]);

        if (draftedCards.length > 0) {
          gameInitialized.current = true;
          initializeGameWithCards(draftedCards);
          // Clear the drafted cards from storage after using them
          sessionStorage.removeItem('draftedCards');
          return;
        }
      }
    } catch (e) {
      console.error('Failed to load drafted cards:', e);
    }

    // Fallback to user's opened cards from Alchemy
    if (userCards.length > 0) {
      console.log('🎴 Using user cards from Alchemy:', userCards.length);
      console.log('🎴 First user card:', userCards[0]);
      gameInitialized.current = true;
      initializeGameWithCards(userCards);
    } else {
      console.log('⚠️ No cards available - userCards.length:', userCards.length);
    }
  }, [searchParams, userCards.length]);

  // Helper function to initialize game state with a set of cards
  const initializeGameWithCards = (cards: MemeCardData[]) => {
    console.log('🎮 initializeGameWithCards called with', cards.length, 'cards');
    console.log('🎮 Sample card:', cards[0]);

    // Give unique IDs to avoid conflicts between player and opponent copies
    const playerCards = cards.map((c, i) => ({ ...c, id: `p-${c.id}-${i}` }));
    const opponentCards = cards.map((c, i) => ({ ...c, id: `o-${c.id}-${i}` }));

    console.log('🎮 Player cards sample:', playerCards[0]);

    const shuffled1 = [...playerCards].sort(() => Math.random() - 0.5);
    const shuffled2 = [...opponentCards].sort(() => Math.random() - 0.5);

    console.log('🎮 Hand cards will be:', shuffled1.slice(0, 4).map(c => ({ name: c.name, image: c.image?.slice(0, 50) })));

    setState({
      playerHand: shuffled1.slice(0, 4), // Draw initial 4 cards
      playerDeck: shuffled1.slice(4), // Rest goes in deck
      playerField: [],
      playerGraveyard: [],
      opponentHand: shuffled2.slice(0, 4), // AI also starts with 4 cards in hand
      opponentField: [], // AI starts with empty field, will play cards on its turn
      opponentDeck: shuffled2.slice(4), // Rest in opponent deck
      opponentGraveyard: [],
      playerMana: 1,
      maxPlayerMana: 1,
      opponentMana: 1,
      maxOpponentMana: 1,
      playerHealth: 30,
      opponentHealth: 30,
      selectedCard: null,
      selectedAttacker: null,
      isPlayerTurn: true,
      turnNumber: 1,
      gameOver: false,
      playerWon: null,
      cardsPlayed: 0,
      damageDealt: 0,
      lastDamage: null,
      dyingMinions: [],
    });
  };
=======
  // Helper to initialize game state from card sets
  // If opponentCards provided, AI uses those; otherwise falls back to playerCards
  const initGameFromCards = useCallback(
    (playerCards: MemeCardData[], opponentCards?: MemeCardData[]) => {
      // Pad to 25 cards minimum by duplicating with unique IDs
      const padDeck = (cards: MemeCardData[]): MemeCardData[] => {
        if (cards.length === 0) return cards;
        const deck = [...cards];
        let dupIdx = 0;
        while (deck.length < 25) {
          const source = cards[dupIdx % cards.length];
          deck.push({ ...source, id: `${source.id}-dup-${dupIdx}` });
          dupIdx++;
        }
        return deck;
      };

      const shuffledPlayer = padDeck(playerCards).sort(
        () => Math.random() - 0.5,
      );
      const aiDeck =
        opponentCards && opponentCards.length > 0 ? opponentCards : playerCards;
      const shuffledAI = padDeck(aiDeck).sort(() => Math.random() - 0.5);

      setState((prev) => ({
        playerHand: shuffledPlayer.slice(0, 4),
        playerDeck: shuffledPlayer.slice(4),
        playerField: [],
        playerGraveyard: [],
        opponentHand: shuffledAI.slice(0, 4),
        opponentField: [],
        opponentDeck: shuffledAI.slice(4),
        opponentGraveyard: [],
        playerMana: 1,
        maxPlayerMana: 1,
        opponentMana: 1,
        maxOpponentMana: 1,
        playerHealth: 30,
        opponentHealth: 30,
        selectedCard: null,
        selectedAttacker: null,
        isPlayerTurn: true,
        turnNumber: 1,
        gameOver: false,
        playerWon: null,
        cardsPlayed: 0,
        damageDealt: 0,
        lastDamage: null,
        dyingMinions: [],
        difficulty: prev.difficulty,
        matchStartTime: Date.now(),
      }));
    },
    [],
  );

  // Track whether we loaded from a draft session — if so, don't let the
  // API card fetch reset the game mid-play
  const loadedFromDraftRef = useRef(false);

  // Fetch AI deck once player contracts are known (so we can exclude them)
  // Falls back to no exclusion if player has no contracts yet
  const aiDeckFetchedRef = useRef(false);
  useEffect(() => {
    if (aiDeckFetchedRef.current) return;
    if (playerContracts.length > 0) {
      aiDeckFetchedRef.current = true;
      fetchAiDeck(playerContracts[0]);
    }
  }, [playerContracts, fetchAiDeck]);
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1

  // Fallback: if player contracts never load (no wallet), fetch AI deck anyway
  useEffect(() => {
    const timer = setTimeout(() => {
      if (!aiDeckFetchedRef.current) {
        aiDeckFetchedRef.current = true;
        fetchAiDeck();
      }
    }, 5000);
    return () => clearTimeout(timer);
  }, [fetchAiDeck]);

  // Store drafted cards if present, but don't init game yet
  const draftedCardsRef = useRef<MemeCardData[] | null>(null);
  useEffect(() => {
    try {
      const stored = sessionStorage.getItem("draftedCards");
      if (stored) {
        const draftedCards: MemeCardData[] = JSON.parse(stored);
        sessionStorage.removeItem("draftedCards");
        if (draftedCards.length > 0) {
          console.log("🎴 Draft cards found:", draftedCards.length);
          loadedFromDraftRef.current = true;
          draftedCardsRef.current = draftedCards;
        }
      }
    } catch {
      // No drafted cards
    }
  }, []);

  // Initialize game only when BOTH player/draft cards AND AI cards are ready.
  // This prevents the opponent from using the player's cards as a fallback.
  const gameInitializedRef = useRef(false);
  useEffect(() => {
    if (gameInitializedRef.current) return;
    if (aiCards.length === 0) return; // Wait for AI deck

    const playerDeck = loadedFromDraftRef.current
      ? draftedCardsRef.current
      : userCards.length > 0
        ? userCards
        : null;

    if (!playerDeck || playerDeck.length === 0) return; // Wait for player cards

    gameInitializedRef.current = true;
    console.log(
      `🎮 Initializing game: ${playerDeck.length} player cards, ${aiCards.length} AI cards`,
    );
    initGameFromCards(playerDeck, aiCards);
  }, [userCards, aiCards, initGameFromCards]);

  // Load cached pack images from localStorage after hydration
  useEffect(() => {
    const cachedAi = localStorage.getItem("gom:aiPackImage");
    if (cachedAi) setAiPackImage(cachedAi);
  }, []);

  // Set player pack image when it loads from the cards API
  useEffect(() => {
    if (userPackImage) setPlayerPackImage(userPackImage);
  }, [userPackImage]);

  const playCard = useCallback(
    (cardId: string) => {
      setState((prev) => {
        const card = prev.playerHand.find((c) => c.id === cardId);
        if (
          !card ||
          card.mana > prev.playerMana ||
          prev.playerField.length >= 7
        )
          return prev;

        // Log action to chat
        if (user?.wallet?.address) {
          logGameAction(
            {
              type: "play_card",
              actor: user.wallet.address,
              data: { cardName: card.name, mana: card.mana },
            },
            user.wallet.address,
          );
        }

        return {
          ...prev,
          playerHand: prev.playerHand.filter((c) => c.id !== cardId),
          playerField: [...prev.playerField, { ...card, canAttack: false }],
          playerMana: prev.playerMana - card.mana,
          selectedCard: null,
          cardsPlayed: prev.cardsPlayed + 1,
        };
      });
    },
    [user?.wallet?.address],
  );

  const selectCard = useCallback((cardId: string | null) => {
    setState((prev) => ({
      ...prev,
      selectedCard: cardId,
      selectedAttacker: null,
    }));
  }, []);

  const selectAttacker = useCallback((cardId: string | null) => {
    setState((prev) => {
      const card = prev.playerField.find((c) => c.id === cardId);
      if (cardId && card && !card.canAttack) return prev;
      return { ...prev, selectedAttacker: cardId, selectedCard: null };
    });
  }, []);

  const attackTarget = useCallback(
    (targetId: string | null) => {
      setState((prev) => {
        if (!prev.selectedAttacker || !targetId) return prev;

        const attacker = prev.playerField.find(
          (c) => c.id === prev.selectedAttacker,
        );
        const target = prev.opponentField.find((c) => c.id === targetId);
        if (!attacker || !target) return prev;

        const newTargetHealth = target.health - attacker.attack;
        const newAttackerHealth = attacker.health - target.attack;

        // Log attack to chat
        if (user?.wallet?.address) {
          logGameAction(
            {
              type: "attack_minion",
              actor: user.wallet.address,
              data: {
                attacker: attacker.name,
                target: target.name,
                damage: attacker.attack,
              },
            },
            user.wallet.address,
          );
        }

        // Mark dying minions instead of removing them immediately
        const dyingMinions = [];
        if (newAttackerHealth <= 0) dyingMinions.push(attacker.id);
        if (newTargetHealth <= 0) dyingMinions.push(target.id);

        const newState = {
          ...prev,
          playerField: prev.playerField.map((c) =>
            c.id === attacker.id
              ? { ...c, health: newAttackerHealth, canAttack: false }
              : c,
          ),
          opponentField: prev.opponentField.map((c) =>
            c.id === target.id ? { ...c, health: newTargetHealth } : c,
          ),
          dyingMinions,
          selectedAttacker: null,
          lastDamage: {
            targetId,
            amount: attacker.attack,
            timestamp: Date.now(),
          },
        };

        console.log("[attackTarget] New lastDamage:", newState.lastDamage);

        // After burn dissolve animation (1200ms), actually remove dead minions
        if (dyingMinions.length > 0) {
          setTimeout(() => {
            setState((current) => ({
              ...current,
              playerField: current.playerField.filter((c) => c.health > 0),
              opponentField: current.opponentField.filter((c) => c.health > 0),
              playerGraveyard:
                newAttackerHealth <= 0
                  ? [...current.playerGraveyard, attacker]
                  : current.playerGraveyard,
              opponentGraveyard:
                newTargetHealth <= 0
                  ? [...current.opponentGraveyard, target]
                  : current.opponentGraveyard,
              dyingMinions: [],
            }));
          }, 1200); // Match burn animation duration
        }

        return newState;
      });
    },
    [user?.wallet?.address],
  );

  const attackHero = useCallback(() => {
    setState((prev) => {
      if (!prev.selectedAttacker) return prev;
      const attacker = prev.playerField.find(
        (c) => c.id === prev.selectedAttacker,
      );
      if (!attacker) return prev;

      // Check for taunt - can't attack hero if opponent has minions (unless attacker has special ability later)
      const hasTauntBlockers = prev.opponentField.length > 0;
      if (hasTauntBlockers) {
        // TODO: Later add check for abilities that bypass taunt
        return prev; // Can't attack hero while minions are blocking
      }

      const newOpponentHealth = prev.opponentHealth - attacker.attack;
      const newDamageDealt = prev.damageDealt + attacker.attack;

      // Log hero attack
      if (user?.wallet?.address) {
        logGameAction(
          {
            type: "attack_hero",
            actor: user.wallet.address,
            data: { attacker: attacker.name, damage: attacker.attack },
          },
          user.wallet.address,
        );
      }

      return {
        ...prev,
        opponentHealth: newOpponentHealth,
        playerField: prev.playerField.map((c) =>
          c.id === attacker.id ? { ...c, canAttack: false } : c,
        ),
        selectedAttacker: null,
        damageDealt: newDamageDealt,
        gameOver: newOpponentHealth <= 0,
        playerWon: newOpponentHealth <= 0 ? true : null,
        lastDamage: {
          targetId: null,
          amount: attacker.attack,
          timestamp: Date.now(),
        }, // null targetId = hero
      };
    });
  }, [user?.wallet?.address]);

  const endTurn = useCallback(() => {
    // Log end turn
    if (user?.wallet?.address) {
      logGameAction(
        {
          type: "end_turn",
          actor: user.wallet.address,
          data: {},
        },
        user.wallet.address,
      );
    }

    setState((prev) => ({
      ...prev,
      isPlayerTurn: false,
      selectedCard: null,
      selectedAttacker: null,
    }));

<<<<<<< HEAD
    // AI opponent turn - Phase 1: Play cards
    setTimeout(() => {
      setState((prev) => {
        if (prev.gameOver) return prev;

        // AI plays cards from hand (simple AI: play cards it can afford, prioritize higher mana cards)
        let opponentMana = prev.opponentMana;
        let opponentHand = [...prev.opponentHand];
        let opponentField = [...prev.opponentField];

        // Sort by mana cost descending (play expensive cards first)
        const playableCards = opponentHand
          .filter(card => card.mana <= opponentMana && opponentField.length < 7)
          .sort((a, b) => b.mana - a.mana);

        for (const card of playableCards) {
          if (card.mana <= opponentMana && opponentField.length < 7) {
            console.log(`🤖 AI plays ${card.name} (${card.mana} mana)`);
            opponentHand = opponentHand.filter(c => c.id !== card.id);
            opponentField.push({ ...card, canAttack: false }); // Summoning sickness
            opponentMana -= card.mana;

            // Log AI play
            if (user?.wallet?.address) {
              logGameAction({
                type: 'play_card',
                actor: 'AI',
                data: { cardName: card.name, mana: card.mana }
              }, user.wallet.address);
            }
          }
        }

        return {
          ...prev,
          opponentHand,
          opponentField,
          opponentMana,
=======
    // AI opponent turn — draw a card, then use getAIActions() for decisions
    setTimeout(() => {
      setState((prev) => {
        if (prev.gameOver) return prev;

        // AI draws a card from its deck
        let opponentDeck = prev.opponentDeck;
        let opponentGraveyard = prev.opponentGraveyard;

        if (opponentDeck.length === 0 && opponentGraveyard.length > 0) {
          opponentDeck = [...opponentGraveyard].sort(() => Math.random() - 0.5);
          opponentGraveyard = [];
        }

        const drawnCard = opponentDeck[0];
        const opponentHand = drawnCard
          ? [...prev.opponentHand, drawnCard]
          : [...prev.opponentHand];
        opponentDeck = drawnCard ? opponentDeck.slice(1) : opponentDeck;

        // Enable canAttack on existing field minions for AI's turn
        const opponentField = prev.opponentField.map((c) => ({
          ...c,
          canAttack: true,
        }));

        // Get AI decisions
        const actions = getAIActions(
          {
            opponentHand,
            opponentField,
            playerField: prev.playerField,
            opponentMana: prev.opponentMana,
            playerHealth: prev.playerHealth,
          },
          prev.difficulty,
        );

        // Execute all actions in one state update
        let newOpponentHand = [...opponentHand];
        let newOpponentField = [...opponentField];
        let newPlayerField = [...prev.playerField];
        let playerHealth = prev.playerHealth;
        let remainingMana = prev.opponentMana;
        const newOpponentGraveyard = [...opponentGraveyard];
        const newPlayerGraveyard = [...prev.playerGraveyard];

        for (const action of actions) {
          if (action.type === "PLAY_CARD" && action.cardId) {
            const card = newOpponentHand.find((c) => c.id === action.cardId);
            if (
              card &&
              card.mana <= remainingMana &&
              newOpponentField.length < 7
            ) {
              newOpponentHand = newOpponentHand.filter((c) => c.id !== card.id);
              newOpponentField = [
                ...newOpponentField,
                { ...card, canAttack: false },
              ];
              remainingMana -= card.mana;

              if (user?.wallet?.address) {
                logGameAction(
                  {
                    type: "play_card",
                    actor: "AI",
                    data: { cardName: card.name, mana: card.mana },
                  },
                  user.wallet.address,
                );
              }
            }
          } else if (action.type === "ATTACK_HERO" && action.cardId) {
            const minion = newOpponentField.find((c) => c.id === action.cardId);
            if (minion && minion.canAttack) {
              playerHealth -= minion.attack;
              newOpponentField = newOpponentField.map((c) =>
                c.id === minion.id ? { ...c, canAttack: false } : c,
              );

              if (user?.wallet?.address) {
                logGameAction(
                  {
                    type: "attack_hero",
                    actor: "AI",
                    data: { attacker: minion.name, damage: minion.attack },
                  },
                  user.wallet.address,
                );
              }
            }
          } else if (
            action.type === "ATTACK_MINION" &&
            action.cardId &&
            action.targetId
          ) {
            const attacker = newOpponentField.find(
              (c) => c.id === action.cardId,
            );
            const target = newPlayerField.find((c) => c.id === action.targetId);
            if (attacker && target && attacker.canAttack) {
              const newAttackerHealth = attacker.health - target.attack;
              const newTargetHealth = target.health - attacker.attack;

              newOpponentField = newOpponentField.map((c) =>
                c.id === attacker.id
                  ? { ...c, health: newAttackerHealth, canAttack: false }
                  : c,
              );
              newPlayerField = newPlayerField.map((c) =>
                c.id === target.id ? { ...c, health: newTargetHealth } : c,
              );

              // Move dead minions to graveyards
              if (newAttackerHealth <= 0) {
                newOpponentGraveyard.push(attacker);
              }
              if (newTargetHealth <= 0) {
                newPlayerGraveyard.push(target);
              }

              if (user?.wallet?.address) {
                logGameAction(
                  {
                    type: "attack_minion",
                    actor: "AI",
                    data: {
                      attacker: attacker.name,
                      target: target.name,
                      damage: attacker.attack,
                    },
                  },
                  user.wallet.address,
                );
              }
            }
          }
        }

        // Remove dead minions
        newOpponentField = newOpponentField.filter((c) => c.health > 0);
        newPlayerField = newPlayerField.filter((c) => c.health > 0);

        const gameOver = playerHealth <= 0;

        return {
          ...prev,
          opponentHand: newOpponentHand,
          opponentField: newOpponentField,
          opponentDeck,
          opponentGraveyard: newOpponentGraveyard,
          playerField: newPlayerField,
          playerGraveyard: newPlayerGraveyard,
          playerHealth,
          opponentMana: remainingMana,
          gameOver,
          playerWon: gameOver ? false : null,
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
        };
      });
    }, 500);

    // AI opponent turn - Phase 2: Attack (with visual feedback)
    // Execute AI attacks one at a time with delays for visual feedback
    const executeAIAttacks = async () => {
      let attackDelay = 1200; // Start after play phase

      setState((prev) => {
        if (prev.gameOver) return prev;

        const attackingMinions = prev.opponentField.filter(m => m.canAttack && m.health > 0);

        // Schedule each attack with visual feedback
        attackingMinions.forEach((minion, index) => {
          setTimeout(() => {
            setState((current) => {
              if (current.gameOver) return current;

              // Find the minion in current state (it may have been updated)
              const currentMinion = current.opponentField.find(m => m.id === minion.id);
              if (!currentMinion || !currentMinion.canAttack || currentMinion.health <= 0) {
                return current;
              }

              let playerHealth = current.playerHealth;
              let playerField = [...current.playerField];
              let opponentField = [...current.opponentField];
              let lastDamage = current.lastDamage;
              let dyingMinions = [...current.dyingMinions];

              // If player has minions, attack them
              if (playerField.length > 0) {
                // Attack the weakest minion
                const targetIndex = playerField.reduce((minIdx, curr, idx, arr) =>
                  curr.health < arr[minIdx].health ? idx : minIdx, 0);
                const target = playerField[targetIndex];

                console.log(`🤖 AI's ${currentMinion.name} attacks ${target.name}`);

                // Combat damage
                const newTargetHealth = target.health - currentMinion.attack;
                const newMinionHealth = currentMinion.health - target.attack;

                // Update minion states
                playerField = playerField.map(c =>
                  c.id === target.id ? { ...c, health: newTargetHealth } : c
                );
                opponentField = opponentField.map(c =>
                  c.id === currentMinion.id ? { ...c, health: newMinionHealth, canAttack: false } : c
                );

                // Set lastDamage for visual feedback on target
                lastDamage = { targetId: target.id, amount: currentMinion.attack, timestamp: Date.now() };

                // Mark dying minions
                if (newTargetHealth <= 0) dyingMinions.push(target.id);
                if (newMinionHealth <= 0) dyingMinions.push(currentMinion.id);

                // Log AI attack
                if (user?.wallet?.address) {
                  logGameAction({
                    type: 'attack_minion',
                    actor: 'AI',
                    data: { attacker: currentMinion.name, target: target.name, damage: currentMinion.attack }
                  }, user.wallet.address);
                }
              } else {
                // No blockers - attack face!
                console.log(`🤖 AI's ${currentMinion.name} attacks player for ${currentMinion.attack} damage!`);
                playerHealth -= currentMinion.attack;

                // Update minion canAttack
                opponentField = opponentField.map(c =>
                  c.id === currentMinion.id ? { ...c, canAttack: false } : c
                );

                // Set lastDamage for visual feedback on hero (null targetId = hero)
                lastDamage = { targetId: 'player-hero', amount: currentMinion.attack, timestamp: Date.now() };

                // Log AI attack
                if (user?.wallet?.address) {
                  logGameAction({
                    type: 'attack_hero',
                    actor: 'AI',
                    data: { attacker: currentMinion.name, damage: currentMinion.attack }
                  }, user.wallet.address);
                }
              }

              // Check if AI won
              const gameOver = playerHealth <= 0;

              return {
                ...current,
                playerHealth,
                playerField,
                opponentField,
                lastDamage,
                dyingMinions,
                gameOver,
                playerWon: gameOver ? false : null,
              };
            });

            // Clean up dying minions after animation
            setTimeout(() => {
              setState((current) => ({
                ...current,
                playerField: current.playerField.filter(c => c.health > 0),
                opponentField: current.opponentField.filter(c => c.health > 0),
                dyingMinions: [],
              }));
            }, 800);

          }, attackDelay + index * 600); // 600ms between each AI attack
        });

        return prev; // Don't change state in this initial call
      });
    };

    setTimeout(executeAIAttacks, 500);

    // End AI turn, start player turn (wait longer to allow all attack animations to complete)
    // Max attacks = 7 minions * 600ms each + 1200ms base + 800ms cleanup = ~6200ms
    setTimeout(() => {
      setState((prev) => {
        if (prev.gameOver) return prev;

        const newMaxMana = Math.min(10, prev.maxPlayerMana + 1);
        const newOpponentMaxMana = Math.min(10, prev.maxOpponentMana + 1);

        // Draw a card from player deck
<<<<<<< HEAD
        let playerDeck = [...prev.playerDeck];
        let playerGraveyard = [...prev.playerGraveyard];
=======
        let playerDeck = prev.playerDeck;
        let playerGraveyard = prev.playerGraveyard;
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1

        if (playerDeck.length === 0 && playerGraveyard.length > 0) {
          playerDeck = [...playerGraveyard].sort(() => Math.random() - 0.5);
          playerGraveyard = [];
        }

        const drawnCard = playerDeck[0];
        const playerHand = drawnCard
          ? [...prev.playerHand, drawnCard]
          : prev.playerHand;
        playerDeck = drawnCard ? playerDeck.slice(1) : playerDeck;

<<<<<<< HEAD
        // AI also draws a card
        let opponentDeck = [...prev.opponentDeck];
        let opponentGraveyard = [...prev.opponentGraveyard];

        if (opponentDeck.length === 0 && opponentGraveyard.length > 0) {
          opponentDeck = [...opponentGraveyard].sort(() => Math.random() - 0.5);
          opponentGraveyard = [];
        }

        const aiDrawnCard = opponentDeck[0];
        const opponentHand = aiDrawnCard ? [...prev.opponentHand, aiDrawnCard] : prev.opponentHand;
        opponentDeck = aiDrawnCard ? opponentDeck.slice(1) : opponentDeck;

        // Log card draw
=======
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
        if (drawnCard && user?.wallet?.address) {
          logGameAction(
            {
              type: "card_draw",
              actor: user.wallet.address,
              data: { cardName: drawnCard.name },
            },
            user.wallet.address,
          );
        }

        return {
          ...prev,
          isPlayerTurn: true,
          playerHand,
          playerDeck,
          playerGraveyard,
          opponentHand,
          opponentDeck,
          opponentGraveyard,
          playerMana: newMaxMana,
          maxPlayerMana: newMaxMana,
          opponentMana: newOpponentMaxMana,
          maxOpponentMana: newOpponentMaxMana,
          turnNumber: prev.turnNumber + 1,
          playerField: prev.playerField.map((c) => ({ ...c, canAttack: true })),
<<<<<<< HEAD
          opponentField: prev.opponentField.map((c) => ({ ...c, canAttack: true })),
          lastDamage: null, // Clear damage indicator
        }
      })
    }, 5000) // Wait 5 seconds for all AI attack animations
  }, [user?.wallet?.address])

  const resetGame = useCallback(() => {
    // Try to use drafted cards first, then fallback to user cards
    let cardsToUse: MemeCardData[] = [];

    try {
      const draftedCardsJson = sessionStorage.getItem('draftedCards');
      if (draftedCardsJson) {
        cardsToUse = JSON.parse(draftedCardsJson);
      }
    } catch (e) {
      // Ignore
    }

    if (cardsToUse.length === 0 && userCards.length > 0) {
      cardsToUse = userCards;
    }

    if (cardsToUse.length > 0) {
      gameInitialized.current = false; // Allow re-initialization
      initializeGameWithCards(cardsToUse);
=======
          opponentField: prev.opponentField.map((c) => ({
            ...c,
            canAttack: true,
          })),
        };
      });
    }, 2000);
  }, [user?.wallet?.address]);

  const resetGame = useCallback(async () => {
    // Use drafted cards if we came from a draft, otherwise all user cards
    const playerDeck =
      draftedCardsRef.current && draftedCardsRef.current.length > 0
        ? draftedCardsRef.current
        : userCards;

    // Fetch a fresh AI deck (potentially different collection), excluding player's
    try {
      const excludeParam = playerContracts[0]
        ? `?exclude=${playerContracts[0]}`
        : "";
      const res = await fetch(`/api/ai-deck${excludeParam}`);
      const data = await res.json();
      if (data.cards?.length > 0) {
        setAiCards(data.cards);
        setAiCollectionName(data.collectionName || "");
        if (data.packImage) {
          setAiPackImage(data.packImage);
          localStorage.setItem("gom:aiPackImage", data.packImage);
        }
        if (playerDeck.length > 0) {
          initGameFromCards(playerDeck, data.cards);
          return;
        }
      }
    } catch {
      // Fall through to existing AI cards
>>>>>>> 0a786e0d6eebf726fff98f3bda559b977bfaa3c1
    }
    if (playerDeck.length > 0) {
      initGameFromCards(playerDeck, aiCards.length > 0 ? aiCards : undefined);
    }
  }, [userCards, aiCards, playerContracts, initGameFromCards]);

  const setDifficulty = useCallback((difficulty: Difficulty) => {
    setState((prev) => ({ ...prev, difficulty }));
  }, []);

  return (
    <GameContext.Provider
      value={{
        ...state,
        playCard,
        selectCard,
        selectAttacker,
        attackTarget,
        attackHero,
        endTurn,
        resetGame,
        setDifficulty,
        aiCollectionName,
        playerPackImage,
        aiPackImage,
      }}
    >
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame must be used within a GameProvider");
  return context;
}
