# Drift Triggers

## Drift Indicators

- language that suggests remediation, repair, migration fix, forensic analysis, or post-failure recovery as core scope
- features that edit live historical transactions or perform corrective data surgery
- content that treats unsupported Odoo versions as in scope
- content that ignores edition or deployment differences where they materially affect behavior
- content that allows checkpoint skipping without explicit deferment rules
- UI or workflow language that implies unrestricted write access
- agent instructions that claim authority above the repository governance documents
- implementation flows that are not branch-aware for relevant Odoo.sh Enterprise changes
- unsupported version expansion
- remediation or repair framing
- unchecked write behavior
- missing checkpoint enforcement
- loss of distinction between configuration completion and operational readiness
- absence of branch-aware handling for relevant Odoo.sh Enterprise changes
- progress that prioritizes shell, UI, or dashboard work over implementation write capability
- wizard or domain work claimed complete while stopped at preview, approval, or recording only
- framing the product as a guide-only planner or control-plane that does not need real Odoo writes
- treating preview/approval/execution recording as the end product rather than means to usable implementation

## When To Escalate Ambiguity

Escalate when:

- two high-authority documents appear to conflict
- a requested feature does not clearly fit a supported project mode
- a change would weaken checkpoint enforcement
- deployment context is missing for a deployment-sensitive rule
- the work risks crossing into remediation, repair, or migration-fix behavior

## Response To Drift

When drift is found:

1. identify the conflicting text or logic
2. align it to the higher-authority document set
3. record the governing assumption if the correction materially affects future work
