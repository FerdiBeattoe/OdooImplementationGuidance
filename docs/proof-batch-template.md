# Governed Proof Batch Template — Odoo 19 Implementation Control Platform

Version: 1.0 — 2026-04-04
Grounded in: Foundation + Users/Roles live-proven execution on test236

This template is reusable across all future governed proof batches. Only the VARIABLE INPUTS block
changes per batch. The FIXED EXECUTION and FIXED OUTPUT EVIDENCE sections are invariant.

Do not modify the fixed sections without a governance decision and decision-log entry.

---

## Governing invariants (non-negotiable across all batches)

- No execution without: preview shown, safety class assigned, auditability confirmed (R1).
- No checkpoint skipped, deferred, or implied optional (R2).
- No direct database writes (R3).
- Domain activation requires completed discovery pass (R4).
- Stage routing blocked if predecessor checkpoint is unresolved (R5).
- Configuration completion is not operational readiness (readiness axiom).
- Never print credentials.
- Fail closed if target IDs or intended write cannot be determined exactly.

---

## Execution mode selector

Before executing, determine which mode applies to this checkpoint.

| Mode | When | Completion evidence |
|------|------|---------------------|
| A — Governed apply | validation_source is Executable or Both; safety_class is Safe or Conditional | checkpoint_statuses[checkpoint_id]="Complete" in updated_runtime_state |
| B — User_Confirmed informational | validation_source is User_Confirmed; execution_relevance is Informational | /api/pipeline/checkpoint/confirm returns ok:true; checkpoint_statuses persisted |
| C — Hybrid / Both with Executable write | validation_source is Both; execution_relevance is Executable | Mode A path only; /api/pipeline/checkpoint/confirm is INVALID for this mode (server rejects non-User_Confirmed) |

Modes A and C both flow through the governed apply path. Mode B flows through the confirm route.
Do not mix routes within a single checkpoint.

---

## VARIABLE INPUTS — change per batch

```
checkpoint_id:          <e.g. MAS-FOUND-001>
safety_class:           <Safe | Conditional | Blocked | Not_Applicable>
validation_source:      <Executable | User_Confirmed | Both>
execution_relevance:    <Executable | Informational>
execution_mode:         <A | B | C>  (derived from table above)
actor:                  <email of the confirming user, e.g. ferdinand.beattie@gmail.com>

carry_over_block:
{
  "FND-FOUND-001": "Complete",
  "FND-FOUND-002": "Complete",
  "FND-DREQ-001":  "Complete",
  "FND-FOUND-004": "Complete",
  "FND-FOUND-005": "Complete",
  "FND-DREQ-002":  "Complete",
  "USR-FOUND-001": "Complete",
  "USR-FOUND-002": "Complete",
  "USR-DREQ-001":  "Complete",
  "USR-DREQ-002":  "Complete",
  "USR-DREQ-003":  "Complete"
  // append newly completed checkpoints after each batch
}

bounded_read_step:      <exact bounded read required to derive target IDs or payload>
                        Examples:
                        - "POST /api/odoo/read { model:'res.partner', ids:[...], fields:[...] }"
                        - "POST /api/pipeline/run with checkpoint_statuses only (no apply) to inspect candidate"
                        - "None — informational checkpoint, no write required"

checkpoint_specific_confirmation_rule:
                        <Only populated for Mode B. Describes what evidence and actor text to supply.>
                        Examples:
                        - "evidence: 'Verified N partners in res.partner; data quality confirmed by actor'"
                        - "Not applicable — Mode A or C"
```

---

## FIXED EXECUTION — do not change between batches

Steps are numbered. Steps marked [MODE A/C] apply only to governed apply batches.
Steps marked [MODE B] apply only to User_Confirmed informational batches.
Steps marked [ALL] apply regardless of mode.

### Step 1 — Verify active connection [ALL]

Confirm the active connection record is present and not expired.
If connection is missing or expired: restore from connections.json or re-authenticate.
Do not proceed without a verified active connection.

Endpoint (read-only probe): `GET /api/connections`
Expected: project_id = test236, status = connected or equivalent active state.

### Step 2 — Load persisted runtime state [ALL]

`POST /api/pipeline/state/load`
Body: `{ "project_id": "test236" }`

Store the full persisted runtime_state. This is the authoritative baseline.
Read `project_identity` from it — required for merge in Step 8.
Read existing `_engine_outputs.executions` from it — required for merge in Step 8.

### Step 3 — Execute bounded read to derive exact target [MODE A/C]

Execute the bounded_read_step defined in VARIABLE INPUTS.
Record exact values: model, ids, field names, current field values.
If the target cannot be determined exactly: halt. Do not estimate. Do not proceed.
If this is Mode B: skip to Step 4.

### Step 4 — Run pipeline (preview) with carry-over [ALL]

`POST /api/pipeline/run`

```json
{
  "project_id": "test236",
  "checkpoint_statuses": { <carry_over_block from VARIABLE INPUTS> },
  "approval_context": { "approval_granted_by": "<actor>" }
}
```

Do not omit approval_context. Without it, execution_approvals is empty and governed apply cannot proceed.
Do not omit checkpoint_statuses. Without it, previously completed checkpoints revert to Not_Started.

Verify in response:
- checkpoints[checkpoint_id].status = "Not_Started" (not yet complete, correct)
- All prior completed checkpoints still show status = "Complete" (carry-over confirmed)
- execution_approvals contains at least one record with checkpoint_id = checkpoint_id
- approval.preview_id is present
- approval.approval_id is present
- approval.safety_class matches expected value from VARIABLE INPUTS

If approval record is absent: halt. Do not proceed to apply.
If safety_class does not match: halt. Surface the discrepancy before proceeding.

For Mode B: verify checkpoints[checkpoint_id].validation_source = "User_Confirmed". Then skip to Step 6B.

### Step 5 — Review preview and confirm safety class [MODE A/C]

Read the operation from the approval record:
- model
- method (expected: write or create, not unlink)
- ids or values

Confirm these match the bounded_read_step output from Step 3.
If there is any discrepancy between the preview and the Step 3 evidence: halt.

Safety class gate:
- Safe: proceed directly.
- Conditional: connection probe required before apply. Confirm connection is still active.
- Blocked: halt. Do not apply. Surface the blocker.
- Not_Applicable: this is Mode B. You are on the wrong path.

### Step 6A — Apply governed operation [MODE A/C]

`POST /api/pipeline/apply`

```json
{
  "project_id": "test236",
  "approval_id": "<approval.approval_id from Step 4>",
  "runtime_state": <persisted runtime_state from Step 2>
}
```

Expected response:
- `ok: true`
- `updated_runtime_state.checkpoint_statuses[checkpoint_id]` = "Complete"
- `updated_runtime_state._engine_outputs.executions[last].result_status` = "success"
- `updated_runtime_state._engine_outputs.executions[last].odoo_result` = true
- `execution_id` present on execution record

Record: execution_id, odoo_result, result_status, executed_at.

If ok is false or odoo_result is false: halt. Do not save. Do not proceed.

### Step 6B — Confirm User_Confirmed checkpoint [MODE B]

`POST /api/pipeline/checkpoint/confirm`

```json
{
  "project_id": "test236",
  "checkpoint_id": "<checkpoint_id>",
  "status": "Complete",
  "evidence": "<evidence string from checkpoint_specific_confirmation_rule>",
  "actor": "<actor>"
}
```

Expected response: `{ "ok": true, "runtime_state": { ... } }`
The route auto-loads, mutates, and auto-saves state. No manual merge or save required.
Verify: `runtime_state.checkpoint_statuses[checkpoint_id]` = "Complete"
Record: confirmed_at from runtime_state.checkpoint_confirmations[checkpoint_id].
Then skip to Step 9.

### Step 7 — Build merged runtime_state for save [MODE A/C]

The updated_runtime_state from Step 6A carries only the current checkpoint status.
It also has project_identity: null unless you supplied it in the run input.

Build the merged object:

```
merged_runtime_state = {
  ...updated_runtime_state,
  checkpoint_statuses: {
    ...carry_over_block,                          // all prior proven statuses
    [checkpoint_id]: "Complete"                    // newly completed
  },
  project_identity: <project_identity from Step 2 persisted state>,
  _engine_outputs: {
    ...updated_runtime_state._engine_outputs,
    executions: [
      ...<prior executions from Step 2 persisted state>,
      ...<executions from updated_runtime_state._engine_outputs.executions>
    ]
  }
}
```

Do not save updated_runtime_state directly. Always merge.

### Step 8 — Save merged runtime_state [MODE A/C]

`POST /api/pipeline/state/save`

Body: the merged_runtime_state object directly (not wrapped in { project_id, runtime_state }).

Expected: 200 ok or equivalent success acknowledgment.

### Step 9 — Load and verify persistence [ALL]

`POST /api/pipeline/state/load`
Body: `{ "project_id": "test236" }`

Verify:
- `checkpoint_statuses[checkpoint_id]` = "Complete"
- All prior carry-over statuses still present
- project_identity is non-null

### Step 10 — Rerun pipeline and verify final state [ALL]

`POST /api/pipeline/run`

```json
{
  "project_id": "test236",
  "checkpoint_statuses": { <updated carry_over_block including checkpoint_id: "Complete"> },
  "approval_context": { "approval_granted_by": "<actor>" }
}
```

Verify:
- `checkpoints[checkpoint_id].status` = "Complete" (not reverted)
- All prior completed checkpoints still "Complete"
- Next unblocked checkpoint is visible and has expected status

This rerun output is the authoritative evidence of truthful persistence.

---

## FIXED OUTPUT EVIDENCE — record per batch

After each batch, record the following before closing:

```
checkpoint_id:         <value>
execution_mode:        <A | B | C>
odoo_write:            <true | false | not_applicable>
model:                 <e.g. res.partner | not_applicable>
ids:                   <e.g. [5] | not_applicable>
values:                <e.g. { name: "..." } | not_applicable>
odoo_result:           <true | not_applicable>
execution_id:          <UUID | not_applicable>
approval_id:           <UUID | not_applicable>
executed_at:           <ISO timestamp | not_applicable>
safety_class:          <value>
confirmed_at:          <ISO timestamp — Mode B only | not_applicable>
actor:                 <email>
rerun_status:          <Complete — confirmed in Step 10>
updated_carry_over:    <full updated carry_over_block to paste into next batch VARIABLE INPUTS>
```

---

## CLAUDE.md carry-over block maintenance rule

After each batch completes and rerun is verified:

1. Add the newly completed checkpoint_id: "Complete" to the carry_over_block in CLAUDE.md.
2. Update the Live proof state table in CLAUDE.md with the new entry.
3. Update the Next milestone line in CLAUDE.md to reflect the next unblocked checkpoint.

Do not update CLAUDE.md before Step 10 rerun verification passes.

---

## Hard stops — never bypass

- Step 3 derives no exact target: halt.
- Step 4 approval record is absent: halt.
- Step 4 safety_class mismatch: halt.
- Step 5 preview does not match Step 3 evidence: halt.
- Step 6A ok=false or odoo_result=false: halt.
- Step 9 checkpoint_statuses not persisted: halt.
- Step 10 checkpoint.status reverted: halt.
- Any step requests a direct database write: refuse (R3).
- Any step requests a checkpoint bypass: refuse (R2).
