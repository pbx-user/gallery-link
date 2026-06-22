const { put, head } = require('@vercel/blob');

const ALLOWED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif']);

function sanitizeHash(raw) {
  if (!raw) return '';
  return String(raw).replace(/[^a-fA-F0-9]/g, '').slice(0, 64).toLowerCase();
}

async function handler(req, res) {
  try {
    if (!process.env.BLOB_READ_WRITE_TOKEN) {
      res.status(500).json({
        error: 'Vercel Blob not configured. In Vercel dashboard: Storage → Create Database → Blob → link to this project. BLOB_READ_WRITE_TOKEN will be auto-injected.',
      });
      return;
    }

    const hash = sanitizeHash(req.query && req.query.hash);

    // ── GET /api/upload-photo?hash=<sha256> ─────────────────────────────
    // Cheap existence probe used by the client before deciding whether to
    // send the full body. Demo / repeat-showings hit the same photos over
    // and over, so most uploads can short-circuit here.
    if (req.method === 'GET') {
      if (!hash) { res.status(400).json({ error: 'hash query param required' }); return; }
      try {
        const existing = await head(`gallery-link/users/${hash}`);
        if (existing && existing.url) {
          res.status(200).json({ url: existing.url, pathname: existing.pathname, dedup: true });
          return;
        }
      } catch (_) {}
      res.status(404).json({ error: 'not_found' });
      return;
    }

    if (req.method !== 'POST') {
      res.status(405).json({ error: 'Method not allowed' });
      return;
    }

    const contentType = (req.headers['content-type'] || '').split(';')[0].trim().toLowerCase();
    if (!ALLOWED_TYPES.has(contentType)) {
      res.status(400).json({
        error: `Unsupported content-type: "${contentType}". Allowed: ${[...ALLOWED_TYPES].join(', ')}`,
      });
      return;
    }

    // ── POST /api/upload-photo?hash=<sha256> ────────────────────────────
    // With a hash: store under the deterministic key gallery-link/users/<hash>.
    // Same content from any future upload hits the same key and overwrites
    // itself (allowOverwrite: true).
    //
    // Skip the head() probe here — clients hit GET first for the existence
    // check, so by the time they POST the body, the content is new (or they
    // intentionally want to overwrite). head() in Vercel Blob counts as an
    // "advanced operation"; halving the count per upload is the whole point.
    if (hash) {
      const filename = `gallery-link/users/${hash}`;
      const blob = await put(filename, req, {
        access: 'public',
        contentType,
        allowOverwrite: true,
        addRandomSuffix: false,
      });
      res.status(200).json({ url: blob.url, pathname: blob.pathname });
      return;
    }

    // ── Legacy hash-less path ──────────────────────────────────────────
    // No hash supplied → fall back to the old random-suffix behaviour so
    // older clients still work.
    const ext = contentType.split('/')[1] || 'bin';
    const filename = `gallery-link/customer-image.${ext}`;
    const blob = await put(filename, req, {
      access: 'public',
      contentType,
      addRandomSuffix: true,
    });
    res.status(200).json({ url: blob.url, pathname: blob.pathname });
  } catch (e) {
    console.error('[upload-photo]', e);
    res.status(500).json({ error: e.message || 'Upload failed' });
  }
}

module.exports = handler;
module.exports.config = {
  api: { bodyParser: false },
};
