# Decision Log

## Purpose

This log records the initial governing decisions for the project. Additional entries should be appended using the same structure.

## Log Format

Each entry contains:

- Date: `[YYYY-MM-DD]`
- Decision: short, precise statement
- Reason: why the decision was made
- Implications: what the product and repository must follow as a result
- Status: `Active`, `Superseded`, or `Deferred`

## Initial Entries

### DL-001

- Date: `[YYYY-MM-DD]`
- Decision: Reset the repository as a new project for an Odoo 19 Implementation Control Platform.
- Reason: Prior direction must not influence this product. The platform requires a clean governance foundation aligned to implementation control only.
- Implications: no prior Odoo diagnostic, remediation, dev-tool, or repair framing may be inherited into product documents, prompts, or implementation work.
- Status: Active

### DL-002

- Date: `[YYYY-MM-DD]`
- Decision: Support Odoo 19 only.
- Reason: version-specific control is required to avoid diluted rules, mixed assumptions, and unsupported branching behavior.
- Implications: all governance, validation, and guidance content must assume Odoo 19 only; unsupported versions are out of scope.
- Status: Active

### DL-003

- Date: `[YYYY-MM-DD]`
- Decision: Position the product as an implementation tool only.
- Reason: the product purpose is to control correct setup, sequencing, and readiness, not to diagnose or repair failed systems.
- Implications: product flows, UI patterns, and agent behavior must remain centered on implementation control, checkpoints, and forward-safe expansion.
- Status: Active

### DL-004

- Date: `[YYYY-MM-DD]`
- Decision: Exclude remediation from scope.
- Reason: remediation changes the problem space, requires different safeguards, and would blur the platform boundary.
- Implications: no historical correction logic, transactional surgery, repair workflows, or migration-fix behavior may be added.
- Status: Active

### DL-005

- Date: `[YYYY-MM-DD]`
- Decision: Use section-specific grid builders instead of a single generic grid system.
- Reason: implementation work differs materially by section and domain, and control quality is stronger when structured capture matches context.
- Implications: information architecture and future UI design must use bounded, context-aware grids linked to checkpoints and validation.
- Status: Active

### DL-006

- Date: `[YYYY-MM-DD]`
- Decision: Make save-and-resume a required platform capability.
- Reason: implementation programs are multi-session and cannot rely on transient working context.
- Implications: project state, stage position, checkpoint results, decisions, and relevant target context must persist reliably.
- Status: Active

### DL-007

- Date: `[YYYY-MM-DD]`
- Decision: Require an explicit project mode split.
- Reason: fresh implementation, forward-safe expansion, and guided setup of unused modules behave differently and need distinct control logic.
- Implications: project entry must require mode selection and downstream rules must honor that selection.
- Status: Active

### DL-008

- Date: `[YYYY-MM-DD]`
- Decision: Require Odoo.sh branch-aware changes for Enterprise users where relevant.
- Reason: deployment-sensitive work on Odoo.sh cannot be governed safely without explicit target context.
- Implications: branch or environment target must be recorded, surfaced in state, and reflected in affected checkpoint logic.
- Status: Active

### DL-009

- Date: `[YYYY-MM-DD]`
- Decision: Keep training opt-in by default.
- Reason: training should support implementation quality without being assumed universally necessary unless the project owner requires it.
- Implications: training must be available in the framework, but default workflow and readiness logic must not force it unless explicitly required.
- Status: Active

### DL-010

- Date: `[YYYY-MM-DD]`
- Decision: Cover all official Odoo functional module domains at governance level.
- Reason: the platform must be expandable and useful across full implementation scope rather than a narrow subset of modules.
- Implications: the domain coverage framework must provide a governed master structure for listed official Odoo domains while remaining explicit about priority, validation, and write safety; any official domain not listed in the coverage map is not yet governed by this framework and must not be treated as covered until added with the same control fields.
- Status: Active
