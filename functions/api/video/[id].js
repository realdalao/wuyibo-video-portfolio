import { FEISHU_VIDEO_SOURCES } from "../../_lib/video-sources.js";

const FEISHU_API = "https://open.feishu.cn/open-apis";
const FEISHU_MEDIA_TMP_URL_API = `${FEISHU_API}/drive/v1/medias/batch_get_tmp_download_url`;
const PASSTHROUGH_HEADERS = [
  "accept-ranges",
  "cache-control",
  "content-length",
  "content-range",
  "content-type",
  "etag",
  "last-modified"
];

let cachedAccessToken = "";
let accessTokenExpiresAt = 0;

async function getAccessToken(env) {
  const now = Date.now();
  if (cachedAccessToken && now < accessTokenExpiresAt) return cachedAccessToken;

  if (!env.FEISHU_APP_ID || !env.FEISHU_APP_SECRET) {
    throw new Error("Feishu credentials are not configured");
  }

  const response = await fetch(`${FEISHU_API}/auth/v3/tenant_access_token/internal`, {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ app_id: env.FEISHU_APP_ID, app_secret: env.FEISHU_APP_SECRET })
  });
  const result = await response.json();
  if (!response.ok || result.code !== 0 || !result.tenant_access_token) {
    throw new Error(`Unable to obtain Feishu access token (${result.code || response.status})`);
  }

  cachedAccessToken = result.tenant_access_token;
  accessTokenExpiresAt = now + Math.max(60, (result.expire || 7200) - 300) * 1000;
  return cachedAccessToken;
}

function createUpstreamUrl(source) {
  const resource = source.kind === "file" ? "files" : "medias";
  return `${FEISHU_API}/drive/v1/${resource}/${encodeURIComponent(source.token)}/download`;
}

function copyResponseHeaders(upstream) {
  const headers = new Headers();
  for (const name of PASSTHROUGH_HEADERS) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  headers.set("cache-control", "no-store");
  headers.set("accept-ranges", "bytes");
  headers.set("x-content-type-options", "nosniff");
  return headers;
}

async function streamVideo(context) {
  const source = FEISHU_VIDEO_SOURCES[context.params.id];
  if (!source) return new Response("Video source not configured", { status: 404 });

  try {
    const accessToken = await getAccessToken(context.env);
    const headers = new Headers({ authorization: `Bearer ${accessToken}` });
    const requestedRange = context.request.headers.get("range");
    if (requestedRange) headers.set("range", requestedRange);
    if (context.request.headers.get("if-range")) {
      headers.set("if-range", context.request.headers.get("if-range"));
    }

    const upstream = await fetch(createUpstreamUrl(source), { headers });
    if (!upstream.ok) {
      return new Response("Feishu video source unavailable", {
        status: upstream.status,
        headers: { "cache-control": "no-store" }
      });
    }

    return new Response(context.request.method === "HEAD" ? null : upstream.body, {
      status: upstream.status,
      headers: copyResponseHeaders(upstream)
    });
  } catch (error) {
    return new Response("Feishu video proxy is not configured", {
      status: 503,
      headers: { "cache-control": "no-store" }
    });
  }
}

async function redirectVideoToFeishu(context) {
  const source = FEISHU_VIDEO_SOURCES[context.params.id];
  if (!source) return new Response("Video source not configured", { status: 404 });
  if (source.kind !== "media") {
    return new Response("Direct Feishu delivery is unavailable for this source", { status: 502 });
  }

  try {
    const accessToken = await getAccessToken(context.env);
    const endpoint = new URL(FEISHU_MEDIA_TMP_URL_API);
    endpoint.searchParams.set("file_tokens", source.token);

    const response = await fetch(endpoint, {
      headers: {
        authorization: `Bearer ${accessToken}`,
        accept: "application/json"
      }
    });
    const result = await response.json();
    if (!response.ok || result.code !== 0) {
      throw new Error(`Feishu temporary URL request failed (${result.code || response.status})`);
    }

    const temporaryUrl = result.data?.tmp_download_urls?.find(
      (entry) => entry.file_token === source.token
    )?.tmp_download_url;
    if (!temporaryUrl) throw new Error("Feishu did not return a temporary URL for this video");

    let destination;
    try {
      destination = new URL(temporaryUrl);
    } catch {
      throw new Error("Feishu returned an invalid temporary URL");
    }
    const trustedHost = destination.hostname === "feishu.cn"
      || destination.hostname.endsWith(".feishu.cn");
    if (destination.protocol !== "https:" || !trustedHost) {
      throw new Error("Feishu returned an untrusted temporary URL host");
    }

    return new Response(null, {
      status: 302,
      headers: {
        location: destination.href,
        "cache-control": "private, max-age=3600",
        "referrer-policy": "no-referrer",
        "x-content-type-options": "nosniff"
      }
    });
  } catch (error) {
    console.error(JSON.stringify({
      event: "feishu_video_redirect_failed",
      videoId: context.params.id,
      reason: error instanceof Error ? error.message : "Unknown error"
    }));
    return new Response("Feishu video redirect is not configured", {
      status: 503,
      headers: { "cache-control": "no-store" }
    });
  }
}

async function handleVideoRequest(context) {
  const delivery = new URL(context.request.url).searchParams.get("delivery");
  return delivery === "direct" ? redirectVideoToFeishu(context) : streamVideo(context);
}

export const onRequestGet = handleVideoRequest;
export const onRequestHead = handleVideoRequest;
