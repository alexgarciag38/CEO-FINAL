-- Incidents Module: employees, incident_types, incidents, incident_comments
-- Safe to run multiple times

DO $$ BEGIN
  CREATE EXTENSION IF NOT EXISTS pgcrypto;
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
EXCEPTION WHEN others THEN NULL; END $$;

-- employees
CREATE TABLE IF NOT EXISTS public.employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  email TEXT,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  external_user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE public.employees ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY employees_select_own ON public.employees
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY employees_insert_own ON public.employees
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY employees_update_own ON public.employees
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY employees_delete_own ON public.employees
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_employees_user_id ON public.employees(user_id);
CREATE INDEX IF NOT EXISTS idx_employees_is_active ON public.employees(is_active);

-- incident_types
CREATE TABLE IF NOT EXISTS public.incident_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  name TEXT NOT NULL,
  description TEXT,
  color_hex TEXT NOT NULL DEFAULT '#3B82F6',
  is_active BOOLEAN NOT NULL DEFAULT TRUE
);

ALTER TABLE public.incident_types ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY incident_types_select_own ON public.incident_types
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_types_insert_own ON public.incident_types
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_types_update_own ON public.incident_types
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_types_delete_own ON public.incident_types
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_incident_types_user_id ON public.incident_types(user_id);
CREATE INDEX IF NOT EXISTS idx_incident_types_is_active ON public.incident_types(is_active);

-- Backfill color_hex if missing (for existing rows)
DO $$ BEGIN
  ALTER TABLE public.incident_types ALTER COLUMN color_hex SET DEFAULT '#3B82F6';
EXCEPTION WHEN others THEN NULL; END $$;
UPDATE public.incident_types SET color_hex = COALESCE(color_hex, '#3B82F6');

-- incidents
CREATE TABLE IF NOT EXISTS public.incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  incident_at TIMESTAMPTZ,
  user_id UUID NOT NULL DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  priority TEXT NOT NULL CHECK (priority IN ('low','medium','high','critical')),
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','in_progress','resolved','closed','cancelled')),
  due_date DATE,
  resolution_details TEXT,
  root_cause TEXT,
  resolved_at TIMESTAMPTZ,
  attachments_url JSONB NOT NULL DEFAULT '[]'::jsonb,
  incident_type_id UUID NOT NULL REFERENCES public.incident_types(id) ON DELETE RESTRICT,
  assigned_to_employee_id UUID NOT NULL REFERENCES public.employees(id) ON DELETE RESTRICT,
  verified_by_employee_id UUID REFERENCES public.employees(id) ON DELETE SET NULL
);

ALTER TABLE public.incidents ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY incidents_select_own ON public.incidents
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_insert_own ON public.incidents
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_update_own ON public.incidents
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_delete_own ON public.incidents
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_incidents_user_id ON public.incidents(user_id);
CREATE INDEX IF NOT EXISTS idx_incidents_created_at ON public.incidents(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_incidents_status ON public.incidents(status);
CREATE INDEX IF NOT EXISTS idx_incidents_type ON public.incidents(incident_type_id);
CREATE INDEX IF NOT EXISTS idx_incidents_assignee ON public.incidents(assigned_to_employee_id);

-- incident_comments
CREATE TABLE IF NOT EXISTS public.incident_comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  user_id UUID NOT NULL DEFAULT auth.uid(),
  incident_id UUID NOT NULL REFERENCES public.incidents(id) ON DELETE CASCADE,
  comment TEXT NOT NULL
);

ALTER TABLE public.incident_comments ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  CREATE POLICY incident_comments_select_own ON public.incident_comments
    FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_comments_insert_own ON public.incident_comments
    FOR INSERT WITH CHECK (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_comments_update_own ON public.incident_comments
    FOR UPDATE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incident_comments_delete_own ON public.incident_comments
    FOR DELETE USING (user_id = auth.uid());
EXCEPTION WHEN others THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_incident_comments_incident_id ON public.incident_comments(incident_id);

-- Dashboard helper RPCs (scoped by auth.uid())
-- Group by status
CREATE OR REPLACE FUNCTION public.incidents_group_by_status()
RETURNS TABLE(status TEXT, count BIGINT) AS $$
  SELECT status, COUNT(*)::BIGINT
  FROM public.incidents
  WHERE user_id = auth.uid()
  GROUP BY status
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;

-- Group by type
CREATE OR REPLACE FUNCTION public.incidents_group_by_type()
RETURNS TABLE(type_id UUID, name TEXT, count BIGINT) AS $$
  SELECT i.incident_type_id AS type_id, t.name, COUNT(*)::BIGINT
  FROM public.incidents i
  JOIN public.incident_types t ON t.id = i.incident_type_id
  WHERE i.user_id = auth.uid()
  GROUP BY i.incident_type_id, t.name
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;

-- Group by assignee
CREATE OR REPLACE FUNCTION public.incidents_group_by_assignee()
RETURNS TABLE(employee_id UUID, name TEXT, count BIGINT) AS $$
  SELECT i.assigned_to_employee_id AS employee_id, e.name, COUNT(*)::BIGINT
  FROM public.incidents i
  JOIN public.employees e ON e.id = i.assigned_to_employee_id
  WHERE i.user_id = auth.uid()
  GROUP BY i.assigned_to_employee_id, e.name
  ORDER BY count DESC;
$$ LANGUAGE sql STABLE;

-- Resolution time (avg days) per type
CREATE OR REPLACE FUNCTION public.incidents_resolution_time()
RETURNS TABLE(type_id UUID, name TEXT, avg_days NUMERIC) AS $$
  SELECT i.incident_type_id AS type_id, t.name,
    AVG(EXTRACT(EPOCH FROM (COALESCE(i.resolved_at, NOW()) - i.created_at)) / 86400.0) AS avg_days
  FROM public.incidents i
  JOIN public.incident_types t ON t.id = i.incident_type_id
  WHERE i.user_id = auth.uid()
  GROUP BY i.incident_type_id, t.name
  ORDER BY avg_days ASC;
$$ LANGUAGE sql STABLE;

-- Storage bucket for attachments with per-user folder policy
INSERT INTO storage.buckets (id, name, public)
VALUES ('incidents-attachments', 'incidents-attachments', false)
ON CONFLICT (id) DO NOTHING;

-- Policies scoped to user's UUID prefix in object name: `${auth.uid()}/...`
DO $$ BEGIN
  CREATE POLICY incidents_attachments_select_own ON storage.objects
    FOR SELECT USING (
      bucket_id = 'incidents-attachments' AND left(name, 36) = auth.uid()::text
    );
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_attachments_insert_own ON storage.objects
    FOR INSERT WITH CHECK (
      bucket_id = 'incidents-attachments' AND left(name, 36) = auth.uid()::text
    );
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_attachments_update_own ON storage.objects
    FOR UPDATE USING (
      bucket_id = 'incidents-attachments' AND left(name, 36) = auth.uid()::text
    );
EXCEPTION WHEN others THEN NULL; END $$;

DO $$ BEGIN
  CREATE POLICY incidents_attachments_delete_own ON storage.objects
    FOR DELETE USING (
      bucket_id = 'incidents-attachments' AND left(name, 36) = auth.uid()::text
    );
EXCEPTION WHEN others THEN NULL; END $$;


