# Project Modes

## Supported Project Types

1. New implementation
   - a fresh Odoo 19 implementation where the operating model is being established from the ground up
2. Expansion of existing implementation
   - a forward-safe extension of an existing Odoo 19 implementation without remediation logic or historical correction
3. Guided setup of unused modules or features
   - structured activation and setup of modules or features that are not currently in operational use within an Odoo 19 implementation

## Mode Logic

### New Implementation

Allowed emphasis:

- end-to-end setup sequencing
- foundational decision capture
- structured module rollout
- go-live readiness control

Restricted emphasis:

- repair of prior failed setups
- corrective handling of legacy mistakes

### Expansion Of Existing Implementation

Allowed emphasis:

- bounded expansion
- compatibility checks with the live operating model
- explicit downstream impact review
- staged activation with deferment where needed

Restricted emphasis:

- backward corrective cleanup
- repair of historical transactional damage

### Guided Setup Of Unused Modules Or Features

Allowed emphasis:

- readiness assessment
- controlled activation
- checkpoint-driven setup
- training and adoption planning where needed

Restricted emphasis:

- retroactive correction of prior misconfiguration
- activation without stage and domain dependencies

## Target Matrix Envelope

- all supported combinations must remain within Odoo 19 only
- Community and Enterprise must be treated distinctly where feature set differs
- deployment constraints are authoritative even when a desired workflow would be possible elsewhere
- Community + Odoo.sh is out of scope and must not be inferred as a supported combination
- project mode determines the allowed behavior envelope and must be selected explicitly at project entry
- if a proposed activity does not fit one of the three project modes, it is out of scope
