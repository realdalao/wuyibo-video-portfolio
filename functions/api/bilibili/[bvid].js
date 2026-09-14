import { BILIBILI_VIDEOS, resolveBilibiliStreamUrl } from "../../_lib/bilibili.js";

const PASSTHROUGH_HEADERS = [
  "accept-ranges",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
];

function copyResponseHeaders(upstream) {
  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("accept-ranges", "bytes");
  headers.set("cache-control", "no-store");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

async function streamBilibiliVideo(context) {
  const bvid = context.params.bvid;
  const cid = BILIBILI_VIDEOS[bvid];
  if (!cid) return new Response("Video source not configured", { status: 404 });

  try {
    const streamUrl = await resolveBilibiliStreamUrl(bvid, cid);
    const headers = new Headers({
      referer: `https://www.bilibili.com/video/${bvid}/`,
      "user-agent": "Mozilla/5.0"
    });
    const requestedRange = context.request.headers.get("range");
    if (requestedRange) headers.set("range", requestedRange);

    const upstream = await fetch(streamUrl, { method: context.request.method, headers });
    if (!upstream.ok) {
      return new Response("Bilibili video stream unavailable", {
        status: upstream.status,
        headers: { "cache-control": "no-store" }
      });
    }

    return new Response(context.request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: copyResponseHeaders(upstream)
    });
  } catch (error) {
    console.error(JSON.stringify({
      message: "Bilibili video proxy failed",
      bvid,
      error: error instanceof Error ? error.message : String(error)
    }));
    return new Response("Bilibili video stream unavailable", {
      status: 502,
      headers: { "cache-control": "no-store" }
    });
  }
}

export const onRequestGet = streamBilibiliVideo;
export const onRequestHead = streamBilibiliVideo;
