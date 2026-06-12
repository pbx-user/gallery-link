const PBX_BASE = process.env.PBX_BASE_URL || 'https://sales-demo-pbx2.getprintbox.com';

// Keep this list mirrored with api/create-project.js — same backend productKeys.
const PRODUCTS = {
  Photobook:          { family_id: 305, product_id: 7605 },
  PhotobookWithered:  { family_id: 305, product_id: 7609 },
  PhotobookPulse:     { family_id: 305, product_id: 7608 },
  Calendar:           { family_id: 220, product_id: 5809 },
  Frame:              { family_id: 304, product_id: 7519 },
  FramePortrait:      { family_id: 304, product_id: 7607 },
  FrameLandscape:     { family_id: 304, product_id: 7606 },
};

let cachedToken = null;
let cachedTokenExpiry = 0;
// productKey → friendly_url cache. Slugs are stable per product; safe to memo
// across requests for the lifetime of the function instance.
const slugCache = new Map();

async function getToken() {
  const now = Date.now();
  if (cachedToken && now < cachedTokenExpiry - 60_000) return cachedToken;

  const clientId = process.env.client_id_sales_demo;
  const clientSecret = process.env.client_secret_sales_demo;
  if (!clientId || !clientSecret) {
    throw httpError(500, 'Server misconfigured: client_id_sales_demo and client_secret_sales_demo env vars must be set in Vercel');
  }

  const body = new URLSearchParams({
    grant_type: 'client_credentials',
    client_id: clientId,
    client_secret: clientSecret,
  });

  const res = await fetch(`${PBX_BASE}/o/token/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body,
  });

  const text = await res.text();
  if (!res.ok) {
    throw httpError(res.status, `OAuth token request failed: ${res.status}`, safeJson(text));
  }

  const json = JSON.parse(text);
  cachedToken = json.access_token;
  cachedTokenExpiry = now + (json.expires_in || 3600) * 1000;
  return cachedToken;
}

async function pbxFetch(path) {
  const token = await getToken();
  const res = await fetch(`${PBX_BASE}${path}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
    },
  });
  const text = await res.text();
  const body = safeJson(text);
  if (!res.ok) throw httpError(res.status, `PBX ${path} failed: ${res.status}`, body);
  return body;
}

function safeJson(text) {
  try { return JSON.parse(text); } catch { return text; }
}

function httpError(status, message, details) {
  const err = new Error(message);
  err.status = status;
  err.details = details;
  return err;
}

module.exports = async (req, res) => {
  if (req.method !== 'GET') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  try {
    const key = req.query && req.query.key;
    if (!key) {
      res.status(400).json({ error: 'Missing ?key=<productKey>', available: Object.keys(PRODUCTS) });
      return;
    }

    const product = PRODUCTS[key];
    if (!product) {
      res.status(404).json({ error: `Unknown productKey: ${key}`, available: Object.keys(PRODUCTS) });
      return;
    }

    if (slugCache.has(key)) {
      const slug = slugCache.get(key);
      res.status(200).json({ productKey: key, family_id: product.family_id, product_id: product.product_id, slug, cached: true });
      return;
    }

    const data = await pbxFetch(`/api/ec/v4/products/${product.product_id}/`);
    const slug = data.friendly_url || null;
    if (slug) slugCache.set(key, slug);

    res.status(200).json({
      productKey: key,
      family_id: product.family_id,
      product_id: product.product_id,
      slug,
      cached: false,
    });
  } catch (e) {
    console.error('[product-info]', e.status || '?', e.message, e.details);
    res.status(e.status && e.status < 600 ? e.status : 500).json({
      error: e.message,
      details: e.details,
    });
  }
};
