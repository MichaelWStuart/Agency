# Entity Registry Schema

> Documents the structure of `cic/registry.json` — the single source of truth for all Agency entities.

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
| `version` | `number` | Schema version (currently `2`). Increment on breaking changes. |
| `entities` | `object` | Map of bunk ID → entity definition. |

### Entity Fields

| Field | Type | Required | Description |
|---|---|---|---|
| `callsign` | `string` | Yes | Unique short name (e.g., `"Admiral"`, `"Hawk"`). |
| `role` | `string` | Yes | Full role title (e.g., `"Admiral"`, `"Chief Analyst"`). |
| `facility` | `enum` | Yes | Organizational facility. |
| `division` | `enum \| null` | Yes | Operational division, or `null` for non-divisional. |
| `tier` | `enum` | Yes | Hierarchy tier. |
| `parent` | `string \| null` | Yes | Parent bunk ID, or `null` for root entities. |

### Enum Values

**Facility:** `WARDROOM`, `BARRACKS`

**Division:** `INTELLIGENCE`, `MODEL_SHOP`, or `null`

**Tier:** `0` (L0 — shore-side command), `1` (L1 — submarine CO), `2` (L2 — department heads), `3` (L3 — workers)

Tier describes **command depth** (who dispatches you), not role.
Facility describes **role** (Wardroom = orchestrators, Barracks = workers).
These are orthogonal.

### Bunk ID Format

Pattern: `B-XXX` where `XXX` is a zero-padded three-digit number.

Regex: `/^B-\d{3}$/`

---

## Constraints

1. **Unique callsigns** — no two entities may share a callsign.
2. **Valid parent references** — `parent` must reference an existing bunk in the same file, or be `null`.
3. **Tier consistency** — L1 entities have L0 parents; L2 entities have L1 parents; L3 entities have L2 parents.
4. **Division consistency** — L3 workers belong to the same division as their L2 parent.

---

## Governance

- **Owner:** CIC (Admiral triggers via automated protocols).
- **Consumers:** Dashboard server (`registry.ts` loader), parsers, UI (via `/api/registry`).
- **Change process:** Edit `registry.json`, restart dashboard. Validation errors block startup.
