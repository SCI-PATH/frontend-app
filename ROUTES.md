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
| `/dashboard` | `(student)` | `src/app/(student)/dashboard/page.tsx` | Student homepage. Renders `Navbar` + `StudentHome` from `components/common/student-home/`. |
| `/learning-path` | `(student)` | `src/app/(student)/learning-path/page.tsx` | Student adaptive learning path. Renders `StudentLearningPath` from `components/features/learning-path-engine/`. |
| `/tutor` | `(student)` | `src/app/(student)/tutor/page.tsx` | Student Socratic tutor chat. Renders `SocraticChatView` from `components/features/learner-analytics/`. |
| `/educator-home` | `(educator)` | `src/app/(educator)/educator-home/page.tsx` | Teacher homepage after login. Renders `EducatorHome` from `components/common/educator-home/`. |
| `/educator-analytics` | `(educator)` | `src/app/(educator)/educator-analytics/page.tsx` | Educator insight dashboard (mastery matrix, at-risk feed, student deep-dive). Renders `EducatorDashboardView` from `components/features/learner-analytics/`. |
| `/classrooms` | `(educator)` | `src/app/(educator)/classrooms/page.tsx` | List teacher-owned classes and create a class (User Management `POST /classes` → join code). Renders `ClassroomsView`. |
| `/classroom` | `(educator)` | `src/app/(educator)/classroom/page.tsx` | Redirects to `/classrooms` (legacy URL). |
| `/matrix` | `(educator)` | `src/app/(educator)/matrix/page.tsx` | Redirects to `/educator-analytics` (legacy URL). |
| `/content-generation` | `(educator)` | `src/app/(educator)/content-generation/page.tsx` | Educator content-generation library. Renders `TeacherContentGeneration` from `components/features/learning-path-engine/`. |
| `/question-generation` | `(educator)` | `src/app/(educator)/question-generation/page.tsx` | Placeholder for teacher question generation (`QuestionGenerationPlaceholder` in `assessment-engine`). |

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

## Post-login redirects

Register always goes to `/login?registered=1`. After a successful login, the user is sent to their role homepage:

| Role | Redirect target |
| --- | --- |
| Student | `/dashboard` (student homepage) |
| Educator | `/educator-home` (teacher homepage) |

---

## Quick map

```text
/                 →  Home (placeholder; signed-in users bounce to role home)
/login            →  Login
/register         →  Register
/dashboard        →  Student homepage
/learning-path    →  Student learning path
/tutor            →  Student tutor chat
/educator-home    →  Teacher homepage
/educator-analytics →  Educator analytics dashboard
/classrooms       →  Create / view classes (join codes)
/classroom        →  Redirect → /classrooms (legacy)
/matrix           →  Redirect → /educator-analytics (legacy)
/content-generation →  Educator content generation
/question-generation →  Question generation placeholder
/api/educator/classroom-slice  →  Classroom discovery JSON (internal)
```
