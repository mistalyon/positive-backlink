// /api/email-exchange-request.js
// Triggered when a user receives a new exchange request.

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method' });
  if (req.headers['x-internal-secret'] !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  const { to, from_site, to_site, anchor, exchange_id } = req.body || {};
  if (!to || !exchange_id) return res.status(400).json({ error: 'missing fields' });
  const r = await fetch(`${req.headers.host ? 'https://'+req.headers.host : 'https://www.positivebacklink.com'}/api/send-email`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'X-Internal-Secret': process.env.INTERNAL_API_SECRET || '' },
    body: JSON.stringify({ to, template: 'exchange_request', data: { from_site, to_site, anchor, accept_url: `https://www.positivebacklink.com/dashboard.html#exchanges/${exchange_id}` } })
  });
  return res.status(r.ok ? 200 : 500).json({ ok: r.ok });
}