-- PositiveBacklink Notifications & Email Preferences Schema
-- Run AFTER sql/schema.sql in Supabase SQL Editor
-- This adds in-app notifications and email preference toggles

-- =============================================================================
-- NOTIFICATIONS TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  type TEXT NOT NULL CHECK (type IN (
    'exchange_request','exchange_accepted','exchange_live','exchange_removed',
    'watchdog_alert','payment_receipt','plan_change','credit_grant','system'
  )),
  title TEXT NOT NULL,
  body TEXT,
  action_url TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  read_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON public.notifications (user_id, created_at DESC) WHERE read_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_notifications_user_all ON public.notifications (user_id, created_at DESC);

ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users update own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
-- Inserts come from service_role only (server-side functions)

-- =============================================================================
-- EMAIL PREFERENCES TABLE
-- =============================================================================
CREATE TABLE IF NOT EXISTS public.email_preferences (
  user_id UUID PRIMARY KEY REFERENCES public.users(id) ON DELETE CASCADE,
  exchange_requests BOOLEAN DEFAULT TRUE,
  watchdog_alerts BOOLEAN DEFAULT TRUE,
  payment_receipts BOOLEAN DEFAULT TRUE,
  newsletter BOOLEAN DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.email_preferences ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage own preferences" ON public.email_preferences FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- =============================================================================
-- HELPER FUNCTION: insert_notification
-- =============================================================================
CREATE OR REPLACE FUNCTION public.insert_notification(
  p_user_id UUID,
  p_type TEXT,
  p_title TEXT,
  p_body TEXT DEFAULT NULL,
  p_action_url TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  new_id UUID;
BEGIN
  INSERT INTO public.notifications (user_id, type, title, body, action_url, metadata)
  VALUES (p_user_id, p_type, p_title, p_body, p_action_url, p_metadata)
  RETURNING id INTO new_id;
  RETURN new_id;
END $$;

GRANT EXECUTE ON FUNCTION public.insert_notification TO authenticated;

-- =============================================================================
-- DONE. Verify with:
--   SELECT COUNT(*) FROM public.notifications;
--   SELECT COUNT(*) FROM public.email_preferences;
-- =============================================================================