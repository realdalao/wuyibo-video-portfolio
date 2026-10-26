import { createHash, randomUUID } from 'node:crypto';

const cookieName = 'portfolio_like_visitor';
const cookieLifetime = 60 * 60 * 24 * 365;
const validVideoId = /^[a-z0-9-]{1,120}$/i;
const validVisitorId = /^[a-z0-9_-]{1,128}$/i;
export const visitorHash = value => createHash('sha256').update(value).digest('hex');

function visitor(request) {
  const raw = request.headers.get('cookie')?.split(';').map(x => x.trim())
    .find(x => x.startsWith(`${cookieName}=`))?.slice(cookieName.length + 1);
  try {
    const value = raw ? decodeURIComponent(raw) : '';
    if (validVisitorId.test(value)) return value;
  } catch { /* Replace malformed cookies with a new identity. */ }
  return randomUUID();
}

function json(body, status = 200, visitorId) {
  const headers = new Headers({ 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', 'x-portfolio-backend': 'edgeone-blob' });
  if (visitorId) headers.set('set-cookie', `${cookieName}=${encodeURIComponent(visitorId)}; Max-Age=${cookieLifetime}; Path=/; HttpOnly; SameSite=Lax; Secure`);
  return new Response(JSON.stringify(body), { status, headers });
}

export function createLikesHandler(getStore) {
  return async function handle({ request, params }) {
    const videoId = params.id;
    if (!validVideoId.test(videoId || '')) return json({ error: 'Invalid video id' }, 400);
    if (!['GET', 'POST'].includes(request.method)) return json({ error: 'Method not allowed' }, 405);
    const visitorId = visitor(request);
    let action;
    if (request.method === 'POST') {
      const origin = request.headers.get('origin');
      // Makers may expose an internal request URL behind its reverse proxy.
      // Fetch Metadata is browser-controlled and preserves the external same-origin relationship.
      if (origin && origin !== new URL(request.url).origin && request.headers.get('sec-fetch-site') !== 'same-origin') {
        return json({ error: 'Invalid origin' }, 403);
      }
      try { ({ action } = await request.json()); } catch { return json({ error: 'Invalid request body' }, 400); }
      if (!['like', 'unlike'].includes(action)) return json({ error: 'Invalid like action' }, 400);
    }
    try {
      const store = getStore();
      // Fail closed until a verified historical import is complete.
      const migration = await store.get('migration/complete.json', { type: 'json', consistency: 'strong' });
      if (!migration?.complete) return json({ error: 'Likes migration is not ready' }, 503);
      const prefix = `votes/${videoId}/`;
      const key = `${prefix}${visitorHash(visitorId)}.json`;
      // One independently owned key per visitor. Distinct visitors never rewrite a shared counter.
      // Repeated likes overwrite the same key; repeated unlikes delete the same key.
      if (action === 'like') await store.setJSON(key, { liked: true }, { cacheControl: 'no-store' });
      if (action === 'unlike') await store.delete(key);
      const { blobs } = await store.list({ prefix, consistency: 'strong' });
      const baseline = Number(migration.offsets?.[videoId] || 0);
      return json({ count: baseline + blobs.length, liked: blobs.some(blob => blob.key === key) }, 200, visitorId);
    } catch (error) {
      console.error(JSON.stringify({ event: 'makers_likes_failed', code: error?.code || 'UNKNOWN' }));
      return json({ error: 'Unable to load or update likes' }, 503);
    }
  };
}
