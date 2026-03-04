# Agency Data Spine — Cutover Checklist

Executed when the workbench is ready to become the live system.
Do NOT execute until all pre-flight checks pass.

---

## Pre-flight

```
[ ] Verify all saga-guard tests pass:
    node saga-guard/test/run.js

[ ] Verify query layer works:
    node .data/rebuild.js && node .data/query.js events --last 5

[ ] Verify event writer works:
    Pipe test fixture through guard, check events.jsonl

[ ] Run migrate.js against live memory/events/ to backfill JSONL:
    node .data/migrate.js

[ ] Verify rebuild.js ingests missions + dossiers from live memory/

[ ] Complete any pending hubshot operations (no in-flight dives)
```

---

## Cutover Sequence

```
[ ] 1. Backup live skill:
       cp -r ~/.claude/skills/agency/ ~/.claude/skills/agency-backup-$(date +%Y%m%d)/

[ ] 2. Sync live operational data into this repo:
       - Copy live memory/missions/ → this repo's memory/missions/
       - Copy live memory/dossiers/ → this repo's memory/dossiers/
       - Copy live memory/events/ → this repo's memory/events/
       - Copy live memory/project/ → this repo's memory/project/
       - Copy live memory/chart.yaml, config.md, work-log.md

[ ] 3. Run migration:
       node .data/migrate.js
       node .data/rebuild.js

[ ] 4. Deploy bootloader:
       cp deploy/bootloader-SKILL.md ~/.claude/skills/agency/SKILL.md

[ ] 5. Apply admiral muster patch:
       (Edit agency/shore/admiral.md muster section per deploy/admiral-muster-patch.md)

[ ] 6. Apply CIC boot patch:
       cp deploy/boot-sh-patch.sh agency/cic/boot.sh

[ ] 7. Update agency SKILL.md path references:
       (Replace memory/ paths with AGENCY_HOME-relative paths)

[ ] 8. Slim project-memory MEMORY.md to pointer:
       echo "Agency root: /Users/michaelstuart/Agency" > ~/.claude/projects/{hash}/memory/MEMORY.md

[ ] 9. Wire saga-guard hooks in settings.json:
       Add PreToolUse/PostToolUse hook entries:
       {
         "hooks": {
           "PreToolUse": [
             { "matcher": "Agent", "hooks": [{ "type": "command", "command": "node /Users/michaelstuart/Agency/saga-guard/guard.js" }] }
           ],
           "PostToolUse": [
             { "matcher": "Agent", "hooks": [{ "type": "command", "command": "node /Users/michaelstuart/Agency/saga-guard/guard.js" }] },
             { "matcher": "Write|Edit", "hooks": [{ "type": "command", "command": "node /Users/michaelstuart/Agency/saga-guard/guard.js" }] }
           ]
         }
       }

[ ] 10. Smoke test:
        Invoke /agency from hubshot. Verify muster queries work.
        Run a lightweight operation. Verify events.jsonl populates.
        Verify guard catches a deliberate violation.
```

---

## Rollback

```
cp -r ~/.claude/skills/agency-backup-{date}/ ~/.claude/skills/agency/
```

Project memory is untouched until step 8, so rollback is just restoring the skill directory.

---

## Post-cutover Cleanup

After confirming stable operation for 24 hours:

```
[ ] Remove agency-backup-{date}/ directory
[ ] Archive old project memory MEMORY.md content
[ ] Verify events.jsonl is growing with new operations
[ ] Run rebuild.js to confirm index stays current
```
