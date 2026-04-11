# Guidance Standards

## Purpose

This document defines the standard structure and writing rules for guidance presented alongside implementation decisions.

## Standard Guidance Block Fields

Every material implementation decision must be expressed with the following fields:

- `What this is` — plain-language definition of the setting, policy, or design choice
- `Why it matters` — the operational reason the decision is consequential
- `Downstream impact` — which later flows, controls, reports, or user behaviors are affected
- `Common mistakes` — predictable implementation errors or false assumptions
- `Reversibility` — whether the decision is easy, difficult, or unsafe to change later
- `Who should decide` — the accountable functional or business owner
- `Training should be offered` — yes, no, or role-dependent
- `Checkpoint blocker` — whether the decision blocks progression if unresolved

## Writing Rules

- Guidance must explain implications, not describe screens.
- Downstream impact must be concrete enough to affect sequencing or checkpointing.
- Reversibility must be honest. Consequential finance or operational decisions must not be described as easily reversible if they are not.
- Decision ownership must name a role type, not "the system."
- Training remains opt-in by default unless the project owner requires it.
- Guidance must be written in plain language readable by a business owner or operations lead without Odoo expertise.

## Authority Source

This document summarizes `docs/06_Guidance_Content_Framework.md`. That document takes precedence over this one in any conflict.
