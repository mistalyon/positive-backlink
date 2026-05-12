// Send Email - Vercel Serverless Function
// Supports Resend (preferred) or Postmark via env-driven adapter selection
// Required env vars (set ONE provider):
//   RESEND_API_KEY (re_...) + FROM_EMAIL (noreply@yourdomain.com)
//   OR
//   POSTMARK_API_TOKEN + FROM_EMAIL
//
// Also requires (for in-app notification mirror):
//   SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY
//
// Invocation: POST /api/send-email
// Body: { to: 'user@example.com', template: 'welcome'|'exchange_request'|'watchdog_alert'|'payment_receipt', data: {...} }
// Authentication: x-internal-secret header must match INTERNAL_API_SECRET env var

const FROM = process.env.FROM_EMAIL || 'noreply@positivebacklink.com';

function welcomeEmail(data) {
  return {
    subject: 'Welcome to PositiveBacklink',
    text: `Hi ${data.name || 'there'},\n\nYour account is ready. You have 25 free credits to start.\n\nNext steps:\n1. Add your first site\n2. Verify ownership (meta tag)\n3. Browse partners and request an exchange\n\nDashboard: https://www.positivebacklink.com/dashboard.html`,
    html: `<h2>Welcome to PositiveBacklink</h2><p>Hi ${data.name || 'there'},</p><p>Your account is ready with <strong>25 free credits</strong> to start.</p><ol><li>Add your first site</li><li>Verify ownership (meta tag)</li><li>Browse partners and request an exchange</li></ol><p><a href="https://www.positivebacklink.com/dashboard.html" style="background:#3ECF8E;color:#000;padding:10px 18px;border-radius:6px;text-decoration:none;font-weight:600">Open Dashboard</a></p>`
  };
}

function exchangeRequestEmail(data) {
  return {
    subject: `New exchange request from ${data.requester_domain}`,
    text: `${data.requester_email} wants to exchange with your site ${data.target_domain}.\n\nAnchor: ${data.anchor}\nCredits: ${data.credits}\n\nReview: https://www.positivebacklink.com/dashboard.html#tab-exchanges`,
    html: `<h3>New exchange request</h3><p><strong>${data.requester_email}</strong> wants to exchange with your site <code>${data.target_domain}</code>.</p><ul><li>Anchor: <em>${data.anchor}</em></li><li>Credits offered: ${data.credits}</li></ul><p><a href="https://www.positivebacklink.com/dashboard.html#tab-exchanges">Review the request</a></p>`
  };
}

function watchdogAlertEmail(data) {
  return {
    subject: `[${data.severity?.toUpperCase()||'ALERT'}] Watchdog detected ${data.event_type} on ${data.domain}`,
    text: `Watchdog event on ${data.domain}:\n\nEvent: ${data.event_type}\nSeverity: ${data.severity}\nCredit impact: ${data.credit_delta}\n\nDetails: https://www.positivebacklink.com/watchdog/dashboard.html`,
    html: `<h3>Watchdog alert</h3><p>Severity: <strong>${data.severity}</strong></p><ul><li>Domain: <code>${data.domain}</code></li><li>Event: ${data.event_type}</li><li>Credit impact: ${data.credit_delta}</li></ul><p><a href="https://www.positivebacklink.com/watchdog/dashboard.html">View timeline</a></p>`
  };
}

function paymentReceiptEmail(data) {
  return {
    subject: `Receipt for your PositiveBacklink purchase`,
    text: `Thanks for your purchase.\n\nItem: ${data.item}\nAmount: ${data.amount}\nCredits added: ${data.credits || 0}\nNew balance: ${data.balance_after}\nTransaction: ${data.session_id || '-'}\n\nDashboard: https://www.positivebacklink.com/dashboard.html#tab-credits`,
    html: `<h3>Payment receipt</h3><table><tr><td>Item</td><td>${data.item}</td></tr><tr><td>Amount</td><td>${data.amount}</td></tr><tr><td>Credits added</td><td>${data.credits || 0}</td></tr><tr><td>New balance</td><td>${data.balance_after}</td></tr><tr><td>Transaction</td><td><code>${data.session_id || '-'}</code></td></tr></table>`
  };
}

const TEMPLATES = {
  welcome: welcomeEmail,
  exchange_request: exchangeRequestEmail,
  watchdog_alert: watchdogAlertEmail,
  payment_receipt: paymentReceiptEmail
};

async function sendViaResend({ to, subject, text, html }) {
  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { 'Authorization': 'Bearer ' + process.env.RESEND_API_KEY, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM, to, subject, text, html })
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

async function sendViaPostmark({ to, subject, text, html }) {
  const r = await fetch('https://api.postmarkapp.com/email', {
    method: 'POST',
    headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN, 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({ From: FROM, To: to, Subject: subject, TextBody: text, HtmlBody: html, MessageStream: 'outbound' })
  });
  return { ok: r.ok, status: r.status, body: await r.text() };
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const secret = process.env.INTERNAL_API_SECRET;
  if (secret && req.headers['x-internal-secret'] !== secret) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { to, template, data } = req.body || {};
  if (!to || !template) return res.status(400).json({ error: 'to and template required' });
  const tplFn = TEMPLATES[template];
  if (!tplFn) return res.status(400).json({ error: 'Unknown template: ' + template });

  const msg = tplFn(data || {});

  let result;
  if (process.env.RESEND_API_KEY) {
    result = await sendViaResend({ to, ...msg });
  } else if (process.env.POSTMARK_API_TOKEN) {
    result = await sendViaPostmark({ to, ...msg });
  } else {
    return res.status(500).json({ error: 'No email provider configured. Set RESEND_API_KEY or POSTMARK_API_TOKEN.' });
  }

  return res.status(result.ok ? 200 : 502).json({ provider: process.env.RESEND_API_KEY ? 'resend' : 'postmark', ...result });
}