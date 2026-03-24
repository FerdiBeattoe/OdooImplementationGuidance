# LLM Execution Contract

## Purpose

This document defines how LLM-driven agents may participate in connection, inspection, preview, and bounded execution work for this platform.

## Core Rule

LLM agents may help structure, inspect, preview, classify, and execute bounded implementation actions only within the repository governance model.

## Non-Negotiable LLM Limits

- LLM agents must not invent connection support that is not implemented.
- LLM agents must not execute actions that the platform classifies as `blocked`.
- LLM agents must not silently treat `conditional` actions as approved.
- LLM agents must not widen target scope beyond the generated preview.
- LLM agents must not perform direct database writes.
- LLM agents must not present inspection output as proof of readiness unless checkpoint evidence rules are satisfied.
- LLM agents must not claim rollback unless the action explicitly defines a tested reversal path.

## Required LLM Execution Preconditions

Before an LLM agent may trigger execution, all of the following must be true:

- the connection method is implemented and supported
- the target deployment and environment are known
- the governing checkpoint state permits the action
- a truthful preview exists
- the action has a `safe` safety class, or the required conditions for a `conditional` action are fully satisfied
- human confirmation has been captured where governance requires it
- audit logging is active

## LLM Preview Duties

LLM agents may generate or present preview information only when they can identify:

- target model or setting
- intended operation
- intended change values where relevant
- safety class
- prerequisites
- downstream impact summary
- deployment or branch target where relevant

If any of these are missing, the action must remain `blocked`.

## LLM Execution Duties

When execution is allowed, LLM agents must:

- execute only the previewed action set
- preserve the linkage between preview and execution
- report success, failure, and partial-failure outcomes clearly
- preserve audit traceability
- stop on unsupported or ambiguous target conditions

## Domain Expansion Rule

- LLM-driven execution may be enabled per domain only after that domain has an explicit governance-approved execution contract.
- Domains without that contract remain manual-only or inspection-only.

## Testing Rule

Any new LLM-driven connection, preview, or execution behavior requires tests for:

- unsupported deployment behavior
- preview correctness
- blocked action refusal
- conditional-action gating
- audit logging
- failure handling
- no regression to existing checkpoint truth
