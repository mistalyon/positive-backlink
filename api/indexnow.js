// IndexNow proxy endpoint for PositiveBacklink
// POST /api/indexnow with body {urls: ["https://..."]}
// Forwards to api.indexnow.org which fans out to Bing, Yandex, Naver, Seznam

const KEY = "62fee0104a8e71b1f7dee2663fd411bc";
const HOST = "www.positivebacklink.com";
const KEY_LOCATION = "https://www.positivebacklink.com/" + KEY + ".txt";

export default async function handler(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") return res.status(204).end();

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed. Use POST." });
  }

  let body = req.body;
  if (typeof body === "string") {
    try { body = JSON.parse(body); } catch (e) { return res.status(400).json({ error: "Invalid JSON body" }); }
  }

  const urls = body && body.urls;
  if (!Array.isArray(urls) || urls.length === 0) {
    return res.status(400).json({ error: "Body must include urls: [string]" });
  }
  if (urls.length > 10000) {
    return res.status(400).json({ error: "Max 10000 URLs per request" });
  }

  for (const u of urls) {
    if (typeof u !== "string" || u.indexOf("https://" + HOST + "/") !== 0) {
      return res.status(400).json({ error: "All URLs must start with https://" + HOST + "/", invalid: u });
    }
  }

  const payload = {
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList: urls
  };

  try {
    const resp = await fetch("https://api.indexnow.org/IndexNow", {
      method: "POST",
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify(payload)
    });
    const text = await resp.text();
    return res.status(200).json({
      submitted: urls.length,
      indexnow_status: resp.status,
      indexnow_response: text || "OK",
      host: HOST
    });
  } catch (err) {
    return res.status(500).json({ error: "IndexNow request failed", detail: String(err) });
  }
}
