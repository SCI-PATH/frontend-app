# SCI-PATH Frontend Routes

This document lists the App Router URLs exposed by the frontend. Route group folders such as `(auth)`, `(student)`, and `(educator)` organize code but **do not** appear in the URL.

For architecture conventions, see [DEVELOPER_README.md](./DEVELOPER_README.md).

---

## Page routes

| URL | Route group | Page file | Purpose |
| --- | --- | --- | --- |
| `/` | — | `src/app/page.tsx` | Temporary landing / stack verification screen (Phase 2 will replace this). |
| `/login` | `(auth)` | `src/app/(auth)/login/page.tsx` | User login. Renders `LoginForm` from `components/common/auth/`. |
| `/register` | `(auth)` | `src/app/(auth)/register/page.tsx` | New account registration (student or educator). Renders `SignupForm` from `components/common/auth/`. |
| `/tutor` | `(student)` | `src/app/(student)/tutor/page.tsx` | Student Socratic tutor chat. Renders `SocraticChatView` from `components/features/learner-analytics/`. |
| `/matrix` | `(educator)` | `src/app/(educator)/matrix/page.tsx` | Educator insight dashboard (mastery matrix, at-risk feed, student deep-dive). Renders `EducatorDashboardView` from `components/features/learner-analytics/`. |

### Layout shells

| Route group | Layout file | Role |
| --- | --- | --- |
| `(auth)` | `src/app/(auth)/layout.tsx` | Shared auth card wrapper (`AuthCardWrapper`). |
| `(student)` | `src/app/(student)/layout.tsx` | Student experience shell. |
| `(educator)` | `src/app/(educator)/layout.tsx` | Educator dashboard shell. |
| Root | `src/app/layout.tsx` | Global HTML shell, fonts, and styles. |

---

## API routes (Next.js Route Handlers)

| URL | Method | Handler file | Purpose |
| --- | --- | --- | --- |
| `/api/educator/classroom-slice` | `GET` | `src/app/api/educator/classroom-slice/route.ts` | Discovers live learner IDs, topic catalog, and display names (Postgres join with `shared.learners`). Used by the educator dashboard before calling the FastAPI analytics backend. |

---

## Post-login redirects (mock auth)

After a successful login or registration, the auth forms currently redirect by role:

| Role | Redirect target |
| --- | --- |
| Educator | `/matrix` |
| Student | `/dashboard` *(route not implemented yet; student chat lives at `/tutor`)* |

---

## Quick map

```text
/                 →  Home (placeholder)
/login            →  Login
/register         →  Register
/tutor            →  Student tutor chat
/matrix           →  Educator dashboard
/api/educator/classroom-slice  →  Classroom discovery JSON (internal)
```
