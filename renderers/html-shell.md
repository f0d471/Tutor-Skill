# HTML 设计系统

本文件定义 tutor-skill 输出的 HTML 课件的全部视觉规范。**首次输出前必读。**

---

## 1. 设计哲学

课件是只读产物——用户阅读，不编辑。所以我们可以用 HTML/CSS 的全部表达力，但要克制：

- **信息密度优先于视觉炫技。** 每一个视觉元素都要承载信息。
- **色彩 = 语义。** 颜色只用来区分内容来源和强调层级，不用来装饰。
- **SVG 是一等公民。** 所有图表（推导链、知识地图、对比图、流程图）都用内联 SVG，不用 ASCII art。
- **自包含。** 除 KaTeX CDN 外零外部依赖。CSS 在 `<style>` 里，SVG 在 `<body>` 里。

---

## 2. CSS 变量（必须使用）

所有颜色、间距、字体都通过 CSS 变量定义。agent 填充内容时直接使用变量名，不要硬编码颜色值。

```css
:root {
  /* 文字 */
  --text-primary: #1a1a2e;
  --text-secondary: #4a4a6a;
  --text-muted: #8888a0;

  /* 背景 */
  --bg-page: #fafaf8;
  --bg-card: #ffffff;
  --bg-code: #f4f4f0;

  /* 语义色——内容来源 */
  --color-book: #2d5a3d;          /* 原书内容：深绿 */
  --color-book-bg: #f0f7f2;
  --color-supplement: #2563eb;    /* 书外补充：蓝 */
  --color-supplement-bg: #eff6ff;
  --color-ppt: #d97706;           /* PPT 考点：橙 */
  --color-ppt-bg: #fffbeb;
  --color-answer: #059669;        /* 苏格拉底答案：绿 */
  --color-answer-bg: #ecfdf5;
  --color-warning: #dc2626;       /* 警告/易错：红 */
  --color-warning-bg: #fef2f2;

  /* 强调 */
  --color-accent: #7c3aed;        /* 关键转折步骤 */
  --color-highlight: #fbbf24;     /* 考点高亮底色 */

  /* 间距 */
  --space-xs: 0.25rem;
  --space-sm: 0.5rem;
  --space-md: 1rem;
  --space-lg: 1.5rem;
  --space-xl: 2.5rem;
  --space-2xl: 4rem;

  /* 字体 */
  --font-body: "Noto Serif SC", "Source Han Serif SC", Georgia, serif;
  --font-heading: "Noto Sans SC", "Source Han Sans SC", system-ui, sans-serif;
  --font-mono: "JetBrains Mono", "Fira Code", "Source Code Pro", monospace;

  /* 尺寸 */
  --content-width: 52rem;
  --sidebar-width: 14rem;

  /* SVG */
  --svg-node-fill: #e8e8f0;
  --svg-node-stroke: #4a4a6a;
  --svg-arrow: #4a4a6a;
  --svg-highlight: #7c3aed;
  --svg-highlight-fill: #ede9fe;
}
```

### 暗色模式

```css
@media (prefers-color-scheme: dark) {
  :root {
    --text-primary: #e8e8f0;
    --text-secondary: #a0a0b8;
    --text-muted: #6a6a80;
    --bg-page: #0f0f1a;
    --bg-card: #1a1a2e;
    --bg-code: #16162a;
    --color-book: #6ee7a0;
    --color-book-bg: #0a2018;
    --color-supplement: #60a5fa;
    --color-supplement-bg: #0a1a30;
    --color-ppt: #fbbf24;
    --color-ppt-bg: #1a1500;
    --color-answer: #34d399;
    --color-answer-bg: #0a2018;
    --color-warning: #f87171;
    --color-warning-bg: #1a0a0a;
    --svg-node-fill: #1e1e3a;
    --svg-node-stroke: #a0a0b8;
    --svg-arrow: #a0a0b8;
    --svg-highlight-fill: #2e1e5a;
  }
}
```

---

## 3. 排版规范

```css
body {
  font-family: var(--font-body);
  color: var(--text-primary);
  background: var(--bg-page);
  line-height: 1.8;
  max-width: var(--content-width);
  margin: 0 auto;
  padding: var(--space-xl);
}

h1, h2, h3, h4 {
  font-family: var(--font-heading);
  line-height: 1.3;
  margin-top: var(--space-2xl);
  margin-bottom: var(--space-md);
}

h1 { font-size: 2rem; border-bottom: 3px solid var(--color-book); padding-bottom: var(--space-sm); }
h2 { font-size: 1.5rem; color: var(--color-book); }
h3 { font-size: 1.2rem; }

p { margin-bottom: var(--space-md); }
```

段落要短，1-3 句换段。这由 agent 写内容时控制，CSS 只保证段间距清晰。

### 引用块（原文引用）

原书原文用带左边框的引用块，左边框颜色 = 原书色（深绿）：

```css
blockquote.book-quote {
  border-left: 4px solid var(--color-book);
  background: var(--color-book-bg);
  padding: var(--space-md) var(--space-lg);
  margin: var(--space-lg) 0;
  border-radius: 0 8px 8px 0;
  font-style: normal;
}
```

---

## 4. Callout 系统（四种来源色）

### 4.1 书外补充（蓝色）

```html
<div class="callout callout-supplement">
  <div class="callout-title">书外补充</div>
  <div class="callout-body">
    <p>内容……</p>
  </div>
</div>
```

### 4.2 PPT 考点（橙色）

```html
<div class="callout callout-ppt">
  <div class="callout-title">PPT 补充（第 N 页）</div>
  <div class="callout-body">
    <p>PPT 在这里换了角度讲……出现在考试中的概率较高。</p>
  </div>
</div>
```

### 4.3 警告 / 易错点（红色）

```html
<div class="callout callout-warning">
  <div class="callout-title">易错</div>
  <div class="callout-body">
    <p>内容……</p>
  </div>
</div>
```

### 4.4 关键转折（紫色）

```html
<div class="callout callout-key">
  <div class="callout-title">关键一步</div>
  <div class="callout-body">
    <p>意识到这一点之后，后面的结论就不可避免了……</p>
  </div>
</div>
```

### Callout CSS

```css
.callout {
  border-left: 4px solid;
  border-radius: 0 8px 8px 0;
  padding: var(--space-md) var(--space-lg);
  margin: var(--space-lg) 0;
}
.callout-title {
  font-family: var(--font-heading);
  font-weight: 700;
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
}
.callout-supplement { border-color: var(--color-supplement); background: var(--color-supplement-bg); }
.callout-supplement .callout-title { color: var(--color-supplement); }

.callout-ppt { border-color: var(--color-ppt); background: var(--color-ppt-bg); }
.callout-ppt .callout-title { color: var(--color-ppt); }

.callout-warning { border-color: var(--color-warning); background: var(--color-warning-bg); }
.callout-warning .callout-title { color: var(--color-warning); }

.callout-key { border-color: var(--color-accent); background: #f5f3ff; }
.callout-key .callout-title { color: var(--color-accent); }
```

---

## 5. 苏格拉底折叠区域

用原生 `<details><summary>` 实现折叠。答案区域用绿底。

```html
<div class="socratic-question">
  <div class="question-label">Q1（戳 §3 的核心）</div>
  <p>问题内容……</p>
  <details>
    <summary>我的回答（先自己想 30 秒再点开）</summary>
    <div class="answer-body">
      <p>答案……</p>
      <p class="wrong-pattern">如果你答错的是 ___，那是因为你把 ___ 和 ___ 混了，回去看 §3.3。</p>
    </div>
  </details>
</div>
```

```css
.socratic-question {
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: var(--space-lg);
  margin: var(--space-lg) 0;
}
.question-label {
  font-family: var(--font-heading);
  font-weight: 700;
  color: var(--color-accent);
  font-size: 0.9rem;
  margin-bottom: var(--space-sm);
}
details summary {
  cursor: pointer;
  font-weight: 600;
  color: var(--color-answer);
  padding: var(--space-sm) 0;
}
details summary:hover { text-decoration: underline; }
.answer-body {
  background: var(--color-answer-bg);
  border-radius: 8px;
  padding: var(--space-md) var(--space-lg);
  margin-top: var(--space-sm);
}
.wrong-pattern {
  color: var(--color-warning);
  font-size: 0.9rem;
  margin-top: var(--space-md);
  padding-top: var(--space-sm);
  border-top: 1px dashed var(--color-warning);
}
```

---

## 6. SVG 规范

详见 `renderers/svg.md`。

简要约定：
- 普通节点：`fill="#e8e8f0" stroke="#4a4a6a" stroke-width="1.5" rx="6"`
- 高亮节点（关键步骤）：`fill="#ede9fe" stroke="#7c3aed" stroke-width="2.5" rx="6"`
- 考点节点：`fill="#fffbeb" stroke="#d97706" stroke-width="2" rx="6"`

---

## 7. 导航（sticky 目录）

课件长时需要导航。用 CSS sticky 实现页内目录：

```html
<nav class="toc" aria-label="目录">
  <div class="toc-title">本课目录</div>
  <a href="#s1">§1 知识点清单</a>
  <a href="#s2">§2 逆向目标</a>
  <a href="#s3">§3 第一性原理</a>
  <a href="#s4">§4 逐字精读</a>
  <a href="#s5">§5 费曼讲法</a>
  <a href="#s6">§6 苏格拉底</a>
  <a href="#s7">§7 闭环验真</a>
</nav>
```

```css
.toc {
  position: sticky;
  top: var(--space-lg);
  float: right;
  width: var(--sidebar-width);
  margin-left: var(--space-lg);
  padding: var(--space-md);
  background: var(--bg-card);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-family: var(--font-heading);
  font-size: 0.85rem;
  line-height: 2;
}
.toc-title {
  font-weight: 700;
  margin-bottom: var(--space-sm);
  color: var(--text-secondary);
  font-size: 0.8rem;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}
.toc a {
  display: block;
  color: var(--text-secondary);
  text-decoration: none;
}
.toc a:hover { color: var(--color-accent); }

@media (max-width: 72rem) {
  .toc { display: none; }
}
```

---

## 8. 数学公式（KaTeX）

在 `<head>` 里加载 KaTeX CDN（auto-render 扩展自动处理 `$...$` 和 `$$...$$`）：

```html
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.css">
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/katex.min.js"></script>
<script defer src="https://cdn.jsdelivr.net/npm/katex@0.16.22/dist/contrib/auto-render.min.js"
  onload="renderMathInElement(document.body, {
    delimiters: [
      {left: '$$', right: '$$', display: true},
      {left: '$', right: '$', display: false}
    ]
  });">
</script>
```

行内公式写 `$a^2 + b^2 = c^2$`，块级公式写 `$$F = G\frac{m_1 m_2}{r^2}$$`。

---

## 9. 响应式

```css
@media (max-width: 48rem) {
  body { padding: var(--space-md); }
  h1 { font-size: 1.5rem; }
  h2 { font-size: 1.25rem; }
  svg { max-width: 100%; height: auto; }
}
```

SVG 都设 `width="100%" height="auto"` 或写 `preserveAspectRatio="xMidYMid meet"`。

---

## 10. 打印优化

```css
@media print {
  .toc { display: none; }
  details[open] > summary { display: none; }
  details > .answer-body { display: block !important; }
  body { max-width: 100%; padding: 1cm; }
}
```

---

## 11. 深度层级（CSS 卡片层次）

用三层 box-shadow 区分内容层级，让页面有纵深感：

```css
/* hero — 最高层，用于关键结论、最终公式 */
.depth-hero {
  background: var(--bg-card);
  border: 2px solid var(--color-accent);
  border-radius: 10px;
  padding: var(--space-lg);
  box-shadow: 0 4px 16px rgba(0,0,0,0.10), 0 1px 4px rgba(0,0,0,0.06);
}

/* elevated — 中间层，用于知识清单卡片、例题 */
.depth-elevated {
  background: var(--bg-card);
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  padding: var(--space-md) var(--space-lg);
  box-shadow: 0 2px 8px rgba(0,0,0,0.06);
}

/* recessed — 最低层，用于原文引用、辅助信息 */
.depth-recessed {
  background: var(--bg-code);
  border: 1px solid #e8e8e8;
  border-radius: 6px;
  padding: var(--space-md) var(--space-lg);
  box-shadow: inset 0 1px 3px rgba(0,0,0,0.04);
}
```

**用法**：
- `depth-hero`：§3 的最终结论、§5 的核心类比
- `depth-elevated`：§1 的知识清单卡片、§4 的例题框
- `depth-recessed`：§4 的原文引用块、§7 的核对清单

---

## 12. 交错动画（逐步展开）

用 CSS `animation-delay` + `--i` 变量实现列表项/步骤依次出现：

```css
/* 交错淡入 — 用于列表、步骤、卡片 */
@keyframes fadeUp {
  from { opacity: 0; transform: translateY(12px); }
  to   { opacity: 1; transform: translateY(0); }
}
.stagger > * {
  animation: fadeUp 0.4s ease both;
  animation-delay: calc(var(--i, 0) * 80ms);
}
```

**用法**：在容器上加 `class="stagger"`，每个子元素设 `style="--i: 0"`、`--i: 1"` 等：

```html
<ul class="stagger">
  <li style="--i: 0">知识点 1</li>
  <li style="--i: 1">知识点 2</li>
  <li style="--i: 2">知识点 3</li>
</ul>
```

```html
<!-- 推导步骤逐步出现 -->
<div class="stagger">
  <div class="step-box" style="--i: 0">假设 1：...</div>
  <div class="step-box" style="--i: 1">推出：...</div>
  <div class="step-box depth-hero" style="--i: 2">最终公式：...</div>
</div>
```

**注意事项**：
- 尊重 `prefers-reduced-motion`：加 `@media (prefers-reduced-motion: reduce) { .stagger > * { animation: none; } }`
- 不要对所有内容都加动画——只对 §1 清单、§3 推导步骤使用
- 延迟间隔 80ms 是甜点，太快看不清、太慢等得烦
