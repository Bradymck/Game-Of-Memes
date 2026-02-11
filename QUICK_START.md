# Quick Start - Implementing Game Features

Ralph has created all the code and documentation. Here's how to apply the changes:

## Option 1: Run the Implementation Script (FASTEST)

```bash
cd /Users/bradymckenna/Documents/game-of-memes
chmod +x implement-charge.sh
./implement-charge.sh
```

This will:
1. Backup app/page.tsx
2. Add Charge effect support
3. Run `npm run build` to verify
4. Tell you if it worked

## Option 2: Manual Implementation

If the script doesn't work, follow these guides in order:

### 1. Charge Effect (7 minutes)
```bash
cat docs/generated/CHARGE_EFFECT_IMPLEMENTATION.md
```
- Edit `app/page.tsx` line 74-80
- Add 3 lines of code
- Test with `npm run build && npm run dev`

### 2. Board Limit (8 minutes)
```bash
cat docs/generated/BOARD_LIMIT_IMPLEMENTATION.md
```
- Edit `app/page.tsx` lines 67 and 419
- Add 2 lines of code

### 3. Hand Limit (18 minutes)
```bash
cat docs/generated/HAND_LIMIT_IMPLEMENTATION.md
```
- Edit `app/page.tsx` multiple locations
- Add ~15 lines of code

### 4. AI Opponent (10 minutes)
```bash
cat docs/generated/AI_INTEGRATION_INSTRUCTIONS.md
```
- Edit `app/page.tsx` 4 locations
- Add ~60 lines of code
- AI module already complete at `lib/ai.ts`

### 5. Taunt Effect (25 minutes)
```bash
cat docs/generated/TAUNT_EFFECT_IMPLEMENTATION.md
```
- Edit `app/page.tsx`, `components/Card.tsx`, `lib/cards.ts`
- Add ~18 lines of code

## Testing

After each implementation:
```bash
npm run build    # Must pass
npm run dev      # Test in browser at localhost:3000
```

## What Ralph Created

- ✅ `lib/ai.ts` (172 lines) - Complete AI logic
- ✅ 7 implementation guides (docs/generated/)
- ✅ `implement-charge.sh` - Auto-implementation script
- ✅ All features designed and ready

**Total implementation time**: ~68 minutes following the guides

## Current Status

Build is passing:
```bash
npm run build  # ✅ No errors
```

Ralph is blocked on file write permissions but all design work is complete.

## Questions?

Read the master guide:
```bash
cat docs/generated/IMPLEMENTATION_SUMMARY.md
```

## Fix Ralph Permissions (Optional - for future)

Edit `.claude/settings.local.json` and add:
```json
"Write",
"Edit",
"Bash(git:*)",
"Read"
```

Then Ralph can implement autonomously.
