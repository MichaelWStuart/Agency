# Barracks Roster

> Worker registry. Identities that produce substantive work.

---

## Identity Templates

Identity files are role templates. Bunks are instances. Each template
defines the maximum concurrent deployments an orchestrator may run.

| Identity Template | Max Concurrent | Bunks | Notes |
|---|---|---|---|
| Field Agent | 2 | B-005 (Hawk), B-007 (Kite) | Parallel evidence capture |
| Desk Analyst | 1 | B-006 (Scribe) | Analysis is sequential |
| Station Worker | 2 | B-008 (Mason), B-010 (Slate) | Enables 2-station WOs |
| Inspector | 1 | B-009 (Quinn) | Independently deployed by orchestrator after station return |

---

## Bunks

See `cic/registry.json` for canonical entity data. Barracks: B-005 through B-010.

All barracks identities are **workers** (ISOLATION). They produce
substantive output — code, evidence, dossiers, quality verdicts.
They do not route or dispatch.

---

## Instantiation Protocol

1. Parent selects instruction IDs from `contracts/catalog.md` catalog
2. Parent composes LAUNCH_BRIEF (STATION_BRIEF, QC_BRIEF, FIELD_BRIEF, or DESK_BRIEF) with identity file path
3. Sub-agent loads identity file on entry
4. Identity file defines: persona, permissions, context contract
5. Sub-agent operates within identity constraints
6. Sub-agent produces RETURN per contract

Orchestrators deploy up to complement per identity template, never more.
