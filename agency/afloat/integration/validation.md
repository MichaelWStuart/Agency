# Verification

> All the verifying. Receives the product and inspects it independently.
> Verification does not build. Verification does not advise the builder.

---

## Department I/O

**Input:** Branch state (from Station Worker via orchestrator dispatch)
**Output:** QC_RETURN with Gate Report

Verification runs as an independent sub-agent (BOUNDARY). The Inspector operates
in complete isolation from the build context — no shared context with
the Station Worker. This is true independence: the Inspector does not
know what the builder intended, only what the product looks like.

Log events: see `model-shop.md` Event Codes (VERIF department).

---

## Independence

Verification is structurally isolated from Construction.

- The Inspector is dispatched by the orchestrator after Station Worker returns
- The Inspector receives only the branch name, WO ID, and reference artifacts
- The Inspector does not see Work Order intent, station values, or build rationale
- Verification evaluates the product, not the process

---

## Gates

All must pass. Cheapest first.

### 1. Validation

Project linters, type checks, formatters, test suites.
```
pnpm typecheck
pnpm run format:check
pnpm knip
pnpm test
```

### 2. Failure Class Audit

Modified files checked against known failure patterns.
**Load:** Quality Manual (`memory/project/failure-class-catalog.md`)

For each modified file, check applicability of each FC. Run the
FC's check procedure against the code.

### 3. Browser QA

Dev server running. Navigate affected pages.
- Data renders correctly
- No console errors
- Interactive features work
- Visual consistency with reference app

**Load (if available):** Dossier artifact at pointer path from QC_BRIEF.
Use dossier findings as the reference for visual and behavioral verification.

**Mandatory.** Cannot be skipped.

After completion, stop dev server:
```bash
lsof -ti:3002 | xargs kill -9
lsof -ti:3000 | xargs kill -9
```

### 4. Network Behavior

If product implements data ops (search, filter, sort, pagination),
verify against reference behavior spec.
**Load:** Dossier artifact at pointer path (network behavior findings)
or `docs/reference/{domain}/network-behavior.md` (if exists)

### 5. E2E Tests

If test suites exist for affected areas:
```
pnpm exec playwright test {relevant dir} --reporter=list
```

### 6. Verdict

**Prerequisite — completeness check:** Before issuing a verdict, verify
that gates 1-5 each have an explicit status in the Gate Report (see
below). Gate 3 (Browser QA) CANNOT be N/A. If any gate is missing a
verdict line -> the Verdict is **FAIL (incomplete report)**.

All gates passed -> **QC PASS** -> return QC_RETURN with OVERALL_VERDICT: PASS

Any gate failed -> **QC FAIL** -> return QC_RETURN with OVERALL_VERDICT: FAIL
and FAILURE_DETAILS listing each failed gate.

New generalizable failure pattern identified -> **New Error Class:**
- Add to Quality Manual (`failure-class-catalog.md`)
- Log to `jobs/log.md`

---

## Gate Report

Every Verification run MUST produce a Gate Report per `templates.md` (gate-report-v1)
as part of QC_RETURN. This is the sub-agent's proof of execution. The
orchestrator uses it to verify that Verification actually ran — a bare "all gates
passed" without a Gate Report is rejected.

**Rules:**
- Every gate gets exactly one entry. Missing gates = incomplete = rejected.
- Gate 3 cannot be N/A. It is always mandatory.
- Gates 4 and 5 may be N/A with a reason.
- FAIL entries must include the failure detail.
- The Gate Report is included in QC_RETURN for orchestrator verification.

---

## Circuit Breakers

See `model-shop.md` Circuit Breakers for canonical limits.
Verification-relevant: rework cycles (5), browser QA retries (5).

---

## Feed-Forward

On pass -> orchestrator returns MODEL_SHOP_RETURN to Captain (Captain handles docking)
On fail -> orchestrator dispatches Station Worker for rework (PROD.REWORK)
