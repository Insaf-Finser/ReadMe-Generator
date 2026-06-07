# README Generator

Scan any public GitHub repository and auto-generate a polished README with live preview.

## How it works

1. Paste a GitHub repo URL (e.g. `https://github.com/facebook/react`)
2. The app scans the file tree via the GitHub API
3. It reads key files (`package.json`, `Dockerfile`, `.env.example`, etc.)
4. Detects languages, tech stack, CI, tests, and Docker
5. Generates a complete README you can copy, download, or edit

## Features

- Full repo file tree scan (recursive)
- Tech stack detection from config files and dependencies
- Auto-generated installation & usage commands
- Language breakdown with percentages
- Badges from repo metadata (license, language, stars)
- Live markdown preview with copy & download
- Optional GitHub token for higher API rate limits

## Getting Started

### Prerequisites

- Node.js 18+

### Installation

```bash
npm install
```

### Development

Runs the Vite frontend (port 5173) and Express API (port 3001):

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173).

### Optional: GitHub Token

Without a token, the GitHub API allows 60 requests/hour. For more scans, either:

- Add a token in the UI when scanning, or
- Set `GITHUB_TOKEN` in your environment when starting the server

### Build

```bash
npm run build
npm run preview
```

## Deployment

This app has two parts: a **React frontend** and an **Express API**. In production they run on **one server** — the API serves the built frontend from `dist/`.

### Environment variables (set on your host)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NODE_ENV` | Yes | Set to `production` |
| `PORT` | Auto | Host usually sets this (default `3001`) |
| `OPENAI_API_KEY` | For AI | OpenAI analysis |
| `GROQ_API_KEY` | For AI | Groq analysis (alternative) |
| `GITHUB_TOKEN` | Recommended | Higher GitHub API rate limits |

Never commit `.env` — add these in your hosting dashboard.

### Option 1: Render (recommended, free tier)

1. Push the project to GitHub
2. Go to [render.com](https://render.com) → **New → Web Service**
3. Connect your repo
4. Settings:
   - **Build command:** `npm install && npm run build`
   - **Start command:** `npm run start:prod`
   - **Environment:** add `NODE_ENV=production` and your API keys
5. Deploy

Or use the included `render.yaml` blueprint for one-click setup.

### Option 2: Railway

1. Push to GitHub
2. [railway.app](https://railway.app) → **New Project → Deploy from GitHub**
3. Add environment variables (`NODE_ENV=production`, API keys)
4. Set start command: `npm run start:prod`

### Option 3: VPS (DigitalOcean, AWS EC2, etc.)

```bash
git clone https://github.com/your-user/readme-generator.git
cd readme-generator
npm install
cp .env.example .env   # edit with your keys
export NODE_ENV=production
npm run start:prod
```

Use **PM2** to keep it running:

```bash
npm install -g pm2
NODE_ENV=production pm2 start "npm run start:prod" --name readme-gen
pm2 save
```

Put **Nginx** in front for HTTPS on port 80/443.

### Option 4: Test production locally

```bash
set NODE_ENV=production   # Windows PowerShell: $env:NODE_ENV="production"
npm run start:prod
```

Open [http://localhost:3001](http://localhost:3001) — frontend and API on the same port.

### Not suitable for static-only hosts

**Vercel / Netlify / GitHub Pages** only host static files. This app needs the Node.js API server for repo scanning and AI — use Render, Railway, or a VPS instead.

## License

MIT
