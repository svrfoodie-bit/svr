# SVR Cashew Management

Single-tenant business app for a cashew processing unit. Two independent npm packages (no workspace):
- `backend/` — Node + Express 4 (CommonJS JS), raw SQL via `mysql2` (no ORM). Prod MySQL 8 (Aiven) on Render; local MariaDB.
- `frontend/` — React 18 + Vite 5 + Tailwind 3, Zustand, axios. Deployed to Netlify (`netlify.toml`).

Root-level `*.md` guides (FEATURES, PROJECT_STRUCTURE, setup guides…) are historical write-ups and partly stale — trust the code and `docs/` over them.

## Commands
| Task | Command |
|------|---------|
| Backend dev / start | `cd backend && npm run dev` (nodemon, :5000) / `npm start` |
| Backend tests | `cd backend && npm test` (jest --coverage; only `backend/tests/`) |
| Migrations | `cd backend && npm run migrate` · `npm run migrate:status` (non-localhost needs `--yes`) |
| Fresh DB bootstrap | `cd backend && npm run setup-db` then `npm run migrate`; `npm run seed` for sample data |
| Frontend dev | `cd frontend && npm run dev` (:5173, proxies `/api` → :5000) |
| Frontend lint / build | `cd frontend && npm run lint` · `npm run build` |
| Windows helpers | `setup.bat`, `start-servers.bat`, `verify-setup.bat` |

No backend lint, no typecheck (plain JS), no frontend tests. Env: copy `backend/.env.example`, `frontend/.env.example`.

## Code patterns & conventions
Full house style: **[docs/PATTERNS.md](docs/PATTERNS.md)** — read before writing code. The essentials:
- Route (`authenticate, validators, validate`) → controller class singleton (`try … next(err)`) → static-method model with parameterized `promisePool.query`.
- Responses `{ success, data }` / `{ success: false, message }`; central `errorHandler`.
- camelCase DB columns and JSON; soft delete via `isDeleted` on master data.
- Schema changes = next `backend/migrations/NNN_*.sql`, applied only through `npm run migrate` (MySQL 8 compatibility).
- Frontend: page → `<domain>Service` → `apiHelpers` → axios `api.js`; Tailwind, react-hot-toast, `useDebounce`.

## Project gotchas (verify before relying)
- SQL must work on **both** MariaDB (local) and MySQL 8 strict (prod). Never run migration SQL raw against prod; the runner translates `IF NOT EXISTS` DDL (`backend/src/utils/schemaHelpers.js:93`).
- `backend/create-tables.js` and `backend/migrations/` are separate schema paths; `leads` in create-tables lacks the columns migration 014 adds.
- Role checks are not enforced (`authorize` unused); demo users with known passwords are seeded on every boot (`backend/src/server.js:141`).
- JWT expiry env mismatch: code reads `JWT_EXPIRY` (`backend/src/models/User.model.js:61`), `.env.example` says `JWT_EXPIRE`.
- Two different WhatsApp integrations: Meta Cloud API (CashewFlowX) vs Twilio (automation).

## Knowledge layer — indexing, retrieval, summaries

These docs load into context, so load the **least** that answers the task, in this order:

0. **`CLAUDE.md` (this file)** — always in context; a thin index that points, never inlines.
1. **[docs/PATTERNS.md](docs/PATTERNS.md)** — when writing/changing code. New code MUST match it.
2. **[docs/ARCHITECTURE.md](docs/ARCHITECTURE.md)** — a router: read it, then only your module's shard in `docs/architecture/` (business-core, cashew-flow-x, lead-manager, exports-automation).
3. **`docs/GLOSSARY.md` / `docs/CONTEXT.md`** — optional, not yet written. Add on purpose when domain terms or non-code constraints need recording.
4. **Agentic retrieval last** — grep / glob for exact lines only.

(No `docs/ESTATE.md` — standalone app. No `docs/SKILLS.md` — ml-skills not installed.)

**Token discipline:** cite `file:line` rather than pasting code; read file *ranges* once a summary
says where to look; never re-read a doc already in context. Sharded docs or a change crossing a
module boundary? Load the ml-specs **`knowledge-retrieval`** skill.

**Keep summaries fresh** (`/ml-specs:repo-refresh`) after changing endpoints, migrations, scheduler
jobs, or external clients. A stale summary is worse than none. CI checks `file:line` refs
(`.github/workflows/knowledge-layer.yml`).

## Working agreement (coding-agent contract)

The full contract lives in the plugin's `coder` agent. What binds *all* work here:

1. **Inspect before assuming** structure or stack — the code is the source of truth.
2. **Smallest correct change**, matching the surrounding file's naming, layering, error handling
   and tests. Reuse what's there; justify any new dependency or abstraction.
3. **ASK rather than guess on contracts** — API shape, data model or migration, error/status codes,
   scope boundary, compatibility.

**Quality gates:** `cd backend && npm test`; `cd frontend && npm run lint && npm run build`.
Final acceptance = all three green. Schema changes ship as numbered migrations, never hand edits.
Secrets come from env.

## Spec-driven development

Non-trivial changes start with a reviewable spec, not code. See `specs/README.md`. The loop:
`/ml-specs:spec-explore` (optional) → `/ml-specs:spec <ticket>` → human reviews → `/ml-specs:spec-advance … Approved` → `/ml-specs:spec-build` (test-first, one
functional/E2E test per user-facing criterion) → `/ml-specs:spec-verify` (adversarial + full suite green,
§6.1) → `/code-review` → `/ml-specs:spec-advance … Verified` → `/ml-specs:pr` → merge → `/ml-specs:spec-advance … Archived`.

Status is only ever written by `/ml-specs:spec-advance`, which refuses a transition whose evidence isn't
there. `/ml-specs:repo-status` shows the board; `/ml-specs:repo-doctor` flags statuses the repo can't back up.

Session handoffs live in `.claude/handoff/`, written by `/ml-specs:handoff` when a session ends with
work in flight and surfaced at the next session start. Committing or ignoring them is this repo's choice.

Anything not in the approved spec is out of scope — update the spec first. Trivial one-line fixes
are exempt: `/ml-specs:code` for those, `/ml-specs:spec` when a change touches an API, data model, migration, or several files.

## Git & PR workflow

- **Branch** off `main`; never commit straight to it. Small, focused, imperative commits; keep the spec in the same branch/PR as its implementation.
- **Before a PR:** quality gates pass, `/code-review` is clean, every acceptance criterion has a passing test. Don't commit secrets, generated artifacts (`frontend/dist`, `backend/coverage`, logs), or unrelated reformatting.
- **No AI attribution anywhere in the history.** Commit messages, trailers, PR titles and bodies name the humans who own the change — no assistant `Co-Authored-By:`, no "Generated with" lines, no model/vendor names. Enforced by `.claude/settings.json` `attribution`.
- Only commit or push when the human asks; surface the diff for review first.
