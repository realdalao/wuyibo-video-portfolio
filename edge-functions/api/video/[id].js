// Transitional forwarding until the original Feishu credentials are configured on Makers.
export default async function onRequest({ request }) {
  const incoming = new URL(request.url);
  const upstream = new URL(incoming.pathname + incoming.search, 'https://wuyibo-video-portfolio.pages.dev');
  const headers = new Headers();
  for (const name of ['range', 'if-range']) {
    const value = request.headers.get(name);
    if (value) headers.set(name, value);
  }
  return fetch(upstream.toString(), { method: request.method, headers });
}
