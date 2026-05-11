// /api/subscribe.js — newsletter signup endpoint (stub mode)
// Replace stub with Supabase insert once anon key is wired into env vars

const RATE = new Map(); // ip -> {count, ts}
const WINDOW_MS = 60 * 1000;
const MAX_PER_WINDOW = 5;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "https://www.positivebacklink.com");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();
  if (req.method !== "POST") return res.status(405).json({ ok: false, message: "Method not allowed" });

  try {
    const body = typeof req.body === "string" ? JSON.parse(req.body) : req.body || {};
    const email = String(body.email || "").trim().toLowerCase();
    const hp = String(body.website || "").trim();
    if (hp.length > 0) {
      return res.status(200).json({ ok: true, message: "Subscribed" });
    }
    if (!EMAIL_RE.test(email) || email.length > 254) {
      return res.status(400).json({ ok: false, message: "Please enter a valid email address." });
    }
    const ip = (req.headers["x-forwarded-for"] || "").split(",")[0].trim() || "anon";
    const now = Date.now();
    const entry = RATE.get(ip);
    if (entry && now - entry.ts < WINDOW_MS) {
      if (entry.count >= MAX_PER_WINDOW) {
        return res.status(429).json({ ok: false, message: "Too many requests. Try again shortly." });
      }
      entry.count += 1;
    } else {
      RATE.set(ip, { count: 1, ts: now });
    }
    console.log("[subscribe]", { email, ip, ts: new Date(now).toISOString() });
    return res.status(200).json({ ok: true, message: "Thanks! Check your inbox to confirm." });
  } catch (e) {
    return res.status(500).json({ ok: false, message: "Server error. Please try again." });
  }
}