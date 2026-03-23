# Target Matrix

## Purpose

This matrix defines the supported implementation envelope for the platform and the behavior allowed within each project mode.

## Project Mode Selector Logic

### New Implementation

Use this mode when the organization is establishing a fresh Odoo 19 operating model and configuration baseline.

Allowed emphasis:

- end-to-end setup sequencing
- foundational decision capture
- structured module rollout
- go-live readiness control

Restricted emphasis:

- repair of prior failed setups
- corrective handling of legacy mistakes

### Expansion Of Existing Implementation

Use this mode when an existing Odoo 19 implementation is operational and the project is adding new capability in a forward-safe way.

Allowed emphasis:

- bounded expansion
- compatibility checks with the live operating model
- explicit downstream impact review
- staged activation with deferment where needed

Restricted emphasis:

- backward corrective cleanup
- repair of historical transactional damage

### Guided Setup Of Unused Modules Or Features

Use this mode when official Odoo 19 modules or features exist in the system or license scope but are not yet in operational use.

Allowed emphasis:

- readiness assessment
- controlled activation
- checkpoint-driven setup
- training and adoption planning where needed

Restricted emphasis:

- retroactive correction of prior misconfiguration
- activation without stage and domain dependencies

## Support Matrix

| Version | Edition | Deployment | Project Mode | Allowed Behavior | Restricted Behavior | Notes |
|---|---|---|---|---|---|---|
| Odoo 19 | Community | Online | New implementation | Guided setup within Online constraints, checkpoint sequencing, user-confirmed decisions | Enterprise-only assumptions, server-level control, remediation logic | Respect Online platform limits and feature availability. |
| Odoo 19 | Community | On-Premise | New implementation | Controlled setup, environment-aware guidance, checkpoint evidence | Historical correction workflows, unsupported version mixing | Technical freedom does not remove checkpoint control. |
| Odoo 19 | Enterprise | Online | New implementation | Guided functional setup, deployment-aware constraints, go-live readiness tracking | Branch-targeting assumptions, unrestricted backend changes, remediation logic | Online limits must be treated as product constraints. |
| Odoo 19 | Enterprise | Odoo.sh | New implementation | Branch-aware planning, staged rollout, environment-targeted validation | Production-target ambiguity, skipped deployment checkpoints, remediation logic | Branch target must be explicit where changes are deployment-sensitive. |
| Odoo 19 | Enterprise | On-Premise | New implementation | Full implementation sequencing, controlled writes, environment-specific approvals | Historical correction, unbounded automation, checkpoint bypass | Local control increases responsibility, not scope. |
| Odoo 19 | Community | Online | Expansion of existing implementation | Forward-safe module enablement within Online limits, compatibility review | Retrospective repair, Enterprise-only patterns | Expansion must not depend on correcting history. |
| Odoo 19 | Community | On-Premise | Expansion of existing implementation | Controlled addition of new domains or features, evidence-backed validation | Cleanup tooling, transaction surgery | Existing live state must be respected as context, not repaired. |
| Odoo 19 | Enterprise | Online | Expansion of existing implementation | Forward-safe feature rollout, role review, training opt-in | Environment-unsafe writes, remediation | Online operational constraints still govern changes. |
| Odoo 19 | Enterprise | Odoo.sh | Expansion of existing implementation | Branch-aware rollout, staged testing, target-specific approvals | Unclear branch targeting, direct production assumption, repair logic | Deployment-sensitive changes require branch/environment state. |
| Odoo 19 | Enterprise | On-Premise | Expansion of existing implementation | Controlled expansion with local deployment governance | Retroactive correction, unsupported migration handling | Change control remains mandatory. |
| Odoo 19 | Community | Online | Guided setup of unused modules/features | Structured activation of available features, user-confirmed readiness | Unsupported modules, remediation framing | Only unused and non-operational features qualify. |
| Odoo 19 | Community | On-Premise | Guided setup of unused modules/features | Controlled setup of dormant modules or features with validation | Historical cleanup, custom repair workflows | Feature activation must respect dependencies. |
| Odoo 19 | Enterprise | Online | Guided setup of unused modules/features | Controlled activation of licensed features within Online boundaries | Backend assumptions not available in Online, repair logic | Training remains opt-in unless project owner requires it. |
| Odoo 19 | Enterprise | Odoo.sh | Guided setup of unused modules/features | Branch-aware activation and staged validation | Production deployment without target clarity, remediation | Use branch-aware checkpointing where deployment path matters. |
| Odoo 19 | Enterprise | On-Premise | Guided setup of unused modules/features | Controlled activation, dependency checks, role and policy confirmation | Unbounded feature toggling, historical correction | Activation is allowed only when forward-safe. |

## General Matrix Rules

- All supported combinations must remain within Odoo 19 only.
- Community and Enterprise must be treated distinctly where feature set differs.
- Deployment constraints are authoritative even when a desired workflow would be possible elsewhere.
- Community + Odoo.sh is out of scope and must not be inferred as a supported combination.
- Project mode determines the allowed behavior envelope and must be selected explicitly at project entry.
- If a proposed activity does not fit one of the three project modes, it is out of scope.
