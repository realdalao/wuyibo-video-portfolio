import { onRequestGet as get, onRequestHead as head } from '../../../functions/api/bilibili/[bvid].js';

async function handle(handler, context) {
  const response = await handler(context);
  const headers = new Headers(response.headers);
  headers.set('x-portfolio-backend', 'edgeone-bilibili');
  return new Response(response.body, { status: response.status, headers });
}
export const onRequestGet = context => handle(get, context);
export const onRequestHead = context => handle(head, context);
