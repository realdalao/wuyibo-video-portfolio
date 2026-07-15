import { existsSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";
import { spawnSync } from "node:child_process";

const mediaRoot = join(process.cwd(), "public", "media");

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function writePoster(videoPath, posterPath, seek) {
  const result = spawnSync(
    "ffmpeg",
    ["-hide_banner", "-loglevel", "error", "-y", "-ss", String(seek), "-i", videoPath, "-frames:v", "1", "-vf", "scale=960:-2", "-q:v", "3", posterPath],
    { encoding: "utf8" }
  );
  if (result.status !== 0) throw new Error(`Failed to create poster for ${videoPath}: ${result.stderr}`);
}

if (!existsSync(mediaRoot)) throw new Error(`Media directory not found: ${mediaRoot}`);

const videos = walk(mediaRoot).filter((file) => extname(file).toLowerCase() === ".mp4");
for (const videoPath of videos) {
  const posterPath = join(videoPath.slice(0, -extname(videoPath).length) + ".jpg");
  writePoster(videoPath, posterPath, 0);
  console.log(`${basename(videoPath)} -> first frame`);
}

console.log(`Refreshed ${videos.length} posters.`);
