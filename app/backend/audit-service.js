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
      .from('audit_log')
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
      .catch((err) => console.error('[audit] write failed:', err));
  } catch (err) {
    console.error('[audit] write failed:', err);
  }
};

export default writeAudit;
