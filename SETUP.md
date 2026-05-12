# PositiveBacklink — Production Setup Guide

This guide walks you through the 6 steps required to make the platform functional. Estimated time: 20-30 minutes (Stripe + Email optional).

## Prerequisites

- Supabase project at https://supabase.com/dashboard/project/hsgxsxiwwkuplcedfhxq
- Vercel project linked to this repo
- Cloudflare DNS for positivebacklink.com

---

## Step 1 — Paste Supabase Anon Key into 9 HTML files

1. Open Supabase Dashboard → Project Settings → API
2. Copy the `anon public` key (starts with `eyJ...`)
3. In each of these files, find `REPLACE_WITH_YOUR_ANON_KEY` and paste your key:

   - `login.html`
   - `register.html`
   - `reset-password.html`
   - `verify-email.html`
   - `dashboard.html`
   - `sites/browse.html`
   - `watchdog/dashboard.html`
   - `admin.html`
   - `notifications.html`

**Tip:** GitHub web search `REPLACE_WITH_YOUR_ANON_KEY in:file` finds all occurrences fast.

---

## Step 2 — Run SQL Migrations

In Supabase Dashboard → SQL Editor, run these two files **in order**:

1. `sql/schema.sql` (7 tables: users, sites, exchanges, credits_ledger, watchdog_events, admin_actions, subscribers + RLS policies)
2. `sql/notifications-schema.sql` (notifications, email_preferences, insert_notification helper)

Verify by running: `SELECT table_name FROM information_schema.tables WHERE table_schema='public';`

You should see 9 tables.

---

## Step 3 — Enable Auth Providers

In Supabase Dashboard → Authentication → Providers:

- **Email**: Enable (default ON). Set "Confirm email" to ON for production.
- **Google** (optional): Add Client ID + Secret from Google Cloud Console OAuth credentials. Set redirect URL to `https://hsgxsxiwwkuplcedfhxq.supabase.co/auth/v1/callback`.

Set Site URL to `https://www.positivebacklink.com`.

---

## Step 4 — Promote Yourself to Admin

After completing Step 1-3, register an account at `/register.html`. Then in Supabase SQL Editor:

```sql
UPDATE public.users SET is_admin = true WHERE email = 'your-email@example.com';
```

You can now access `/admin.html`.

---

## Step 5 — Stripe (Optional, for paid plans)

Skip if you only need the free tier.

1. Create Stripe account at https://dashboard.stripe.com
2. Create 5 Payment Links:
   - Pro $29/month subscription
   - Agency $99/month subscription
   - Credit Pack 50 ($9 one-time)
   - Credit Pack 200 ($29 one-time)
   - Credit Pack 1000 ($99 one-time)
3. Add Webhook endpoint: `https://www.positivebacklink.com/api/stripe-webhook`
   - Events to subscribe: `checkout.session.completed`, `customer.subscription.deleted`
4. In Vercel → Settings → Environment Variables add:
   - `STRIPE_SECRET_KEY` = sk_live_...
   - `STRIPE_WEBHOOK_SECRET` = whsec_...
   - `SUPABASE_URL` = https://hsgxsxiwwkuplcedfhxq.supabase.co
   - `SUPABASE_SERVICE_ROLE_KEY` = (from Supabase API settings)
5. `npm install stripe` (or add to package.json dependencies)
6. In `pricing.html`, update `window.STRIPE_LINKS` object with your actual Payment Link URLs

---

## Step 6 — Email (Optional, for transactional mail)

Skip if you don't need welcome, exchange-request, or watchdog alert emails.

1. Sign up at https://resend.com OR https://postmarkapp.com
2. In Cloudflare DNS for positivebacklink.com, add the TXT records they provide:
   - **SPF**: `v=spf1 include:_spf.resend.com ~all` (or `include:spf.mtasv.net` for Postmark)
   - **DKIM**: provided by your email vendor (long base64 string)
   - **DMARC**: `v=DMARC1; p=quarantine; rua=mailto:dmarc@positivebacklink.com`
3. Verify domain in your email vendor dashboard
4. In Vercel env vars:
   - `RESEND_API_KEY` = re_... (or `POSTMARK_API_TOKEN` = ...)
   - `FROM_EMAIL` = noreply@positivebacklink.com
   - `INTERNAL_API_SECRET` = generate a random 32-char string
   - `CRON_SECRET` = generate another random 32-char string (for /api/watchdog-scan auth)

---

## Verification

After completing Step 1-4, register a test account and:

- [ ] Login works
- [ ] Dashboard loads with empty states
- [ ] Can add a site at `/dashboard.html` → Sites tab → Add Site
- [ ] Can browse other sites at `/sites/browse.html`
- [ ] Notifications inbox at `/notifications.html` shows empty state
- [ ] Admin panel `/admin.html` accessible (after Step 4)

## Troubleshooting

- **"Invalid API key"** in browser console → Step 1 not done
- **"relation public.users does not exist"** → Step 2 not done
- **"User from sub claim in JWT does not exist"** → Auth providers misconfigured (Step 3)
- **Admin panel says "Access denied"** → Step 4 not done

## Next Steps

- Configure Vercel cron jobs: they auto-activate from `vercel.json` on next deploy
- Add your first 5 sites to bootstrap exchange marketplace
- Invite beta users via the admin panel

---

Last updated: 2026-05-12 | Version 1.49.0