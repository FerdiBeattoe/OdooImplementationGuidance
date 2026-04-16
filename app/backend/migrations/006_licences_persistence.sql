-- Migration: 006_licences_persistence
-- Adds missing columns to the licences table so that licence-service.js
-- can persist the full licence record to Supabase instead of app/backend/data/licences/.
--
-- Also drops the project_id FK constraint. In the service, project_id is
-- a plain text identifier supplied at payment time — it is not guaranteed to
-- exist in the projects table at licence creation. The unique index on
-- project_id enforces the one-active-licence-per-project invariant needed
-- for upsert.
--
-- Run in Supabase SQL editor.
-- Project: bywbaytwhpvznjmaklzp

-- 1. Drop the project_id FK (plain text identifier — not always in projects table)
ALTER TABLE public.licences
  DROP CONSTRAINT IF EXISTS licences_project_id_fkey;

-- 2. Add columns that match the licence-service.js data model
ALTER TABLE public.licences
  ADD COLUMN IF NOT EXISTS licence_id         text,
  ADD COLUMN IF NOT EXISTS price_paid         numeric,
  ADD COLUMN IF NOT EXISTS early_adopter      boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS early_adopter_slot integer,
  ADD COLUMN IF NOT EXISTS payment_intent_id  text,
  ADD COLUMN IF NOT EXISTS payment_status     text,
  ADD COLUMN IF NOT EXISTS tier               text,
  ADD COLUMN IF NOT EXISTS domains_unlocked   text;

-- 3. Unique index on project_id for upsert support
--    (one active licence per project; project_id may be null on legacy rows)
CREATE UNIQUE INDEX IF NOT EXISTS licences_project_id_unique
  ON public.licences (project_id)
  WHERE project_id IS NOT NULL;
