# Entity Roster Schema

> Documents the structure of `shared/roster.json` — the single source of truth for all Agency entities.

---

## File Structure

```json
{
  "version": <number>,
  "entities": {
    "<bunk>": { ... }
  }
}
```

### Top-Level Fields

| Field | Type | Description |
|---|---|---|
| `version` | `number` | Schema version (currently `3`). Increment on breaking changes. |
| `entities` | `object` | Map of bunk ID → entity definition. |

### Entity Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `callsign` | `string` | Yes | Unique short name (e.g., `"Admiral"`, `"Hawk"`). |
| `role` | `string` | Yes | Full role title (e.g., `"Admiral"`, `"Chief Analyst"`). |
| `type` | `enum` | Yes | Role type: orchestrator or worker. |
| `department` | `enum \| null` | Yes | Operational department, or `null` for non-departmental. |
| `tier` | `enum` | Yes | Hierarchy tier. |
| `parent` | `string \| null` | Yes | Parent bunk ID, or `null` for root entities. |
| `identity` | `string` | Yes | Relative path to identity file from agency root. |
| `maxConcurrent` | `number` | Yes | Maximum concurrent instances of this bunk. |

### Enum Values

**Type:** `orchestrator`, `worker`

**Department:** `INTELLIGENCE`, `INTEGRATION`, or `null`

**Tier:** `0` (L0 — shore-side command), `1` (L1 — submarine CO), `2` (L2 — department heads), `3` (L3 — workers)

Tier describes **command depth** (who dispatches you), not role.
Type describes **role** (orchestrator = routing, worker = production).
These are orthogonal.

### Bunk ID Format

Pattern: `B-XXX` where `XXX` is a zero-padded three-digit number.

Regex: `/^B-\d{3}$/`

---

## Constraints

1. **Unique callsigns** — no two entities may share a callsign.
2. **Valid parent references** — `parent` must reference an existing bunk in the same file, or be `null`.
3. **Tier consistency** — L1 entities have L0 parents; L2 entities have L1 parents; L3 entities have L2 parents.
4. **Department consistency** — L3 workers belong to the same department as their L2 parent.

---

## Governance

- **Owner:** CIC (Admiral triggers via automated protocols).
- **Consumers:** Dashboard server (`registry.ts` loader), parsers, UI (via `/api/registry`).
- **Change process:** Edit `shared/roster.json`, restart dashboard. Validation errors block startup.
