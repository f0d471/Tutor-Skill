#!/usr/bin/env python3
"""
fix-image-paths.py — 修复 markdown 中的图片路径 + 下载网络图片

用法:
    python fix-image-paths.py <md文件或目录>

功能:
    1. 下载：扫描网络图片 URL（![...](http...) 和 <img src="http...">），
       下载到同级 assert/ 目录，替换为本地路径
    2. 修复：把 Obsidian 全局路径（Physics/raw/book/半导体/md/assert/xxx.jpg）
       替换为相对路径（assert/xxx.jpg）
"""

import hashlib
import os
import re
import sys
import mimetypes
from pathlib import Path
from urllib.request import urlopen, Request
from urllib.error import URLError, HTTPError

TIMEOUT = 30
RETRY = 2

# 匹配各种图片引用格式
RE_MD_WEB = re.compile(r'!\[([^\]]*)\]\((https?://[^\)]+)\)')           # ![alt](http://...)
RE_HTML_WEB = re.compile(r'<img\s[^>]*src="(https?://[^"]+)"', re.I)    # <img src="http://...">
RE_OBSIDIAN_EMBED = re.compile(r'!\[\[([^\]]+\.(?:jpg|png|gif|webp|jpeg|svg|bmp))\]\]', re.I)  # ![[path/to/img.jpg]]


def md5_hash(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def guess_ext(content_type: str, url: str) -> str:
    ext = mimetypes.guess_extension(content_type or '') or ''
    if ext:
        return ext
    path = Path(url.split('?')[0].split('#')[0])
    url_ext = path.suffix.lower()
    if url_ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'):
        return url_ext
    return '.jpg'


def download(url: str, assert_dir: Path) -> str | None:
    for attempt in range(1, RETRY + 1):
        try:
            req = Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with urlopen(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                content_type = resp.headers.get('Content-Type', '')

            if len(data) < 100:
                print(f"  [跳过] 文件太小 ({len(data)}B): {url}")
                return None

            ext = guess_ext(content_type, url)
            hash_name = md5_hash(data)
            filename = f"{hash_name}_MD5{ext}"
            filepath = assert_dir / filename

            if not filepath.exists():
                filepath.write_bytes(data)
                print(f"  [下载] {filename} ({len(data)//1024}KB) <- {url[:80]}")
            else:
                print(f"  [已有] {filename}")

            return filename

        except (URLError, HTTPError, TimeoutError) as e:
            if attempt < RETRY:
                print(f"  [重试 {attempt}/{RETRY}] {url[:60]}... ({e})")
            else:
                print(f"  [失败] {url[:80]} ({e})")
                return None
        except Exception as e:
            print(f"  [错误] {url[:80]} ({e})")
            return None


def process_md(md_path: Path) -> dict:
    assert_dir = md_path.parent / 'assert'
    assert_dir.mkdir(exist_ok=True)
    text = md_path.read_text(encoding='utf-8')
    original = text
    stats = {'downloaded': 0, 'fixed': 0, 'failed': 0}

    # === 1. 下载网络图片 ===
    for match in RE_MD_WEB.finditer(text):
        url = match.group(2)
        filename = download(url, assert_dir)
        if filename:
            text = text.replace(url, f"assert/{filename}")
            stats['downloaded'] += 1
        else:
            stats['failed'] += 1

    for match in RE_HTML_WEB.finditer(text):
        url = match.group(1)
        filename = download(url, assert_dir)
        if filename:
            text = text.replace(url, f"assert/{filename}")
            stats['downloaded'] += 1
        else:
            stats['failed'] += 1

    # === 2. 修复 Obsidian 全局路径为相对路径 ===
    # 匹配 ![[Physics/raw/book/半导体/md/assert/xxx.jpg]] 或类似全路径
    # 提取 assert/ 之后的文件名，替换为 ![](assert/filename)
    def fix_embed(match):
        full_path = match.group(1)
        # 找到 assert/ 的位置
        idx = full_path.find('assert/')
        if idx >= 0:
            local_path = full_path[idx:]  # assert/xxx.jpg
            stats['fixed'] += 1
            return f"![]({local_path})"
        return match.group(0)

    text = RE_OBSIDIAN_EMBED.sub(fix_embed, text)

    # === 3. 写回 ===
    if text != original:
        md_path.write_text(text, encoding='utf-8')

    return stats


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    target = Path(sys.argv[1])

    if target.is_file() and target.suffix == '.md':
        md_files = [target]
    elif target.is_dir():
        md_files = sorted(target.glob('*.md'))
    else:
        print(f"错误: {target} 不是有效的 .md 文件或目录")
        sys.exit(1)

    if not md_files:
        print(f"在 {target} 下没找到 .md 文件")
        sys.exit(1)

    print(f"找到 {len(md_files)} 个 .md 文件\n")

    total = {'downloaded': 0, 'fixed': 0, 'failed': 0}

    for md_file in md_files:
        print(f"=== {md_file.name} ===")
        stats = process_md(md_file)
        for k in total:
            total[k] += stats[k]
        print(f"  下载 {stats['downloaded']}, 路径修复 {stats['fixed']}, 失败 {stats['failed']}\n")

    print(f"总计: 下载 {total['downloaded']}, 路径修复 {total['fixed']}, 失败 {total['failed']}")


if __name__ == '__main__':
    main()
