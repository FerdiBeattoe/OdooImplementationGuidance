# Project Scope

## Version

- supported version: Odoo 19 only
- unsupported versions: all earlier and later Odoo versions
- no dual-version behavior, migration bridge logic, or version comparison workflows

## Editions

- Odoo 19 Community
- Odoo 19 Enterprise
- edition-specific guidance is required wherever capability, licensing, hosting, or module availability differs
- the platform must not imply Enterprise capabilities are available in Community

## Deployments

- Odoo Online
- Odoo.sh for Enterprise only
- On-Premise
- deployment-aware rules must be applied when configuration method, hosting control, module availability, deployment governance, or change process differs

## Module And Domain Coverage

- the current domain coverage map is a first-pass governed domain structure
- it does not claim exhaustive checkpoint completeness for every official Odoo 19 domain
- any official domain not listed in the coverage map is not yet governed by the framework and must not be treated as covered until added with the same control fields
- domain entries are governance shells, not proof of exhaustive checkpoint completeness within that domain

## All Modules Clarification

Includes:

- modules already in use
- modules planned for current phase
- modules intentionally deferred
- modules currently unused but considered for forward-safe activation

Does not mean:

- every technical object at field level
- every custom module ever created by a partner
- every unsupported third-party add-on
- historical cleanup of previously misconfigured modules
