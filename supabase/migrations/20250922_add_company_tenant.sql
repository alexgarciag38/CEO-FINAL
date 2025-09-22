-- Multi-tenant by company_id: 4C / MANUCAR
DO $$ BEGIN
  ALTER TABLE public.employees ADD COLUMN company_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.incident_types ADD COLUMN company_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

DO $$ BEGIN
  ALTER TABLE public.incidents ADD COLUMN company_id text;
EXCEPTION WHEN duplicate_column THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_employees_company_id ON public.employees(company_id);
CREATE INDEX IF NOT EXISTS idx_incident_types_company_id ON public.incident_types(company_id);
CREATE INDEX IF NOT EXISTS idx_incidents_company_id ON public.incidents(company_id);


