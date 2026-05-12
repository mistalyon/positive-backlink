// /api/email-welcome.js
// Triggered after user verifies email. Sends a welcome message via /api/send-email.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { to, name } = req.body || {};
  if (!to) return res.status(400).json({ error: 'to required' });
  const r = await fetch(`${req.headers.host ? 'https://'+req.headers.host : 'https://www.positivebacklink.com'}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '' },
    body: JSON.stringify({ to, template: 'welcome', data: { name: name || 'there' } })
  });
  return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
}