# Runtime State and Engine Output Contract

## Purpose

This document defines the single canonical runtime state contract that all platform
engines read from and write to. It is the system of record for:

- persisted project state (survives sessions, supports save/resume)
- computed engine outputs (deterministically recomputed from persisted state)
- dashboard summaries (derived views over persisted + computed state)
- decision records (immutable audit trail)
- blocker/warning/deferment lifecycle
- preview/execution linkage (where implemented)

No engine may store state outside this contract. No frontend component may read state
that is not defined here. No backend persistence layer may save fields that are not
declared here.

---

## Part 1 — Top-Level Runtime State Model

The runtime state is organized into 16 top-level objects. Each object is classified as:

- **Persisted**: saved to storage, survives sessions, restored on resume.
- **Computed**: derived deterministically from persisted state by a specific engine.
  Never saved. Always recomputed on load, resume, or state change.
- **Both**: has persisted fields and computed fields. Computed fields are refreshed
  from persisted fields on every load cycle.

### 1.1 project_identity

**Purpose:** Establishes what this project is, who owns it, and what implementation
mode governs it. Set once at S01, immutable after S02 exit unless a formal scope
change event is raised.

**Classification:** Persisted

**Required fields:**

| Field | Type | Set When | Immutable After |
|---|---|---|---|
| project_id | string (UUID) | S01 creation | Always |
| project_name | string | S01 | Never (can be renamed) |
| customer_entity | string | S01 | S02 exit |
| project_owner | string | S01 | Never (can be reassigned) |
| implementation_lead | string | S01 | Never (can be reassigned) |
| project_mode | enum: `new_implementation` / `expansion` / `guided_setup` | S01 | S02 exit |
| created_at | ISO 8601 timestamp | S01 creation | Always |
| last_modified_at | ISO 8601 timestamp | Every state change | Never |

**Source of truth:** User input at S01, validated against Target Matrix
(`docs/02_Target_Matrix.md`).

---

### 1.2 target_context

**Purpose:** Records the Odoo environment this project targets. Constrains every
downstream engine's behavior.

**Classification:** Persisted

**Required fields:**

| Field | Type | Set When | Immutable After |
|---|---|---|---|
| odoo_version | string (must be `"19"`) | S01 | Always |
| edition | enum: `community` / `enterprise` | S01 | S02 exit |
| deployment_type | enum: `online` / `odoosh` / `on_premise` | S01 | S02 exit |
| primary_country | string (ISO 3166-1 alpha-2) | S02 (BM-03) | S04 exit (localization locked) |
| primary_currency | string (ISO 4217) | S02 (derived from BM-03) | S04 exit (currency locked) |
| multi_company | boolean | S02 (BM-02) | S04 exit |
| multi_currency | boolean | S02 (BM-04) | S04 exit |

**Optional fields:**

| Field | Type | When Present |
|---|---|---|
| odoosh_branch_target | string | deployment_type = `odoosh` AND deployment-sensitive work is active |
| odoosh_environment_type | enum: `production` / `staging` / `development` | deployment_type = `odoosh` |
| connection_mode | enum: `not_connected` / `inspection_only` / `preview_enabled` / `execution_enabled` | When connection is established |
| connection_status | enum: `disconnected` / `connected` / `error` | When connection is attempted |
| connection_target_id | string | When connected (environment identifier for safe resume) |
| connection_capability_note | string | When build does not support connection for this target |

**Source of truth:** User input at S01, refined at S02 via discovery answers. Connection
fields updated by Connection subsystem.

**Secrets prohibition:** No credentials, tokens, passwords, or API keys may be stored
in this object. Connection authentication is handled outside project state.

---

### 1.3 discovery_answers

**Purpose:** Raw captured input from the Discovery Question Framework. These are
historical facts — what the user answered. Never modified by engines. Never
recomputed. Read-only after S02 exit unless a scope change event replays questions.

**Classification:** Persisted (immutable after S02 exit)

**Required fields:**

| Field | Type | Description |
|---|---|---|
| answers | map<question_id, answer_value> | Key: question ID (e.g., `BM-01`). Value: the raw answer as provided. Multi-select answers stored as arrays. |
| answered_at | map<question_id, ISO 8601 timestamp> | When each answer was recorded |
| conditional_questions_skipped | array<question_id> | Questions not asked because their conditions were not met |
| framework_version | string | Version of the Discovery Question Framework used |
| confirmed_by | string | Identity of the user who confirmed the final answer set |
| confirmed_at | ISO 8601 timestamp | When the answer set was confirmed |

**Source of truth:** User input during S02, captured by the Discovery Engine.

**Mutation rule:** After S02 exit, this object is read-only. A scope change event
creates a new `discovery_answers` version, preserving the original as history.

---

### 1.4 activated_domains

**Purpose:** The output of the Domain Activation Engine. Records which domains are
in scope, their priority, and their activation rationale.

**Classification:** Both (persisted activation decisions, computed status)

**Persisted fields (set at S02 exit, immutable unless scope change):**

| Field | Type | Description |
|---|---|---|
| domains | array<activated_domain> | See activated_domain object below |
| activation_engine_version | string | Version of the Domain Activation Engine used |
| activated_at | ISO 8601 timestamp | When domain activation was finalized |

**activated_domain object:**

| Field | Type | Description |
|---|---|---|
| domain_id | string | From Domain Activation Engine (e.g., `foundation`, `sales`) |
| activated | boolean | true if in scope |
| excluded_reason | string or null | Why this domain is not activated (null if activated) |
| priority | enum: `required` / `go_live` / `recommended` / `optional` | From Domain Activation Engine priority rules |
| activation_question_refs | array<question_id> | Which discovery answers triggered activation |
| deferral_eligible | boolean | Whether this domain can be deferred to Phase 2 |

**Computed fields (recomputed by Stage Routing Engine on every load):**

| Field | Type | Source Engine |
|---|---|---|
| primary_stage | string (Stage ID) | Stage Routing Engine (from §2.1 assignment table; Projects conditional resolved from discovery_answers.BM-01). Deterministic — both inputs (domain_id, BM-01) are immutable after S02, so this value is stable across recomputes for the life of the project. |
| domain_status | enum: `not_started` / `in_progress` / `blocked` / `complete` / `deferred` | Stage Routing Engine (aggregated from checkpoint statuses) |
| domain_visibility | enum: `hidden` / `locked` / `active` / `deferred` / `complete` | Stage Routing Engine |
| has_warnings | boolean | Stage Routing Engine |
| has_deferrals | boolean | Stage Routing Engine |
| has_blocked_golive | boolean | Stage Routing Engine |
| has_review_pending | boolean | Stage Routing Engine |

---

### 1.5 checkpoints

**Purpose:** The full checkpoint set generated by the Checkpoint Engine. Each
checkpoint has persisted evidence/status and computed blocker/dependency state.

**Classification:** Both

**Persisted fields per checkpoint:**

| Field | Type | Mutability |
|---|---|---|
| checkpoint_id | string | Immutable (set at generation) |
| domain | string | Immutable |
| checkpoint_name | string | Immutable |
| checkpoint_class | enum | Immutable |
| validation_source | enum | Immutable |
| evidence_required | array<string> | Immutable |
| checkpoint_owner | enum | Immutable |
| deferment_allowed | boolean | Immutable |
| deferment_constraints | array<string> or null | Immutable |
| dependencies | array<checkpoint_id> | Immutable |
| downstream_impact_summary | string | Immutable |
| guidance_required | boolean | Immutable |
| training_available | boolean | Immutable |
| execution_relevance | enum | Immutable |
| preview_required | boolean | Immutable |
| safety_class | enum | Immutable |
| linked_decision_types | array<string> | Immutable |
| status | enum: `not_started` / `in_progress` / `blocked` / `ready_for_review` / `complete` / `deferred` | Mutable (transitions per Checkpoint Engine state machine) |
| evidence_items | map<evidence_key, evidence_record> | Mutable (populated as evidence is provided) |
| reviewer | string or null | Mutable |
| linked_preview_ids | array<string> | Mutable (appended when previews are generated) |
| linked_execution_ids | array<string> | Mutable (appended when executions occur) |
| linked_decision_ids | array<string> | Mutable (appended when decisions are recorded) |
| last_status_transition_actor | string or null | Mutable |
| last_status_transition_at | ISO 8601 timestamp or null | Mutable |
| last_reviewed_at | ISO 8601 timestamp or null | Mutable |

**evidence_record object:**

| Field | Type |
|---|---|
| evidence_key | string (matches an item from evidence_required) |
| provided | boolean |
| source | enum: `system_detected` / `user_confirmed` |
| value | string or structured data or null |
| provided_by | string |
| provided_at | ISO 8601 timestamp |

**Computed fields per checkpoint (recomputed on every load):**

| Field | Type | Source Engine |
|---|---|---|
| blocker_flag | boolean | Checkpoint Engine (dependency check) |
| blocked_reason | string or null | Checkpoint Engine |
| dependencies_met | boolean | Checkpoint Engine (all dependency checkpoint IDs are `complete` or `deferred`) |
| all_evidence_provided | boolean | Checkpoint Engine (all evidence_required items have `provided = true`) |

**Generation rule:** The checkpoint set is generated at S02 exit by the Checkpoint
Engine and persisted. Checkpoint definitions (immutable fields) are never regenerated
unless a scope change event adds or removes domains.

---

### 1.6 decisions

**Purpose:** Immutable audit trail of every business decision, policy confirmation,
and owner approval captured during the implementation. See Part 4 for full contract.

**Classification:** Persisted (append-only, never modified or deleted)

**Structure:** Array of decision_record objects. See Part 4.

---

### 1.7 stage_state

**Purpose:** Tracks stage-level progression. Mix of persisted progression markers
and computed status.

**Classification:** Both

**Persisted fields per stage:**

| Field | Type | Mutability |
|---|---|---|
| stage_id | string (S01–S12) | Immutable |
| entry_confirmed_at | ISO 8601 timestamp or null | Set once when stage is entered |
| entry_confirmed_by | string or null | Set once |
| exit_confirmed_at | ISO 8601 timestamp or null | Set once when stage exit is confirmed |
| exit_confirmed_by | string or null | Set once |

**Computed fields per stage (recomputed by Stage Routing Engine):**

| Field | Type | Source |
|---|---|---|
| stage_status | enum: `locked` / `not_started` / `in_progress` / `blocked` / `ready_for_exit` / `complete` | Stage Routing Engine aggregation |
| entry_conditions_met | boolean | Stage Routing Engine |
| exit_conditions_met | boolean | Stage Routing Engine |
| has_deferrals | boolean | Aggregated from domain states |
| has_cross_stage_blockers | boolean | Stage Routing Engine (derived from checkpoint cross-domain dependency state) |
| parallel_active | boolean | true for S07 and S08 when both are entered |
| assigned_domains | array<domain_id> | Stage Routing Engine domain-to-stage assignment |

---

### 1.8 readiness_state

**Purpose:** Go-live readiness assessment output. Fully computed — never directly
edited by users.

**Classification:** Computed

**Fields:**

| Field | Type | Source |
|---|---|---|
| go_live_readiness | enum: `not_ready` / `ready_for_review` / `ready_for_golive_recommendation` / `blocked_for_golive` | Stage Routing Engine (Part 5 computation) |
| readiness_reason | string | Describes why the current readiness status applies |
| incomplete_critical_checkpoints | array<checkpoint_id> | Checkpoints with class Foundational/Domain_Required/Go_Live that are not Complete |
| blocked_checkpoints | array<{ checkpoint_id, blocked_reason }> | Non-deferrable blocked checkpoints |
| deferred_checkpoints | array<{ checkpoint_id, constraints_met: boolean, review_date_passed: boolean }> | Deferred checkpoints with constraint status |
| unresolved_warnings | array<{ checkpoint_id, warning_detail }> | Warning validation results not yet reviewed |
| training_status | object: { mandated: boolean, addressed: boolean } | Reflects project owner training mandate |
| recommendation_issued | boolean | Whether go-live recommendation has been formally issued |
| recommendation_issued_at | ISO 8601 timestamp or null | When issued |
| recommendation_issued_by | string or null | Who issued it |
| recommendation_withheld_reason | string or null | If explicitly withheld, why |

---

### 1.9 blockers

**Purpose:** Consolidated view of all active blockers across the project. Fully
computed from checkpoint and stage state.

**Classification:** Computed

**Fields:**

| Field | Type |
|---|---|
| active_blockers | array<blocker_record> | See Part 5 |
| total_count | integer |
| by_severity | map<severity, count> |
| by_stage | map<stage_id, count> |
| by_domain | map<domain_id, count> |
| highest_priority_blocker | blocker_record or null |

---

### 1.10 deferments

**Purpose:** Consolidated view of all active deferments. Persisted deferment
decisions with computed constraint-check status.

**Classification:** Both

**Fields:**

| Field | Type |
|---|---|
| active_deferments | array<deferment_record> | See Part 5 |
| total_count | integer |
| past_review_date_count | integer (computed: count where review_date < now) |
| constraints_unmet_count | integer (computed: count where any constraint not satisfied) |

---

### 1.11 warnings

**Purpose:** Consolidated view of all active warnings. Aggregated from checkpoint
validation results, with persisted review state per warning.

**Classification:** Both

**Computed fields (recomputed by Stage Routing Engine):**

| Field | Type | Source |
|---|---|---|
| active_warnings | array<warning_record> | Stage Routing Engine (from checkpoint validation) |
| total_count | integer | Stage Routing Engine |
| by_domain | map<domain_id, count> | Stage Routing Engine |
| unreviewed_count | integer | Stage Routing Engine |

**Persisted fields per warning_record (written by Checkpoint Engine during
checkpoint review actions):**

| Field | Type | Mutability |
|---|---|---|
| reviewed | boolean | Mutable (set when warning is reviewed) |
| reviewed_by | string or null | Mutable |
| reviewed_at | ISO 8601 timestamp or null | Mutable |
| review_outcome | enum: accepted / escalated / deferred / null | Mutable |

---

### 1.12 previews

**Purpose:** Records of all preview actions generated. Immutable once created.
Linked to checkpoints and (if executed) to execution records.

**Classification:** Persisted (append-only)

**preview_record object:**

| Field | Type |
|---|---|
| preview_id | string (UUID) |
| linked_checkpoint_id | string |
| target_deployment | string (from target_context.deployment_type) |
| target_branch | string or null (from target_context.odoosh_branch_target) |
| target_model | string (Odoo model name, e.g., `account.fiscal.year`) |
| target_operation | enum: `create` / `update` / `delete` |
| intended_changes | array<{ field, old_value, new_value }> or null |
| safety_class | enum: `safe` / `conditional` / `blocked` |
| prerequisite_snapshot | map<checkpoint_id, status> (status of dependencies at preview time) |
| downstream_impact_summary | string |
| preview_actor | string |
| preview_created_at | ISO 8601 timestamp |
| stale | boolean (computed: true if any prerequisite_snapshot entry has changed since creation) |
| linked_execution_id | string or null (set when this preview is executed) |

---

### 1.13 executions

**Purpose:** Records of all execution attempts. Immutable once completed. Linked to
previews.

**Classification:** Persisted (append-only)

**execution_record object:**

| Field | Type |
|---|---|
| execution_id | string (UUID) |
| linked_preview_id | string (must reference an existing preview_record) |
| execution_actor | string |
| target_environment | string |
| target_branch | string or null |
| status | enum: `planned` / `approved` / `in_progress` / `succeeded` / `failed` / `cancelled` |
| result_summary | string or null |
| failure_reason | string or null |
| confirmation_actor | string or null (who approved execution) |
| confirmation_at | ISO 8601 timestamp or null |
| requested_at | ISO 8601 timestamp |
| started_at | ISO 8601 timestamp or null |
| completed_at | ISO 8601 timestamp or null |

---

### 1.14 audit_refs

**Purpose:** Cross-referencing index that links decisions, previews, executions,
and checkpoints for traceability. Computed from the linkage fields in each record.

**Classification:** Computed

**Fields:**

| Field | Type |
|---|---|
| by_checkpoint | map<checkpoint_id, { decision_ids, preview_ids, execution_ids }> |
| by_decision | map<decision_id, { checkpoint_ids, preview_ids }> |
| by_preview | map<preview_id, { checkpoint_id, execution_id or null }> |
| by_execution | map<execution_id, { preview_id, checkpoint_id }> |

---

### 1.15 training_state

**Purpose:** Tracks training availability, assignment, and completion per domain.

**Classification:** Both

**Persisted fields per domain:**

| Field | Type |
|---|---|
| domain_id | string |
| training_available | boolean (from Checkpoint Engine) |
| training_mandated | boolean (set by project owner) |
| training_assigned_to | array<string> or null |
| training_completed | boolean |
| training_completed_at | ISO 8601 timestamp or null |

---

### 1.16 resume_context

**Purpose:** Computed on every load/resume. Never persisted — always fresh.

**Classification:** Computed

**Fields:**

| Field | Type | Source |
|---|---|---|
| current_stages | array<stage_id> | Stage Routing Engine (may be multiple for S07/S08 parallel) |
| resume_target_type | enum: `blocker` / `review_pending` / `next_action` / `stage_transition` | Resume Logic computation |
| resume_target_checkpoint_id | string or null | Highest-priority checkpoint to resume at |
| resume_target_domain_id | string or null | Domain containing the resume target |
| resume_target_stage_id | string | Stage containing the resume target |
| resume_context_message | string | Human-readable description: "You left off at..." |
| stale_state_alerts | array<stale_alert> | Stale state detection results |
| highest_priority_blocker | blocker_record or null | From blockers object |
| next_required_action | next_action_record | From Next Action computation |
| secondary_action_queue | array<next_action_record> (max 3) | Next 3 actions after primary |

**stale_alert object:**

| Field | Type |
|---|---|
| alert_type | enum: `dependency_reverted` / `deferment_past_review_date` / `connection_changed` / `scope_changed` |
| affected_checkpoint_id | string or null |
| detail | string |

**next_action_record object:**

| Field | Type |
|---|---|
| priority_level | integer (1–12, from Stage Routing Engine priority cascade) |
| action_type | enum: `resolve_blocker` / `complete_checkpoint` / `begin_checkpoint` / `review_checkpoint` / `complete_stage` / `defer_or_complete` / `waiting` |
| target_checkpoint_id | string or null |
| target_stage_id | string or null |
| action_description | string |
| blocked_by | string or null (upstream checkpoint if cross-domain block) |

---

## Part 2 — Engine Input/Output Boundaries

Each engine has explicit read and write permissions over the runtime state objects.
No engine may read from or write to objects outside its declared boundaries.

### 2.1 Discovery Engine

**Runs at:** S02

| Access | Object | Fields |
|---|---|---|
| **Reads** | project_identity | project_mode |
| **Reads** | target_context | edition, deployment_type |
| **Writes** | discovery_answers | All fields (creates the object) |
| **Forbidden** | activated_domains, checkpoints, stage_state, decisions, readiness_state, blockers, deferments, warnings, previews, executions, audit_refs, resume_context |

### 2.2 Domain Activation Engine

**Runs at:** S02 exit (after discovery_answers are finalized)

| Access | Object | Fields |
|---|---|---|
| **Reads** | discovery_answers | answers (read-only) |
| **Reads** | target_context | edition, deployment_type |
| **Writes** | activated_domains | Persisted fields only (domains array, activation_engine_version, activated_at) |
| **Forbidden** | activated_domains computed fields, checkpoints, stage_state, decisions, readiness_state, blockers, deferments, warnings, previews, executions, audit_refs, resume_context |

### 2.3 Checkpoint Engine

**Runs at:** S02 exit (after activated_domains are set); recomputes computed fields on
every load

| Access | Object | Fields |
|---|---|---|
| **Reads** | discovery_answers | answers (for conditional checkpoint generation) |
| **Reads** | activated_domains | domains (persisted: which domains are active) |
| **Reads** | target_context | edition, deployment_type (for deployment-aware safety class) |
| **Writes (generation)** | checkpoints | All immutable fields (one-time at generation) |
| **Writes (status)** | checkpoints | status, evidence_items, reviewer, linked_*_ids, last_* fields |
| **Writes (deferment)** | deferments | Creates new deferment_record (append-only) when transitioning a checkpoint status to Deferred |
| **Writes (warning review)** | warnings | reviewed, reviewed_by, reviewed_at, review_outcome per warning_record (during checkpoint review actions) |
| **Computes** | checkpoints | blocker_flag, blocked_reason, dependencies_met, all_evidence_provided |
| **Forbidden** | project_identity, target_context, discovery_answers, activated_domains persisted fields, stage_state, readiness_state, previews, executions (may read linked IDs but not create records), blockers, resume_context, audit_refs |

### 2.4 Stage Routing and Readiness Engine

**Runs at:** Every load, every state change, every resume

| Access | Object | Fields |
|---|---|---|
| **Reads** | project_identity | project_mode |
| **Reads** | target_context | All fields |
| **Reads** | activated_domains | All persisted fields |
| **Reads** | checkpoints | All fields (persisted + computed) |
| **Reads** | decisions | All fields (for readiness checks) |
| **Reads** | deferments | All fields (persisted) |
| **Reads** | training_state | All fields |
| **Reads** | discovery_answers | answers (BM-01 only, for Projects domain primary_stage conditional) |
| **Computes** | activated_domains | All computed fields (primary_stage, domain_status, domain_visibility, modifier flags) |
| **Computes** | stage_state | All computed fields (stage_status, entry/exit conditions, modifier flags) |
| **Computes** | readiness_state | All fields (entire object) |
| **Computes** | blockers | All fields (entire object, derived from checkpoint blocker_flag) |
| **Computes** | warnings | All fields (entire object) |
| **Computes** | deferments | Computed fields only (past_review_date_count, constraints_unmet_count) |
| **Computes** | resume_context | All fields (entire object) |
| **Computes** | audit_refs | All fields (entire object, derived from linkage fields) |
| **Writes** | stage_state | entry_confirmed_at/by, exit_confirmed_at/by (persisted — records stage transition events) |
| **Forbidden** | project_identity, target_context, discovery_answers, checkpoints immutable fields, previews, executions |

### 2.5 Preview/Execution Engine

**Runs at:** When a user initiates a preview or execution action on an executable
checkpoint

| Access | Object | Fields |
|---|---|---|
| **Reads** | target_context | All fields (deployment, connection, branch target) |
| **Reads** | checkpoints | Relevant checkpoint (status, safety_class, execution_relevance, dependencies_met) |
| **Reads** | decisions | Relevant decisions (for confirmation checks) |
| **Writes** | previews | Creates new preview_record (append-only) |
| **Writes** | executions | Creates new execution_record (append-only) |
| **Writes** | checkpoints | linked_preview_ids, linked_execution_ids (append only) |
| **Forbidden** | project_identity, target_context (may not change connection state), discovery_answers, activated_domains, checkpoints immutable fields, checkpoints status (status transitions are handled by Checkpoint Engine only), stage_state, readiness_state, blockers, deferments, warnings, resume_context |

### 2.6 Boundary Enforcement Rules

1. No engine may write to an object listed in its **Forbidden** row.
2. No engine may write to computed fields of another engine's output objects.
3. Append-only objects (decisions, previews, executions) may never have records
   modified or deleted by any engine.
4. Immutable fields may not be changed after their initial set event, regardless
   of which engine holds write access.
5. The Stage Routing and Readiness Engine is the only engine authorized to produce
   the resume_context, readiness_state, and blocker/warning/deferment aggregations.
6. The Checkpoint Engine is the only engine authorized to transition checkpoint status,
   create deferment_records, and write warning review state.
7. The Preview/Execution Engine is the only engine authorized to create preview and
   execution records.

---

## Part 3 — Deterministic Recompute Rules

### 3.1 What Is Recomputed on Resume/Load

Every time the project state is loaded (initial load, resume, or state change),
the following objects are recomputed from persisted state. The recompute order is
fixed and must not be reordered.

**Recompute Order:**

```
Step 1: Checkpoint Engine recomputes checkpoint computed fields
        Input:  checkpoints (persisted), activated_domains (persisted)
        Output: blocker_flag, blocked_reason, dependencies_met, all_evidence_provided

Step 2: Stage Routing Engine recomputes domain computed fields
        Input:  checkpoints (persisted + computed), activated_domains (persisted),
                discovery_answers (for Projects conditional: BM-01)
        Output: primary_stage, domain_status, domain_visibility, modifier flags

Step 3: Stage Routing Engine recomputes stage computed fields
        Input:  stage_state (persisted), activated_domains (computed), checkpoints
        Output: stage_status, entry/exit conditions, modifier flags

Step 4: Stage Routing Engine recomputes readiness_state
        Input:  checkpoints, stage_state, decisions, deferments, training_state
        Output: go_live_readiness and all readiness fields

Step 5: Stage Routing Engine recomputes blockers, warnings, deferments (computed)
        Input:  checkpoints (computed blocker_flag), deferments (persisted)
        Output: aggregated blocker/warning/deferment views

Step 6: Stage Routing Engine computes resume_context
        Input:  stage_state (computed), blockers (computed), checkpoints
        Output: resume target, stale alerts, next action, secondary queue

Step 7: Audit_refs recomputed
        Input:  checkpoints (linked_*_ids), decisions, previews, executions
        Output: cross-reference index
```

### 3.2 What Must Be Preserved as Historical Fact

The following are **never recomputed**. They represent historical facts and must
survive indefinitely in persisted state:

| Object | Why It Cannot Be Recomputed |
|---|---|
| discovery_answers | Raw user input; recomputing would erase the original answer |
| activated_domains (persisted fields) | Activation decisions reflect a point-in-time engine run; re-running could produce different results if the engine version changes |
| checkpoints (immutable fields) | Checkpoint definitions are generated once; regeneration could change IDs and break linkage |
| checkpoints.evidence_items | User-provided and system-detected evidence is factual; it cannot be re-derived |
| checkpoints.status | Status reflects actual work done; recomputing would lose in-progress/review history |
| decisions | Append-only audit trail; immutable by definition |
| previews | Point-in-time action previews; stale-flagging is allowed, deletion is not |
| executions | Execution outcomes are historical fact |
| stage_state (persisted fields) | Stage entry/exit confirmations are events that occurred |
| deferments (persisted fields) | Deferment decisions are owner-approved actions |

### 3.3 What Invalidates Cached Computed State

Any of the following events invalidate all computed state and trigger a full recompute
(Steps 1–7 above):

| Invalidation Event | Trigger |
|---|---|
| Checkpoint status transition | Any checkpoint changes status |
| Evidence provided | Any evidence_item is added or changed |
| Deferment recorded | A deferment_record is created |
| Decision recorded | A decision_record is created |
| Stage transition | A stage is entered or exited |
| Preview created | A preview_record is created |
| Execution completed | An execution_record reaches `succeeded`, `failed`, or `cancelled` |
| Session resume | User returns to a saved project |
| Scope change event | Domain activation is re-run |

### 3.4 Stale State Detection

On every recompute (especially resume), the engine detects stale state:

| Stale Condition | Detection Method | Effect |
|---|---|---|
| Upstream dependency reverted | A checkpoint with status `complete` has a dependency whose status is now `in_progress` or `blocked` | Checkpoint flagged for re-review; stale_alert generated. **Cascade rule:** All stale checkpoints are identified and batch-reverted in a single pass. The subsequent recompute (Steps 1–7) runs once. Stale detection does not re-trigger recursively within the same load event. |
| Deferred review date passed | deferment_record.review_date < current date | stale_alert generated; surfaced in resume banner |
| Preview prerequisites changed | preview_record.prerequisite_snapshot differs from current checkpoint statuses | preview_record.stale = true; execution of this preview blocked |
| Connection context changed | target_context.connection_status or connection_target_id differs from last session | stale_alert generated; system-detectable evidence may be invalidated |

### 3.5 Immutable-Once-Set Fields

The following fields across all objects may never be changed after their initial
write, regardless of any engine, user action, or scope change:

- project_identity.project_id
- project_identity.created_at
- All checkpoint immutable fields (see section 1.5)
- All decision_record fields (entire object is append-only immutable)
- All preview_record fields except `stale` and `linked_execution_id`
- All execution_record fields (entire object, once status is terminal)
- discovery_answers (entire object after S02 exit)

---

## Part 4 — Decision Record Contract

### 4.1 Decision Record Object

Every decision captured by the platform is stored as an immutable decision_record.
Decisions are append-only. A decision cannot be modified — it can only be superseded
by a new decision that references the original.

```
decision_record {
  decision_id:          string (UUID, immutable)
  decision_type:        enum (see below)
  domain_id:            string or null (the domain this decision affects)
  stage_id:             string (the stage where this decision was made)
  question_ref:         string or null (discovery question ID if derived from S02)
  checkpoint_ref:       string or null (checkpoint ID if made during checkpoint work)
  owner_role:           enum: project_owner | implementation_lead | domain_lead |
                               process_owner | system_administrator
  decided_by:           string (identity of the person who made the decision)
  decided_at:           ISO 8601 timestamp
  decision_summary:     string (concise statement of what was decided)
  decision_detail:      string or null (extended explanation)
  confirmation_status:  enum: confirmed | pending | superseded
  superseded_by:        string (decision_id) or null
  reversibility:        enum: reversible | irreversible | conditional
  reversibility_note:   string or null (conditions for reversal, if conditional)
  downstream_impact:    array<string> (list of affected domain_ids or checkpoint_ids)
  blocker_effect:       enum: none | creates_blocker | resolves_blocker
  deferment_effect:     enum: none | creates_deferment | resolves_deferment
  linked_checkpoint_ids: array<checkpoint_id>
  linked_preview_ids:   array<preview_id> or null
}
```

### 4.2 Decision Types

| decision_type | When Used |
|---|---|
| business_policy | A business operating rule is established (e.g., "we use FIFO valuation") |
| technical_configuration | A technical setup choice is made (e.g., "3-step receipt route") |
| financial_policy | A financial control rule is set (e.g., "3-way matching required") |
| access_policy | An access/role/approval rule is set (e.g., "sales managers approve orders") |
| operational_policy | An operational workflow rule is set (e.g., "serial tracking on products") |
| deployment_decision | A deployment target or branch is confirmed |
| owner_confirmation | A project owner explicitly confirms a decision or deferment |
| integration_decision | An integration boundary or connection decision is made |
| deferment_approval | A project owner approves deferring a checkpoint or domain |
| scope_change | A scope change event modifies the activated domain set |
| golive_recommendation | A go-live recommendation is issued or withheld |

### 4.3 Decision Lifecycle Rules

1. Decisions are append-only. The decisions array grows monotonically.
2. A decision may be superseded by a new decision with `superseded_by` pointing
   to the new decision_id. The original remains in the array with
   `confirmation_status = superseded`.
3. A decision with `reversibility = irreversible` may still be superseded, but
   the superseding decision must have `decision_type = scope_change` and require
   project_owner role.
4. Every checkpoint that captures a human decision must create a decision_record.
5. Every deferment must create a decision_record with `decision_type = deferment_approval`.
6. Every go-live recommendation (issued or withheld) must create a decision_record.

---

## Part 5 — Blocker / Warning / Deferment Contract

### 5.1 Blocker Record

```
blocker_record {
  blocker_id:               string (computed: "{checkpoint_id}:blocker")
  scope:                    enum: checkpoint | domain | stage
  source_checkpoint_id:     string (the blocked checkpoint)
  source_domain_id:         string
  source_stage_id:          string
  blocker_type:             enum: dependency_unmet | evidence_missing |
                                   owner_confirmation_missing |
                                   connection_unavailable |
                                   branch_target_undefined |
                                   cross_domain_dependency |
                                   deployment_constraint
  blocked_reason:           string (human-readable)
  blocking_checkpoint_id:   string or null (the upstream checkpoint causing the block)
  blocking_domain_id:       string or null (the upstream domain)
  severity:                 enum: critical | standard
                            critical: Foundational or Domain_Required checkpoint blocked
                            standard: Go_Live, Recommended, or Optional blocked
  created_at:               ISO 8601 timestamp (computed: when blocker_flag became true)
  resolution_action:        string (what must happen to resolve this blocker)
}
```

**Lifecycle:**
- Created (computed) when a checkpoint's `blocker_flag` becomes true.
- Removed (computed) when the `blocker_flag` becomes false.
- Never persisted independently — derived from checkpoint computed state on each
  recompute cycle.

### 5.2 Warning Record

```
warning_record {
  warning_id:               string (computed: "{checkpoint_id}:warning:{sequence}")
  source_checkpoint_id:     string
  source_domain_id:         string
  warning_detail:           string (specific risk, ambiguity, or incompleteness)
  downstream_impact:        string (what this warning affects if unresolved)
  reviewed:                 boolean (persisted: whether someone has acknowledged it)
  reviewed_by:              string or null
  reviewed_at:              ISO 8601 timestamp or null
  review_outcome:           enum: accepted | escalated | deferred | null
}
```

**Lifecycle:**
- Created when checkpoint validation produces a Warning result (not Pass, not Fail).
- Persists until explicitly reviewed.
- A warning with `reviewed = false` prevents dependent Go_Live checkpoints from
  completing if the warning's checkpoint has `downstream_impact` referencing
  those checkpoints.
- Warnings are never auto-dismissed.

### 5.3 Deferment Record

```
deferment_record {
  deferment_id:             string (UUID)
  source_checkpoint_id:     string (the deferred checkpoint)
  source_domain_id:         string
  source_stage_id:          string
  deferred_by:              string (identity)
  deferred_at:              ISO 8601 timestamp
  reason:                   string (why deferment was chosen)
  constraints:              array<string> (from checkpoint.deferment_constraints)
  constraints_met:          map<string, boolean> (computed: which constraints are satisfied)
  review_date:              ISO date (when this deferment should be revisited)
  review_date_passed:       boolean (computed: review_date < current date)
  owner_signoff:            boolean (whether project owner approved the deferment)
  owner_signoff_by:         string or null
  owner_signoff_at:         ISO 8601 timestamp or null
  linked_decision_id:       string (references the deferment_approval decision_record)
  phase2_eligible:          boolean (whether this flows into S12)
  reactivated:              boolean (set to true if the checkpoint is later reactivated)
  reactivated_at:           ISO 8601 timestamp or null
}
```

**Lifecycle:**
- Created when a checkpoint transitions to `deferred` status.
- Persists for the life of the project (even after reactivation — for audit trail).
- `constraints_met` and `review_date_passed` are recomputed on each load.
- A deferment without `owner_signoff = true` is invalid and blocks go-live readiness.
- When reactivated, the checkpoint returns to `in_progress` and the deferment_record
  is marked `reactivated = true`.

---

## Part 6 — Dashboard Output Contract

The dashboard reads exclusively from computed state objects. It never reads from
persisted raw state directly. It never computes its own aggregations.

### 6.1 Dashboard Fields

| Dashboard Section | Source Object | Fields Displayed |
|---|---|---|
| **Project Header** | project_identity | project_name, customer_entity, project_owner |
| **Environment Badge** | target_context | odoo_version, edition, deployment_type, connection_mode |
| **Stage Progress** | stage_state (computed) | Per-stage: stage_status; overall: stages complete / total |
| **Domain Progress** | activated_domains (computed) | Per-domain: domain_status, priority badge, modifier flags |
| **Active Blockers** | blockers | total_count, highest_priority_blocker, by_severity breakdown |
| **Active Warnings** | warnings | total_count, unreviewed_count |
| **Active Deferrals** | deferments | total_count, past_review_date_count, constraints_unmet_count |
| **Next Required Action** | resume_context | next_required_action (primary), secondary_action_queue |
| **Go-Live Readiness** | readiness_state | go_live_readiness badge, readiness_reason |
| **Connection Status** | target_context | connection_mode, connection_status |

### 6.2 Dashboard Must Display

1. **Every active blocker** — blockers are never hidden or filtered for cleaner display.
2. **Every unreviewed warning** — warnings are never auto-dismissed.
3. **Every deferment past its review date** — past-due deferrals are always flagged.
4. **The distinction between configuration completion and operational readiness** —
   the dashboard must never show a single combined "progress" metric that collapses
   these two concepts.
5. **Connection capability accurately** — if connection is not implemented for the
   current deployment type, the dashboard must state this, not imply it exists.

### 6.3 Dashboard Must NOT Display

1. **Time estimates** — no "estimated time remaining" or "projected completion date."
2. **Comparative metrics** — no "you are faster/slower than average."
3. **AI-suggested next steps** — next action is deterministic, not suggested.
4. **Vanity progress percentages** that count deferred items as complete.
5. **Execution counts or success rates** as standalone metrics (these imply
   universal execution support; execution records are shown per-checkpoint only).
6. **Raw discovery answers** — the dashboard shows activated domains and checkpoint
   status, not the questionnaire.
7. **Collapsed blocker summaries** — "3 blockers" with no detail is not sufficient.
   At minimum: highest-priority blocker fully displayed, remainder expandable.

---

## Part 7 — Resume Contract

### 7.1 Persisted Fields Required for Resume

The minimum persisted state required to resume a project faithfully:

| Object | Required for Resume |
|---|---|
| project_identity | All fields |
| target_context | All persisted fields |
| discovery_answers | Entire object |
| activated_domains | All persisted fields |
| checkpoints | All persisted fields per checkpoint (including evidence_items) |
| decisions | All records |
| stage_state | All persisted fields per stage |
| deferments | All persisted deferment_records |
| previews | All preview_records |
| executions | All execution_records |
| training_state | All persisted fields |
| warnings | reviewed/reviewed_by/reviewed_at/review_outcome per warning |

### 7.2 Computed Fields Regenerated on Resume

All computed fields across all objects are regenerated using the recompute order
defined in Part 3.1. No computed field is persisted or cached between sessions.

### 7.3 Resume Truth Guarantees

| Guarantee | How Enforced |
|---|---|
| User returns to meaningful context | resume_context is computed fresh; resume_target routes to highest-priority item |
| Highest-priority blocker is surfaced | blockers object is recomputed; highest_priority_blocker is populated |
| Next required action is current | next_required_action is computed from current checkpoint + stage state |
| Stale state is detected | stale_state_alerts are populated by comparing persisted state to current conditions |
| No false readiness implied | readiness_state is fully recomputed; resume banner never says "ready" unless go_live_readiness = ready_for_golive_recommendation |
| Evidence survives | checkpoint.evidence_items are persisted, not recomputed |
| Decisions survive | decisions array is immutable and always fully restored |
| Preview/execution history survives | previews and executions are persisted append-only |
| Deferred items with past review dates are flagged | deferments computed fields detect past-due review dates |
| Connection state is verified | stale_alert generated if connection context has changed |

### 7.4 Resume Must NOT

1. Return to a completed stage unless the user explicitly navigates there.
2. Show a welcome/getting-started screen when work is in progress.
3. Recompute discovery_answers, activated_domains (persisted), or checkpoint
   immutable fields — these are historical facts, not recomputable state.
4. Auto-dismiss blockers, warnings, or past-due deferment alerts.
5. Skip stale-state detection for performance reasons.
6. Resume into a stage whose entry conditions are no longer met (must redirect
   to the predecessor stage that needs attention).
7. Silently advance stages that were Ready_For_Exit at the end of the last session
   (stage transitions require explicit confirmation).

---

## Part 8 — Contract Integrity Rules

1. **Single source of truth per field.** Every field in this contract has exactly one
   source of truth (one engine that creates or computes it). No field may be written
   by two engines.

2. **Persisted state is the only root input to computed state.** Computed state is
   derived from persisted state via deterministic engines. Within a single recompute
   cycle, computed fields may depend on other computed fields produced by earlier
   steps in the pipeline, but only in the forward direction defined by the recompute
   order in Part 3.1 (Step 1 before Step 2, Step 2 before Step 3, etc.). No circular
   dependency between computed fields is permitted. No later step may feed back into
   an earlier step within the same cycle.

3. **Append-only objects are never modified.** decisions, previews, and executions
   grow monotonically. No record in these arrays may be edited, replaced, or deleted.

4. **Immutable-once-set fields are enforced at write time.** Any write attempt to an
   immutable field after its initial set must be rejected, not silently ignored.

5. **No engine may infer execution support.** The Preview/Execution Engine may only
   create records for checkpoints where `execution_relevance = Executable` AND
   connection capability supports it. All other checkpoints have no preview or
   execution records.

6. **The runtime contract does not define connection mechanics.** Connection
   establishment, authentication, and session management are outside this contract.
   This contract defines only the state fields that record connection context.

7. **The runtime contract does not define persistence technology.** Whether state is
   stored in a file, a database, or in-memory is an implementation decision outside
   this contract. This contract defines the logical shape, mutability rules, and
   recompute order.

8. **Version compatibility.** When engine versions change (discovery framework,
   activation engine, checkpoint engine), previously persisted state must remain
   readable. New engine versions must not silently invalidate existing projects.
   If a version change affects checkpoint definitions, a migration path must be
   defined.

9. **No data outside this contract.** Any state the platform needs to function must
   be declared in this contract. "Internal" or "temporary" state that affects
   checkpoint status, routing, or readiness must be surfaced here or it does not
   exist.

10. **Configuration completion ≠ Operational readiness.** This contract maintains
    the distinction at every level: checkpoint status tracks configuration work;
    readiness_state tracks operational readiness assessment. No aggregation,
    dashboard view, or resume banner may collapse this distinction.

---

**Contract Version:** 1.0
**Governing Documents:**
- `docs/08_Project_State_Model.md` (what state must be saved)
- `docs/05_Validation_Checkpoint_Rules.md` (checkpoint classes, safety, evidence)
- `docs/06_Checkpoint_and_Validation_Rules.md` (preview, execution, audit)
- `docs/07_Information_Architecture.md` (dashboard, navigation, resume)
- `docs/01_Scope_Boundaries.md` (execution boundaries, connection scope)
- `docs/12_LLM_Execution_Contract.md` (LLM execution preconditions)
- `specs/discovery_question_framework.md` (discovery answers)
- `specs/domain_activation_engine.md` (domain activation)
- `specs/checkpoint_engine.md` (checkpoint generation and state)
- `specs/stage_routing_engine.md` (stage routing, readiness, resume)
**Authority:** Subordinate to all governing documents. In any conflict, governing
documents win.
