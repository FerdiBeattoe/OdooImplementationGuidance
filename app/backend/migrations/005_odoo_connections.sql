-- Migration: 005_odoo_connections
-- Creates the odoo_connections table for connection registry persistence.
-- Run in Supabase SQL editor: project bywbaytwhpvznjmaklzp
-- Table already exists in Supabase — this file tracks the schema.
--
-- Purpose:
--   Persists the in-memory connection registry (engine.js connectionRegistry Map)
--   to Supabase so connections survive server restarts.
--   Stores URL and database name only — no credentials, no passwords, no session tokens.
--
-- Used by engine.js:
--   loadConnectionRegistry()  — SELECT project_id, base_url, database, updated_at
--   saveConnectionRegistry()  — UPSERT on conflict project_id
--   disconnectProject()       — DELETE WHERE project_id = ?

CREATE TABLE IF NOT EXISTS odoo_connections (
  project_id  TEXT PRIMARY KEY,
  base_url    TEXT NOT NULL,
  database    TEXT NOT NULL,
  updated_at  TIMESTAMPTZ DEFAULT NOW()
);

-- Row level security: connection records are not scoped to individual users
-- because the project_id is the isolation boundary. Enable RLS but allow
-- authenticated service-role access (server uses service role key).
ALTER TABLE odoo_connections ENABLE ROW LEVEL SECURITY;
