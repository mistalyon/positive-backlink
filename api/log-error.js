// /api/log-error.js
// Lightweight error ingest endpoint - inserts client errors into Supabase
// Rate-limited by source IP (in-memory, resets per cold start)

const RATE = new Map();
const MAX_PER_MIN = 10;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'method_not_allowed' });
  const ip = (req.headers['x-forwarded-for'] || '').split(',')[0].trim() || 'unknown';
  const now = Date.now();
  const bucket = RATE.get(ip) || [];
  const recent = bucket.filter(t => now - t < 60000);
  if (recent.length >= MAX_PER_MIN) return res.status(429).json({ error: 'rate_limited' });
  recent.push(now); RATE.set(ip, recent);

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) return res.status(204).end(); // silently drop if not configured

  let body = req.body;
  if (typeof body === 'string') { try { body = JSON.parse(body); } catch { body = {}; } }
  body = body || {};

  const payload = {
    url: String(body.url || '').slice(0, 500),
    user_agent: String(req.headers['user-agent'] || '').slice(0, 300),
    message: String(body.message || '').slice(0, 1000),
    stack: String(body.stack || '').slice(0, 4000),
    source: String(body.source || '').slice(0, 300),
    lineno: Number(body.lineno) || null,
    colno: Number(body.colno) || null,
    severity: ['info','warn','error','fatal'].includes(body.severity) ? body.severity : 'error'
  };

  try {
    const r = await fetch(`${SUPABASE_URL}/rest/v1/client_errors`, {
      method: 'POST',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify(payload)
    });
    if (!r.ok) return res.status(502).json({ error: 'supabase_error' });
    return res.status(204).end();
  } catch (e) {
    return res.status(500).json({ error: 'internal' });
  }
}