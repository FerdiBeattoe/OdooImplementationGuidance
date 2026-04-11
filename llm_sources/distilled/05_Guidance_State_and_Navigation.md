# Guidance, State, and Navigation

Merged from: `docs/08_Guidance_Standards.md`, `docs/09_State_and_Resume_Rules.md`, `docs/10_IA_and_Navigation_Guards.md`

Root sources take precedence over this file in any conflict.

---

## Part 1: Guidance Standards

### Standard Guidance Block

Every material implementation decision must be expressed with the following fields:

- `What this is` — plain-language definition of the setting, policy, or design choice
- `Why it matters` — the operational reason the decision is consequential
- `Downstream impact` — which later flows, controls, reports, or user behaviors are affected
- `Common mistakes` — predictable implementation errors or false assumptions
- `Reversibility` — whether the decision is easy, difficult, or unsafe to change later
- `Who should decide` — the accountable functional or business owner
- `Training should be offered` — yes, no, or role-dependent
- `Checkpoint blocker` — whether the decision blocks progression if unresolved

### Writing Rules

- Guidance must explain implications, not describe screens.
- Downstream impact must be concrete enough to affect sequencing or checkpointing.
- Reversibility must be honest. Consequential decisions must not be described as easily reversible if they are not.
- Decision ownership must name a role type, not "the system."
- Training remains opt-in by default unless the project owner requires it.
- Guidance must be written in plain language readable by a business owner or operations lead without Odoo expertise.

---

## Part 2: Project State and Resume Rules

### Required State Fields

The platform must save state sufficient to reconstruct:

- project identity (name, id, entity, owner, lead, mode, version, edition, deployment)
- environment context (deployment type, hosting constraints, company scope, localization, module scope, Odoo.sh branch target where relevant)
- workflow position (current stage, domain, section, stage and domain completion status)
- checkpoint state for every checkpoint (status, validation source, evidence, safety class, blocked/deferred flags, dependency references, linked preview and execution ids, actor and timestamp)
- connection state (mode, status, capability level, authenticated environment identity — secrets must not be stored)
- preview state (id, target, operation, changes, safety class, prerequisites, impact, actor, timestamp)
- execution state (id, linked preview id, actor, target, status, result, failure reason, confirmations, timestamps)
- decision log linkages
- training state (available, assigned, required, completed)
- branch/environment target state where relevant

### Resume Behavior

When a project is resumed, the platform must:

- return the user to the last meaningful working location
- restore unresolved blockers and warnings prominently
- preserve unsatisfied dependencies
- preserve deferred items with their review conditions
- preserve environment and target context
- preserve preview and execution history

Resume must not imply readiness if saved state reflects only partial configuration, inspection, or incomplete preview.

### Status Values

- `Not Started` — no substantive work begun
- `In Progress` — active and not yet ready for review
- `Blocked` — required progress cannot continue due to unmet conditions
- `Ready For Review` — ready for explicit review or approval
- `Complete` — satisfies all defined criteria
- `Deferred` — intentionally postponed under recorded conditions

### Configuration Completion vs Operational Readiness

Configuration completion means setup work has been planned, previewed, or performed for the defined scope.

Operational readiness requires:
- required checkpoints have passed
- go-live controls are satisfied
- required decisions are approved
- known blockers are resolved
- required preview and execution records are complete where applicable
- any mandatory training requirements are addressed

The platform must never treat configuration completion alone as proof of operational readiness.

---

## Part 3: Navigation and Interface Guards

### Fixed Product Surfaces

The platform has exactly three fixed surfaces. All three must be present, navigable, and functional. None may be removed, merged into another, or treated as subordinate.

**Pipeline** — the logic and control layer. Sequences implementation stages, drives discovery questions, enforces checkpoints, determines domain activation, governs execution eligibility, tracks implementation state. Users see progress, blockers, and next required actions here.

**Module Dashboard** — the module-level workspace. Exposes each activated domain's checkpoints, guidance, inspection output, preview, and execution surface. Where truthful governed writes exist, the Module Dashboard writes configuration directly to Odoo through approved, audited execution.

**Import Wizard** — the data import surface. Guides users through data preparation, template download, validation, and governed import execution that writes records to Odoo.

### Primary Navigation Structure

1. Dashboard — project summary, stage progress, domain progress, blockers, next actions
2. Implementation Roadmap — stage-ordered view of the implementation journey
3. Module Setup (Module Dashboard) — domain-level workspaces, checkpoints, inspection, preview, execution
4. Data Import (Import Wizard) — governed data import and template preparation
5. Pipeline — checkpoint state, domain activation, governed execution layer
6. Knowledge Base — methodology content and decision reference
7. Analytics — implementation progress and audit reporting
8. Audit Log — execution and checkpoint audit trail
9. Team — team members, roles, and access

### Stage vs Domain Navigation

Stage navigation controls sequencing — use for moving through the implementation journey in dependency order.

Domain navigation controls working depth — use for deep, topic-specific work within a functional area.

Both must reflect the same checkpoint state.

### Dashboard

The dashboard is a control surface, not a reporting warehouse or admin console. It must show:

- project identity and mode
- version, edition, deployment, and environment context
- connection status
- stage and domain progress
- blocked checkpoints
- warnings needing review
- ready-for-review items
- deferred items
- go-live readiness summary
- the next required manual, preview, or execution action

### Connection State Display

The UI must distinguish:
- not connected
- connected for inspection only
- connected for preview
- connected for bounded execution

Unsupported connection or execution paths must be stated directly rather than implied.

### Workspace Structure

Each stage or domain workspace should contain:
1. context header
2. current status
3. checkpoint list
4. guidance blocks
5. evidence and validation panel
6. inspection summary where implemented
7. preview panel where implemented
8. execution result panel where implemented
9. decision log references
10. training entry points where available

### Advanced/Admin Mode Boundaries

Advanced or admin-oriented views may expose more detail but must not:
- bypass checkpoint rules
- expose blocked write paths as permitted
- redefine scope or project mode
- convert the product into a developer diagnostic console
- expose direct database, shell, or unrestricted Odoo administration

Advanced mode increases visibility, not authority.

### Save-and-Resume

Save-and-resume is mandatory. The interface must preserve:
- stage position
- checkpoint state
- unresolved warnings and blockers
- decision log links
- connection context where relevant
- preview and execution history where relevant
- environment and branch target state where relevant

It must restore users to a meaningful last-working context.
