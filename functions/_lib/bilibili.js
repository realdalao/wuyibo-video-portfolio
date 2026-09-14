export const BILIBILI_VIDEOS = {
  BV1sdt46oEkS: "41445492190",
  BV1noYH6JE2g: "41709931538"
};

export async function resolveBilibiliStreamUrl(bvid, cid) {
  // Request 1080p; Bilibili returns the highest quality available anonymously.
  const params = new URLSearchParams({ bvid, cid, qn: "80", fnval: "0", platform: "html5" });
  const response = await fetch(`https://api.bilibili.com/x/player/playurl?${params}`, {
    headers: {
      referer: `https://www.bilibili.com/video/${bvid}/`,
      "user-agent": "Mozilla/5.0"
    }
  });
  const payload = await response.json();
  const streamUrl = payload?.data?.durl?.[0]?.url;
  if (!response.ok || payload.code !== 0 || !streamUrl) {
    throw new Error(`Bilibili play URL unavailable (${payload?.code ?? response.status})`);
  }
  return streamUrl;
}
