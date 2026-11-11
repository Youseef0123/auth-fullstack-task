# Project: auth-fullstack-task

## Goal
Production-ready sign up / sign in module. Evaluated on: functionality, security,
code quality, delivery speed, and bonus items (logging, error handling, tests, CI, API docs).
Keep it focused: do NOT over-engineer (no refresh tokens, no email verification, no roles).

## Structure (STRICT — do not create files outside this layout without asking)
auth-fullstack-task/
  backend/   NestJS 11, TypeScript strict, MongoDB via Mongoose
  frontend/  Next.js (latest stable, App Router, src/ dir), TypeScript strict,
             Zustand, Zod, react-hook-form, Tailwind CSS, axios
  .github/workflows/ci.yml, docker-compose.yml, README.md, AI.md

Backend layout: src/common/{constants,decorators,filters,guards}, src/config,
src/modules/{auth,users,health} — each module has its own dto/, and users has schemas/.
Frontend layout: src/app (route groups (auth) and (protected)), src/components/ui,
src/features/auth/{components,schemas,services,store,types}, src/lib.

## Naming
- Files: kebab-case (sign-up-form.tsx, auth.service.ts). React components: PascalCase exports.
- One component / class per file. No barrel files that create circular imports.
- Imports via path alias "@/..." in frontend.

## Validation rules (MUST be identical in frontend and backend)
- email: valid email, trimmed, lowercased before saving/lookup
- name: trimmed, min 3 chars, max 50
- password: min 8, max 128, at least one letter, one number, one special character
  regex: ^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,128}$
- Backend source: backend/src/common/constants/validation.constants.ts
- Frontend source: frontend/src/features/auth/schemas/ — same regex and same messages.

## Security rules
- Hash passwords with argon2. Never return password hash (select:false + response DTO).
- JWT in httpOnly cookie "access_token" (secure in production, sameSite=lax).
  NEVER in localStorage, NEVER in Zustand, NEVER readable by client JS.
- Zustand holds only non-sensitive user info (id, email, name) and auth status. No persist middleware.
- Sign-in failure message is always generic: "Invalid email or password".
- All config from env, validated at startup. No secrets committed; provide .env.example.

## Code rules
- DTOs for every input/output, no `any`, no unused code, no commented-out code.
- Conventional commits, one logical change per commit.
- Do not add libraries not listed here without asking me first.
- After each task, list files created/changed and any assumption you made.