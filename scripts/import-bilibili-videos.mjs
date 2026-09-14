import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { spawnSync } from "node:child_process";

const videos = [
  { id: "newtestament-04", bvid: "BV1sdt46oEkS", cid: "41445492190" },
  { id: "newtestament-05", bvid: "BV1noYH6JE2g", cid: "41709931538" }
];

const publicDirectory = join(process.cwd(), "public");
const previewDirectory = join(publicDirectory, "previews");
const posterDirectory = join(publicDirectory, "media", "newtestament");
const temporaryDirectory = mkdtempSync(join(tmpdir(), "bilibili-import-"));
const requestHeaders = {
  "User-Agent": "Mozilla/5.0",
  Referer: "https://www.bilibili.com/"
};

mkdirSync(previewDirectory, { recursive: true });
mkdirSync(posterDirectory, { recursive: true });

async function download(url, destination) {
  const response = await fetch(url.replace(/^http:/, "https:"), { headers: requestHeaders });
  if (!response.ok) throw new Error(`Download failed (${response.status}): ${url}`);
  writeFileSync(destination, Buffer.from(await response.arrayBuffer()));
}

for (const video of videos) {
  const pageUrl = `https://api.bilibili.com/x/web-interface/view?bvid=${video.bvid}`;
  const pageResponse = await fetch(pageUrl, { headers: requestHeaders });
  const pagePayload = await pageResponse.json();
  if (pagePayload.code !== 0) throw new Error(`Unable to read ${video.bvid}: ${pagePayload.message}`);

  const playUrl = `https://api.bilibili.com/x/player/playurl?bvid=${video.bvid}&cid=${video.cid}&qn=64&fnval=16`;
  const playResponse = await fetch(playUrl, { headers: requestHeaders });
  const playPayload = await playResponse.json();
  if (playPayload.code !== 0) throw new Error(`Unable to resolve ${video.bvid}: ${playPayload.message}`);

  const videoStream = [...playPayload.data.dash.video].sort((a, b) => b.width - a.width)[0];
  const audioStream = [...playPayload.data.dash.audio].sort((a, b) => b.bandwidth - a.bandwidth)[0];
  const videoPath = join(temporaryDirectory, `${video.id}-video.m4s`);
  const audioPath = join(temporaryDirectory, `${video.id}-audio.m4s`);
  const fullVideoPath = join(temporaryDirectory, `${video.id}-full.mp4`);
  const outputPath = join(previewDirectory, `${video.id}.mp4`);

  await Promise.all([
    download(videoStream.baseUrl, videoPath),
    download(audioStream.baseUrl, audioPath),
    download(pagePayload.data.pic, join(posterDirectory, `${video.id}.jpg`))
  ]);

  const mux = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-i", videoPath, "-i", audioPath,
    "-c", "copy", "-movflags", "+faststart", fullVideoPath
  ], { encoding: "utf8" });
  if (mux.status !== 0) throw new Error(`ffmpeg failed for ${video.bvid}: ${mux.stderr}`);

  const preview = spawnSync("ffmpeg", [
    "-hide_banner", "-loglevel", "error", "-y",
    "-ss", "20", "-i", fullVideoPath, "-t", "7",
    "-an", "-vf", "scale=960:-2", "-c:v", "libx264",
    "-preset", "medium", "-crf", "27", "-movflags", "+faststart", outputPath
  ], { encoding: "utf8" });
  if (preview.status !== 0) throw new Error(`preview generation failed for ${video.bvid}: ${preview.stderr}`);

  console.log(`Imported ${video.bvid} as ${video.id}`);
}

rmSync(temporaryDirectory, { recursive: true, force: true });
