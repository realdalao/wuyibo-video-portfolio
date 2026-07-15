import { copyFileSync, existsSync, mkdirSync, readdirSync, rmSync, writeFileSync } from "node:fs";
import { basename, extname, join, relative } from "node:path";
import { spawnSync } from "node:child_process";

const sourceRoot = "/Users/wuyibo/Movies/已压缩含封面视频作品";
const publicRoot = join(process.cwd(), "public", "media");

const categoryOrder = [
  "ai",
  "academy",
  "guangxi",
  "palace",
  "xiangxin",
  "tibet",
  "xinhua",
  "commercial",
  "student"
];

const categoryFolders = {
  ai: "ai-manga",
  academy: "documentary-trailers",
  guangxi: "guangxi",
  palace: "palace",
  xiangxin: "xiangxin",
  tibet: "tibet",
  xinhua: "xinhua",
  commercial: "xiaomi",
  student: "course"
};

function walk(directory) {
  return readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const path = join(directory, entry.name);
    return entry.isDirectory() ? walk(path) : [path];
  });
}

function getCategory(path) {
  const localPath = relative(sourceRoot, path);
  const name = basename(path);

  if (localPath.startsWith("ai漫剧/")) return "ai";
  if (localPath.startsWith("纪录片片花/")) return "academy";
  if (localPath.startsWith("我们的故宫/") || name.includes("我们的故宫")) return "palace";
  if (localPath.startsWith("向新而行/") || name.includes("向新而行")) return "xiangxin";
  if (localPath.startsWith("小米/")) return "commercial";
  if (name.includes("西藏")) return "tibet";
  if (name.includes("甜美广西")) return "guangxi";
  if (localPath.startsWith("视频号下载/")) return "xinhua";
  return "student";
}

function cleanTitle(path) {
  return basename(path, extname(path))
    .replace(/\s+/g, " ")
    .replace(/…+$/g, "")
    .trim();
}

function probe(path) {
  const result = spawnSync(
    "ffprobe",
    [
      "-v", "error",
      "-select_streams", "v:0",
      "-show_entries", "stream=width,height",
      "-show_entries", "format=duration",
      "-of", "json",
      path
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) throw new Error(`ffprobe failed: ${path}`);
  const data = JSON.parse(result.stdout);
  const { width, height } = data.streams[0];
  return {
    width,
    height,
    duration: Math.round(Number(data.format.duration)),
    orientation: height > width ? "portrait" : width === height ? "square" : "landscape"
  };
}

function makePoster(videoPath, posterPath) {
  const result = spawnSync(
    "ffmpeg",
    [
      "-hide_banner", "-loglevel", "error", "-y",
      "-ss", "0.6", "-i", videoPath,
      "-frames:v", "1",
      "-vf", "scale='min(960,iw)':-2",
      "-q:v", "3",
      posterPath
    ],
    { encoding: "utf8" }
  );

  if (result.status !== 0) throw new Error(`poster generation failed: ${videoPath}\n${result.stderr}`);
}

if (!existsSync(sourceRoot)) throw new Error(`Source directory not found: ${sourceRoot}`);
rmSync(publicRoot, { recursive: true, force: true });
mkdirSync(publicRoot, { recursive: true });

const grouped = Object.fromEntries(categoryOrder.map((category) => [category, []]));
for (const path of walk(sourceRoot).filter((file) => extname(file).toLowerCase() === ".mp4")) {
  grouped[getCategory(path)].push(path);
}

const manifest = {};
for (const category of categoryOrder) {
  const files = grouped[category].sort((a, b) => cleanTitle(a).localeCompare(cleanTitle(b), "zh-CN"));
  const folder = categoryFolders[category];
  const outputDirectory = join(publicRoot, folder);
  mkdirSync(outputDirectory, { recursive: true });

  manifest[category] = files.map((sourcePath, index) => {
    const id = `${folder}-${String(index + 1).padStart(2, "0")}`;
    const videoName = `${id}.mp4`;
    const posterName = `${id}.jpg`;
    const videoPath = join(outputDirectory, videoName);
    const posterPath = join(outputDirectory, posterName);
    const metadata = probe(sourcePath);

    copyFileSync(sourcePath, videoPath);
    makePoster(videoPath, posterPath);

    return {
      id,
      title: cleanTitle(sourcePath),
      src: `/media/${folder}/${videoName}`,
      poster: `/media/${folder}/${posterName}`,
      ...metadata
    };
  });
}

writeFileSync(join(publicRoot, "manifest.json"), `${JSON.stringify(manifest, null, 2)}\n`);

const count = Object.values(manifest).reduce((sum, videos) => sum + videos.length, 0);
console.log(`Imported ${count} videos into ${publicRoot}`);
for (const category of categoryOrder) console.log(`${category}: ${manifest[category].length}`);
