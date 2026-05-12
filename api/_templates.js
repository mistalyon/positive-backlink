// /api/_lib/email-templates.js
// Shared email rendering for PositiveBacklink transactional emails
// All templates are inline-CSS, dark-mode safe, mobile responsive

const BRAND = {
  name: 'PositiveBacklink',
  url: 'https://www.positivebacklink.com',
  primary: '#3ECF8E',
  text: '#0f172a',
  muted: '#64748b',
  bg: '#f8fafc',
  card: '#ffffff',
  border: '#e2e8f0',
  supportEmail: 'support@positivebacklink.com'
};

function esc(s) { return String(s == null ? '' : s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }

function shell(title, bodyHtml, preheader) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light dark">
<meta name="supported-color-schemes" content="light dark">
<title>${esc(title)}</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.text};-webkit-font-smoothing:antialiased">
<div style="display:none;font-size:1px;line-height:1px;max-height:0;max-width:0;opacity:0;overflow:hidden;mso-hide:all">${esc(preheader||title)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.bg};padding:24px 0">
  <tr><td align="center">
    <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;width:100%">
      <tr><td style="padding:16px 24px">
        <a href="${BRAND.url}" style="text-decoration:none;color:${BRAND.text}"><span style="font-size:20px;font-weight:700;letter-spacing:-0.02em"><span style="color:${BRAND.primary}">●</span> ${BRAND.name}</span></a>
      </td></tr>
      <tr><td style="background:${BRAND.card};border:1px solid ${BRAND.border};border-radius:12px;padding:32px 28px">
        ${bodyHtml}
      </td></tr>
      <tr><td style="padding:24px;color:${BRAND.muted};font-size:13px;line-height:1.6;text-align:center">
        <p style="margin:0 0 8px">${BRAND.name} - White-hat backlink exchanges with AI quality monitoring.</p>
        <p style="margin:0"><a href="${BRAND.url}" style="color:${BRAND.muted};text-decoration:underline">positivebacklink.com</a> &middot; <a href="mailto:${BRAND.supportEmail}" style="color:${BRAND.muted};text-decoration:underline">${BRAND.supportEmail}</a></p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function button(label, url) {
  return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:20px 0"><tr><td style="background:${BRAND.primary};border-radius:8px"><a href="${esc(url)}" style="display:inline-block;padding:12px 28px;color:#0f172a;font-weight:600;text-decoration:none;font-size:15px">${esc(label)}</a></td></tr></table>`;
}

function h1(text) { return `<h1 style="margin:0 0 16px;font-size:24px;font-weight:700;color:${BRAND.text};letter-spacing:-0.01em">${esc(text)}</h1>`; }
function p(text) { return `<p style="margin:0 0 14px;font-size:15px;line-height:1.6;color:${BRAND.text}">${text}</p>`; }
function muted(text) { return `<p style="margin:0 0 14px;font-size:13px;line-height:1.55;color:${BRAND.muted}">${esc(text)}</p>`; }
// === TEMPLATES ===

export function renderWelcome(d) {
  const name = d.name || 'there';
  const body = h1(`Welcome, ${esc(name)}!`)
    + p(`You are in. ${BRAND.name} helps you exchange clean, white-hat backlinks with sites in your niche - no PBNs, no paid links, just mutual SEO value.`)
    + p(`<strong>Three things to try first:</strong>`)
    + `<ol style="margin:0 0 18px;padding-left:22px;font-size:15px;line-height:1.7;color:${BRAND.text}">
      <li>Add your first site and let our crawler score its niche.</li>
      <li>Browse the catalog and request your first exchange.</li>
      <li>Watch your AI Watchdog score those exchanges every 12 hours.</li>
    </ol>`
    + button('Open your dashboard', `${BRAND.url}/dashboard.html`)
    + muted(`Questions? Just reply to this email - a real human reads it.`);
  return { subject: `Welcome to ${BRAND.name}, ${name}`, html: shell(`Welcome to ${BRAND.name}`, body, `Your account is ready. Here is how to get your first backlink in under 10 minutes.`) };
}

export function renderExchangeRequest(d) {
  const fromSite = esc(d.fromSite || 'a partner site');
  const toSite = esc(d.toSite || 'your site');
  const requesterName = esc(d.requesterName || 'A member');
  const niche = esc(d.niche || 'related');
  const relevance = Number(d.relevance) || 0;
  const exchangeId = esc(d.exchangeId || '');
  const body = h1('You have a new exchange request')
    + p(`${requesterName} wants to exchange a link with you.`)
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:${BRAND.bg};border-radius:8px;padding:16px">
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0;width:120px">Their site</td><td style="font-size:14px;color:${BRAND.text};font-weight:600">${fromSite}</td></tr>
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0">Your site</td><td style="font-size:14px;color:${BRAND.text};font-weight:600">${toSite}</td></tr>
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0">Niche match</td><td style="font-size:14px;color:${BRAND.text};font-weight:600">${niche} (${relevance}% relevance)</td></tr>
    </table>`
    + p(`Review the proposal and accept or decline from your dashboard.`)
    + button('Review request', `${BRAND.url}/dashboard.html?exchange=${exchangeId}`)
    + muted(`If you do not act within 7 days, the request expires automatically.`);
  return { subject: `New exchange request: ${fromSite} ${'\u2194'} ${toSite}`, html: shell('New exchange request', body, `${requesterName} wants to link to ${toSite} from ${fromSite}.`) };
}
export function renderWatchdogAlert(d) {
  const severity = (d.severity || 'medium').toLowerCase();
  const SEV = { critical: {color:'#dc2626',label:'CRITICAL'}, high: {color:'#ea580c',label:'HIGH'}, medium: {color:'#ca8a04',label:'MEDIUM'}, low: {color:'#0891b2',label:'LOW'} };
  const s = SEV[severity] || SEV.medium;
  const liveUrl = esc(d.liveUrl || '');
  const partnerSite = esc(d.partnerSite || 'partner site');
  const issue = esc(d.issue || 'Link issue detected');
  const detail = esc(d.detail || '');
  const exchangeId = esc(d.exchangeId || '');
  const body = `<div style="display:inline-block;background:${s.color};color:#fff;font-size:11px;font-weight:700;letter-spacing:0.08em;padding:4px 10px;border-radius:4px;margin-bottom:14px">${s.label}</div>`
    + h1(`Watchdog detected: ${issue}`)
    + p(`Our 12-hour scan found an issue with one of your live exchanges.`)
    + `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:16px 0;background:${BRAND.bg};border-radius:8px;padding:16px">
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0;width:120px">Partner site</td><td style="font-size:14px;color:${BRAND.text};font-weight:600">${partnerSite}</td></tr>
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0">Live URL</td><td style="font-size:13px;color:${BRAND.text};word-break:break-all"><a href="${liveUrl}" style="color:${BRAND.primary};text-decoration:none">${liveUrl}</a></td></tr>
      <tr><td style="font-size:13px;color:${BRAND.muted};padding:4px 0">Details</td><td style="font-size:13px;color:${BRAND.text}">${detail}</td></tr>
    </table>`
    + p(`If the partner does not restore the link within 48 hours, you can mark the exchange as broken and reclaim your credit.`)
    + button('Open Watchdog', `${BRAND.url}/watchdog/dashboard.html?exchange=${exchangeId}`)
    + muted(`You receive at most one watchdog email per exchange per 24 hours.`);
  return { subject: `[${s.label}] ${issue} - ${partnerSite}`, html: shell('Watchdog alert', body, `${issue} on ${partnerSite}`) };
}

export function renderWeeklyDigest(d) {
  const name = esc(d.name || 'there');
  const newExchanges = Number(d.newExchanges) || 0;
  const liveLinks = Number(d.liveLinks) || 0;
  const watchdogEvents = Number(d.watchdogEvents) || 0;
  const credits = Number(d.credits) || 0;
  function stat(label, val, color) { return `<table role="presentation" cellpadding="0" cellspacing="0" border="0" width="100%" style="margin:6px 0"><tr><td style="padding:14px 16px;background:${BRAND.bg};border-radius:8px"><div style="font-size:12px;color:${BRAND.muted};margin-bottom:4px;letter-spacing:0.04em;text-transform:uppercase">${esc(label)}</div><div style="font-size:22px;font-weight:700;color:${color||BRAND.text}">${val}</div></td></tr></table>`; }
  const body = h1(`Your weekly recap, ${name}`)
    + p(`Here is what happened on your ${BRAND.name} account this week:`)
    + stat('New exchange requests', newExchanges)
    + stat('Live backlinks', liveLinks, BRAND.primary)
    + stat('Watchdog events', watchdogEvents)
    + stat('Credit balance', credits)
    + button('Open dashboard', `${BRAND.url}/dashboard.html`)
    + muted(`Want to stop weekly digests? Update preferences in your dashboard settings.`);
  return { subject: `Your weekly ${BRAND.name} recap`, html: shell('Weekly digest', body, `${newExchanges} new requests, ${liveLinks} live links, ${watchdogEvents} watchdog events.`) };
}
// === SEND HELPER ===
// Tries Resend first (RESEND_API_KEY), falls back to Postmark (POSTMARK_API_TOKEN).
// Returns { ok: bool, provider: string, status: number, body?: string }.

export async function sendEmail({ to, subject, html, from }) {
  const fromAddr = from || process.env.FROM_EMAIL || 'no-reply@positivebacklink.com';
  if (process.env.RESEND_API_KEY) {
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${process.env.RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: fromAddr, to: Array.isArray(to) ? to : [to], subject, html })
    });
    return { ok: r.ok, provider: 'resend', status: r.status, body: r.ok ? null : await r.text() };
  }
  if (process.env.POSTMARK_API_TOKEN) {
    const r = await fetch('https://api.postmarkapp.com/email', {
      method: 'POST',
      headers: { 'X-Postmark-Server-Token': process.env.POSTMARK_API_TOKEN, 'Accept':'application/json', 'Content-Type':'application/json' },
      body: JSON.stringify({ From: fromAddr, To: Array.isArray(to) ? to.join(',') : to, Subject: subject, HtmlBody: html, MessageStream: 'outbound' })
    });
    return { ok: r.ok, provider: 'postmark', status: r.status, body: r.ok ? null : await r.text() };
  }
  return { ok: false, provider: 'none', status: 0, body: 'no email provider configured (set RESEND_API_KEY or POSTMARK_API_TOKEN)' };
}

// === SAMPLE DATA (for preview) ===
export const SAMPLE = {
  welcome: { name: 'Alex' },
  exchangeRequest: { fromSite: 'design-weekly.com', toSite: 'your-saas-blog.com', requesterName: 'Maya Chen', niche: 'Design / SaaS', relevance: 87, exchangeId: 'ex_demo_123' },
  watchdogAlert: { severity: 'critical', liveUrl: 'https://partner-site.com/blog/best-tools', partnerSite: 'partner-site.com', issue: 'Link removed', detail: 'No link to our domain found on the page (404 or content edited)', exchangeId: 'ex_demo_456' },
  weeklyDigest: { name: 'Alex', newExchanges: 4, liveLinks: 27, watchdogEvents: 2, credits: 145 }
};

export const TEMPLATES = {
  welcome: renderWelcome,
  'exchange-request': renderExchangeRequest,
  'watchdog-alert': renderWatchdogAlert,
  'weekly-digest': renderWeeklyDigest
};