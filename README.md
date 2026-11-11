# Auth Fullstack Task

A production-ready sign-up / sign-in module: a **NestJS 11** API with MongoDB and a
**Next.js 16** frontend. Sessions are a JWT in an `httpOnly` cookie, so no token is ever
readable by JavaScript. Everything runs behind one origin with `docker compose up`.

| | Light | Dark |
|---|---|---|
| Sign in | ![Sign in, light](frontend/docs/screenshots/signin-light.png) | ![Sign in, dark](frontend/docs/screenshots/signin-dark.png) |
| Sign up (validation) | ![Sign up with errors, light](frontend/docs/screenshots/signup-errors-light.png) | ![Sign up with errors, dark](frontend/docs/screenshots/signup-errors-dark.png) |
| App | ![App, light](frontend/docs/screenshots/app-light.png) | ![App, dark](frontend/docs/screenshots/app-dark.png) |

360px mobile versions are in [`frontend/docs/screenshots`](frontend/docs/screenshots).

**Contents:** [Architecture](#architecture) · [Tech stack](#tech-stack) · [Repository structure](#repository-structure) · [Quick start](#quick-start-docker) · [Local development](#local-development-without-docker) · [Environment variables](#environment-variables) · [API](#api) · [Testing](#testing) · [CI](#ci) · [Security decisions](#security-decisions) · [Known limitations](#known-limitations--trade-offs) · [Troubleshooting](#troubleshooting) · [AI usage](#ai-usage)

## Architecture

```mermaid
flowchart LR
  B[Browser] -->|"http://localhost:8080"| N["nginx (edge)<br/>overwrites X-Forwarded-For"]
  N -->|pages and /api/*| F["Next.js 16<br/>pages, proxy.ts, /api rewrite"]
  F -->|"/api/* (rewrite)"| A["NestJS 11 API<br/>TRUST_PROXY=1"]
  A --> M[("MongoDB 8")]
```

**Why same-origin.** The browser only talks to one origin: Next.js rewrites `/api/*` to the
API. The auth cookie is first-party (`SameSite=Lax` works, no third-party-cookie blocking, no
credentialed CORS), `proxy.ts` can see the cookie for redirects, and the API, Next.js and
MongoDB are never published to the host. In Docker only nginx (8080) is.

**Request flow.** `proxy.ts` makes an optimistic redirect from the cookie's presence only. The
`(protected)` layout then confirms the session with `GET /api/users/me`. A cookie the API
rejects is cleared via `POST /api/auth/logout` and the user lands on `/signin`.

## Tech stack

| Area | Choice (version) | Why |
|---|---|---|
| API | NestJS 11.2, TypeScript 5.9 strict | Modules, DI, guards and pipes keep auth concerns separated |
| Database | MongoDB 8 via Mongoose 9.12 | Unique email index, `select: false` for the hash |
| Passwords | argon2 0.44 (argon2id) | Memory-hard hashing; 0.44 pinned (0.45.2 segfaults on Windows) |
| Auth | @nestjs/jwt 11 + passport-jwt 4, HS256 | Stateless JWT read from the `access_token` cookie |
| Hardening | helmet 8, @nestjs/throttler 6.7, Joi 18 env validation | Headers, per-IP rate limits, fail-fast config |
| Logging / docs | nestjs-pino 5 (pino 10), @nestjs/swagger 11.4 | JSON logs with redacted cookies; OpenAPI at `/api/docs` |
| Frontend | Next.js 16.4 (App Router), React 19.3 | `proxy.ts` route protection, rewrites, standalone server |
| Forms / state | react-hook-form 7.92 + Zod 4.6, Zustand 5.1, axios 1.21 | Same rules as the API; tiny store without persistence |
| UI | Tailwind CSS 4.3 | Light/dark tokens via `prefers-color-scheme`, no UI library |
| Tests | Jest 30 + supertest + mongodb-memory-server; Vitest 4.1 + Testing Library + MSW 2 | Real HTTP and in-memory MongoDB for the API; jsdom + mocked network for the UI |
| Delivery | Docker (Node 22 alpine), nginx 1.30, GitHub Actions | Production-like stack in one command |

Node: Docker and CI use **Node 22 LTS** (`.nvmrc`); `engines` is `>=20.19.0`, so Node 20 still works locally.

## Repository structure

```
.
├─ backend/                 NestJS API
│  ├─ src/common/           constants (shared validation rules), decorators, filters, guards
│  ├─ src/config/           env validation, app bootstrap, logger, swagger, trust proxy
│  ├─ src/modules/          auth, users (schema + DTOs), health
│  ├─ test/                 e2e specs + utils (in-memory MongoDB, test app factory)
│  └─ Dockerfile
├─ frontend/                Next.js app
│  ├─ src/app/              (auth)/signin, (auth)/signup, (protected)/app, not-found, error
│  ├─ src/components/ui/    Button, Input, Label, FormField, Card, Alert, Spinner, Logo
│  ├─ src/features/auth/    components, schemas, services, store, types
│  ├─ src/lib/              http client, ApiError, form error mapping, routes
│  ├─ src/proxy.ts          optimistic route protection
│  ├─ docs/screenshots/
│  └─ Dockerfile
├─ nginx/nginx.conf         edge proxy (only published service)
├─ docker-compose.yml
├─ .env.example             compose secrets (JWT_SECRET)
└─ .github/workflows/ci.yml
```

## Quick start (Docker)

```bash
echo "JWT_SECRET=$(openssl rand -hex 48)" > .env   # or copy .env.example and fill it in
docker compose up --build -d --wait               # first build takes a few minutes
# open http://localhost:8080  (API docs: http://localhost:8080/api/docs)
```

`docker compose down` stops the stack; add `-v` to also delete the MongoDB volume.

## Local development (without Docker)

Requirements: Node 22 (or ≥ 20.19) and MongoDB listening on `127.0.0.1:27017`.

```bash
# API: http://localhost:4000/api (docs: /api/docs)
cd backend
cp .env.example .env        # set JWT_SECRET (generator command is in the file)
npm ci
npm run start:dev

# Web: http://localhost:3000 (proxies /api to BACKEND_URL)
cd frontend
cp .env.example .env.local
npm ci
npm run dev
```

## Environment variables

**Backend** (`backend/.env`, validated with Joi at startup; the app refuses to start on invalid values)

| Variable | Required | Default | Purpose |
|---|---|---|---|
| `NODE_ENV` | no | `development` | `development`, `production` or `test`; production adds `Secure` to the cookie and logs JSON |
| `PORT` | no | `4000` | HTTP port |
| `MONGODB_URI` | yes | — | `mongodb://` or `mongodb+srv://` URI |
| `JWT_SECRET` | yes | — | HS256 secret, at least 32 characters |
| `JWT_EXPIRES_IN` | no | `1d` | Token lifetime (`15m`, `1h`, `1d`…); also the cookie `Max-Age` |
| `CORS_ORIGIN` | yes | — | Origin allowed to make credentialed requests |
| `THROTTLE_TTL_MS` | no | `60000` | Rate-limit window |
| `THROTTLE_LIMIT` | no | `5` | Sign-in / sign-up attempts per window per client IP |
| `TRUST_PROXY` | no | `false` | Which proxies may set `X-Forwarded-For`: `false`, `loopback`, a hop count, or IPs/CIDRs ([details](#security-decisions)) |

**Frontend** (`frontend/.env.local`)

| Variable | Required | Purpose |
|---|---|---|
| `BACKEND_URL` | yes | API origin for the `/api/*` rewrite (e.g. `http://localhost:4000`). Read by `next dev`, `next build` and `npm run typecheck`; compiled into the build (a Docker **build arg**). |

**Root** (`.env`, used by `docker compose`)

| Variable | Required | Purpose |
|---|---|---|
| `JWT_SECRET` | yes | Passed to the API; compose refuses to start without it |
| `JWT_EXPIRES_IN` | no | Session length, default `1d` |

## API

Base path `/api`. Interactive docs (Swagger, cookie auth): **`/api/docs`**. OpenAPI JSON: `/api/docs-json`.

| Method | Path | Auth | Success | Errors |
|---|---|---|---|---|
| `POST` | `/api/auth/signup` | — (rate limited) | `201` user + `access_token` cookie | `400`, `409`, `429` |
| `POST` | `/api/auth/signin` | — (rate limited) | `200` user + `access_token` cookie | `400`, `401`, `429` |
| `POST` | `/api/auth/logout` | — | `204`, cookie cleared | — |
| `GET` | `/api/users/me` | cookie | `200` user | `401` |
| `GET` | `/api/health` | — | `200` `{ status, database, uptime, timestamp }` | `503` when MongoDB is down |

The user is always `{ id, email, name, createdAt }`. Every error has the same shape:
`{ statusCode, message, error, path, timestamp }`, where `message` is a list for validation errors.

## Testing

| | Command | What it covers |
|---|---|---|
| Backend unit | `cd backend && npm test` (`npm run test:cov`) | Services, guards, decorators, config parsing, cookie options |
| Backend e2e | `npm run test:e2e` | The real app bootstrap against in-memory MongoDB: full session flow, validation messages, duplicate emails, identical 401s, cookie attributes (incl. `Secure` in production), tampered/expired/foreign/`alg=none` JWTs, deleted users, 429 + `Retry-After`, `TRUST_PROXY` behaviour (including a rotating `X-Forwarded-For`), health/Swagger, and that no response ever contains a password or hash |
| Frontend | `cd frontend && npm test` (`npm run test:cov`, `test:watch`) | Zod schemas, HTTP error normalization, store, forms (MSW), `proxy.ts`, protected layout |

Coverage at the time of writing: backend e2e **97% statements** (unit 49%, since controllers and wiring are
exercised end to end); frontend **88% statements / 91% branches**.

**Drift guard.** The validation rules exist twice (class-validator DTOs and Zod schemas) but come from one
source: `backend/src/common/constants/validation.constants.ts`. The frontend keeps an identical copy, and
`validation.constants.test.ts` imports the backend file by relative path and deep-compares every export
(regexes by source and flags). Changing a rule or message on one side fails the frontend tests.

## CI

`.github/workflows/ci.yml` runs on every push and pull request (read-only permissions, superseded runs cancelled):

1. **backend**: `npm ci`, lint, typecheck, unit, e2e (MongoDB binaries cached), build.
2. **frontend**: `npm ci`, lint, typecheck, format check, tests, build.
3. **docker** (after both): `docker compose build`, `up --wait` with a generated secret, then smoke-test
   `/api/health` and sign-up → `/api/users/me` through nginx on port 8080.

## Security decisions

- **Passwords**: argon2id; the hash is `select: false` in the schema and responses are built from an
  allow-list DTO, so the hash cannot be serialized. Inputs are whitelisted (`forbidNonWhitelisted`), so
  extra fields such as `role` are rejected.
- **Session cookie**: `access_token`, `HttpOnly`, `SameSite=Lax`, `Path=/`, `Max-Age` = JWT lifetime, and
  `Secure` when `NODE_ENV=production`. Browsers treat `http://localhost` as secure, so the Docker stack works
  without TLS locally. JWTs are pinned to HS256, and the user must still exist.
- **No tokens in client state**: the Zustand store holds only `{ id, email, name }` and a status. Nothing is
  persisted, and nothing touches `localStorage`.
- **Generic auth errors**: sign-in always answers `401 Invalid email or password`. Unknown emails are verified
  against a dummy argon2 hash, so the response time does not reveal whether an account exists.
- **Rate limiting**: 5 sign-in and 5 sign-up attempts per minute per client IP, with 429 + `Retry-After`.
  The Next.js rewrite adds no `X-Forwarded-For` and forwards a client-sent one unchanged, so:
  - local development uses `TRUST_PROXY=false` (also the default): the header is ignored and everyone
    shares one bucket, which is strict but cannot be bypassed;
  - in Docker, nginx **overwrites** `X-Forwarded-For` with the client address and the API trusts exactly
    one hop (`TRUST_PROXY=1`, the Next.js server). A spoofed header never changes the bucket; this is
    tested in e2e and verified through the stack.
- **Headers**: helmet on the API; `X-Frame-Options: DENY`, `nosniff`, `Referrer-Policy` and
  `Permissions-Policy` on pages; `X-Powered-By` and nginx versions hidden.
- **Configuration**: all settings come from the environment and are validated at startup (Joi for the API,
  Zod for `BACKEND_URL`). Secrets are only in git-ignored `.env` files, and logs redact cookies and
  `Authorization` headers.
- **Containers**: multi-stage images with production dependencies only; nginx, Next.js, the API and
  MongoDB all run as non-root users; only port 8080 is published, and each service pair has its own network.

## Known limitations / trade-offs

- **Sign-up reveals registered emails** (`409 Email already registered`), which the specification requires.
  Sign-in does not leak this.
- **The throttler stores counters in memory**: limits apply per API instance and reset on restart. Several
  instances would need a shared store (e.g. Redis).
- **Local development shares one rate-limit bucket** (`TRUST_PROXY=false` behind the Next.js rewrite).
- **The frontend email check is slightly stricter than the backend's**: Zod rejects rare RFC-valid characters
  such as `!` in the local part, which validator.js accepts. The API remains the authority.
- **Out of scope**: refresh tokens, email verification and roles. There is no CSRF token, because
  `SameSite=Lax` plus a same-origin API covers this deployment; a cross-site deployment would need one.
- **MongoDB runs without authentication** on the private compose network (never published). Enable auth
  and TLS for real deployments.

## Troubleshooting

- **Vitest: "failed to find the current suite" on Windows Git Bash.** Git Bash reports the drive letter in
  lowercase (`d:\…`) and Vitest then loads itself twice. Run the tests from PowerShell or cmd, or `cd /D/...`
  with an uppercase drive in Git Bash.
- **`BACKEND_URL` errors from `npm run typecheck` or `npm run build`.** `next typegen` and `next build`
  evaluate the rewrites, so create `frontend/.env.local` (or export `BACKEND_URL`) first.
- **`npm run start` warns about `output: standalone`.** The local production server still works; the Docker
  image runs `node server.js` from the standalone output instead.
- **Port 8080 already in use.** Stop the other service or change the published port in `docker-compose.yml`.

## AI usage

How AI assistance was used while building this project is documented in [AI.md](AI.md).
