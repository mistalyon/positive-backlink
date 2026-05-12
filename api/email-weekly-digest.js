// /api/email-weekly-digest.js
// Vercel Cron: runs every Monday at 10:00 UTC. Sends a weekly digest of stats per user.
// Schedule: "0 10 * * 1"

export const config = { maxDuration: 120 };

export default async function handler(req, res) {
  const authHeader = req.headers.authorization || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(500).json({ error: 'env missing' });

  // Fetch users with weekly_digest=true
  const usersRes = await fetch(
    `${SUPABASE_URL}/rest/v1/users?select=id,email,email_preferences(weekly_digest)&email_preferences.weekly_digest=eq.true&limit=1000`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  const users = await usersRes.json();

  const since = new Date(Date.now() - 7 * 86400 * 1000).toISOString();
  const sent = [];
  for (const u of users) {
    // Aggregate stats for user
    const exRes = await fetch(
      `${SUPABASE_URL}/rest/v1/exchanges?or=(from_site.owner_id.eq.${u.id},to_site.owner_id.eq.${u.id})&created_at=gte.${since}&select=status`,
      { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
    );
    const exchanges = exRes.ok ? await exRes.json() : [];
    const stats = {
      new_exchanges: exchanges.length,
      published: exchanges.filter(e => e.status === 'live').length,
      pending: exchanges.filter(e => e.status === 'pending').length
    };

    const r = await fetch(`https://www.positivebacklink.com/api/send-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '' },
      body: JSON.stringify({ to: u.email, template: 'weekly_digest', data: stats })
    });
    sent.push({ to: u.email, ok: r.ok });
  }
  return res.status(200).json({ users: sent.length, sent });
}