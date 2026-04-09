const writeAudit = (supabase, {
  projectId,
  accountId,
  actorName,
  actorRole,
  action,
  domain,
  checkpointId,
  details,
}) => {
  try {
    if (!supabase) {
      return;
    }

    supabase
      .from("audit_log")
      .insert({
        project_id: projectId,
        account_id: accountId || null,
        actor_name: actorName,
        actor_role: actorRole,
        action,
        domain: domain || null,
        checkpoint_id: checkpointId || null,
        details: details || {},
        created_at: new Date().toISOString(),
      })
      .then(() => {})
      .catch((err) => console.error("[audit] write failed:", err));
  } catch (err) {
    console.error("[audit] write failed:", err);
  }
};

function buildBaseDetails(baseContext = {}) {
  return {
    projectId: baseContext.projectId || null,
    accountId: baseContext.accountId || null,
    actorName: baseContext.actorName || "",
    actorRole: baseContext.actorRole || "",
  };
}

function fireAuditEvent(supabase, baseContext, action, details, { domain = null, checkpointId = null } = {}) {
  const normalized = buildBaseDetails(baseContext);
  if (!normalized.projectId) {
    return;
  }

  writeAudit(supabase, {
    projectId: normalized.projectId,
    accountId: normalized.accountId,
    actorName: normalized.actorName,
    actorRole: normalized.actorRole,
    action,
    domain,
    checkpointId,
    details,
  });
}

export function logPipelineRunStarted(supabase, baseContext, { domainCount = 0, answerCount = 0 } = {}) {
  fireAuditEvent(supabase, baseContext, "pipeline_run_started", {
    project_id: baseContext?.projectId || null,
    domain_count: domainCount,
    answer_count: answerCount,
    timestamp: new Date().toISOString(),
  });
}

export function logDiscoveryAnswersSubmitted(
  supabase,
  baseContext,
  { answerCount = 0, domainsActivated = [] } = {}
) {
  fireAuditEvent(supabase, baseContext, "discovery_answers_submitted", {
    project_id: baseContext?.projectId || null,
    answer_count: answerCount,
    domains_activated: domainsActivated,
    timestamp: new Date().toISOString(),
  });
}

export function logDomainActivated(
  supabase,
  baseContext,
  { domainId, triggerQuestion }
) {
  if (!domainId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "domain_activated",
    {
      project_id: baseContext?.projectId || null,
      domain_id: domainId,
      trigger_question: triggerQuestion || null,
      timestamp: new Date().toISOString(),
    },
    { domain: domainId }
  );
}

export function logCheckpointConfirmed(
  supabase,
  baseContext,
  { checkpointId, confirmedBy, evidence, domain }
) {
  if (!checkpointId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "checkpoint_confirmed",
    {
      project_id: baseContext?.projectId || null,
      checkpoint_id: checkpointId,
      confirmed_by: confirmedBy || baseContext?.actorName || "",
      evidence: evidence || "",
      timestamp: new Date().toISOString(),
    },
    { domain: domain || null, checkpointId }
  );
}

export function logGovernedWriteAttempted(
  supabase,
  baseContext,
  { checkpointId, approvalId, operation }
) {
  if (!baseContext?.projectId || !approvalId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "governed_write_attempted",
    {
      project_id: baseContext.projectId,
      checkpoint_id: checkpointId || null,
      approval_id: approvalId,
      operation_model: operation?.model || null,
      operation_method: operation?.method || null,
      timestamp: new Date().toISOString(),
    },
    { checkpointId: checkpointId || null }
  );
}

export function logGovernedWriteSucceeded(
  supabase,
  baseContext,
  { checkpointId, approvalId, executionInputs, executedAt }
) {
  if (!baseContext?.projectId || !approvalId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "governed_write_succeeded",
    {
      project_id: baseContext.projectId,
      checkpoint_id: checkpointId || null,
      approval_id: approvalId,
      execution_source_inputs: executionInputs || null,
      executed_at: executedAt || null,
      timestamp: new Date().toISOString(),
    },
    { checkpointId: checkpointId || null }
  );
}

export function logGovernedWriteFailed(
  supabase,
  baseContext,
  { checkpointId, approvalId, error, executionInputs }
) {
  if (!baseContext?.projectId || !approvalId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "governed_write_failed",
    {
      project_id: baseContext.projectId,
      checkpoint_id: checkpointId || null,
      approval_id: approvalId,
      error: error || "",
      execution_source_inputs: executionInputs || null,
      timestamp: new Date().toISOString(),
    },
    { checkpointId: checkpointId || null }
  );
}

export function logWizardCompleted(
  supabase,
  baseContext,
  { domainId, wizardDataKeys = [] }
) {
  if (!domainId) {
    return;
  }

  fireAuditEvent(
    supabase,
    baseContext,
    "wizard_completed",
    {
      project_id: baseContext?.projectId || null,
      domain: domainId,
      wizard_data_keys: wizardDataKeys,
      timestamp: new Date().toISOString(),
    },
    { domain: domainId }
  );
}

export function logScanCompleted(
  supabase,
  baseContext,
  { modulesDetected }
) {
  fireAuditEvent(supabase, baseContext, "scan_completed", {
    project_id: baseContext?.projectId || null,
    modules_detected: modulesDetected || [],
    timestamp: new Date().toISOString(),
  });
}

export function logGoLiveReached(
  supabase,
  baseContext,
  { totalCheckpoints, durationDays }
) {
  fireAuditEvent(supabase, baseContext, "go_live_reached", {
    project_id: baseContext?.projectId || null,
    total_checkpoints: totalCheckpoints,
    duration_days: durationDays,
    timestamp: new Date().toISOString(),
  });
}

export default writeAudit;
