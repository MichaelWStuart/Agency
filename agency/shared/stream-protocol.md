# Stream Logging Protocol
Moored: Ship's Status Board / EOOW Log (Naval Engineering Watch)

> Canonical agent stream format. Role-specific event vocabularies
> remain in identity files. This file defines the shared protocol.

---

## Destination

Single-bunk identities log to: `~/.claude/agency-workspace/streams/B-NNN.md`

Multi-bunk identity templates (Field Agent, Integration Engineer) use the
CALLSIGN from their BRIEF as the stream filename: `streams/{CALLSIGN}.md`
(e.g., `streams/Hawk.md`, `streams/Atlas.md`).

---

## Format

Each row: `| {ISO-8601 UTC} | {EVENT} | {Detail <=100 chars} |`

On first write, create the file with this header:

```
| Time | Event | Detail |
| ---- | ----- | ------ |
```

---

## Rules

- Append immediately on each operational step — do not batch or defer
- Entries are append-only — never edit or delete previous entries
- Events use the vocabulary defined in the agent's identity file
