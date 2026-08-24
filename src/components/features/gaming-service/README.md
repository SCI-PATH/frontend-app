# Gaming Service (Farm / DDA)

SCI_PATH farm — Phaser 3 + React (Vite). **Dev server:** `gaming-service/frontend` on port **5173**.

## Launch from Next.js dashboard

**Game Arena** on the student dashboard opens the farm with query params.

Backend API (`/api/storyline`, `/api/avatar-chat`, …) is proxied to `GAMING_API_PROXY_TARGET` (local `:8002` or EC2).

```env
NEXT_PUBLIC_GAMING_SERVICE_URL=http://localhost:5173
GAMING_API_PROXY_TARGET=http://127.0.0.1:8002
```

## Run farm locally

```bash
cd path/to/gaming-service/frontend
npm install
npm run dev
```

Then run Next.js (`npm run dev` in this repo) and sign in as a student → **Launch Game Arena**.
