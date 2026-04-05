# Stage Routing and Readiness Engine

## Purpose

This document defines the engine that converts activated domains and generated
checkpoints into a governed implementation journey. It controls stage sequencing,
next-action resolution, domain and stage completion status, go-live readiness
assessment, and save-and-resume behavior.

This engine sits above the Domain Activation Engine (which decides *what* is in scope)
and the Checkpoint Engine (which defines *what work* each domain contains). This engine
decides *when* and *in what order* that work is presented, and *when the project is
ready*.

---

## Part 1 — Stage Routing Model

### 1.1 Stage List

The following stages match the Implementation Master Map
(`docs/03_Implementation_Master_Map.md`). Stage IDs are stable and must not change.

| Stage ID | Stage Name | Stage Order |
|---|---|---|
| S01 | Entry / Project Setup | 1 |
| S02 | Business Assessment | 2 |
| S03 | System Discovery | 3 |
| S04 | Foundation | 4 |
| S05 | Users / Roles / Security | 5 |
| S06 | Master Data | 6 |
| S07 | Core Operations | 7 |
| S08 | Finance | 8 |
| S09 | Extended Modules | 9 |
| S10 | Validation | 10 |
| S11 | Go-Live Readiness | 11 |
| S12 | Post Go-Live / Phase 2 | 12 |

### 1.2 Stage Entry Conditions

A stage may be entered (become the active working stage) only when its entry
conditions are satisfied. Entry does not mean complete — it means work can begin.

| Stage | Entry Conditions |
|---|---|
| S01 | Always — this is the starting point for every project |
| S02 | S01 exit criteria met (project identity recorded, project mode selected, target matrix confirmed) |
| S03 | S02 exit criteria met (all Required discovery questions answered; domain activation engine has run; activated domain list is finalized) |
| S04 | S03 exit criteria met (system baseline recorded for project mode; current vs. planned domain status distinguished) |
| S05 | S04 status is Complete or all S04 Foundational checkpoints are Complete (partial entry allowed — S04 Domain_Required checkpoints may still be In_Progress). **S04/S05 overlap rule:** When S05 is entered while S04 Domain_Required checkpoints remain In_Progress, both stages are concurrently active. The next-action engine treats S04 as the higher-priority stage: any actionable S04 checkpoint outranks any S05 checkpoint at the same priority level. S04 blockers and in-progress items are evaluated before S05 items. This overlap terminates when S04 reaches Complete. Unlike S07/S08, this is a predecessor-overlap, not a co-dependency — S05 work may proceed on checkpoints whose S04 dependencies are already met. |
| S06 | S04 Foundational checkpoints are Complete; S05 Foundational checkpoints are Complete |
| S07 | S04 is Complete; S05 is Complete; S06 is Complete; Finance policy checkpoints required by Core Operations are Complete or Deferred (see S08 co-dependency rule) |
| S08 | S04 is Complete; S06 is Complete (Finance can begin in parallel with S07 — see co-dependency rule below) |
| S09 | S07 dependent domains for each extended module are Complete or Deferred; S08 dependent checkpoints for each extended module are Complete or Deferred |
| S10 | All Required and Go_Live checkpoints across all activated domains are either Complete, Deferred, or Blocked with documented reasons |
| S11 | S10 is Complete |
| S12 | S11 is Complete (go-live recommendation issued or explicitly withheld with acceptance) |

### 1.3 S07/S08 Co-Dependency Rule

The Implementation Master Map states that Finance cannot be treated as a late
cosmetic layer. This creates a co-dependency between S07 (Core Operations) and
S08 (Finance) that must be handled explicitly:

**Rule:** S07 and S08 may both be entered once S04 and S06 are Complete. However:

- S07 domain checkpoints that depend on Finance policy checkpoints (as defined in
  the Checkpoint Engine cross-domain dependency map) remain **Blocked** until those
  specific S08 checkpoints are Complete or Deferred.
- S08 domain checkpoints that depend on operational policy (e.g., invoicing policy
  requires Sales order workflow to be understood) remain **Blocked** until those
  specific S07 checkpoints are Complete.
- The platform must surface these cross-stage blocks explicitly, not silently
  prevent stage entry.

**Effect:** S07 and S08 are worked in parallel, with specific checkpoint-level
blocking enforcing the correct dependency order. Neither fully blocks the other
at stage level.

### 1.4 Stage Exit Conditions

A stage may be exited (marked Complete at stage level) only when its exit conditions
are satisfied.

| Stage | Exit Conditions |
|---|---|
| S01 | Project identity fields populated; project mode selected; target Odoo version = 19; edition and deployment type recorded; project owner identified |
| S02 | All Required discovery questions answered; conditional questions answered where conditions were met; domain activation engine executed; activated domain list confirmed by project owner |
| S03 | Implementation baseline record created; current domain status map populated (for expansion/guided-setup modes); for fresh implementation: baseline is "no existing state" — still requires explicit confirmation; no discovery item framed as repair |
| S04 | All Foundation domain (`foundation`) Foundational and Domain_Required checkpoints are Complete |
| S05 | All Users/Roles domain (`users_roles`) Foundational and Domain_Required checkpoints are Complete |
| S06 | All Master Data domain (`master_data`) Foundational and Domain_Required checkpoints are Complete |
| S07 | All activated Core Operations domain Foundational and Domain_Required checkpoints are Complete or Deferred; Go_Live checkpoints are Complete, Deferred, or have documented blockers |
| S08 | All activated Accounting domain Foundational and Domain_Required checkpoints are Complete; Go_Live checkpoints are Complete, Deferred, or have documented blockers |
| S09 | All activated Extended Module domain Foundational and Domain_Required checkpoints are Complete or Deferred; Recommended and Optional checkpoints are Complete, Deferred, or acknowledged as Phase 2 |
| S10 | Validation summary generated; unresolved blocker register reviewed; evidence completeness confirmed for all Required and Go_Live checkpoints; no Foundational checkpoint is Blocked without documented reason |
| S11 | Go-live recommendation issued or explicitly withheld; all go-live blockers resolved or acceptance explicitly recorded; training requirements addressed if mandated by project owner |
| S12 | No formal exit — Phase 2 is an ongoing governance context |

### 1.5 Stage Blocking Conditions

A stage is **Blocked** when its entry conditions are met but work cannot proceed
due to active blockers.

| Blocking Condition | Affected Stage | Resolution |
|---|---|---|
| Predecessor stage has unresolved Foundational checkpoint failures | Any stage after S04 | Complete or resolve the failing Foundational checkpoint in predecessor stage |
| Cross-domain dependency checkpoint is Blocked in upstream domain | S07, S08, S09 | Complete the upstream checkpoint that this stage's checkpoints depend on |
| Project owner confirmation required but not provided | S02 (domain activation), S10 (validation), S11 (go-live) | Obtain project owner confirmation |
| Environment or connection context missing for system-detectable checkpoints | S03 (discovery), S07–S09 (where inspection is needed) | Establish connection context or convert to User_Confirmed validation |
| Branch/environment target undefined for Odoo.sh deployment-sensitive changes | S07, S08, S09 | Record explicit branch/environment target |

### 1.6 Stage Deferment Handling

Stages themselves cannot be deferred. Only individual checkpoints within a stage may
be deferred (subject to the Checkpoint Engine's deferment rules).

When multiple checkpoints within a stage are deferred:
- The stage can still exit as Complete if all remaining non-deferred Required and
  Domain_Required checkpoints are Complete.
- Deferred checkpoints flow into S12 (Post Go-Live / Phase 2) as the deferred work
  backlog.
- The stage's status shows "Complete with deferrals" (distinct from clean "Complete").

### 1.7 Stage Dependency Graph

```
S01 → S02 → S03 → S04 → S05 → S06 ─┬→ S07 ─┐
                                     │       ├→ S09 → S10 → S11 → S12
                                     └→ S08 ─┘
```

S07 and S08 run in parallel after S06. S09 begins when its specific domain
dependencies in S07 and S08 are met (not necessarily when S07 and S08 are fully
complete). S10 requires all operational work to be in a reviewable state.

---

## Part 2 — Domain-to-Stage Assignment Rules

Every activated domain has a **primary stage** (where its main configuration work
lives) and optionally **secondary stage presence** (where cross-stage dependencies
surface that domain's checkpoints).

### 2.1 Assignment Table

| Domain ID | Primary Stage | Secondary Stage Presence | Roadmap Visibility Rule |
|---|---|---|---|
| foundation | S04 | None | Always visible from S04 onward |
| users_roles | S05 | S07, S08, S09 (approver checkpoints surface when dependent domains need them) | Always visible from S05 onward |
| master_data | S06 | S07, S08, S09 (data readiness surfaces when dependent domains need records) | Always visible from S06 onward |
| crm | S07 | None | Visible from S07 when activated |
| sales | S07 | S08 (invoicing policy linkage) | Visible from S07 when activated |
| purchase | S07 | S08 (billing policy linkage) | Visible from S07 when activated |
| inventory | S07 | S08 (valuation linkage) | Visible from S07 when activated |
| manufacturing | S07 | S08 (costing linkage) | Visible from S07 when activated |
| accounting | S08 | S07 (Finance policy checkpoints that block S07 domains surface as cross-stage blockers) | Visible from S08 when activated; cross-stage blocker view available in S07 |
| pos | S07 | S08 (journal linkage) | Visible from S07 when activated |
| website_ecommerce | S09 | S07 (Sales dependency) | Visible from S09 when activated |
| projects | S07 or S09 (see rule below) | S08 (analytic linkage) | Visible from primary stage when activated |
| hr | S09 | None | Visible from S09 when activated |
| quality | S09 | S07 (Inventory/MRP dependency) | Visible from S09 when activated |
| maintenance | S09 | S07 (MRP dependency) | Visible from S09 when activated |
| repairs | S09 | S07 (Inventory/Sales dependency) | Visible from S09 when activated |
| documents | S09 | None | Visible from S09 when activated |
| sign | S09 | None | Visible from S09 when activated |
| approvals | S09 | S05 (approval role dependency) | Visible from S09 when activated |
| subscriptions | S09 | S07 (Sales dependency), S08 (journal dependency) | Visible from S09 when activated |
| rental | S09 | S07 (Inventory/Sales dependency) | Visible from S09 when activated |
| field_service | S09 | S07 (Projects/Inventory dependency) | Visible from S09 when activated |

### 2.2 Projects Domain Stage Rule

The Projects domain assignment depends on the business classification:

- If BM-01 = `Services only` → Projects is assigned to **S07** (Core Operations),
  because it is the primary operational domain.
- If BM-01 != `Services only` → Projects is assigned to **S09** (Extended Modules),
  because it is supplementary to product-based operations.

### 2.3 Domain Visibility States

Each domain in the roadmap has one of five visibility states at any point:

| State | Meaning | When |
|---|---|---|
| **Hidden** | Domain is not shown in the roadmap | Domain is excluded (activation conditions not met) |
| **Visible (Locked)** | Domain appears in the roadmap but cannot be worked | Primary stage has not been entered; or domain-level blockers are active |
| **Visible (Active)** | Domain can be worked; checkpoints are accessible | Primary stage is entered and domain-level blockers are resolved |
| **Visible (Deferred)** | Domain appears with deferred indicator | All domain checkpoints are Deferred; domain moved to Phase 2 |
| **Visible (Complete)** | Domain appears with completion indicator | All Required and Domain_Required checkpoints are Complete; Go_Live checkpoints are Complete or Deferred |

### 2.4 Domain Appears-in-Roadmap Rule

A domain appears in the roadmap (transitions from Hidden to any Visible state) when:
1. The Domain Activation Engine has activated it (S02 is Complete), AND
2. The project has reached or passed S04 (Foundation).

Before S02 is Complete, no domains appear in the roadmap (activation is not finalized).
Between S02 Complete and S04 entry, domains appear in a preview list (showing the
activated scope) but are all Locked.

---

## Part 3 — Next Required Action Logic

The platform must always be able to answer: "What should the user do next?" This is
computed deterministically, not by AI suggestion.

### 3.1 Action Resolution Priority

The engine evaluates the following in strict priority order. The **first** match
produces the next required action. Evaluation stops at the first match.

```
Priority 1: STAGE ENTRY BLOCKER
  IF the current stage cannot be entered due to predecessor exit criteria:
    → Action: "Complete [predecessor stage] — [specific unmet exit criterion]"
    → Target: the specific incomplete checkpoint or missing confirmation
             in the predecessor stage

Priority 2: FOUNDATIONAL CHECKPOINT BLOCKER
  IF any Foundational checkpoint in the current stage is Blocked:
    → Action: "Resolve blocker on [checkpoint_name] — [blocked_reason]"
    → Target: the specific Foundational checkpoint with blocker_flag = true
  Evaluate in checkpoint_id order within the current stage.

Priority 3: CROSS-DOMAIN DEPENDENCY BLOCKER
  IF any checkpoint in the current stage is Blocked due to an upstream
  cross-domain dependency (from the Checkpoint Engine dependency map):
    → Action: "Complete [upstream_checkpoint_name] in [upstream_domain]
              before [downstream_checkpoint_name] can proceed"
    → Target: the upstream checkpoint that is blocking progress
  Evaluate by upstream checkpoint stage order (S04 before S05 before S06,
  etc.), then by checkpoint_id within stage.

Priority 4: IN-PROGRESS FOUNDATIONAL CHECKPOINT
  IF any Foundational checkpoint in the current stage is In_Progress:
    → Action: "Complete [checkpoint_name] — [next missing evidence item]"
    → Target: the Foundational checkpoint, with specific missing evidence
  Evaluate in checkpoint_id order.

Priority 5: NOT-STARTED FOUNDATIONAL CHECKPOINT
  IF any Foundational checkpoint in the current stage is Not_Started:
    → Action: "Begin [checkpoint_name]"
    → Target: the first Not_Started Foundational checkpoint
  Evaluate in checkpoint_id order.

Priority 6: IN-PROGRESS DOMAIN REQUIRED CHECKPOINT
  IF any Domain_Required checkpoint in the current stage is In_Progress:
    → Action: "Complete [checkpoint_name] — [next missing evidence item]"
    → Target: the Domain_Required checkpoint, with specific missing evidence
  Evaluate by domain priority (Required > Go_Live > Recommended > Optional),
  then by checkpoint_id.

Priority 7: NOT-STARTED DOMAIN REQUIRED CHECKPOINT
  IF any Domain_Required checkpoint in the current stage is Not_Started
  AND its dependencies are met:
    → Action: "Begin [checkpoint_name]"
    → Target: the first eligible Not_Started Domain_Required checkpoint
  Evaluate by domain priority, then by checkpoint_id.

Priority 8: READY-FOR-REVIEW CHECKPOINT
  IF any checkpoint in the current stage is Ready_For_Review:
    → Action: "Review [checkpoint_name] — evidence is ready for validation"
    → Target: the Ready_For_Review checkpoint
  Evaluate by checkpoint class (Foundational > Domain_Required > Go_Live >
  Recommended > Optional), then by checkpoint_id.

Priority 9: GO-LIVE CHECKPOINT (in-progress or not-started)
  IF all Foundational and Domain_Required checkpoints in the current stage
  are Complete, and Go_Live checkpoints remain:
    → Action: "Complete [checkpoint_name]" or "Begin [checkpoint_name]"
    → Target: the Go_Live checkpoint
  Evaluate in checkpoint_id order.

Priority 10: STAGE EXIT ELIGIBLE
  IF all exit conditions for the current stage are met:
    → Action: "Mark [stage_name] as Complete and proceed to [next_stage_name]"
    → Target: stage transition

Priority 11: RECOMMENDED/OPTIONAL CHECKPOINT (non-blocking)
  IF all Required, Domain_Required, and Go_Live checkpoints are Complete,
  and Recommended or Optional checkpoints remain:
    → Action: "[checkpoint_name] is recommended — complete or defer"
    → Target: the checkpoint
    → Note: this is non-blocking; stage exit is already eligible
  Evaluate in checkpoint_id order.

Priority 12: NO ACTION AVAILABLE
  IF no actionable items exist and stage exit conditions are not met:
    → Action: "Waiting for external resolution — [specific blocked items]"
    → Target: list of Blocked checkpoints with their blocked_reasons
```

### 3.2 Multi-Stage Action Visibility

When S07 and S08 are both active (parallel stages), the next-action engine evaluates
across both stages simultaneously. Priority order applies globally:
- A Priority 2 blocker in S08 outranks a Priority 7 not-started checkpoint in S07.
- Cross-stage blockers (Priority 3) naturally surface the upstream action regardless
  of which stage the user is currently viewing.

### 3.3 Action Queue vs. Single Action

The engine computes a **single primary next action** (the highest-priority match) and
a **secondary action queue** (the next 3 actions in priority order). The dashboard
shows the primary action prominently and the queue as context.

The secondary queue helps the user understand what follows, but does not imply those
actions can be worked before the primary action. If a secondary action has no
dependency on the primary action, it may be worked in parallel (the platform
does not enforce strict serial execution within a priority level).

### 3.4 Action Scope Constraint

The next-action engine never recommends:
- Working in a stage that has not been entered
- Working on a checkpoint whose domain is Locked
- Working on a checkpoint whose dependencies are not met
- Executing a write where no preview exists
- Executing a write where the safety class is Blocked

---

## Part 4 — Status Aggregation Rules

### 4.1 Checkpoint → Domain Status Aggregation

A domain's status is computed from the statuses of all its checkpoints. The
aggregation uses worst-case escalation within checkpoint classes:

```
DOMAIN STATUS COMPUTATION:

1. IF any Foundational checkpoint is Blocked → Domain status = Blocked
2. IF any Foundational checkpoint is Not_Started or In_Progress
   → Domain status = In_Progress
3. IF any Domain_Required checkpoint is Blocked → Domain status = Blocked
4. IF any Domain_Required checkpoint is Not_Started or In_Progress
   → Domain status = In_Progress
5. IF all Foundational and Domain_Required checkpoints are Complete:
   a. IF any Go_Live checkpoint is Blocked → Domain status = In_Progress
      (not Blocked — the domain is progressing, just not go-live ready)
   b. IF any Go_Live checkpoint is Not_Started or In_Progress
      → Domain status = In_Progress
   c. IF all Go_Live checkpoints are Complete or Deferred
      → Domain status = Complete
6. IF all checkpoints are Deferred → Domain status = Deferred

DOMAIN STATUS VALUES:
  Not_Started    — no checkpoint has been worked
  In_Progress    — at least one checkpoint is being worked or is incomplete
  Blocked        — a Foundational or Domain_Required checkpoint is blocked
  Complete       — all Required and Go_Live checkpoints are Complete/Deferred
  Deferred       — entire domain is deferred to Phase 2
```

**Modifier flags** (applied alongside the domain status):

| Flag | Condition |
|---|---|
| `has_warnings` | Any checkpoint in the domain has a Warning validation result |
| `has_deferrals` | Any checkpoint in the domain is Deferred |
| `has_blocked_golive` | Any Go_Live checkpoint is Blocked (domain is In_Progress but go-live is blocked) |
| `has_review_pending` | Any checkpoint is Ready_For_Review |

### 4.2 Domain → Stage Status Aggregation

A stage's status is computed from the statuses of all domains assigned to it
(primary stage assignment only — secondary stage presence does not affect stage
status).

```
STAGE STATUS COMPUTATION:

1. IF stage entry conditions are not met → Stage status = Locked
2. IF stage entry conditions are met but no work has started
   → Stage status = Not_Started
3. IF any domain in this stage is Blocked (Foundational/Domain_Required level)
   → Stage status = Blocked
4. IF any domain in this stage is In_Progress
   → Stage status = In_Progress
5. IF all domains in this stage meet stage exit conditions
   → Stage status = Ready_For_Exit
6. IF stage exit has been confirmed
   → Stage status = Complete

STAGE STATUS VALUES:
  Locked         — entry conditions not yet met
  Not_Started    — entry conditions met, no work begun
  In_Progress    — at least one domain is being worked
  Blocked        — a domain has a blocking condition
  Ready_For_Exit — exit conditions met, awaiting confirmation
  Complete       — stage is formally complete (with or without deferrals)
```

**Stage modifier flags:**

| Flag | Condition |
|---|---|
| `has_deferrals` | Any domain in the stage has `has_deferrals` flag |
| `has_cross_stage_blockers` | Any checkpoint in this stage is blocked by an upstream checkpoint in another stage |
| `parallel_active` | This stage is active simultaneously with another stage (S07/S08) |

### 4.3 Stage → Overall Project Status Aggregation

The overall project status is a summary across all stages:

```
PROJECT STATUS COMPUTATION:

1. Compute: current_stage = highest-order stage with status In_Progress,
   Blocked, or Ready_For_Exit
2. Compute: completed_stages = count of stages with status Complete
3. Compute: total_stages = count of stages in scope
   (S12 is always counted; stages that contain only excluded domains
   are still counted but auto-complete)
4. Compute: blocked_count = count of Blocked checkpoints across all stages
5. Compute: deferred_count = count of Deferred checkpoints across all stages
6. Compute: warning_count = count of Warning validation results across all stages

PROJECT STATUS = {
  current_stage:     Stage ID (or array of Stage IDs if parallel)
  progress:          completed_stages / total_stages
  active_blockers:   blocked_count
  active_deferrals:  deferred_count
  active_warnings:   warning_count
  go_live_eligible:  boolean (see Part 5)
}
```

### 4.4 Status Display Rules

| What is displayed | Where | Rule |
|---|---|---|
| Overall project status | Dashboard header | Always visible |
| Stage status for each stage | Stage navigation panel | All stages visible; Locked stages shown greyed out |
| Domain status for each activated domain | Domain navigation panel and stage workspace | Only activated domains shown; excluded domains hidden |
| Checkpoint status | Domain workspace and checkpoint panel | Only for domains in Visible (Active) or Visible (Complete) state |
| Blocked checkpoints | Dashboard, stage workspace, domain workspace | Always surfaced prominently with blocked_reason |
| Deferred checkpoints | Dashboard, stage workspace, domain workspace | Always surfaced with deferred indicator and constraints |
| Warnings | Dashboard, affected checkpoint panel | Always surfaced; never hidden or auto-dismissed |

### 4.5 What Status Aggregation Must NOT Do

- Must not show a stage as Complete if any Foundational or Domain_Required
  checkpoint within it is Blocked or In_Progress.
- Must not show a domain as Complete if any Go_Live checkpoint is Blocked
  (it is In_Progress with a `has_blocked_golive` flag).
- Must not show overall progress as 100% if any blocker or required deferment
  review point is unresolved.
- Must not hide Blocked or Deferred items from any aggregated view.
- Must not treat a Deferred domain the same as a Complete domain in
  progress calculations (Deferred counts toward progress only when
  deferment is properly recorded with owner and constraints).
- Must not auto-advance stages. Stage completion requires explicit
  confirmation, not automatic rollover.

---

## Part 5 — Go-Live Readiness Rules

Go-Live Readiness is assessed at S11. It is a formal evaluation, not a progress bar
reaching 100%. The distinction between configuration completion and operational
readiness governs this section entirely.

### 5.1 Go-Live Readiness Statuses

| Status | Meaning |
|---|---|
| **Not Ready** | Required or Go_Live checkpoints remain incomplete; blockers unresolved |
| **Ready for Review** | All Required and Go_Live checkpoints are Complete or Deferred with proper constraints; validation summary exists; review has not been completed |
| **Ready for Go-Live Recommendation** | Review is complete; no unresolved blockers; all deferments have project owner sign-off; training requirements addressed (if mandated); go-live recommendation can be issued |
| **Blocked for Go-Live** | One or more non-deferrable Go_Live checkpoints are Blocked with unresolvable conditions; go-live cannot be recommended until these are resolved |

### 5.2 Go-Live Readiness Computation

```
COMPUTE go_live_readiness:

1. Collect all checkpoints with checkpoint_class in
   [Foundational, Domain_Required, Go_Live] across all activated domains.
   Call this set: critical_checkpoints.

2. IF any checkpoint in critical_checkpoints has status = Blocked:
   a. IF the blocked checkpoint has deferment_allowed = false:
      → go_live_readiness = Blocked_For_GoLive
      → blocked_reason = list of non-deferrable blocked checkpoints
      → STOP evaluation
   b. IF the blocked checkpoint has deferment_allowed = true
      AND has not been deferred:
      → go_live_readiness = Not_Ready
      → reason = "Blocked checkpoints must be resolved or formally deferred"
      → STOP evaluation

3. IF any checkpoint in critical_checkpoints has status = Not_Started
   or In_Progress:
   → go_live_readiness = Not_Ready
   → reason = "Required checkpoints remain incomplete"
   → include list of incomplete checkpoints
   → STOP evaluation

4. IF any checkpoint in critical_checkpoints has status = Deferred:
   a. IF ALL of the following are true for each deferred checkpoint:
      - deferment_constraints are satisfied
      - project owner sign-off is recorded
      - deferment does not invalidate an in-scope go-live path
      - review point date is recorded
      → Continue to step 5
   b. IF any deferred checkpoint fails the above conditions:
      → go_live_readiness = Not_Ready
      → reason = "Deferred checkpoints have unresolved constraints"
      → STOP evaluation

5. IF S10 (Validation) has not been completed:
   → go_live_readiness = Not_Ready
   → reason = "Validation stage must complete before go-live assessment"
   → STOP evaluation

6. IF S10 is Complete:
   a. IF the validation summary contains unresolved blocker register entries:
      → go_live_readiness = Not_Ready
      → reason = "Validation identified unresolved blockers"
      → STOP evaluation
   b. IF the validation summary is clean or all issues are resolved/accepted:
      → go_live_readiness = Ready_For_Review

7. IF go_live_readiness = Ready_For_Review AND:
   a. Project owner has reviewed the validation summary
   b. All accepted deferments have sign-off
   c. Training requirements (if mandated) are addressed
   d. Cutover or activation conditions (if any) are documented
   → go_live_readiness = Ready_For_GoLive_Recommendation

OTHERWISE:
   → go_live_readiness = Ready_For_Review (review not yet complete)
```

### 5.3 Go-Live Readiness Display

| Element | Dashboard | S11 Workspace |
|---|---|---|
| Readiness status | Summary badge (Not Ready / Review / Ready / Blocked) | Full status with reasons |
| Incomplete critical checkpoints | Count | Full list with domain, stage, and status |
| Blocked checkpoints | Count with severity | Full list with blocked_reason |
| Deferred checkpoints | Count | Full list with constraints, owner, review date |
| Unresolved warnings | Count | Full list with downstream impact |
| Training status (if mandated) | Summary | Per-domain training completion |
| Go-live recommendation | Not shown until Ready | Issuable at S11 when all criteria met |

### 5.4 Go-Live Readiness Must NOT

- Treat configuration completion alone as proof of readiness.
- Auto-issue a go-live recommendation. The recommendation requires explicit
  project owner action.
- Show "Ready" if any non-deferrable blocker exists.
- Hide deferred items from the readiness assessment.
- Count Recommended or Optional checkpoints toward readiness blocking
  (they are informational in the readiness view, not blocking).
- Imply operational readiness for domains where execution support does not
  exist in the current build (the platform must state what was configured
  vs. what was executed and validated).

---

## Part 6 — Resume Logic

### 6.1 State Saved for Resume

The following state is persisted and restored on resume (aligned with
`docs/08_Project_State_Model.md`):

| State Category | Specific Fields |
|---|---|
| Project identity | Project name, ID, owner, mode, version, edition, deployment |
| Environment | Connection status, target identifiers, branch/environment target |
| Stage position | Current stage(s), stage statuses, stage completion flags |
| Domain state | Per-domain: visibility state, status, modifier flags |
| Checkpoint state | Per-checkpoint: status, evidence, blocker/deferment, linked previews/executions |
| Decision log | All recorded decisions with linkage |
| Preview/Execution history | All preview and execution records |
| Next action | Computed on resume (not saved — always fresh computation) |

### 6.2 Resume Entry Point Computation

When a user resumes a saved project, the platform computes the entry point using
the following rules:

```
COMPUTE resume_entry_point:

1. Determine current_stage(s):
   Find the highest-order stage(s) with status In_Progress, Blocked,
   or Ready_For_Exit.
   If S07 and S08 are both active: current_stages = [S07, S08].

2. Check for critical blockers:
   IF any checkpoint across all active stages has blocker_flag = true
   AND checkpoint_class in [Foundational, Domain_Required]:
     → resume_target = the highest-priority blocker
        (using Priority 2/3 from Next Action Logic)
     → resume_context = "Blocked: [blocker description]"
     → STOP

3. Check for review-pending items:
   IF any checkpoint has status = Ready_For_Review:
     → resume_target = the highest-priority review-pending checkpoint
     → resume_context = "Review pending: [checkpoint_name]"
     → STOP

4. Default to next action:
   → resume_target = result of Next Required Action computation (Part 3)
   → resume_context = "[action description]"
```

### 6.3 Resume Display Rules

| Element | Behavior |
|---|---|
| **Resume banner** | Shows on first load after resume: "You left off at [stage/domain]. [resume_context]." Dismissable after acknowledgment. |
| **Stage panel** | All stages show their saved status. Current stage(s) highlighted. |
| **Domain panel** | All activated domains show their saved status. The domain containing the resume_target is highlighted. |
| **Blocker panel** | If blockers exist, they are surfaced immediately — not buried in a checkpoint list. |
| **Deferred panel** | Deferred items are visible with their review dates. Items past their review date are flagged. |
| **Next action** | Computed fresh from current state (never stale from last session). |

### 6.4 Resume Must NOT

- Return the user to a completed stage unless they explicitly navigate there.
- Show a "welcome" or "getting started" screen when work is already in progress.
- Imply readiness based on the last session's state without re-evaluating
  checkpoint status (dependencies may have been invalidated by upstream changes).
- Silently skip over blockers to show a later-stage action.
- Resume into a stage that is Locked (if upstream changes invalidated
  entry conditions, the platform must route to the predecessor stage).
- Lose checkpoint evidence, preview records, or execution records between sessions.

### 6.5 Stale State Detection

On resume, the engine checks for stale state. **Cascade termination rule:** Stale
detection runs exactly once per resume or load event as a single-pass scan. All
stale checkpoints are identified and batch-reverted to In_Progress in one pass.
The subsequent recompute (Steps 1–7) then runs once on the updated persisted state.
Stale detection does not re-trigger recursively within the same load event — the
recompute following the batch reversion is the terminal recompute for that event.
This guarantees termination regardless of dependency chain depth.

| Condition | Detection | Action |
|---|---|---|
| A Complete checkpoint's upstream dependency has reverted to In_Progress | Compare dependency graph on resume | Flag the checkpoint as "Evidence may be invalidated — review required" and set status to In_Progress |
| A deferred checkpoint's review date has passed | Compare deferred review dates to current date | Surface in resume banner: "Deferred checkpoint [name] is past its review date" |
| Connection context has changed or expired | Compare saved connection state to current | Surface: "Connection context has changed — re-verify before proceeding with system-detectable checkpoints" |
| Project mode or scope change has occurred externally | Compare saved domain activation state to current | Trigger scope change review — do not auto-resume until scope is re-confirmed |

---

## Part 7 — Engine Integrity Rules

1. **Stage order is not negotiable.** The 12 stages execute in the order defined by
   the Implementation Master Map. The only flexibility is the S07/S08 parallel
   execution, which is governed by the co-dependency rule.

2. **No stage skipping.** A stage may not be entered until its predecessor's exit
   conditions are met. The platform may not offer a "jump to stage" capability
   that bypasses entry conditions.

3. **No silent auto-completion.** Stage exit and domain completion require explicit
   confirmation. The platform does not auto-advance stages or auto-mark domains
   complete.

4. **Blockers are never hidden.** Blocked checkpoints, blocked domains, and blocked
   stages are always visible in all aggregated views. The platform may not filter
   them out for cleaner progress display.

5. **Deferrals are tracked, not forgotten.** Every deferred checkpoint appears in
   the deferred backlog, the go-live readiness assessment, and the S12 Phase 2
   workspace. Deferment is not deletion.

6. **Configuration ≠ Readiness.** The engine never equates all-checkpoints-complete
   with go-live-ready. Readiness is a separate, explicit assessment at S11 that
   considers evidence quality, blocker resolution, deferment acceptance, and
   training completion.

7. **Next action is deterministic.** Given the same project state, the next-action
   engine always produces the same result. No randomization, no AI suggestion,
   no mood-based prioritization.

8. **Resume is faithful.** The resume engine returns the user to the actual state
   of the project, not an optimistic interpretation of it. Stale state is detected
   and surfaced, not concealed.

9. **Parallel stages share a single action queue.** When S07 and S08 are both
   active, the next-action engine produces a single unified priority queue, not
   two competing queues.

10. **The dashboard is a control surface.** Status aggregation serves decision-making
    (what to do next, what is blocked, what is deferred). It does not serve
    vanity metrics (percentage complete, time estimates, speed comparisons).

---

## Part 8 — Quick Reference: Stage-Domain-Checkpoint Flow

```
Project Start
    │
    ▼
┌─────────────────────────────┐
│ S01: Entry / Project Setup  │  No domains, no checkpoints.
│     Record project identity │  Project mode, version, edition,
│     Select project mode     │  deployment recorded.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S02: Business Assessment    │  Discovery questions answered.
│     Run Discovery Framework │  Domain Activation Engine runs.
│     Activate domains        │  Checkpoint Engine generates
│     Generate checkpoints    │  checkpoint set.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S03: System Discovery       │  Baseline recorded.
│     Record current state    │  Existing modules/config
│     Distinguish active vs.  │  documented (expansion mode).
│     planned capability      │  Fresh mode: explicit "no state."
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S04: Foundation             │  Domain: foundation
│     FND-FOUND-001..006      │  Company, localization, currency,
│     FND-DREQ-001..004       │  fiscal country, multi-company,
│                             │  UoM, base settings.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S05: Users / Roles          │  Domain: users_roles
│     USR-FOUND-001..002      │  Admin account, role matrix,
│     USR-DREQ-001..011       │  users, groups, approvers,
│                             │  team rules, cross-company.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S06: Master Data            │  Domain: master_data
│     MAS-FOUND-001..002      │  Categories, contacts, products,
│     MAS-DREQ-001..007       │  vendors, customers, warehouses,
│                             │  BOM components, traceability.
└─────────────┬───────────────┘
              ▼
      ┌───────┴────────┐
      ▼                ▼
┌────────────┐  ┌────────────┐
│ S07: Core  │  │ S08:       │  PARALLEL — cross-checkpoint
│ Operations │  │ Finance    │  blocking enforced, not
│            │  │            │  stage-level blocking.
│ crm        │  │ accounting │
│ sales      │  │            │  Finance policy checkpoints
│ purchase   │  │            │  block dependent S07
│ inventory  │  │            │  checkpoints (valuation,
│ manufactur.│  │            │  costing, invoicing, POS
│ pos        │  │            │  journal).
│ projects*  │  │            │
└─────┬──────┘  └─────┬──────┘
      └───────┬────────┘
              ▼
┌─────────────────────────────┐
│ S09: Extended Modules       │  Domains: website_ecommerce,
│     Per-domain entry based  │  projects*, hr, quality,
│     on specific S07/S08     │  maintenance, repairs, documents,
│     dependency completion   │  sign, approvals, subscriptions,
│                             │  rental, field_service.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S10: Validation             │  Cross-project consolidation.
│     Evidence completeness   │  Blocker register. Readiness
│     Blocker register        │  gap list. No new config work.
│     Readiness gap list      │
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S11: Go-Live Readiness      │  Formal assessment.
│     Readiness computation   │  Go-live recommendation
│     Training verification   │  issued or withheld.
│     Cutover conditions      │  Operational readiness ≠
│     Go-live recommendation  │  configuration completion.
└─────────────┬───────────────┘
              ▼
┌─────────────────────────────┐
│ S12: Post Go-Live / Phase 2 │  Deferred checkpoint backlog.
│     Forward-safe expansion  │  Phase 2 domain activation.
│     Deferred work queue     │  No remediation.
│     Retained decision hist. │
└─────────────────────────────┘

* Projects: assigned to S07 when BM-01 = "Services only";
  otherwise assigned to S09.
```

---

**Engine Version:** 1.0
**Governing Documents:**
- `docs/03_Implementation_Master_Map.md` (stage definitions and ordering)
- `docs/07_Information_Architecture.md` (navigation model, dashboard, save-and-resume)
- `docs/08_Project_State_Model.md` (state persistence, status model)
- `specs/domain_activation_engine.md` (domain activation, priority, blocking)
- `specs/checkpoint_engine.md` (checkpoint generation, dependencies, status transitions)
**Authority:** Subordinate to all governing documents. In any conflict, governing
documents win.
