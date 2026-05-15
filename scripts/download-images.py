#!/usr/bin/env python3
"""
download-images.py — 批量下载 markdown 中的网络图片到 assert/ 目录

用法:
    python download-images.py <md文件或目录>
    python download-images.py E:/github/Physics/raw/book/半导体/md
    python download-images.py E:/github/Physics/raw/book/半导体/md/ch3.md

行为:
    1. 扫描所有 .md 文件
    2. 找到所有网络图片 URL（![...](http...) 和 <img src="http...">）
    3. 下载图片到同级 assert/ 目录，文件名用 MD5 命名避免重复
    4. 把 md 中的 URL 替换为本地相对路径 assert/xxx_MD5.jpg
    5. 跳过已下载的图片（MD5 命名，重复就跳过）
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

# 匹配 markdown 图片语法: ![alt](url) 和 HTML img 标签
RE_MD_IMG = re.compile(r'!\[([^\]]*)\]\((https?://[^\)]+)\)')
RE_HTML_IMG = re.compile(r'<img\s[^>]*src="(https?://[^"]+)"[^>]*>', re.IGNORECASE)


def md5_hash(data: bytes) -> str:
    return hashlib.md5(data).hexdigest()


def guess_ext(content_type: str, url: str) -> str:
    """根据 Content-Type 或 URL 推断文件扩展名"""
    ext = mimetypes.guess_extension(content_type or '') or ''
    if ext:
        return ext
    # 从 URL 推断
    path = Path(url.split('?')[0].split('#')[0])
    url_ext = path.suffix.lower()
    if url_ext in ('.jpg', '.jpeg', '.png', '.gif', '.webp', '.svg', '.bmp', '.ico'):
        return url_ext
    return '.jpg'  # 默认


def download(url: str, assert_dir: Path) -> str | None:
    """下载图片，返回本地文件名（不含路径），已存在则直接返回"""
    for attempt in range(1, RETRY + 1):
        try:
            req = Request(url, headers={
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            })
            with urlopen(req, timeout=TIMEOUT) as resp:
                data = resp.read()
                content_type = resp.headers.get('Content-Type', '')

            if len(data) < 100:
                # 太小，可能是错误页面
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
    """处理单个 md 文件，返回统计"""
    assert_dir = md_path.parent / 'assert'
    text = md_path.read_text(encoding='utf-8')
    stats = {'downloaded': 0, 'skipped': 0, 'failed': 0, 'total': 0}

    replacements = []  # (old_url, new_path)

    # 找所有网络图片 URL
    for match in RE_MD_IMG.finditer(text):
        url = match.group(2)
        stats['total'] += 1
        filename = download(url, assert_dir)
        if filename:
            new_path = f"assert/{filename}"
            replacements.append((url, new_path))
            stats['downloaded'] += 1
        else:
            stats['failed'] += 1

    for match in RE_HTML_IMG.finditer(text):
        url = match.group(1)
        stats['total'] += 1
        filename = download(url, assert_dir)
        if filename:
            new_path = f"assert/{filename}"
            replacements.append((url, new_path))
            stats['downloaded'] += 1
        else:
            stats['failed'] += 1

    # 替换 md 中的 URL
    if replacements:
        for old_url, new_path in replacements:
            text = text.replace(old_url, new_path)
        md_path.write_text(text, encoding='utf-8')
        print(f"  [更新] 替换了 {len(replacements)} 个图片路径")

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

    total = {'downloaded': 0, 'skipped': 0, 'failed': 0, 'total': 0}

    for md_file in md_files:
        print(f"=== {md_file.name} ===")
        stats = process_md(md_file)
        for k in total:
            total[k] += stats[k]
        print()

    print(f"总计: {total['total']} 个图片, 下载 {total['downloaded']}, 失败 {total['failed']}")


if __name__ == '__main__':
    main()
