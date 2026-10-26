// Keep the existing video sources and shared likes database on Cloudflare.
export default async function onRequest({ request }) {
  const incoming = new URL(request.url);
  if (!/^\/api\/(video|bilibili|likes)\/[^/]+$/.test(incoming.pathname)) {
    return new Response('Not found', { status: 404 });
  }
  const headers = new Headers();
  for (const name of ['content-type', 'range', 'if-range', 'if-none-match', 'if-modified-since', 'cookie']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  const upstream = new URL(incoming.pathname + incoming.search, 'https://wuyibo-video-portfolio.pages.dev');
  try {
    return await fetch(upstream.toString(), {
      method: request.method,
      headers,
      body: ['GET', 'HEAD'].includes(request.method) ? undefined : await request.arrayBuffer(),
      redirect: 'follow'
    });
  } catch {
    return new Response('Upstream unavailable', { status: 502 });
  }
}
