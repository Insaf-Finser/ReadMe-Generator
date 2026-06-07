# ReadMe-Generator

> Scan any public GitHub repository and auto-generate a polished README with live preview.

![TypeScript](https://img.shields.io/github/languages/top/Insaf-Finser/ReadMe-Generator?color=%233178C6) ![Stars](https://img.shields.io/github/stars/Insaf-Finser/ReadMe-Generator?style=social)

## Table of Contents

- [Aim](#aim)
- [Description](#description)
- [Problem Statement](#problem-statement)
- [Target Audience](#target-audience)
- [Features](#features)
- [Demo](#demo)
- [Technology Stack](#technology-stack)
- [Key Routes](#key-routes)
- [AI Models](#ai-models)
- [Firebase](#firebase)
- [Medical Disclaimer](#medical-disclaimer)
- [How it works](#how-it-works)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Usage](#usage)
- [Testing](#testing)
- [Deployment](#deployment)
- [Project Structure](#project-structure)
- [Contributing](#contributing)
- [License](#license)
- [Author](#author)

## Aim

This project aims to simplify the process of creating high-quality README files by scanning a GitHub repository and generating a complete README. It detects languages, tech stack, CI, tests, and Docker, and provides features like full repo file tree scan, tech stack detection, auto-generated installation & usage commands, language breakdown with percentages, badges from repo metadata, and live markdown preview with copy & download.


## Description

Scan any public GitHub repository and auto-generate a polished README with live preview.

1. Paste a GitHub repo URL (e.g. `https://github.com/facebook/react`) 2. The app scans the file tree via the GitHub API 3. It reads key files (`package.json`, `Dockerfile`, `.env.example`, etc.) 4. Detects languages, tech stack, CI, tests, and Docker 5. Generates a complete README you can copy, download, or edit

The repository contains **34** tracked files organized into top-level areas such as `public`, `scripts`, `server`, `src`. The codebase is primarily written in TypeScript (85%), CSS (14%), HTML (1%).

A live demo or project homepage is available at [https://read-me-generator-lovat.vercel.app](https://read-me-generator-lovat.vercel.app).

The project has garnered **0** stars and welcomes community participation through issues and pull requests.


## Problem Statement

Teams frequently struggle with boilerplate when standing up APIs, managing configuration, and keeping services consistent across environments. ReadMe-Generator addresses these challenges by offering a cohesive stack centered on Node.js, React, Express, and practical defaults derived from the repository structure. By standardizing how the project is set up, tested, and extended, it reduces friction for both new contributors and downstream users.


## Target Audience

This project is intended for:

- **Frontend developers building interactive user interfaces**
- **Backend engineers designing APIs and server-side logic**
- **JavaScript/TypeScript developers**

Whether you want to use ReadMe-Generator directly, study its architecture, or contribute improvements, the repository is structured to support gradual onboarding.


## Features

### Features
- Full repo file tree scan (recursive)
- Tech stack detection from config files and dependencies
- Auto-generated installation & usage commands
- Language breakdown with percentages
- Badges from repo metadata (license, language, stars)
- Live markdown preview with copy & download
- Optional GitHub token for higher API rate limits
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


## Demo

[Live Demo](https://read-me-generator-lovat.vercel.app)

## Technology Stack

| Technology | Version |
|----------|---------|
| Node.js | 18+ |
| React | 18.3.1 |
| Express | 4.21.2 |
| TypeScript | ~5.6.2 |
| Vite | 6.0.3 |


## Key Routes

| Route | Method | Description |
|----------|--------|-------------|
| /api/scan | POST | Scan a repository and generate a README |
| /api/preview | GET | Preview the generated README |


## AI Models

The README Generator uses OpenAI and Groq for AI analysis.


## Firebase

Not applicable


## Medical Disclaimer

Not applicable


## How it works

1. Paste a GitHub repo URL (e.g. `https://github.com/facebook/react`)
2. The app scans the file tree via the GitHub API
3. It reads key files (`package.json`, `Dockerfile`, `.env.example`, etc.)
4. Detects languages, tech stack, CI, tests, and Docker
5. Generates a complete README you can copy, download, or edit


## Architecture

ReadMe-Generator follows a modular layout that separates concerns across directories and configuration files. This makes it easier to navigate, test, and extend individual parts of the system without affecting unrelated code.

**Directory overview:**

- `public/` — Static assets served to clients
- `scripts/` — Build, deployment, and utility scripts
- `server/` — Backend server code and middleware
- `src/` — Core application source code and business logic

**Key configuration:**

- `package.json` — Node.js dependencies and scripts
- `tsconfig.json` — TypeScript compiler options

The architecture is built on **Node.js, React, Express, TypeScript, Vite, CSS, HTML, JavaScript**, chosen to balance developer productivity, performance, and ecosystem support.


## Getting Started

### Prerequisites

Node.js 18+

### Installation

```bash
npm install
```

### Environment

Create a `.env` file:

```env
NODE_ENV=production
PORT=3001
OPENAI_API_KEY=
GROQ_API_KEY=
GITHUB_TOKEN=
```

## Usage

### Getting Started
1. Paste a GitHub repo URL (e.g. `https://github.com/facebook/react`)
2. The app scans the file tree via the GitHub API
3. It reads key files (`package.json`, `Dockerfile`, `.env.example`, etc.)
4. Detects languages, tech stack, CI, tests, and Docker
5. Generates a complete README you can copy, download, or edit
### Optional: GitHub Token
Without a token, the GitHub API allows 60 requests/hour. For more scans, either:
- Add a token in the UI when scanning, or
- Set `GITHUB_TOKEN` in your environment when starting the server


## Testing

No dedicated test directory was detected in the repository scan. Consider adding tests to improve reliability and contributor confidence.


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


## Project Structure

```text
README.md
index.html
package-lock.json
package.json
public/favicon.svg
render.yaml
scripts/free-port.mjs
server/aiAnalyzer.ts
server/analyzeRepo.ts
server/generateDetailedContent.ts
server/github.ts
server/index.ts
server/normalizeReadme.ts
server/parseExistingReadme.ts
server/parseRepoUrl.ts
src/App.tsx
src/api.ts
src/components/FormField.tsx
src/components/ListEditor.tsx
src/components/LoadingSteps.tsx
src/components/PreviewPanel.tsx
src/components/ReadmeForm.tsx
src/components/RepoScanner.tsx
src/components/ScanSummary.tsx
src/generateMarkdown.ts
src/index.css
src/main.tsx
src/types.ts
src/utils/text.ts
src/vite-env.d.ts
tsconfig.json
tsconfig.server.json
tsconfig.tsbuildinfo
vite.config.ts
```


## Contributing

Contributions to **ReadMe-Generator** are welcome and appreciated. Whether you are fixing a bug, improving documentation, or proposing a new feature, your help makes the project better for everyone.

### How to contribute

1. **Fork** the repository on GitHub
2. **Clone** your fork: `git clone https://github.com/YOUR_USERNAME/ReadMe-Generator.git`
3. **Create a branch** for your changes: `git checkout -b feature/your-feature-name`
4. **Make your changes** and add tests if applicable
5. **Commit** with a clear message describing what you changed
6. **Push** to your fork and open a **Pull Request** against [`Insaf-Finser/ReadMe-Generator`](https://github.com/Insaf-Finser/ReadMe-Generator)

### Reporting issues

If you encounter a bug or have a feature request, please [open an issue](https://github.com/Insaf-Finser/ReadMe-Generator/issues) with a clear description, steps to reproduce (if applicable), and your environment details.


## License

This project is licensed under the **MIT** License. See the [LICENSE](LICENSE) file for full details.


## Author

**Insaf-Finser**

- [GitHub](https://github.com/Insaf-Finser)
