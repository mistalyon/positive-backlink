# PositiveBacklink

Automated white-hat backlink exchange platform with AI Watchdog and ABC triangular method.

**Live:** https://www.positivebacklink.com

## Stack

- **Frontend:** Vanilla HTML + Tailwind utility classes (no framework runtime)
- **Backend:** Vercel Serverless Functions (Node 18) in `/api`
- **Database:** Supabase Postgres with Row-Level Security
- **Auth:** Supabase Auth (email + Google OAuth)
- **Payments:** Stripe Payment Links + webhook
- **Email:** Resend or Postmark adapter via `/api/send-email`
- **Edge:** Cloudflare + Vercel
- **Cron:** Vercel Cron Jobs (12h watchdog scan, daily summary, weekly digest)

## Features

- **AI Watchdog:** Every 12 hours, fetches each earned backlink and verifies presence, dofollow status, anchor text, and host page indexability
- **ABC Triangular Method:** Three-site rotation eliminates the reciprocal-exchange footprint
- **Niche Relevance Scoring:** Jaccard similarity on site keyword profiles, minimum 60% match required
- **Credit System:** Earn 1 credit per outbound link, spend 1 credit per inbound link
- **Admin Control Center:** 6-tab dashboard with Users / Sites / Exchanges / Watchdog / Ledger / Audit
- **In-App Notifications:** 9 event types with email preferences and unsubscribe
- **REST API:** Read-only Q2 2026, write capability Q3 2026 (Pro + Agency plans)

## Getting Started

See [SETUP.md](./SETUP.md) for the 6-step production setup guide.
See [env-template.txt](./env-template.txt) for required environment variables.

## Repository Structure

```
/                       # Static HTML pages (marketing + app shell)
/blog/                  # 18+ technical SEO articles
/tools/                 # 15+ free in-browser SEO tools
/learn/                 # SEO glossary entries
/case-studies/          # Real customer case studies
/compare/               # Competitor comparison pages
/sites/                 # Public site catalog (browse.html)
/watchdog/              # Per-user link health dashboard
/billing/               # Stripe success / cancel pages
/api/                   # Vercel serverless functions
/sql/                   # Supabase migrations (run via SQL Editor)
sitemap.xml             # 95+ URLs
feed.xml                # RSS, 19+ items
vercel.json             # Security headers, redirects, cron jobs
```

## Development

```bash
# Local preview (any static server)
npx serve .

# Deploy
vercel --prod
```

## License

Proprietary. © 2026 PositiveBacklink. All rights reserved.

## Status

Production-ready as of v1.49.0 (May 2026). See [/status.html](https://www.positivebacklink.com/status.html) for operational status and [/changelog.html](https://www.positivebacklink.com/changelog.html) for release history.