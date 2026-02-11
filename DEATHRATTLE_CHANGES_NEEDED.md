# Deathrattle Integration - Required Changes to app/page.tsx

## Change 1: Update Import (Line 10)
**FROM:**
```typescript
import { executeBattlecry, EffectResult } from '@/lib/effects';
```

**TO:**
```typescript
import { executeBattlecry, executeDeathrattle, EffectResult } from '@/lib/effects';
```

---

## Change 2: AI Battlecry Cleanup (Lines 137-145)
**FROM:**
```typescript
                // Remove dead minions after battlecry damage
                opponentPlayer.board = opponentPlayer.board.filter(minion => {
                  if (minion.currentHealth <= 0) {
                    opponentPlayer.graveyard.push(minion);
                    return false;
                  }
                  return true;
                });
```

**TO:**
```typescript
                // Remove dead minions after battlecry damage
                opponentPlayer.board = opponentPlayer.board.filter(minion => {
                  if (minion.currentHealth <= 0) {
                    // Execute deathrattle before moving to graveyard
                    if (minion.effect === 'deathrattle') {
                      const deathrattleResult = executeDeathrattle(minion, opponentPlayer, newPlayer);
                      if (deathrattleResult.success && deathrattleResult.message) {
                        setEffectNotification({
                          id: `effect-${Date.now()}`,
                          message: deathrattleResult.message,
                          type: 'deathrattle',
                        });
                      }
                    }
                    opponentPlayer.graveyard.push(minion);
                    return false;
                  }
                  return true;
                });
```

---

## Change 3: AI Combat Cleanup (Lines 166-167)
**FROM:**
```typescript
              newState.player2.board = newState.player2.board.filter(c => c.currentHealth > 0);
              newState.player1.board = newState.player1.board.filter(c => c.currentHealth > 0);
```

**TO:**
```typescript
              // Process deathrattles for AI minions that died
              newState.player2.board.forEach(minion => {
                if (minion.currentHealth <= 0 && minion.effect === 'deathrattle') {
                  const result = executeDeathrattle(minion, newState.player2, newState.player1);
                  if (result.success && result.message) {
                    setEffectNotification({
                      id: `effect-${Date.now()}-${minion.id}`,
                      message: result.message,
                      type: 'deathrattle',
                    });
                  }
                }
              });

              // Process deathrattles for player minions that died
              newState.player1.board.forEach(minion => {
                if (minion.currentHealth <= 0 && minion.effect === 'deathrattle') {
                  const result = executeDeathrattle(minion, newState.player1, newState.player2);
                  if (result.success && result.message) {
                    setEffectNotification({
                      id: `effect-${Date.now()}-${minion.id}`,
                      message: result.message,
                      type: 'deathrattle',
                    });
                  }
                }
              });

              // Remove dead minions
              newState.player2.board = newState.player2.board.filter(c => {
                if (c.currentHealth <= 0) {
                  newState.player2.graveyard.push(c);
                  return false;
                }
                return true;
              });
              newState.player1.board = newState.player1.board.filter(c => {
                if (c.currentHealth <= 0) {
                  newState.player1.graveyard.push(c);
                  return false;
                }
                return true;
              });
```

---

## Change 4: Player Battlecry Cleanup (Lines 298-306)
**FROM:**
```typescript
        // Remove dead minions after battlecry damage
        opponentPlayer.board = opponentPlayer.board.filter(minion => {
          if (minion.currentHealth <= 0) {
            opponentPlayer.graveyard.push(minion);
            return false;
          }
          return true;
        });
```

**TO:**
```typescript
        // Remove dead minions after battlecry damage
        opponentPlayer.board = opponentPlayer.board.filter(minion => {
          if (minion.currentHealth <= 0) {
            // Execute deathrattle before moving to graveyard
            if (minion.effect === 'deathrattle') {
              const deathrattleResult = executeDeathrattle(minion, opponentPlayer, newPlayer);
              if (deathrattleResult.success && deathrattleResult.message) {
                setEffectNotification({
                  id: `effect-${Date.now()}`,
                  message: deathrattleResult.message,
                  type: 'deathrattle',
                });
              }
            }
            opponentPlayer.graveyard.push(minion);
            return false;
          }
          return true;
        });
```

---

## Change 5: Player Combat Cleanup (Lines 348-363)
**FROM:**
```typescript
      // Remove dead minions
      attackingPlayer.board = attackingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          attackingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });

      defendingPlayer.board = defendingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          defendingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });
```

**TO:**
```typescript
      // Process deathrattles and remove dead minions
      attackingPlayer.board = attackingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          // Execute deathrattle before moving to graveyard
          if (c.effect === 'deathrattle') {
            const result = executeDeathrattle(c, attackingPlayer, defendingPlayer);
            if (result.success && result.message) {
              setEffectNotification({
                id: `effect-${Date.now()}-${c.id}`,
                message: result.message,
                type: 'deathrattle',
              });
            }
          }
          attackingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });

      defendingPlayer.board = defendingPlayer.board.filter(c => {
        if (c.currentHealth <= 0) {
          // Execute deathrattle before moving to graveyard
          if (c.effect === 'deathrattle') {
            const result = executeDeathrattle(c, defendingPlayer, attackingPlayer);
            if (result.success && result.message) {
              setEffectNotification({
                id: `effect-${Date.now()}-${c.id}`,
                message: result.message,
                type: 'deathrattle',
              });
            }
          }
          defendingPlayer.graveyard.push(c);
          return false;
        }
        return true;
      });
```

---

## Change 6: Update Effect Notification UI (Lines 535-543)
**FROM:**
```typescript
            <div className="bg-purple-600 text-white px-6 py-3 rounded-lg shadow-2xl border-2 border-purple-400">
              <div className="flex items-center gap-2">
                <span className="text-2xl">⚡</span>
                <div>
                  <div className="font-bold">Battlecry!</div>
                  <div className="text-sm opacity-90">{effectNotification.message}</div>
                </div>
              </div>
            </div>
```

**TO:**
```typescript
            <div className={`${
              effectNotification.type === 'battlecry'
                ? 'bg-purple-600 border-purple-400'
                : 'bg-orange-600 border-orange-400'
            } text-white px-6 py-3 rounded-lg shadow-2xl border-2`}>
              <div className="flex items-center gap-2">
                <span className="text-2xl">
                  {effectNotification.type === 'battlecry' ? '⚡' : '💀'}
                </span>
                <div>
                  <div className="font-bold">
                    {effectNotification.type === 'battlecry' ? 'Battlecry!' : 'Deathrattle!'}
                  </div>
                  <div className="text-sm opacity-90">{effectNotification.message}</div>
                </div>
              </div>
            </div>
```

---

## Change 7: Update Instructions Tip (Lines 747-749)
**FROM:**
```typescript
        <div className="text-xs text-gray-500">
          Tip: Cards with ⚡ Battlecry trigger special effects when played!
        </div>
```

**TO:**
```typescript
        <div className="text-xs text-gray-500">
          Tip: Cards with ⚡ Battlecry trigger when played. Cards with 💀 Deathrattle trigger when they die!
        </div>
```

---

## Summary
- **7 changes** total
- **~95 lines** added/modified
- Deathrattle executes in 4 combat/death locations
- Visual feedback updated (orange 💀 vs purple ⚡)
- User instructions updated

## Apply these changes manually or use sed/awk/patch to apply them programmatically
