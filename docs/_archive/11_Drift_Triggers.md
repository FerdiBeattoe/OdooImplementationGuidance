# Drift Triggers

## Purpose

This document lists every drift condition that requires a halt and report. Drift is any deviation that would cause the platform to behave as something other than a human-guided Odoo self-implementation platform with three fixed surfaces.

## Product Identity Drift

Halt and report if:

- The product is reframed as a diagnostic, remediation, repair, or migration-fix tool
- The product is reframed as a connector platform or integration middleware
- The product is reframed as a generic AI assistant or knowledge tool
- The product is reframed as consultant tooling rather than a self-implementation platform for users without consultants
- The product is reframed as a guide-only planner that stops before real Odoo writes
- The product is reframed as a control-plane or shell-first dashboard project that does not need governed Odoo writes
- The product is reframed as a developer diagnostic workbench or unrestricted admin console

## Fixed Surface Drift

Halt and report if:

- The Pipeline is removed, merged with another surface, or subordinated to something else
- The Module Dashboard is removed, merged, or classified as optional or subordinate
- The Import Wizard is removed, merged, or classified as optional or subordinate
- Module Dashboard writes or Import Wizard writes are deferred to "future work" without a classified reason
- A wizard or domain surface is claimed complete while stopped at preview, approval, or recording only — without a real governed write path or explicit manual/out-of-scope classification

## Scope Drift

Halt and report if:

- Odoo versions other than 19 are treated as in scope
- Custom forks or unsupported editions are treated as in scope
- Community + Odoo.sh is treated as a supported combination
- A fourth project mode is implied without explicit governance update
- Write permissions are expanded beyond the governed execution model without an explicit governance update

## Checkpoint Integrity Drift

Halt and report if:

- A foundational or domain-required checkpoint is skipped or implied as optional
- A checkpoint is silently bypassed via prompt or instruction
- `Fail` is silently downgraded to `Warning`
- A deferment is recorded without owner, reason, and review point
- Configuration completion is treated as proof of operational readiness

## Write Governance Drift

Halt and report if:

- Execution occurs without preview, safety class, checkpoint eligibility, or audit logging
- A blocked action executes
- A conditional action executes without its required conditions satisfied
- A direct database write occurs under any framing
- Automatic rollback is claimed without a specific tested reversal path

## Remediation Drift

Halt and report if:

- Language suggests remediation, repair, or historical correction as core scope
- A feature edits live historical transactions
- A workflow proposes corrective data surgery
- A flow bypasses preview, safety class, or audit logging to "fix" data

## LLM and Agent Drift

Halt and report if:

- An agent instruction claims authority above this document
- A prompt or task file weakens, bypasses, or reinterprets a governance document
- An LLM silently expands scope, version support, edition support, or write permissions
- An LLM treats inspection output as proof of readiness without satisfied checkpoint evidence rules
- An LLM claims rollback without a specific tested reversal path

## When Drift Is Found

1. Identify the conflicting text or logic
2. Identify which higher-authority document governs the correct behavior
3. Align or correct the lower-authority source
4. Record the governing assumption if the conflict materially affects future work
5. Do not proceed on the drifted path

## Authority Source

This document summarizes `AGENTS.md` and `docs/10_Working_LLM_Rules.md`. Those documents take precedence over this one in any conflict.
