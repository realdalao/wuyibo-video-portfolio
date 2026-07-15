import { copyFileSync, readFileSync, readdirSync } from "node:fs";
import { basename, extname, join } from "node:path";

const sourceDirectory = "/Users/wuyibo/Movies/作品预览短序列/480p";
const manifestPath = join(process.cwd(), "public", "media", "manifest.json");
const previewDirectory = join(process.cwd(), "public", "previews");

const normalizeTitle = (value) => value
  .normalize("NFKC")
  .replace(/_1(?:\.mp4)?$/i, "")
  .replace(/\.mp4$/i, "")
  .replace(/[\s\p{P}\p{S}]/gu, "")
  .toLocaleLowerCase("zh-CN");

const manifest = JSON.parse(readFileSync(manifestPath, "utf8"));
const sourceFiles = readdirSync(sourceDirectory)
  .filter((file) => extname(file).toLowerCase() === ".mp4")
  .map((file) => ({
    file,
    path: join(sourceDirectory, file),
    key: normalizeTitle(basename(file, extname(file)))
  }));

const report = { matched: [], unmatched: [] };

for (const video of Object.values(manifest).flat()) {
  const key = normalizeTitle(video.title);
  const candidates = sourceFiles.filter(({ key: sourceKey }) => sourceKey === key);

  if (candidates.length !== 1) {
    report.unmatched.push({ id: video.id, title: video.title, candidates: candidates.map(({ file }) => file) });
    continue;
  }

  const [{ file, path }] = candidates;
  copyFileSync(path, join(previewDirectory, `${video.id}.mp4`));
  report.matched.push({ id: video.id, title: video.title, source: file });
}

if (report.unmatched.length > 0) {
  throw new Error(`Unable to uniquely match ${report.unmatched.length} preview video(s).`);
}

console.log(`Updated ${report.matched.length} preview videos from ${sourceDirectory}.`);
