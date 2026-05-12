// /api/watchdog-summary.js
// Vercel Cron: runs daily at 09:00 UTC to email a digest of unresolved watchdog events
// Schedule defined in vercel.json: "0 9 * * *"

export const config = { maxDuration: 60 };

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env missing' });
  }

  // 1. Get all unresolved watchdog events grouped by user
  const eventsRes = await fetch(
    `${SUPABASE_URL}/rest/v1/watchdog_events?resolved=is.false&select=id,exchange_id,severity,event_type,detail,created_at,exchanges(from_site_id,to_site_id,sites!from_site_id(owner_id,url))`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  if (!eventsRes.ok) {
    return res.status(500).json({ error: 'failed to fetch events' });
  }
  const events = await eventsRes.json();

  // 2. Group by owner_id
  const byOwner = {};
  for (const ev of events) {
    const ownerId = ev.exchanges?.sites?.owner_id;
    if (!ownerId) continue;
    if (!byOwner[ownerId]) byOwner[ownerId] = [];
    byOwner[ownerId].push(ev);
  }

  // 3. For each owner, send a digest email via /api/send-email
  const sent = [];
  for (const [ownerId, ownerEvents] of Object.entries(byOwner)) {
    // Look up owner email + pref
    const userRes = await fetch(
      `${SUPABASE_URL}/rest/v1/users?id=eq.${ownerId}&select=email,email_preferences(watchdog_alerts)`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const users = await userRes.json();
    if (!users[0]?.email) continue;
    if (users[0]?.email_preferences?.watchdog_alerts === false) continue;

    // Build summary lines
    const critical = ownerEvents.filter(e => e.severity === 'critical').length;
    const high = ownerEvents.filter(e => e.severity === 'high').length;
    const medium = ownerEvents.filter(e => e.severity === 'medium').length;

    // Send via internal email API
    const emailRes = await fetch(`${process.env.VERCEL_URL ? 'https://'+process.env.VERCEL_URL : 'https://www.positivebacklink.com'}/api/send-email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-Secret': process.env.INTERNAL_API_SECRET || ''
      },
      body: JSON.stringify({
        to: users[0].email,
        template: 'watchdog_alert',
        data: { critical, high, medium, total: ownerEvents.length, dashboard_url: 'https://www.positivebacklink.com/watchdog/dashboard.html' }
      })
    });
    sent.push({ owner: ownerId, sent: emailRes.ok, events: ownerEvents.length });
  }

  return res.status(200).json({ users_notified: sent.length, sent });
}