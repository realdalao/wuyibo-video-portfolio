#!/usr/bin/env python3
"""CSS 结构审计。

styles.css 是长期叠加形成的覆盖链，不是按区块组织的文件。本脚本
量化它的重复情况与断点分布，用于判断"能不能安全重排"以及改动影响面。

用法：
    python3 scripts/css-audit.py                # 概览
    python3 scripts/css-audit.py --top 15       # 列出重复最多的选择器
    python3 scripts/css-audit.py --selector .video-modal   # 追某个选择器的全部出现位置
"""

from __future__ import annotations

import argparse
import collections
import pathlib
import re

ROOT = pathlib.Path(__file__).resolve().parent.parent
CSS = ROOT / "src" / "styles.css"


def load() -> str:
    return CSS.read_text(encoding="utf-8")


def selector_counts(text: str) -> collections.Counter:
    """统计选择器出现次数。取每个规则块的选择器列表部分的第一个作为代表。"""
    counter: collections.Counter = collections.Counter()
    # 匹配 `selector {` 形式（规则块开头），排除 @media/@keyframes 内部嵌套的干扰
    for match in re.finditer(r"(?m)^([^\s@{}][^{}\n]*?)\s*\{", text):
        head = match.group(1).strip()
        if not head or head.startswith("@") or head.startswith("/*"):
            continue
        # 一个规则可能有逗号分隔的多个选择器
        for part in head.split(","):
            sel = part.strip()
            if sel and not sel.startswith("@"):
                counter[sel] += 1
    return counter


def breakpoint_counts(text: str) -> collections.Counter:
    return collections.Counter(
        m.group(1).strip() for m in re.finditer(r"@media\s*\(([^)]*)\)", text)
    )


def important_count(text: str) -> int:
    return len(re.findall(r"!important", text))


def find_selector(text: str, selector: str) -> list[tuple[int, str]]:
    """返回某选择器每次出现的行号与所在规则头。"""
    hits = []
    for match in re.finditer(re.escape(selector), text):
        line = text[: match.start()].count("\n") + 1
        tail = text[match.start() : match.start() + 160].split("{")[0]
        hits.append((line, tail.strip().replace("\n", " ")))
    return hits


def main() -> int:
    parser = argparse.ArgumentParser()
    parser.add_argument("--top", type=int, default=10)
    parser.add_argument("--selector", default=None)
    args = parser.parse_args()

    if not CSS.exists():
        print(f"未找到 {CSS}")
        return 1

    text = load()

    if args.selector:
        hits = find_selector(text, args.selector)
        print(f"{args.selector} 共出现 {len(hits)} 次：\n")
        for line, context in hits:
            print(f"  行{line:>5}  {context[:96]}")
        print(
            "\n提示：该选择器被多处覆盖，移动或删除任一段都会改变最终样式。"
            if len(hits) > 3 else ""
        )
        return 0

    lines = text.splitlines()
    counter = selector_counts(text)
    breakpoints = breakpoint_counts(text)
    important = important_count(text)

    print(f"文件      {CSS.relative_to(ROOT)}")
    print(f"行数      {len(lines)}")
    print(f"体积      {len(text.encode()) / 1024:.0f} KB")
    print(f"规则块    {text.count('{')}")
    print(f"!important {important}")
    print(f"断点种类  {len(breakpoints)}")
    print(f"覆盖段落  {len(re.findall(r'(?m)^/\\*\\+?\\s*Final', text, re.I))} 段以 Final 开头的注释")

    print(f"\n=== 重复最多的选择器（top {args.top}）===")
    for sel, n in counter.most_common(args.top):
        flag = "  ⚠️ 覆盖链" if n > 3 else ""
        print(f"  {sel:<40}{n:>4} 次{flag}")

    print("\n=== 媒体查询断点分布 ===")
    for bp, n in breakpoints.most_common():
        print(f"  {bp:<44}{n:>4} 次")

    print(
        "\n结论：该文件按时间顺序叠加覆盖，重排风险高。"
        "\n新增样式请写入独立 CSS 文件并在 main.jsx 中于 styles.css 之后 import。"
    )
    return 0


if __name__ == "__main__":
    raise SystemExit(main())