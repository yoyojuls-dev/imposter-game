# 🕵️ Imposter Party Game

A real-time multiplayer party game where players try to identify the imposter among them.

## Features
- **Single Device Mode** – Pass one phone/computer around; each player taps to reveal their card
- **Multiplayer Mode** – Everyone uses their own device via room codes
- **AI-Generated Words** – Uses Claude AI to generate unique words and hints per topic
- **Difficulty Levels** – Easy, Medium, Hard hint difficulty for the imposter
- **8 Topics** – Fruits, Animals, Countries, Sports, Food, Movies, Technology, Music

## Quick Start

```bash
# Install dependencies
npm install

# Start the game
npm run dev
```

Then open **http://localhost:3000** in your browser.

## AI Setup (Optional)

The game works without an API key using built-in fallback words. To enable AI-generated words:

1. Get your API key from https://console.anthropic.com
2. Create `server/.env` (copy from `server/.env.example`)
3. Add: `ANTHROPIC_API_KEY=your_key_here`
4. Restart with `npm run dev`

## How to Play

1. Choose **Single Device** or **Multiplayer**
2. Enter player names and select a topic
3. Each player secretly views their card (word or hint)
4. Discuss and try to find the imposter through conversation
5. Vote and reveal!

## Tech Stack
- **Frontend**: React + TypeScript + Vite
- **Backend**: Node.js + Express + TypeScript
- **Real-time**: Socket.io
- **AI**: Anthropic Claude (claude-haiku)
