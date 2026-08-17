# SCI-PATH

**SCI-PATH** (System for Science Pathways) — research frontend for adaptive middle-school science learning (grades 6–9).

## Instructions for Developers

This document is the onboarding source of truth for **developers** joining the frontend. Follow the folder rules below so authentication (login/logout) and feature work can start immediately without merge-conflict chaos.

---

## Quick Start for Developers

```bash
git clone <repo-url>
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). The root page is a temporary stack-verification screen only (Phase 2 replaces it).

Other scripts:

```bash
npm run build    # production build
npm run start    # serve production build
npm run lint     # ESLint
```

---

## Tech Stack

| Layer | Choice | Role |
| --- | --- | --- |
| Framework | **Next.js** (App Router) | Routing, layouts, RSC, and page composition under `src/app/` |
| Styling | **Tailwind CSS** | Utility-first styling; theme tokens live in `src/app/globals.css` |
| UI primitives | **shadcn/ui** + **Radix UI** | Pre-installed under `src/components/ui/` |
| Icons | **lucide-react** | Consistent icon set used by shadcn and feature UI |
| State | **Zustand** | Client global state under `src/store/` (auth uses `useUserStore.ts`) |
| Language | **TypeScript** | Shared contracts under `src/types/` |

Path alias: `@/*` maps to `./src/*` (see `tsconfig.json`).

**Do not re-install** the standard shadcn primitives already in `src/components/ui/` (button, card, input, dialog, dropdown-menu, tabs, avatar, sheet, badge). Import them directly. Only run the CLI for components that are not already present:

```bash
npx shadcn@latest add <component>
```

---

## Architecture & Folder Structure Guide (MUST READ)

### Strict separation of concerns

| Area | Responsibility | Rule for developers |
| --- | --- | --- |
| **`src/app/`** | Reserved **strictly** for Next.js App Router endpoints, route groups `(auth)`, `(student)`, `(educator)`, and page layouts | Keep route files **light**. Compose UI from `components/`; do not dump domain logic into `page.tsx` / `layout.tsx`. |
| **`src/components/ui/`** | Pre-installed shadcn/Radix primitives (Button, Card, Input, Dialog, …) | Import and compose. **Do not re-install via CLI.** Do not add product business logic here. |
| **`src/components/common/`** | Shared app-wide components (Navbar, Sidebar, Footer, wrappers) | Cross-role chrome only — not feature-specific screens. |
| **`src/components/features/`** | Dedicated domain modules mapped to our 4 backend repos | **Developers must write their component code inside their assigned feature folder** to avoid merge conflicts. |

```text
src/
├── app/                         # ROUTING ONLY — endpoints, route groups, layouts
│   ├── (auth)/                  # Login / logout / register (auth developer)
│   ├── (student)/               # Student dashboard & learning viewport
│   ├── (educator)/              # Educator / teacher matrix dashboard
│   ├── layout.tsx
│   ├── page.tsx                 # Temporary verification landing (Phase 2 replaces this)
│   └── globals.css
├── components/
│   ├── ui/                      # Pre-installed shadcn primitives (do not re-install)
│   ├── common/                  # Navbar, Sidebar, Footer, shared wrappers
│   └── features/                # 4 core modules — put YOUR work here only
│       ├── assessment-engine/   # Intelligent Assessment & Question Bank
│       ├── gaming-service/      # Gamification & Dynamic Difficulty Adjustment
│       ├── learner-analytics/   # Student Profiling & Knowledge Tracing
│       └── learning-path-engine/# Curriculum Sequencing & Adaptive Pathways
├── store/                       # Zustand — empty useUserStore.ts for auth state
├── types/                       # Shared TypeScript / JSON payload contracts
└── lib/                         # Utilities (e.g. cn())
```

### Authentication entry points

Developers implementing **login/logout** should:

1. Add auth routes under `src/app/(auth)/` (e.g. `login/page.tsx`).
2. Implement auth UI in `src/components/common/` only when it is truly app-wide (e.g. a shared login form shell); keep route files thin.
3. Put session/user client state in `src/store/useUserStore.ts` (currently an **empty placeholder** — implement there; do not invent temporary test stores elsewhere).

### Four core feature folders (backend-aligned)

Developers **must** implement UI for their service only inside the matching folder:

| Folder | Backend domain |
| --- | --- |
| `features/assessment-engine/` | Intelligent Assessment & Question Bank |
| `features/gaming-service/` | Gamification & Dynamic Difficulty Adjustment |
| `features/learner-analytics/` | Student Profiling & Knowledge Tracing |
| `features/learning-path-engine/` | Curriculum Sequencing & Adaptive Pathways |

Do **not** create overlapping feature folders. Shared shells belong in `common/`; primitives belong in `ui/`.

### `store/` and `types/`

- **`store/`** — client global state. `useUserStore.ts` is reserved for authentication/session state.
- **`types/`** — shared interfaces for API/WebSocket JSON payloads. Export from `types/index.ts`.

---

## Route Groups (Role-Based Access)

Next.js [route groups](https://nextjs.org/docs/app/building-your-application/routing/route-groups) use parentheses `(name)` so folders organize routes **without** appearing in the URL.

| Group | Intended routes | Purpose |
| --- | --- | --- |
| `(auth)` | e.g. `/login`, `/register` | Unauthenticated entry; login/logout flows |
| `(student)` | e.g. `/dashboard`, learning session routes | Student experience |
| `(educator)` | e.g. teacher matrix / classroom overview | Educator dashboards |

1. Add a `layout.tsx` inside each group for role-specific shell (nav, guards, viewport).
2. Add `page.tsx` files for concrete URLs (the group name is omitted from the path).
3. Keep route files thin; import feature UI from `components/features/<module>/`.

Example:

```text
src/app/(auth)/login/page.tsx          → URL: /login
src/app/(auth)/register/page.tsx       → URL: /register
src/app/(student)/tutor/page.tsx       → URL: /tutor
src/app/(educator)/matrix/page.tsx     → URL: /matrix
```

---

## Conventions for Developers

1. Prefer Server Components by default; add `"use client"` only for interactivity, Zustand, or browser APIs.
2. Import UI with `@/components/ui/...`, shared chrome with `@/components/common/...`, domain UI with `@/components/features/<module>/...`.
3. Do not hand-edit large blocks inside `components/ui/` unless aligning with an upstream shadcn change.
4. Keep payload shapes in `src/types`; keep auth/session client state in `src/store/useUserStore.ts`.

---

## 🎨 Design System & Color Palette

Brand colors live in `tailwind.config.ts` (`theme.extend.colors`) and are mirrored as Tailwind v4 `@theme` tokens in `src/app/globals.css`. Prefer semantic class names over hard-coded hex values.

| Token | Hex | Use |
| --- | --- | --- |
| `brand-primary` | `#00A8E8` | Focus Cyan — primary actions, navigation, and key CTAs |
| `brand-secondary` | `#70E000` | Growth Lime — success, mastery, progress, and positive reinforcement |
| `brand-accent` | `#FF6B35` | Confidence Orange — urgency, streaks, and secondary highlights |
| `brand-special` | `#7209B7` | Creative Purple — gamification, XP, and premium/special rewards |
| `brand-text` | `#212529` | Ink Charcoal — headings and body copy (high contrast, not pure black) |
| `brand-surface` | `#E9ECEF` | Soft Slate — component backgrounds, borders, and subtle dividers |
| `brand-background` | `#F8F9FA` | Calm Off-White — main page / canvas background for long study sessions |

**Tailwind usage:** apply tokens with standard color utilities, e.g. `className="bg-brand-background text-brand-text"`, `className="bg-brand-primary text-white"`, or `className="border-brand-surface text-brand-accent"`. Opacity modifiers work as usual (`bg-brand-primary/10`, `text-brand-text/70`).
