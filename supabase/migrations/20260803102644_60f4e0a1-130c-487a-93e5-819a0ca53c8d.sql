ALTER TABLE public.user_roles
  ADD COLUMN IF NOT EXISTS full_name text,
  ADD COLUMN IF NOT EXISTS status text NOT NULL DEFAULT 'active';

ALTER TABLE public.user_roles
  ADD CONSTRAINT user_roles_status_check CHECK (status IN ('active','blocked'));