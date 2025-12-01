# Push to GitHub

Your repo is initialized locally. Here's how to push it to GitHub:

## Option 1: GitHub CLI (Easiest)

```bash
cd ~/Desktop/game-of-memes

# Create repo and push (you'll be prompted to authenticate if needed)
gh repo create game-of-memes --public --source=. --push
```

## Option 2: Manual GitHub Setup

1. Go to [github.com/new](https://github.com/new)
2. Create a new repository named `game-of-memes`
3. Don't initialize with README (we already have one)
4. Copy the remote URL, then:

```bash
cd ~/Desktop/game-of-memes

# Add remote
git remote add origin https://github.com/YOUR_USERNAME/game-of-memes.git

# Push
git branch -M main
git push -u origin main
```

## Your First Commit is Ready!

Already committed with message:
> "Initial commit: Game of Memes card game prototype"

Includes:
- Complete Next.js card game
- 8 starter meme cards
- Working gameplay mechanics
- Full documentation

---

## Deploy to Vercel (Free)

```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
cd ~/Desktop/game-of-memes
vercel
```

Or just connect the GitHub repo to Vercel dashboard for auto-deploys!
