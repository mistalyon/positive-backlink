-- PositiveBacklink Database Schema
-- Run in Supabase SQL Editor: https://supabase.com/dashboard/project/hsgxsxiwwkuplcedfhxq/sql
-- Version 1.0 | Date 2026-05-11

-- 1. USERS
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text UNIQUE NOT NULL,
  credits integer NOT NULL DEFAULT 25,
  site_count integer NOT NULL DEFAULT 0,
  is_admin boolean NOT NULL DEFAULT false,
  is_banned boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS users_email_idx ON public.users(email);

CREATE OR REPLACE FUNCTION public.handle_new_user() RETURNS trigger AS $$
BEGIN INSERT INTO public.users (id, email) VALUES (NEW.id, NEW.email); RETURN NEW; END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 2. SITES
CREATE TABLE IF NOT EXISTS public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_email text, domain text NOT NULL UNIQUE,
  niche text, dr integer,
  tier text DEFAULT 'standard' CHECK (tier IN ('standard','premium','authority','elite')),
  status text DEFAULT 'pending' CHECK (status IN ('pending','verified','rejected','suspended')),
  hosted_count integer DEFAULT 0, verification_token text,
  created_at timestamptz NOT NULL DEFAULT now(), verified_at timestamptz
);
CREATE INDEX IF NOT EXISTS sites_user_idx ON public.sites(user_id);
CREATE INDEX IF NOT EXISTS sites_status_idx ON public.sites(status);

-- 3. EXCHANGES (ABC triangular)
CREATE TABLE IF NOT EXISTS public.exchanges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_user uuid REFERENCES public.users(id), source_domain text,
  target_user uuid REFERENCES public.users(id), target_domain text,
  middle_user uuid REFERENCES public.users(id), middle_domain text,
  anchor text, url_placed text, credits integer NOT NULL,
  status text DEFAULT 'pending' CHECK (status IN ('pending','matched','live','removed','disputed')),
  created_at timestamptz NOT NULL DEFAULT now(),
  live_at timestamptz, removed_at timestamptz
);
CREATE INDEX IF NOT EXISTS exch_source_idx ON public.exchanges(source_user);
CREATE INDEX IF NOT EXISTS exch_target_idx ON public.exchanges(target_user);

-- 4. CREDITS LEDGER
CREATE TABLE IF NOT EXISTS public.credits_ledger (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type text NOT NULL CHECK (type IN ('earn','spend','purchase','refund','bonus','penalty','admin_adjust')),
  amount integer NOT NULL, balance_after integer NOT NULL,
  description text, exchange_id uuid REFERENCES public.exchanges(id),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS ledger_user_idx ON public.credits_ledger(user_id, created_at DESC);

-- 5. WATCHDOG EVENTS
CREATE TABLE IF NOT EXISTS public.watchdog_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  owner_email text, site_domain text NOT NULL,
  exchange_id uuid REFERENCES public.exchanges(id),
  event_type text NOT NULL,
  severity text DEFAULT 'low' CHECK (severity IN ('low','medium','high')),
  credit_delta integer DEFAULT 0, auto_action text, resolved boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS wd_user_idx ON public.watchdog_events(user_id, created_at DESC);

-- 6. ADMIN ACTIONS audit log
CREATE TABLE IF NOT EXISTS public.admin_actions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_id uuid REFERENCES public.users(id), admin_email text NOT NULL,
  action_type text NOT NULL, target_user uuid REFERENCES public.users(id),
  target_email text, amount integer, reason text, metadata jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 7. SUBSCRIBERS (waitlist)
CREATE TABLE IF NOT EXISTS public.subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL, source text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- 8. RLS
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchanges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.credits_ledger ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watchdog_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.admin_actions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.subscribers ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_admin() RETURNS boolean AS $$
  SELECT EXISTS(SELECT 1 FROM public.users WHERE id = auth.uid() AND is_admin = true);
$$ LANGUAGE sql STABLE SECURITY DEFINER;

DROP POLICY IF EXISTS users_self_read ON public.users;
CREATE POLICY users_self_read ON public.users FOR SELECT USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS users_self_update ON public.users;
CREATE POLICY users_self_update ON public.users FOR UPDATE USING (auth.uid() = id OR public.is_admin());
DROP POLICY IF EXISTS sites_self ON public.sites;
CREATE POLICY sites_self ON public.sites FOR ALL USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS exch_participant ON public.exchanges;
CREATE POLICY exch_participant ON public.exchanges FOR SELECT USING (auth.uid() IN (source_user, target_user, middle_user) OR public.is_admin());
DROP POLICY IF EXISTS ledger_self ON public.credits_ledger;
CREATE POLICY ledger_self ON public.credits_ledger FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS wd_self ON public.watchdog_events;
CREATE POLICY wd_self ON public.watchdog_events FOR SELECT USING (auth.uid() = user_id OR public.is_admin());
DROP POLICY IF EXISTS aa_admin ON public.admin_actions;
CREATE POLICY aa_admin ON public.admin_actions FOR ALL USING (public.is_admin());
DROP POLICY IF EXISTS subs_admin_read ON public.subscribers;
CREATE POLICY subs_admin_read ON public.subscribers FOR SELECT USING (public.is_admin());
DROP POLICY IF EXISTS subs_anon_insert ON public.subscribers;
CREATE POLICY subs_anon_insert ON public.subscribers FOR INSERT WITH CHECK (true);

-- 9. MAKE YOURSELF ADMIN (run after sign-up)
-- UPDATE public.users SET is_admin = true WHERE email = 'your_email@example.com';