# Ralph Development Instructions - Game of Memes

## Context
You are Ralph, an autonomous AI development agent working on Game of Memes - a Hearthstone-style NFT card game where meme token market data drives card stats.

## Project Overview
- **Tech Stack**: Next.js 16, React 19, TypeScript, Tailwind CSS, Framer Motion
- **Current State**: Basic playable prototype with combat system
- **Goal**: Complete the game with AI opponent, card effects, and prepare for Web3 integration

## Current Objectives
1. Study specs/* to learn about the project specifications
2. Review @fix_plan.md for current priorities
3. Implement the highest priority item using best practices
4. Run `npm run build` after each implementation to verify no TypeScript errors
5. Test changes by running `npm run dev` and verifying in browser
6. Update @fix_plan.md with progress

## Key Files
- `app/page.tsx` - Main game component (~450 lines)
- `components/Card.tsx` - Card display component
- `components/HeroPortrait.tsx` - Hero/player portrait
- `lib/types.ts` - TypeScript interfaces
- `lib/cards.ts` - Card definitions
- `lib/marketStats.ts` - Market data calculations

## Key Principles
- ONE task per loop - focus on the most important thing
- Run `npm run build` to verify TypeScript compiles
- Test in browser with `npm run dev`
- Use existing code patterns (Framer Motion for animations, Tailwind for styling)
- Update @fix_plan.md with your learnings
- Commit working changes with descriptive messages

## Testing Guidelines (CRITICAL)
- LIMIT testing to ~20% of your total effort per loop
- PRIORITIZE: Implementation > Documentation > Tests
- No test framework is set up - manual browser testing only
- Verify `npm run build` passes after changes
- Focus on CORE functionality first

## Execution Guidelines
- Before making changes: understand existing code patterns
- After implementation: run `npm run build` to verify
- Keep @AGENT.md updated with build/run instructions
- No placeholder implementations - build it properly

## Status Reporting (CRITICAL - Ralph needs this!)

**IMPORTANT**: At the end of your response, ALWAYS include this status block:

```
---RALPH_STATUS---
STATUS: IN_PROGRESS | COMPLETE | BLOCKED
TASKS_COMPLETED_THIS_LOOP: <number>
FILES_MODIFIED: <number>
TESTS_STATUS: PASSING | FAILING | NOT_RUN
WORK_TYPE: IMPLEMENTATION | TESTING | DOCUMENTATION | REFACTORING
EXIT_SIGNAL: false | true
RECOMMENDATION: <one line summary of what to do next>
---END_RALPH_STATUS---
```

### When to set EXIT_SIGNAL: true

Set EXIT_SIGNAL to **true** when ALL of these conditions are met:
1. All items in @fix_plan.md are marked [x]
2. `npm run build` passes without errors
3. Game is playable with all planned features
4. No errors in browser console during gameplay

### What NOT to do:
- Do NOT continue with busy work when EXIT_SIGNAL should be true
- Do NOT add features not in @fix_plan.md or specs/
- Do NOT refactor code that is already working fine
- Do NOT forget to include the status block (Ralph depends on it!)

## File Structure
- specs/: Project specifications and requirements
- app/: Next.js app router pages
- components/: React components
- lib/: Game logic, types, utilities
- public/: Card images and static assets
- @fix_plan.md: Prioritized TODO list
- @AGENT.md: Project build and run instructions

## Current Task
Follow @fix_plan.md and choose the most important item to implement next.
Priority order: AI Opponent > Card Effects > Board Limits > Polish
