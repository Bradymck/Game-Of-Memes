# AI Integration Instructions

## Status
- ✅ Created `lib/ai.ts` with complete AI decision logic
- ⏸️ Waiting for permission to edit `app/page.tsx`

## What Was Built

### lib/ai.ts
Complete AI module with:
- `chooseBestCardToPlay()` - Selects highest cost playable card
- `chooseBestAttackTarget()` - Evaluates trades and decides targets
- `plan AITurn()` - Generates complete turn action sequence
- Trade evaluation system with favorable/unfavorable scoring

## What Needs to Be Added to app/page.tsx

### 1. Add Imports (Line 3)
```typescript
import { useState, useEffect, useRef } from 'react'; // Add useRef
import { planAITurn, AIAction } from '@/lib/ai'; // Add this line
```

### 2. Add AI State (after line 37)
```typescript
const [isAIThinking, setIsAIThinking] = useState(false);
const aiTimeoutRef = useRef<NodeJS.Timeout | null>(null);
```

### 3. Add AI Execution Function (after handleEndTurn, around line 216)
```typescript
const executeAIAction = (action: AIAction) => {
  switch (action.type) {
    case 'PLAY_CARD':
      if (action.cardId) {
        handlePlayCard(action.cardId);
      }
      break;
    case 'ATTACK_MINION':
      if (action.cardId && action.targetId) {
        setAttackState({ attackerId: action.cardId, mode: 'selecting_target' });
        // Small delay to show selection
        setTimeout(() => {
          handleAttackMinion(action.targetId!);
        }, 300);
      }
      break;
    case 'ATTACK_HERO':
      if (action.cardId) {
        setAttackState({ attackerId: action.cardId, mode: 'selecting_target' });
        setTimeout(() => {
          handleAttackHero();
        }, 300);
      }
      break;
    case 'END_TURN':
      setTimeout(() => {
        handleEndTurn();
        setIsAIThinking(false);
      }, 500);
      break;
  }
};
```

### 4. Add AI Turn useEffect (after mount useEffect, around line 50)
```typescript
// AI Turn Logic
useEffect(() => {
  if (!gameState || gameState.winner || gameState.turn !== 'player2' || isAIThinking) {
    return;
  }

  // Start AI turn after brief delay
  setIsAIThinking(true);

  aiTimeoutRef.current = setTimeout(() => {
    const aiActions = planAITurn(gameState.player2, gameState.player1);

    // Execute actions sequentially with delays
    let delay = 0;
    aiActions.forEach((action, index) => {
      setTimeout(() => {
        executeAIAction(action);
      }, delay);

      // Add delay between actions for visual feedback
      if (action.type === 'PLAY_CARD') delay += 800;
      else if (action.type === 'ATTACK_MINION' || action.type === 'ATTACK_HERO') delay += 1000;
      else if (action.type === 'END_TURN') delay += 500;
    });
  }, 1000); // Initial thinking delay

  return () => {
    if (aiTimeoutRef.current) {
      clearTimeout(aiTimeoutRef.current);
    }
  };
}, [gameState?.turn, gameState?.winner, isAIThinking]);
```

### 5. Update Turn Indicator (line 311, optional enhancement)
```typescript
{gameState.turn === 'player1' ? '👤 Your Turn' : '🤖 AI Thinking...'}
```

## Testing Checklist

After integration:
1. Run `npm run build` - should compile without errors
2. Run `npm run dev`
3. Play a game:
   - Play cards
   - End turn
   - Watch AI play cards automatically
   - Watch AI attack with minions
   - Verify AI ends turn automatically
4. Check for console errors
5. Verify game flows smoothly with delays

## Expected Behavior

- Player1 plays normally
- When player1 ends turn:
  - Brief pause (1 second)
  - AI plays highest cost cards it can afford
  - AI attacks with all available minions
  - AI makes smart trades (kills without dying preferred)
  - AI goes face when no good trades
  - AI automatically ends turn
- Player regains control

