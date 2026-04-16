# State and Resume Rules

## Purpose

This document defines what state the platform must save and how it must behave when work is resumed.

## Required State Fields

The platform must save state sufficient to reconstruct:

- project identity (name, id, entity, owner, lead, mode, version, edition, deployment)
- environment context (deployment type, hosting constraints, company scope, localization, module scope, Odoo.sh branch target where relevant)
- workflow position (current stage, domain, section, stage and domain completion status)
- checkpoint state for every checkpoint (status, validation source, evidence, safety class, blocked/deferred flags, dependency references, linked preview and execution ids, actor and timestamp)
- connection state (mode, status, capability level, authenticated environment identity — no secrets)
- preview state (id, target, operation, changes, safety class, prerequisites, impact, actor, timestamp)
- execution state (id, linked preview id, actor, target, status, result, failure reason, confirmations, timestamps)
- decision log linkages
- training state (available, assigned, required, completed)
- branch/environment target state where relevant

## Resume Behavior

When a project is resumed, the platform must:

- return the user to the last meaningful working location
- restore unresolved blockers and warnings prominently
- preserve unsatisfied dependencies
- preserve deferred items with their review conditions
- preserve environment and target context
- preserve preview and execution history

Resume must not imply readiness if saved state reflects only partial configuration, inspection, or incomplete preview.

## Configuration Completion vs Operational Readiness

Configuration completion means setup work has been planned, previewed, or performed for the defined scope.

Operational readiness requires:

- required checkpoints have passed
- go-live controls are satisfied
- required decisions are approved
- known blockers are resolved
- required preview and execution records are complete where applicable
- any mandatory training requirements are addressed

The platform must never treat configuration completion alone as proof of operational readiness.

## Status Values

- `Not Started` — no substantive work begun
- `In Progress` — active and not yet ready for review
- `Blocked` — required progress cannot continue due to unmet conditions
- `Ready For Review` — ready for explicit review or approval
- `Complete` — satisfies all defined criteria
- `Deferred` — intentionally postponed under recorded conditions

## Authority Source

This document summarizes `docs/08_Project_State_Model.md`. That document takes precedence over this one in any conflict.
