-- Migration: 004_audit_log
-- Creates the audit_log table for full implementation traceability.
-- Run in Supabase SQL editor: project bywbaytwhpvznjmaklzp
-- Table already exists in Supabase — this file tracks the schema.

CREATE TABLE IF NOT EXISTS audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id TEXT NOT NULL,
  account_id UUID REFERENCES accounts(id),
  actor_name TEXT NOT NULL,
  actor_role TEXT NOT NULL,
  action TEXT NOT NULL,
  domain TEXT,
  checkpoint_id TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_audit_log_project_time
  ON audit_log(project_id, created_at DESC);

-- Valid action values (enforced in /api/audit/write whitelist):
-- checkpoint_confirmed | checkpoint_executed | pipeline_run
-- member_invited | member_removed | member_role_changed
-- commit_approved | commit_cancelled | report_generated
-- module_installed
