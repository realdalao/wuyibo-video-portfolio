#!/usr/bin/env python3
"""视频时长校验与回填。

背景
----
线上播放走飞书媒体（见 functions/_lib/video-sources.js），
仓库里的 mp4 只存在于本地且被 .gitignore 排除，多为 7 秒预览片，
因此**无法用本地文件实测原片时长**。

manifest.json 的 `duration` 字段记录的是原片时长，用于两处：
  1. 播放器信息栏展示（formatVideoDuration）
  2. 「长纪录片 / 短视频」分组过滤（阈值 20 分钟，getWorkVideosForDisplay）

用法
----
    # 检查：找出为 0、超长、异常的值
    python3 scripts/verify_durations.py

    # 回填：拿到真实时长后写入（支持批量）
    python3 scripts/verify_durations.py --set tibet-01=285 xinhua-01=126

若本地已有完整视频文件（未被 gitignore），脚本会自动用 ffprobe 实测并对比。
"""

from __future__ import annotations

import argparse
import json
import os
import pathlib
import shutil
import subprocess

ROOT = pathlib.Path(__file__).resolve().parent.parent
MANIFEST = ROOT / "public" / "media" / "manifest.json"

FFPROBE = shutil.which("ffprobe") or "/opt/homebrew/bin/ffprobe"

# 分组过滤阈值，与 main.jsx 的 getWorkVideosForDisplay 保持一致
LONG_FORM_THRESHOLD = 20 * 60

# 超过此值（秒）视为可疑，除非它是长纪录片/直播
SUSPICIOUS_UPPER = 3 * 3600


def iter_videos(data: dict):
    for category, items in data.items():
        for video in items:
            yield category, video


def local_file_for(video: dict) -> pathlib.Path | None:
    src = video.get("src", "")
    candidates = []
    if src.startswith("/"):
        candidates.append(ROOT / "public" / src.lstrip("/"))
    if src.startswith("/api/"):
        candidates.append(ROOT / "public" / "previews" / f"{src.rsplit('/', 1)[-1]}.mp4")
    for path in candidates:
        if path.exists():
            return path
    return None


def probe_duration(path: pathlib.Path) -> int | None:
    if not FFPROBE or not FFPROBE:
        return None
    try:
        result = subprocess.run(
            [FFPROBE, "-v", "error", "-show_entries", "format=duration",
             "-of", "default=nw=1:nk=1", str(path)],
            capture_output=True, text=True, timeout=30,
        )
        value = result.stdout.strip()
        return round(float(value)) if value else None
    except (ValueError, OSError, subprocess.SubprocessError):
        return None


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--set", nargs="*", default=[],
                        help="回填真实时长，格式：id=秒数")
    args = parser.parse_args()

    data = json.loads(MANIFEST.read_text(encoding="utf-8"))

    # ---- 回填模式 ----
    if args.set:
        updates = {}
        for pair in args.set:
            if "=" not in pair:
                print(f"跳过无效参数：{pair}（应为 id=秒数）")
                continue
            vid, value = pair.split("=", 1)
            try:
                updates[vid.strip()] = int(float(value))
            except ValueError:
                print(f"跳过无效秒数：{pair}")

        changed = []
        for _, video in iter_videos(data):
            vid = video.get("id")
            if vid in updates:
                old = video.get("duration", 0)
                video["duration"] = updates[vid]
                changed.append((vid, old, updates[vid]))

        if changed:
            MANIFEST.write_text(
                json.dumps(data, ensure_ascii=False, indent=1) + "\n", encoding="utf-8"
            )
            for vid, old, new in changed:
                print(f"  {vid:<26} {old:>6}s -> {new}s")
            print(f"\n已更新 {len(changed)} 条")
        else:
            print("没有匹配的 id，未修改")
        return 0

    # ---- 检查模式 ----
    if not FFPROBE:
        print(f"未找到 ffprobe，跳过实测。\n按 {FFPROBE} 确认安装路径。\n")

    pending = []   # duration 为 0
    suspicious = []
    unverifiable = []

    print(f"{'id':<26}{'声称':>8}{'本地实测':>10}  说明")
    print("-" * 66)
    for category, video in iter_videos(data):
        vid = video.get("id", "?")
        claimed = video.get("duration", 0) or 0
        path = local_file_for(video)
        actual = probe_duration(path) if path else None

        note = ""
        if claimed <= 0:
            note = "待回填"
            pending.append(vid)
        elif claimed > SUSPICIOUS_UPPER:
            note = "超长，请核对"
            suspicious.append((vid, claimed))

        if actual is not None:
            # 本地是预览片，与原片时长不同属正常，只提示不报错
            label = f"{actual}s(预览)"
            if abs(actual - claimed) > 3 and claimed > 0 and actual > 10:
                label += " ≠原片"
                unverifiable.append(vid)
        else:
            label = "无本地文件"

        if note:
            print(f"{vid:<26}{claimed:>8}{label:>12}  {note}")

    print("-" * 66)
    print(f"总条目        {sum(1 for _ in iter_videos(data))}")
    print(f"待回填时长    {len(pending)}  {pending if pending else ''}")
    print(f"可疑超长      {len(suspicious)}  {suspicious if suspicious else ''}")
    print(f"本地仅预览片  {len(unverifiable)} 条（预期行为，线上走飞书源）")

    if pending:
        print(
            "\n待回填条目在页面上会显示「时长待定」。"
            "\n拿到原片真实时长后执行："
            "\n  python3 scripts/verify_durations.py --set "
            + " ".join(f"{v}=秒数" for v in pending)
        )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())