#!/usr/bin/env node
// render-mermaid.mjs — Mermaid → SVG 渲染器
// 用法:
//   node scripts/render-mermaid.mjs --input diagram.mmd
//   node scripts/render-mermaid.mjs --input diagram.mmd --output diagram.svg
//   echo 'graph TD; A-->B' | node scripts/render-mermaid.mjs
//   node scripts/render-mermaid.mjs --input diagram.mmd --bg '#fafaf8' --fg '#1a1a2e'

import { readFileSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

// ── 自动安装 beautiful-mermaid ──
async function loadMermaid() {
  try {
    return await import('beautiful-mermaid');
  } catch {
    console.error('[render-mermaid] beautiful-mermaid not found, installing...');
    const { execSync } = await import('node:child_process');
    execSync('npm install beautiful-mermaid', {
      cwd: resolve(import.meta.dirname || '.'),
      stdio: 'inherit',
    });
    return await import('beautiful-mermaid');
  }
}

// ── 解析 CLI 参数 ──
function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const arg = argv[i];
    if (arg === '--input' || arg === '-i')  { args.input = argv[++i]; }
    else if (arg === '--output' || arg === '-o') { args.output = argv[++i]; }
    else if (arg === '--bg')    { args.bg = argv[++i]; }
    else if (arg === '--fg')    { args.fg = argv[++i]; }
    else if (arg === '--font')  { args.font = argv[++i]; }
    else if (arg === '--theme') { args.theme = argv[++i]; }
    else if (arg === '--transparent') { args.transparent = true; }
    else if (arg === '--help' || arg === '-h') {
      console.log(`Usage: render-mermaid [options]

Options:
  -i, --input <file>     Input .mmd file (or stdin)
  -o, --output <file>    Output .svg file (or stdout)
  --bg <color>           Background color (default: #FFFFFF)
  --fg <color>           Foreground color (default: #27272A)
  --font <family>        Font family (default: Inter)
  --theme <name>         Built-in theme name (15 available)
  --transparent          Transparent background
  -h, --help             Show this help`);
      process.exit(0);
    }
  }
  return args;
}

// ── 读取输入 ──
function readInput(args) {
  if (args.input) {
    return readFileSync(resolve(args.input), 'utf-8').trim();
  }
  // stdin
  let data = '';
  const fd = readFileSync(0, 'utf-8'); // fd 0 = stdin
  return fd.trim();
}

// ── 主函数 ──
async function main() {
  const args = parseArgs(process.argv);
  const { renderMermaidSVG, THEMES } = await loadMermaid();

  const code = readInput(args);
  if (!code) {
    console.error('[render-mermaid] No input provided. Use --input <file> or pipe via stdin.');
    process.exit(1);
  }

  // 构建渲染选项
  const options = { padding: 24 };

  if (args.theme && THEMES[args.theme]) {
    const t = THEMES[args.theme];
    options.bg = t.bg;
    options.fg = t.fg;
    options.line = t.line;
    options.accent = t.accent;
    options.muted = t.muted;
    options.surface = t.surface;
    options.border = t.border;
  }

  if (args.bg) options.bg = args.bg;
  if (args.fg) options.fg = args.fg;
  if (args.font) options.font = args.font;
  if (args.transparent) options.transparent = true;

  // 渲染
  try {
    const svg = renderMermaidSVG(code, options);

    if (args.output) {
      writeFileSync(resolve(args.output), svg, 'utf-8');
      console.error(`[render-mermaid] Written to ${args.output}`);
    } else {
      process.stdout.write(svg);
    }
  } catch (err) {
    console.error(`[render-mermaid] Render failed: ${err.message}`);
    process.exit(1);
  }
}

main();
