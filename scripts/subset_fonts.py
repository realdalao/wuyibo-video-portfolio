#!/usr/bin/env python3
"""字体子集化脚本。

全站 7 款字体合计约 33 MB，其中思源黑体三款各 8.3 MB。
本脚本扫描源码与数据源中实际使用的字符（当前约 818 个汉字），
用 fontTools 生成 woff2 子集，通常可压到原体积的 2% 左右。

用法：
    # 1. 改了页面文案后重新生成
    python3 scripts/subset_fonts.py

    # 2. 确认结果
    ls -la public/fonts/*.woff2

注意：
- 原始字体完整备份在 public/fonts/original-backup-20261008/，
  重新生成时会自动从此目录读取，不会使用已子集化的文件。
- 新增了源码扫描不到的字符（例如后端接口返回的文案）时，
  需要把该字符补进 EXTRA_CHARS，否则会缺字。
- 部分字体（如 Alibaba PuHuiTi 2.0 Black）本身不含繁体字形，
  原始文案若为繁体，会回退到系统中文字体显示，属预期行为。
- fontTools 需预先安装：pip install fonttools brotli
"""

from __future__ import annotations

import os
import pathlib
import shutil
import subprocess
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
FONT_DIR = ROOT / "public" / "fonts"
BACKUP_DIR = FONT_DIR / "original-backup-20261008"
CHARSET_CACHE = ROOT / "scripts" / ".font-charset.txt"

PYTHON = sys.executable

# 源码扫描覆盖不到、但页面上可能出现的字符，按需补充。
# originalCaption 存的是各平台原始发布文案，可能含繁体字；
# 用户展开"原发布文案"时会看到它们，因此必须一并纳入子集。
EXTRA_CHARS = "·—…※￥€"

SCAN_GLOBS = (
    "src/**/*.js",
    "src/**/*.jsx",
    "src/**/*.css",
    "index.html",
    "vite.config.js",
    "public/**/*.json",
)

FONT_SUBSET_ARGS = (
    "--layout-features=*",
    "--no-hinting",
    "--desubroutinize",
    "--name-IDs=*",
    "--drop-tables+=DSIG",
)


def collect_charset() -> str:
    chars: set[str] = set()
    for pattern in SCAN_GLOBS:
        for path in ROOT.glob(pattern):
            # 排除备份文件：其中的文案不属于线上站点内容，
            # 若纳入子集会导致部分字体被迫包含无用的繁体字形。
            if ".bak" in path.name or "original-backup" in str(path):
                continue
            chars |= set(path.read_text(encoding="utf-8", errors="ignore"))
    chars |= set(EXTRA_CHARS)
    # 基础 ASCII + 常用中英文标点
    chars |= set(chr(c) for c in range(0x20, 0x7F))
    chars |= set("　、。，．；：？！“”‘’（）〔〕【】《》〈〉—…·×÷±°¥€£§№@#%&*+−=/\\|<>~^_`′″←→↑↓■□▪▫●○◆◇▲△▼▽※")
    return "".join(sorted(c for c in chars if c.isprintable() or c == " "))


def source_font(name: str) -> pathlib.Path | None:
    """优先从原始备份取字体，避免对已子集化的文件再次子集化。"""
    for ext in (".ttf", ".otf", ".woff2"):
        candidate = BACKUP_DIR / (name + ext)
        if candidate.exists():
            return candidate
    for ext in (".ttf", ".otf", ".woff2"):
        candidate = FONT_DIR / (name + ext)
        if candidate.exists():
            return candidate
    return None


def main() -> int:
    try:
        import fontTools  # noqa: F401
    except ImportError:
        print("缺少 fontTools，请先运行：pip install fonttools brotli", file=sys.stderr)
        return 1

    if not BACKUP_DIR.exists():
        print(f"未找到原始字体备份：{BACKUP_DIR}", file=sys.stderr)
        print("请确认原始 ttf/otf 仍在 public/fonts/ 下。", file=sys.stderr)
        return 1

    charset = collect_charset()
    CHARSET_CACHE.write_text(charset, encoding="utf-8")
    cjk = sum(1 for c in charset if "一" <= c <= "鿿")
    print(f"待保留字符：{len(charset)} 个（其中汉字 {cjk} 个）\n")

    names = [
        "Anton-Regular",
        "AlibabaPuHuiTi-2-85-Bold",
        "Alibaba-PuHuiTi-2.0-115-Black",
        "SourceHanSansCN-Regular",
        "SourceHanSansCN-Medium",
        "SourceHanSansCN-Heavy",
        "IdeaFonts-DunDun-95",
    ]

    staging = ROOT / "scripts" / ".fonts-staging"
    shutil.rmtree(staging, ignore_errors=True)
    staging.mkdir(parents=True, exist_ok=True)

    before_total = after_total = 0
    print(f"{'字体':<36}{'原始':>12}{'子集':>11}{'压缩率':>9}")
    print("-" * 72)
    for name in names:
        src = source_font(name)
        if src is None:
            print(f"{name:<36}  跳过（未找到源文件）")
            continue
        out = staging / f"{name}.woff2"
        before = src.stat().st_size
        result = subprocess.run(
            [PYTHON, "-m", "fontTools.subset", str(src),
             f"--text-file={CHARSET_CACHE}",
             f"--output-file={out}",
             "--flavor=woff2", *FONT_SUBSET_ARGS],
            capture_output=True, text=True,
        )
        if result.returncode != 0 or not out.exists():
            print(f"{name:<36}  失败：{result.stderr.strip()[:70]}")
            continue
        after = out.stat().st_size
        before_total += before
        after_total += after
        print(f"{name:<36}{before:>12,}{after:>11,}{after / before * 100:>8.1f}%")

    if not after_total:
        print("\n没有生成任何子集字体，已保留原状。")
        return 1

    # 清掉上一轮产物，确保目录里只有本轮结果 + 备份
    for stale in FONT_DIR.glob("*.ttf"):
        stale.unlink()
    for stale in FONT_DIR.glob("*.otf"):
        stale.unlink()
    for stale in FONT_DIR.glob("*.woff2"):
        stale.unlink()
    for produced in staging.glob("*.woff2"):
        shutil.move(str(produced), FONT_DIR / produced.name)

    shutil.rmtree(staging, ignore_errors=True)
    print("-" * 72)
    print(f"{'合计':<34}{before_total:>12,}{after_total:>11,}{after_total / before_total * 100:>8.1f}%")
    print(f"\n节省 {(before_total - after_total) / 1024 / 1024:.1f} MB")
    print(f"字符集已缓存至 {CHARSET_CACHE.relative_to(ROOT)}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
