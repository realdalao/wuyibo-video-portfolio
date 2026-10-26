import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createLikesHandler } from '../server/likes.mjs';

function setup(ready = true) {
  const data = new Map();
  const store = {
    get: async () => ready ? { complete: true, offsets: { historical: 3 } } : null,
    setJSON: async (key, value) => { data.set(key, value); },
    delete: async key => { data.delete(key); },
    list: async ({ prefix, consistency }) => {
      assert.equal(consistency, 'strong');
      return { blobs: [...data.keys()].filter(key => key.startsWith(prefix)).map(key => ({ key })) };
    }
  };
  const handle = createLikesHandler(() => store);
  const request = async (visitor, action, video = 'test-video', origin) => {
    const response = await handle({ params: { id: video }, request: new Request(`https://example.test/api/likes/${video}`, {
      method: action ? 'POST' : 'GET', headers: { cookie: `portfolio_like_visitor=${visitor}`, ...(origin ? { origin } : {}) },
      ...(action ? { body: JSON.stringify({ action }) } : {})
    }) });
    return { status: response.status, body: await response.json() };
  };
  return { request, handle };
}

test('concurrent distinct visitors are retained and repeat likes are idempotent', async () => {
  const { request } = setup();
  await Promise.all(Array.from({ length: 50 }, (_, i) => request(`visitor-${i}`, 'like')));
  assert.deepEqual((await request('visitor-1')).body, { count: 50, liked: true });
  await Promise.all(Array.from({ length: 10 }, () => request('visitor-1', 'like')));
  assert.equal((await request('visitor-1')).body.count, 50);
  await request('visitor-1', 'unlike');
  await request('visitor-1', 'unlike');
  assert.deepEqual((await request('visitor-1')).body, { count: 49, liked: false });
  assert.deepEqual((await request('visitor-1', undefined, 'different')).body, { count: 0, liked: false });
});
test('historical totals are retained', async () => {
  const { request } = setup();
  assert.equal((await request('one', 'like', 'historical')).body.count, 4);
  assert.equal((await request('one', 'unlike', 'historical')).body.count, 3);
});
test('migration, origin and action are validated before any write', async () => {
  assert.equal((await setup(false).request('one', 'like')).status, 503);
  const { request } = setup();
  assert.equal((await request('one', 'like', 'test-video', 'https://other.test')).status, 403);
  assert.equal((await request('one', 'invalid')).status, 400);
  assert.equal((await request('one')).body.count, 0);
});

test('same-origin browser POST survives the Makers reverse proxy URL', async () => {
  const { handle } = setup();
  const response = await handle({ params: { id: 'test-video' }, request: new Request('http://internal/api/likes/test-video', {
    method: 'POST', headers: { origin: 'https://portfolio.example', 'sec-fetch-site': 'same-origin', cookie: 'portfolio_like_visitor=one' },
    body: JSON.stringify({ action: 'like' })
  }) });
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { count: 1, liked: true });
});
