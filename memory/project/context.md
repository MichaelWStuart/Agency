# Factory Context

> Project-specific context loaded by all factory modes at initialization.
> This is the foundation that gives factory sub-agents the "why" behind
> every quality gate and verification step.

---

## Project: HubShot

HubShot is a functional replica of HubSpot's CRM, built as a training
environment for reinforcement learning (RL) agents. The **reference app**
is HubSpot itself (`app.hubspot.com`) — the source of truth for UI
structure, interaction patterns, data shapes, visual fidelity, and
**network behavior** (which actions trigger API calls).

Fidelity to the reference app is a first-class requirement:
- **Visual fidelity** — does it look right?
- **Behavioral fidelity** — does the data flow match?

### Why Behavioral Fidelity Matters

RL agents learn from the full interaction loop: action → network request →
response → state change → UI update. A client-side search that filters 50
in-memory records teaches the agent fundamentally different patterns than a
server-side search with loading states, debounce, and paginated responses.
Agents trained on the wrong pattern won't transfer to the real app.

This is why Browser QA and Network Behavior Verification are mandatory
steps in every phase — they verify that HubShot's data flow matches
HubSpot's.

### RL Operational Model

The client's RL pipeline:
1. State API POSTs data → `db.sqlite`
2. `db.sqlite` bind-mounted into Docker container running Next.js
3. RL agent interacts via browser — not the State API
4. Between episodes, container restarts with fresh `db.sqlite`

The State API is a setup tool (clarity > latency); the agent only touches
the running app.

### Default Data Integrity

HubShot has hundreds of default entities (properties, views, segments).
The State API wipes and recreates the DB, so default data is NOT
guaranteed. The app must ensure critical defaults exist regardless of
initialization method.

---

## Organization

**Team:** Romeo
**Repo:** g2i-ai/hubshot
**Main branch:** dev
**Project management:** Linear (see `conventions.md` §Linear Ticket Lifecycle)

---

## Critical Rules

Non-negotiable across all factory operations:

1. **Never modify `.gitignore`** — shared repo config, requires team coordination.
2. **Never commit screenshots/images** — unstage before every commit, delete in post-flight.
3. **CursorBot is a HARD GATE** — never merge until check-run status is `completed`.
4. **Run E2E tests LOCALLY before creating a PR** — relying on CI is a protocol violation.
5. **Never use "HubSpot"/"HUBSPOT" in code** — use "HubShot"/"HUBSHOT" (exception: `docs/reference/`).
6. **`create-handler.ts`** State API handler supports both string and number IDs.
7. **Full enum/option field protocol** in `conventions.md` §Enum/Option Field Protocol.
8. **No new routes unless they exist in the reference app API.** CI runs an API compatibility check that diffs our routes against the reference app schema. Any route not in the reference API — including `/internal/` prefixed routes — fails the check. If you need data for the frontend, use an existing route or inline it.
