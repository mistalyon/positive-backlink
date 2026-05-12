// /api/watchdog-scan.js
// Vercel Cron: runs every 12h to scan all live exchange links
// Schedule defined in vercel.json: "0 */12 * * *"

export const config = { maxDuration: 300 };

export default async function handler(req, res) {
  // Verify Vercel cron secret to prevent unauthorized invocation
  const authHeader = req.headers.authorization || '';
  if (process.env.CRON_SECRET && authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return res.status(401).json({ error: 'unauthorized' });
  }

  const SUPABASE_URL = process.env.SUPABASE_URL;
  const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!SUPABASE_URL || !SERVICE_KEY) {
    return res.status(500).json({ error: 'supabase env missing' });
  }

  // Fetch all live exchanges that need a scan (last_scan older than 12h)
  const cutoff = new Date(Date.now() - 12 * 3600 * 1000).toISOString();
  const exchangesRes = await fetch(
    `${SUPABASE_URL}/rest/v1/exchanges?status=eq.live&or=(last_scan.is.null,last_scan.lt.${cutoff})&select=id,live_url,expected_anchor,from_site_id,to_site_id&limit=100`,
    { headers: { apikey: SERVICE_KEY, Authorization: `Bearer ${SERVICE_KEY}` } }
  );
  if (!exchangesRes.ok) {
    return res.status(500).json({ error: 'failed to fetch exchanges', detail: await exchangesRes.text() });
  }
  const exchanges = await exchangesRes.json();

  const results = [];
  for (const ex of exchanges) {
    const scan = await scanLink(ex.live_url, ex.expected_anchor);
    results.push({ id: ex.id, ...scan });
    // Update exchange.last_scan
    await fetch(`${SUPABASE_URL}/rest/v1/exchanges?id=eq.${ex.id}`, {
      method: 'PATCH',
      headers: {
        apikey: SERVICE_KEY,
        Authorization: `Bearer ${SERVICE_KEY}`,
        'Content-Type': 'application/json',
        Prefer: 'return=minimal'
      },
      body: JSON.stringify({ last_scan: new Date().toISOString(), last_status: scan.status })
    });
    // If issue detected, insert a watchdog_event
    if (scan.severity !== 'ok') {
      await fetch(`${SUPABASE_URL}/rest/v1/watchdog_events`, {
        method: 'POST',
        headers: {
          apikey: SERVICE_KEY,
          Authorization: `Bearer ${SERVICE_KEY}`,
          'Content-Type': 'application/json',
          Prefer: 'return=minimal'
        },
        body: JSON.stringify({
          exchange_id: ex.id,
          severity: scan.severity,
          event_type: scan.eventType,
          detail: scan.detail,
          created_at: new Date().toISOString()
        })
      });
    }
  }

  return res.status(200).json({ scanned: results.length, results });
}

async function scanLink(url, expectedAnchor) {
  try {
    const controller = new AbortController();
    const to = setTimeout(() => controller.abort(), 10000);
    const r = await fetch(url, { signal: controller.signal, redirect: 'follow' });
    clearTimeout(to);
    if (r.status === 404) return { severity: 'critical', eventType: 'page_404', status: r.status, detail: 'Host page returns 404' };
    if (r.status >= 500) return { severity: 'high', eventType: 'page_5xx', status: r.status, detail: `Server error ${r.status}` };
    if (!r.ok) return { severity: 'medium', eventType: 'page_error', status: r.status, detail: `HTTP ${r.status}` };
    const html = await r.text();
    // Check for noindex
    if (/<meta[^>]+name=["']robots["'][^>]+(noindex|none)/i.test(html)) {
      return { severity: 'high', eventType: 'noindex', status: r.status, detail: 'Host page is noindex' };
    }
    // Check for our link presence
    const targetMatch = expectedAnchor && new RegExp('<a[^>]+href=["\'][^"\']*positivebacklink[\\.\\w/-]*[^"\']*["\'][^>]*>[^<]*' + escapeRegExp(expectedAnchor) + '[^<]*</a>', 'i').test(html);
    const anyLinkMatch = /<a[^>]+href=["'][^"']*positivebacklink/i.test(html);
    if (!anyLinkMatch) {
      return { severity: 'critical', eventType: 'link_removed', status: r.status, detail: 'No link to our domain found on the page' };
    }
    // Check rel=nofollow
    const nofollowMatch = new RegExp('<a[^>]+rel=["\'][^"\']*nofollow[^"\']*["\'][^>]+href=["\'][^"\']*positivebacklink', 'i').test(html);
    if (nofollowMatch) {
      return { severity: 'medium', eventType: 'nofollow_added', status: r.status, detail: 'Link became rel=nofollow' };
    }
    if (expectedAnchor && !targetMatch && anyLinkMatch) {
      return { severity: 'low', eventType: 'anchor_changed', status: r.status, detail: 'Anchor text changed' };
    }
    return { severity: 'ok', eventType: 'healthy', status: r.status, detail: 'OK' };
  } catch (err) {
    return { severity: 'high', eventType: 'fetch_error', status: 0, detail: String(err.message || err) };
  }
}

function escapeRegExp(s) { return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'); }