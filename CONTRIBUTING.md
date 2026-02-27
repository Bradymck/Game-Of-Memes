# Contributing to Game of Memes

Thanks for your interest in contributing! This guide will help you get set up and understand our development workflow.

## Getting Started

### Prerequisites

- Node.js 22+
- npm 10+
- Git

### Development Setup

1. **Fork the repo** on GitHub

2. **Clone your fork:**
   ```bash
   git clone https://github.com/YOUR_USERNAME/Game-Of-Memes.git
   cd Game-Of-Memes
   ```

3. **Install dependencies:**
   ```bash
   npm install
   ```

4. **Set up environment:**
   ```bash
   cp .env.example .env
   ```
   Fill in the required API keys. At minimum you need Supabase and Privy credentials. See the README for details on where to get each key.

5. **Start the dev server:**
   ```bash
   npm run dev
   ```

6. **Run tests:**
   ```bash
   npm test              # Unit tests (Vitest)
   npm run test:e2e      # E2E tests (Playwright)
   ```

## Development Workflow

### Branch Naming

Use descriptive branch names:
- `feat/card-abilities` - New features
- `fix/mana-calculation` - Bug fixes
- `docs/api-reference` - Documentation
- `refactor/game-context` - Code refactoring

### Making Changes

1. Create a branch from `main`:
   ```bash
   git checkout -b feat/your-feature
   ```

2. Make your changes

3. Run the checks:
   ```bash
   npm test              # Unit tests pass
   npm run build         # Build succeeds
   ```

4. Commit with clear messages:
   ```
   feat: add spell card mechanics
   fix: correct damage calculation for armor
   docs: add API route documentation
   ```

5. Push and open a PR against `main`

### Pull Request Guidelines

- Keep PRs focused on a single change
- Include a description of what changed and why
- Add tests for new functionality
- Update documentation if you changed behavior
- Make sure CI passes before requesting review

## Code Style

### TypeScript

- Strict mode is enabled
- Use explicit types for function parameters and return values
- Prefer `interface` over `type` for object shapes
- Use `const` assertions for enum-like objects

### React

- Functional components only
- Use hooks for state and effects
- Components live in `components/`
- Shared hooks live in `hooks/`
- Business logic lives in `lib/`

### Styling

- Tailwind CSS 4 for all styling
- Radix UI primitives for accessible components (in `components/ui/`)
- Use `cn()` utility from `lib/utils.ts` for conditional classes

### File Organization

```
components/
  feature-name.tsx      # Feature component
  ui/                   # Reusable UI primitives
lib/
  feature-name.ts       # Business logic
hooks/
  use-feature.ts        # Custom hooks
app/api/
  route-name/route.ts   # API routes
```

## Testing

- **Unit tests:** Vitest with jsdom environment
- **E2E tests:** Playwright
- Tests go next to the code they test or in `e2e/` for end-to-end
- Aim for meaningful coverage of game logic and API routes

## Web3 Development

- Auth is wallet-based via Privy (no passwords, no OAuth)
- NFT data comes from VibeMarket's Wield API
- Chain interactions use viem + wagmi on Base mainnet
- Server-side secrets (API keys) must never have `NEXT_PUBLIC_` prefix

## Getting Help

- Open a [Discussion](https://github.com/Bradymck/Game-Of-Memes/discussions) for questions
- Check existing [Issues](https://github.com/Bradymck/Game-Of-Memes/issues) before filing new ones
- Tag issues with appropriate labels

## License

By contributing, you agree that your contributions will be licensed under the [MIT License](LICENSE).
