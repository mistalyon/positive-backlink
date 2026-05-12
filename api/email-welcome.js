// /api/email-welcome.js
// Sends welcome email using shared templates

import { TEMPLATES, sendEmail } from './_templates.js';

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const secret = req.headers['x-internal-secret'] || '';
  if (process.env.INTERNAL_API_SECRET && secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};
  const to = body.to;
  if (!to) return res.status(400).json({ error: 'missing_to' });
  const render = TEMPLATES['welcome'];
  const { subject, html } = render(body.data || {});
  const result = await sendEmail({ to, subject, html });
  if (!result.ok) return res.status(502).json({ error: 'send_failed', detail: result });
  return res.status(200).json({ ok: true, provider: result.provider });
}