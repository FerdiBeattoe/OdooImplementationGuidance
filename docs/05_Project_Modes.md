# Project Modes

There are exactly three supported project modes. Every project must select one at entry.

## Mode 1 — New Implementation

A fresh Odoo 19 operating model and configuration baseline established from the ground up.

Allowed: end-to-end setup sequencing, foundational decision capture, structured module rollout, go-live readiness control.

Restricted: repair of prior failed setups, corrective handling of legacy mistakes.

## Mode 2 — Expansion of Existing Implementation

An existing Odoo 19 instance is operational. The project is adding new capability in a forward-safe way.

Allowed: bounded expansion, compatibility checks with the live operating model, explicit downstream impact review, staged activation with deferment where needed.

Restricted: backward corrective cleanup, repair of historical transactional damage.

## Mode 3 — Guided Setup of Unused Modules or Features

Official Odoo 19 modules or features exist in the system or license scope but are not yet in operational use.

Allowed: readiness assessment, controlled activation, checkpoint-driven setup, training and adoption planning.

Restricted: retroactive correction of prior misconfiguration, activation without stage and domain dependencies.

## Rules

- Project mode must be selected explicitly at project entry.
- Downstream rules honor the selected mode.
- If a proposed activity does not fit one of the three modes, it is out of scope.
- All three modes operate within the same fixed Odoo scope (version 19, Community/Enterprise, supported deployments).

## Authority Source

This document summarizes `docs/02_Target_Matrix.md`. That document takes precedence in any conflict.
