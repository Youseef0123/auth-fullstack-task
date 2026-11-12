# How AI was used

## 1. Summary

Nearly all code, tests, Docker/CI files and docs in this repository were written by AI agents.
My part was choosing the stack, writing down the rules, deciding every trade-off the agents raised,
and designing how each phase had to prove its own work. The project was built in eight phases over
two days, each ending in a written report that I reviewed before the next one started.

## 2. Workflow

- **Planner / reviewer: Claude (chat).** Turned the task brief into stack decisions, `CLAUDE.md`
  and one prompt per phase, and reviewed each phase's final report before the next prompt.
- **Executor: Claude Code in VS Code.** Worked autonomously per phase, ran its own verification
  checklist, logged problems and decisions to a local `ai-log.md`, and committed in small
  conventional commits.
- **Me:** the decision-maker between the two. I chose the stack, approved or rejected each
  recommendation, and triaged the review findings.

Phases: 1 backend foundation · 2 users + auth · 3 hardening + e2e tests · 4 frontend ·
5 frontend tests + rate-limit fix · 6 Docker / nginx / CI / README / GitHub · 7 independent review
in a fresh session · 8 review fixes + this file · 9 creative redesign of the auth pages and the
welcome page.

## 3. What was AI-assisted

| Area | AI | Me |
|---|---|---|
| Stack and rules | Proposed a stack and drafted `CLAUDE.md` | Chose the final stack, kept or changed every rule |
| Backend code (NestJS, auth, validation, filters) | Wrote all of it | Reviewed the reports, approved security trade-offs |
| Frontend code (Next.js, forms, store, UI) | Wrote all of it | Reviewed the reports |
| Tests (Jest, e2e, Vitest, MSW) | Wrote all of them, ran mutation checks | Asked for specific scenarios and for deliberately breaking code |
| Docker, nginx, CI | Wrote them, rehearsed CI locally, fixed the failing CI run | Approved the edge-proxy model and Node 22 |
| README / AI.md | Drafted both from the logs, reports and review | Reviewed them; my own reasons go where marked |
| Visual design and welcome page | Researched Easygenerator and auth-page patterns, built the split-screen pages, the "Why me" section and the hack-this-app game, and wrote the image prompt | Asked for a more creative UI, generated the comic with Gemini from my photo, and asked for a game instead of a quiz |
| Verification | Ran every checklist (browser flows, curl, coverage) | Designed the checklists and decided what counts as done |

## 4. Prompts and approaches that worked

1. **One rules file as the contract.** `CLAUDE.md` holds the layout, naming, validation rules and
   security rules, e.g. *"Structure (STRICT — do not create files outside this layout without asking)"*
   and *"Do not add libraries not listed here without asking me first."* Every phase prompt started
   with "Read CLAUDE.md first and follow it strictly", so libraries beyond the list were reported for
   approval instead of slipping in unnoticed (`@vitest/coverage-v8` and `@testing-library/dom`, for example).
2. **Verification checklists the agent runs itself.** Each prompt ended with concrete checks, e.g.
   *"In a real browser … run the full flow"* and *"rotating X-Forwarded-For via curl must now hit 429
   after the limit."* Because the agent had to show evidence, it found problems that a code read would
   not: the rate-limit bypass (phase 4) only showed up in the curl check.
3. **A mandatory "assumptions / deviations" section.** `CLAUDE.md`: *"After each task, list files
   created/changed and any assumption you made."* Deviations such as skipping an empty "renormalize"
   commit or keeping argon2 0.44 surfaced in the report instead of in the code.
4. **Deliberately breaking code to prove the tests.** Phase 5: *"temporarily break 2-3 things in source
   … and confirm the right tests fail, then revert."* Six mutations each failed only the intended tests;
   the same idea later proved the emoji-name e2e cases fail against the old schema.
5. **An independent review in a fresh session, and honest logs.** A new Claude Code session with no
   memory of the build did a read-only review; it found the emoji-name 500 and the README paste failure,
   which the builder had missed. The log rule *"Be factual. If nothing went wrong in an area, don't
   invent entries."* kept `ai-log.md` usable as the source for this file.

## 5. What had to be corrected or reworked

| Problem | Before | After |
|---|---|---|
| argon2 on Windows | `argon2@0.45.2` prebuild segfaulted on load (Node 20, Windows) | Pinned 0.44.0; later verified on Node 22 Linux (alpine and slim) |
| JWT lifetime units | `jsonwebtoken` reads a unit-less `"3600"` as 3.6 seconds; `"0s"` was accepted | `JWT_EXPIRES_IN` must match `^([1-9]\d*)([smhd])$`; one parser feeds both the JWT and cookie `Max-Age` |
| Tests not type-checked | ts-jest only transpiles and `nest build` skips specs, so a type error in an e2e spec went unnoticed | `npm run typecheck` covers `src` and `test` |
| Rate-limit bypass | With `TRUST_PROXY=loopback` behind the Next.js rewrite, a client could send its own `X-Forwarded-For` and get a fresh bucket per value | Dev and built-in default `false`; in Docker nginx overwrites the header and the API trusts one hop; e2e test with a rotating header |
| MongoDB in CI | The first CI run failed: `mongo:8.0` (8.0.34) refuses to start on Linux 6.19+; local Docker (kernel 6.18) never showed it | Compose pins `mongo:8.2` (no guard in the binary); CI green |
| Emoji names (review) | `"x"*45+"🎉"*3` passed both validators but failed Mongoose `maxlength` (UTF-16 units): 500 | Schema length rules removed (the DTO is the single source); Mongoose validation errors map to 400 as a backstop; e2e and frontend tests for these names |
| README paste failure (review) | The local-dev block `cd`'d into `backend`, started a blocking watcher, then tried `cd frontend` | Two terminal blocks, each starting at the repo root |
| `lib` → feature dependency (review) | `lib/http.ts` imported the auth feature's messages to map errors to fields | `lib/http` returns raw messages; the auth feature owns the mapping; an ESLint rule blocks `src/lib` from importing features |

## 6. Decisions I made differently from AI suggestions

- **Frontend stack.** The planner proposed React + Vite; I chose Next.js (App Router) + Zustand + Zod
  because: TODO-YOUSSEF.
- **TRUST_PROXY.** The phase-3 plan made `"loopback"` the default. Phase 4's own verification showed the
  bypass above, so I changed course: `false` for local dev and as the built-in default, an nginx edge
  proxy that overwrites `X-Forwarded-For` in Docker, and `TRUST_PROXY=1` there.
- **Node version.** `CLAUDE.md` said Node 20, a stale instruction (Node 20 reached end-of-life in April
  2026). The agent followed it faithfully and even chose older test-library majors to stay on Node 20. I
  corrected it to Node 22 LTS for Docker and CI, keeping `engines >=20.19.0` for local development.
- **Review triage.**
  - Fixed: the emoji-name 500 (#1), README paste failure (#2), localhost-only cookie note (#3), the
    `lib` → feature dependency (#4), the checklist built from `PASSWORD_CHECKS` (#5), 413 instead of 500
    for oversized bodies (#6), dev `THROTTLE_LIMIT=20` (#10), unused dev dependencies and debug
    scripts (#11), shorter TRUST_PROXY prose (#13), shared route and cookie constants (#14), a JWT with
    only `sub` (#15), and every README mismatch the review listed.
  - Documented as known limitations: logout does not revoke the JWT (#7), Swagger is served in the demo
    production stack (#8), pages have no CSP (#9).
  - Not fixed, on purpose: production-mode log lines during e2e (#12), the `agentRules` setting (#16,
    explained below), and the duplicated `.prettierrc` (the two apps are independent).

## 7. Where AI was weak / what I wouldn't delegate

- **It follows instructions even when they are stale.** The Node 20 rule was applied consistently,
  including choosing older libraries, instead of being questioned.
- **Cross-layer mismatches slipped through until an outside review.** The Mongoose schema and the DTO
  counted name length differently; the builder's own tests used ASCII names and passed.
- **Environment blind spots.** The MongoDB/kernel issue only appeared on GitHub's runners; a Windows Git
  Bash path-casing quirk broke Vitest locally; Docker Desktop stopped responding during phase 6.
- **Its own verification scripts needed checking.** It once printed the exit code of `echo` instead of
  the smoke test, wrote a backup to `/tmp` and restored from the wrong path, and reported a CRLF problem
  that was a grep artifact. Each was caught by re-checking, but the habit of verifying the verifier
  mattered.
- **It tends to over-explain.** The TRUST_PROXY explanation ended up in four places before the review
  trimmed it.
- **What I keep for myself:** the stack choice, security trade-offs (proxy trust, revealing registered
  emails on sign-up, what goes into the JWT), approving new libraries and deviations, triaging review
  findings, and deciding when a phase is done.

## 8. Time spent

From the first commit (11 Nov, 12:03, `CLAUDE.md`) to the last commit (12 Nov, 17:19) is
about 29.5 hours of wall-clock time, including a night. Commits fall into two windows: 12:03–21:38 on day 1
(phases 1–6, with gaps between phases) and 08:39–17:19 on day 2 (the CI fix, the review
fixes, this file and the UI redesign). These are commit timestamps, not tracked working time.

## 9. Two AI-specific files

- **`CLAUDE.md`** is the rules file Claude Code reads at the start of every session: layout, naming,
  validation and security rules. It is committed because it is the contract every phase was checked
  against.
- **`agentRules: false`** in `frontend/next.config.ts` stops `next dev` from writing an `AGENTS.md`
  file when it detects a coding agent. That file was outside the agreed layout, so the setting keeps the
  repository to the documented structure.
