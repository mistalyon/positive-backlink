// /api/email-watchdog-alert.js
// Triggered for high/critical watchdog events. Immediate notification.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { to, severity, link_url, detail } = req.body || {};
  if (!to || !severity) return res.status(400).json({ error: 'missing fields' });
  const r = await fetch(`${req.headers.host ? 'https://'+req.headers.host : 'https://www.positivebacklink.com'}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '' },
    body: JSON.stringify({ to, template: 'watchdog_alert', data: { severity, link_url, detail, dashboard_url: 'https://www.positivebacklink.com/watchdog/dashboard.html' } })
  });
  return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
}