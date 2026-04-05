// ---------------------------------------------------------------------------
// Stage Routing Engine — Odoo 19 Implementation Control Platform
// ---------------------------------------------------------------------------
//
// Purpose:
//   First-pass stage routing: maps activated domains and generated checkpoints
//   to implementation stages per the master stage map, groups checkpoints and
//   blockers by stage, and derives source_stage_id for each blocker record.
//
// Governing constraints:
//   - specs/stage_routing_engine.md §1.1 (stage list)
//   - specs/stage_routing_engine.md §2.1 (domain-to-stage assignment table)
//   - specs/stage_routing_engine.md §2.2 (Projects domain conditional rule)
//   - specs/runtime_state_contract.md §1.9 (blockers by_stage field)
//
// Hard rules:
//   R1  Stage IDs, names, and order match the master stage map exactly.
//       No renaming, reordering, or omission.
//   R2  Domain primary stage is derived from the static assignment table (§2.1)
//       only. No inference from checkpoint content or domain metadata.
//   R3  Projects domain primary stage depends solely on BM-01:
//         BM-01 = "Services only" → S07
//         BM-01 ≠ "Services only" OR BM-01 absent → S09
//   R4  Checkpoint stage = primary stage of the checkpoint's domain.
//       No overrides from checkpoint class, validation source, or status.
//   R5  Only activated domains (activated = true) appear in domain_to_stage.
//   R6  Unknown domain IDs not in the static table are skipped silently.
//       No remapping outside the governed stage map.
//   R7  enriched_active_blockers is a copy of input blocker records with
//       source_stage_id derived from checkpoint_to_stage. The original blocker
//       records are never mutated.
//   R8  checkpoints_by_stage lists are sorted lexicographically for determinism.
//   R9  No readiness, deferment, go-live, preview, or execution computation.
//   R10 Output is deterministic: same inputs always produce same outputs.
// ---------------------------------------------------------------------------

import { ODOO_VERSION } from "./constants.js";

if (ODOO_VERSION !== "19") {
  throw new Error(
    `stage-routing-engine: ODOO_VERSION must be "19", got "${ODOO_VERSION}". Halting module init.`
  );
}

// ---------------------------------------------------------------------------
// Engine version — increment on any rule change
// ---------------------------------------------------------------------------

export const STAGE_ROUTING_ENGINE_VERSION = "1.0.0";

// ---------------------------------------------------------------------------
// Stage definitions — master stage map (§1.1)
// Frozen. Ordered by stage_order ascending.
// ---------------------------------------------------------------------------

export const STAGE_DEFINITIONS = Object.freeze([
  Object.freeze({ stage_id: "S01", stage_name: "Entry / Project Setup",   stage_order: 1  }),
  Object.freeze({ stage_id: "S02", stage_name: "Business Assessment",      stage_order: 2  }),
  Object.freeze({ stage_id: "S03", stage_name: "System Discovery",         stage_order: 3  }),
  Object.freeze({ stage_id: "S04", stage_name: "Foundation",               stage_order: 4  }),
  Object.freeze({ stage_id: "S05", stage_name: "Users / Roles / Security", stage_order: 5  }),
  Object.freeze({ stage_id: "S06", stage_name: "Master Data",              stage_order: 6  }),
  Object.freeze({ stage_id: "S07", stage_name: "Core Operations",          stage_order: 7  }),
  Object.freeze({ stage_id: "S08", stage_name: "Finance",                  stage_order: 8  }),
  Object.freeze({ stage_id: "S09", stage_name: "Extended Modules",         stage_order: 9  }),
  Object.freeze({ stage_id: "S10", stage_name: "Validation",               stage_order: 10 }),
  Object.freeze({ stage_id: "S11", stage_name: "Go-Live Readiness",        stage_order: 11 }),
  Object.freeze({ stage_id: "S12", stage_name: "Post Go-Live / Phase 2",   stage_order: 12 }),
]);

// Quick lookup: stage_id → stage_order
const STAGE_ORDER_BY_ID = Object.freeze(
  Object.fromEntries(STAGE_DEFINITIONS.map((s) => [s.stage_id, s.stage_order]))
);

// ---------------------------------------------------------------------------
// Static domain-to-primary-stage map (§2.1)
// Projects domain is excluded — it is resolved conditionally per §2.2.
// PLM is not listed in §2.1; assigned to S09 (Extended Module, MRP extension).
// ---------------------------------------------------------------------------

export const DOMAIN_PRIMARY_STAGE_MAP = Object.freeze({
  foundation:        "S04",
  users_roles:       "S05",
  master_data:       "S06",
  crm:               "S07",
  sales:             "S07",
  purchase:          "S07",
  inventory:         "S07",
  manufacturing:     "S07",
  plm:               "S09",
  accounting:        "S08",
  pos:               "S07",
  website_ecommerce: "S09",
  // projects: conditional — see resolveProjectsStage()
  hr:                "S09",
  quality:           "S09",
  maintenance:       "S09",
  repairs:           "S09",
  documents:         "S09",
  sign:              "S09",
  approvals:         "S09",
  subscriptions:     "S09",
  rental:            "S09",
  field_service:     "S09",
});

// ---------------------------------------------------------------------------
// Projects domain stage resolution (§2.2)
// ---------------------------------------------------------------------------

/**
 * Resolves the primary stage for the Projects domain.
 *
 * BM-01 = "Services only" → S07 (Core Operations)
 * BM-01 anything else, or absent → S09 (Extended Modules)
 *
 * @param {object|null} discoveryAnswers
 * @returns {"S07"|"S09"}
 */
export function resolveProjectsStage(discoveryAnswers) {
  if (
    discoveryAnswers !== null &&
    discoveryAnswers !== undefined &&
    discoveryAnswers.answers !== null &&
    discoveryAnswers.answers !== undefined &&
    discoveryAnswers.answers["BM-01"] === "Services only"
  ) {
    return "S07";
  }
  return "S09";
}

// ---------------------------------------------------------------------------
// Output factories
// ---------------------------------------------------------------------------

/**
 * Creates the stage_routing container returned by computeStageRouting().
 *
 * @param {object} params
 * @param {Array}       params.stages                   - ordered STAGE_DEFINITIONS
 * @param {object}      params.domain_to_stage          - domain_id → stage_id
 * @param {object}      params.checkpoint_to_stage      - checkpoint_id → stage_id
 * @param {object}      params.checkpoints_by_stage     - stage_id → string[]
 * @param {object|null} params.blockers_by_stage        - stage_id → count; null if empty
 * @param {Array}       params.enriched_active_blockers - blocker records with source_stage_id
 * @param {string}      params.engine_version
 * @param {string}      params.routed_at                - ISO 8601 timestamp
 * @returns {object}  stage_routing
 */
export function createStageRouting({
  stages = [],
  domain_to_stage = {},
  checkpoint_to_stage = {},
  checkpoints_by_stage = {},
  blockers_by_stage = null,
  enriched_active_blockers = [],
  engine_version = null,
  routed_at = null,
} = {}) {
  return {
    stages:                   Array.isArray(stages) ? stages : [],
    domain_to_stage:          domain_to_stage ?? {},
    checkpoint_to_stage:      checkpoint_to_stage ?? {},
    checkpoints_by_stage:     checkpoints_by_stage ?? {},
    blockers_by_stage:        blockers_by_stage ?? null,
    enriched_active_blockers: Array.isArray(enriched_active_blockers) ? enriched_active_blockers : [],
    engine_version:           engine_version ?? null,
    routed_at:                routed_at ?? null,
  };
}

// ---------------------------------------------------------------------------
// Internal helpers
// ---------------------------------------------------------------------------

/**
 * Builds domain_to_stage from activated_domains.domains (activated only).
 * Unknown domain IDs are skipped (R6).
 */
function buildDomainToStage(activatedDomains, discoveryAnswers) {
  const result = {};
  const domains = activatedDomains?.domains ?? [];
  for (const domain of domains) {
    if (!domain.activated) continue;
    const id = domain.domain_id;
    if (id === "projects") {
      result[id] = resolveProjectsStage(discoveryAnswers);
    } else if (Object.prototype.hasOwnProperty.call(DOMAIN_PRIMARY_STAGE_MAP, id)) {
      result[id] = DOMAIN_PRIMARY_STAGE_MAP[id];
    }
    // Unknown domain_id: skip silently (R6)
  }
  return result;
}

/**
 * Builds checkpoint_to_stage by joining each checkpoint's domain to domainToStage.
 * Checkpoints whose domain is not in domainToStage are excluded.
 */
function buildCheckpointToStage(checkpoints, domainToStage) {
  const result = {};
  for (const cp of checkpoints) {
    const stage = domainToStage[cp.domain];
    if (stage !== undefined) {
      result[cp.checkpoint_id] = stage;
    }
  }
  return result;
}

/**
 * Builds checkpoints_by_stage: inverts checkpoint_to_stage into stage → sorted ids[].
 */
function buildCheckpointsByStage(checkpointToStage) {
  const result = {};
  for (const [checkpointId, stageId] of Object.entries(checkpointToStage)) {
    if (!Object.prototype.hasOwnProperty.call(result, stageId)) {
      result[stageId] = [];
    }
    result[stageId].push(checkpointId);
  }
  // Sort each list lexicographically for determinism (R8, R10)
  for (const stageId of Object.keys(result)) {
    result[stageId].sort();
  }
  return result;
}

/**
 * Derives source_stage_id for each blocker record (R7).
 * Returns new blocker objects — originals are not mutated.
 */
function enrichBlockers(activeBlockers, checkpointToStage) {
  return activeBlockers.map((b) => {
    const stageId = checkpointToStage[b.source_checkpoint_id] ?? null;
    return { ...b, source_stage_id: stageId };
  });
}

/**
 * Builds blockers_by_stage counts from enriched blocker records.
 * Returns null when no blockers have a resolved stage_id.
 */
function buildBlockersByStage(enrichedBlockers) {
  const result = {};
  for (const b of enrichedBlockers) {
    if (b.source_stage_id !== null && b.source_stage_id !== undefined) {
      result[b.source_stage_id] = (result[b.source_stage_id] ?? 0) + 1;
    }
  }
  return Object.keys(result).length > 0 ? result : null;
}

// ---------------------------------------------------------------------------
// Main export: computeStageRouting
// ---------------------------------------------------------------------------

/**
 * Derives stage routing assignments from activated domains and checkpoints.
 *
 * Does NOT compute readiness, deferments, go-live, previews, or executions.
 *
 * @param {object}      activatedDomains      - persisted activated_domains object
 * @param {Array}       checkpoints           - array of checkpoint records
 * @param {object}      validatedCheckpoints  - output of computeValidation()
 *                                              { records, engine_version, validated_at }
 * @param {object}      blockers              - output of computeBlockers()
 *                                              { active_blockers, total_count, ... }
 * @param {object|null} [discoveryAnswers]    - optional; used for Projects §2.2 only
 * @returns {object}  stage_routing
 */
export function computeStageRouting(
  activatedDomains,
  checkpoints,
  validatedCheckpoints,
  blockers,
  discoveryAnswers = null
) {
  if (activatedDomains === null || typeof activatedDomains !== "object") {
    throw new Error("computeStageRouting: activatedDomains must be an object.");
  }
  if (!Array.isArray(checkpoints)) {
    throw new Error("computeStageRouting: checkpoints must be an array.");
  }
  if (
    validatedCheckpoints === null ||
    typeof validatedCheckpoints !== "object" ||
    !Array.isArray(validatedCheckpoints.records)
  ) {
    throw new Error(
      "computeStageRouting: validatedCheckpoints must be an object with a records array."
    );
  }
  if (
    blockers === null ||
    typeof blockers !== "object" ||
    !Array.isArray(blockers.active_blockers)
  ) {
    throw new Error(
      "computeStageRouting: blockers must be an object with an active_blockers array."
    );
  }

  // Step 1: build domain → stage from activated domains
  const domainToStage = buildDomainToStage(activatedDomains, discoveryAnswers);

  // Step 2: build checkpoint → stage (via domain's primary stage)
  const checkpointToStage = buildCheckpointToStage(checkpoints, domainToStage);

  // Step 3: group checkpoint IDs by stage
  const checkpointsByStage = buildCheckpointsByStage(checkpointToStage);

  // Step 4: enrich blocker records with source_stage_id
  const enrichedActiveBlockers = enrichBlockers(
    blockers.active_blockers,
    checkpointToStage
  );

  // Step 5: count blockers per stage
  const blockersByStage = buildBlockersByStage(enrichedActiveBlockers);

  return createStageRouting({
    // Shallow-copy each stage definition to prevent external mutation
    stages: STAGE_DEFINITIONS.map((s) => ({ ...s })),
    domain_to_stage:          domainToStage,
    checkpoint_to_stage:      checkpointToStage,
    checkpoints_by_stage:     checkpointsByStage,
    blockers_by_stage:        blockersByStage,
    enriched_active_blockers: enrichedActiveBlockers,
    engine_version:           STAGE_ROUTING_ENGINE_VERSION,
    routed_at:                new Date().toISOString(),
  });
}
