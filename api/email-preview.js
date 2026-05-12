// /api/email-preview.js - admin-only template preview
import { TEMPLATES, SAMPLE } from './_templates.js';
export default async function handler(req, res) {
  const secret = req.headers['x-internal-secret'] || req.query?.key || '';
  if (process.env.INTERNAL_API_SECRET && secret !== process.env.INTERNAL_API_SECRET) {
    return res.status(401).json({ error: 'unauthorized' });
  }
  let body = req.body || {};
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  const template = body.template || req.query?.template || 'welcome';
  const render = TEMPLATES[template];
  if (!render) return res.status(400).json({ error: 'unknown_template', available: Object.keys(TEMPLATES) });
  const sampleKey = ({ welcome: 'welcome', 'exchange-request': 'exchangeRequest', 'watchdog-alert': 'watchdogAlert', 'weekly-digest': 'weeklyDigest' })[template];
  const data = body.data || SAMPLE[sampleKey] || {};
  const { subject, html } = render(data);
  const wantsJson = (req.headers.accept || '').includes('application/json') || req.method === 'POST';
  if (wantsJson) return res.status(200).json({ subject, html, template });
  res.setHeader('Content-Type', 'text/html; charset=utf-8');
  res.setHeader('X-Email-Subject', subject);
  return res.status(200).send(html);
}