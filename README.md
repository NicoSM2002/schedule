# Drake Construction — Schedule Planner

Interactive construction schedule planner with AI assistant powered by Claude.

## Features

- **Floor-based templates** — 1, 2, or 3 floors auto-generate tasks
- **Interactive Gantt chart** — drag to move, resize to change duration, connect dependencies
- **AI Assistant** — natural language commands (text or voice) to manage the schedule
- **Undo/Redo** — Ctrl+Z / Ctrl+Y with full history
- **Export** — CSV for Buildertrend import, HTML Gantt for visual reference
- **Color-coded phases** — matching Buildertrend categories

## Setup

### 1. Clone the repo

```bash
git clone https://github.com/NicoSM2002/schedule.git
cd schedule
npm install
```

### 2. Configure API Key

Create a `.env` file from the template:

```bash
cp .env.example .env
```

Edit `.env` and add your Anthropic API key:

```
ANTHROPIC_API_KEY=sk-ant-your-key-here
```

Get your key at: https://console.anthropic.com/

### 3. Run locally

```bash
npm start
```

Open http://localhost:3000

## Deploy to Railway (recommended)

1. Go to [railway.app](https://railway.app)
2. Click "New Project" → "Deploy from GitHub repo"
3. Select this repository
4. Add environment variable: `ANTHROPIC_API_KEY` = your key
5. Railway auto-detects Node.js and deploys
6. You get a public URL like `https://schedule-production-xxxx.up.railway.app`

## Deploy to Render

1. Go to [render.com](https://render.com)
2. New → Web Service → Connect this repo
3. Build command: `npm install`
4. Start command: `npm start`
5. Add environment variable: `ANTHROPIC_API_KEY`
6. Deploy

## AI Assistant Commands (examples)

- "Agrega una tarea de Garage Door del 15 al 17 de junio en Exterior"
- "Conecta Drywall con Insulation Install"
- "Elimina las tareas de Solar"
- "Mueve Painting-Interior al 1 de julio"
- "Cambia la duración de Framing a 25 días"
- "¿Cuándo termina el proyecto?"

Works in Spanish and English. Supports voice input (Chrome).

## Tech Stack

- **Frontend**: Vanilla HTML/CSS/JS (no frameworks)
- **Backend**: Node.js + Express
- **AI**: Anthropic Claude API (claude-sonnet-4-20250514)
- **Voice**: Web Speech API
