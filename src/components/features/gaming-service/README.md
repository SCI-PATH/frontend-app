# Gaming Service (Farm / DDA)

SCI_PATH farm — Phaser 3 + React (Vite). Runs on port **5173** when started from this folder.

## How integrators run SCI-PATH + farm

1. **gaming-service backend** (`:8002`) — engagement API, Sage, mind maps  
2. **This Vite app** (`:5173`) — farm UI  
3. **frontend-app** (`:3000`) — students sign in and launch the farm from the dashboard  

```bash
# Terminal 1 — API
cd path/to/gaming-service && npm run backend

# Terminal 2 — farm (this folder)
npm install && npm run dev

# Terminal 3 — SCI-PATH platform
cd path/to/frontend-app && npm run dev
```

## Launch from frontend-app

**Game Arena** on the student dashboard opens the farm with:

```
http://localhost:5173/
  ?studentId=<userId>
  &username=<login-handle>
  &displayName=<fullName>
  &sessionId=<platform-session>
  &topicId=<always-set>
  &grade=7
  &source=frontend-app
```

`topicId` is always included: live tutor topic → last saved topic for the student → first curriculum topic for their grade.

Set in Next `.env.local`:

```env
NEXT_PUBLIC_GAMING_SERVICE_URL=http://localhost:5173
```

Params are built in:

- `getGamingLaunchContext.ts` — reads `useUserStore` + `useTutorStore`, resolves `topicId`
- `buildGamingServiceLaunchUrl.ts` — URL builder (always sets `topicId`)
- `GameArenaCard.tsx` — **Launch Game Arena** button

The farm reads them in `src/data/platformLaunch.js` and stores them on the student session (`mockStudents.js`).
