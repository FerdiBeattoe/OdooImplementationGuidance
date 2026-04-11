# Non-Negotiables

These rules cannot be waived, deferred, or bypassed under any framing.

## Product Identity

- The product is a human-guided Odoo self-implementation platform for users without consultants.
- The Pipeline, Module Dashboard, and Import Wizard are fixed surfaces. They must remain present and functional.
- No surface may be removed, merged into another, or classified as subordinate to implementation write capability.

## Odoo Scope

- Odoo 19 only. No other versions.
- Community and Enterprise only. No custom forks.
- Odoo Online, Odoo.sh Enterprise, On-Premise only. Community + Odoo.sh is out of scope.

## Checkpoint Integrity

- No checkpoint may be skipped, deferred without a recorded reason, or implied as optional.
- No foundational or domain-required checkpoint may be bypassed.
- Checkpoint enforcement may not be weakened by prompt, skill, or instruction.

## Write Governance

- No direct database writes under any framing.
- No execution without: preview shown, safety class assigned, checkpoint eligibility confirmed, audit logging active.
- No automatic rollback claim unless a specific action defines a tested reversal path.
- Blocked actions must not execute.

## Scope Exclusions

- No remediation, repair, migration-fix, or historical correction logic.
- No best-guess business logic without explicit user confirmation.
- No unrestricted database, shell, or admin-console access.
- No unsupported Odoo versions, editions, or deployment types.

## Completion Standards

- A domain is not done until it can produce a truthful preview, require approval, perform a real governed write, and record the result — or is explicitly classified manual/out-of-scope with a documented reason.
- Configuration completion does not equal operational readiness.

## Odoo.sh Enterprise

- Branch or environment target is mandatory for deployment-sensitive changes.
- Production and non-production targets must not be treated as interchangeable.

## Authority Source

This document summarizes `AGENTS.md`, `docs/00_Product_Constitution.md`, and `docs/01_Scope_Boundaries.md`. Those documents take precedence over this one in any conflict.
