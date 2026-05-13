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

### 暗色模式（可选，用户在系统级切换）

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

/* 段落要短，1-3 句换段。这由 agent 写内容时控制，CSS 只保证段间距清晰 */
```

### 引用块（原文引用）

原书原文用带左边框的引用块，左边框颜色 = 原书色（深绿）：

```css
blockquote.book-quote {
  border-left: 4px solid var(--color-book);
  background: var(--color-book-bg);
  padding: var(--space-md) var(--space-lg);
  margin: var(--space-lg) 0;
  border-radius: 0 8px 8px 0;
  font-style: normal; /* 中文不用斜体 */
}
```

---

## 4. Callout 系统（四种来源色）

### 4.1 书外补充（蓝色）

```html
<div class="callout callout-supplement">
  <div class="callout-title">📎 书外补充</div>
  <div class="callout-body">
    <p>内容……</p>
  </div>
</div>
```

### 4.2 PPT 考点（橙色）

```html
<div class="callout callout-ppt">
  <div class="callout-title">📌 PPT 补充（第 N 页）</div>
  <div class="callout-body">
    <p>PPT 在这里换了角度讲……出现在考试中的概率较高。</p>
  </div>
</div>
```

### 4.3 警告 / 易错点（红色）

```html
<div class="callout callout-warning">
  <div class="callout-title">⚠️ 易错</div>
  <div class="callout-body">
    <p>内容……</p>
  </div>
</div>
```

### 4.4 关键转折（紫色）

```html
<div class="callout callout-key">
  <div class="callout-title">🔑 关键一步</div>
  <div class="callout-body">
    <p>意识到这一点之后，后面的结论就不可避免了……</p>
  </div>
</div>
```

### Callout CSS（统一）

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

所有图表用内联 SVG。统一约定：

### 6.1 通用属性

```
viewBox: 按实际内容设，常用 "0 0 800 400"（横向流程）或 "0 0 600 800"（纵向树形）
xmlns: "http://www.w3.org/2000/svg"
font-family: var(--font-heading) 在 SVG 里不生效，写死 "Noto Sans SC, system-ui, sans-serif"
font-size: 节点标签 14px，小注释 11px
```

### 6.2 节点样式

```
普通节点：fill="#e8e8f0" stroke="#4a4a6a" stroke-width="1.5" rx="6"
高亮节点（关键步骤）：fill="#ede9fe" stroke="#7c3aed" stroke-width="2.5" rx="6"
考点节点（🎯）：fill="#fffbeb" stroke="#d97706" stroke-width="2" rx="6"
```

### 6.3 箭头定义（每个 SVG 文件内复制一次）

```html
<defs>
  <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
    markerWidth="8" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#4a4a6a"/>
  </marker>
  <marker id="arrow-accent" viewBox="0 0 10 7" refX="10" refY="3.5"
    markerWidth="8" markerHeight="6" orient="auto-start-reverse">
    <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#7c3aed"/>
  </marker>
</defs>
```

### 6.4 常见图类型速查

| 图类型 | 用在 | 布局 | 要点 |
|---|---|---|---|
| **知识地图** | §1 末尾 | 树形或径向 | 根节点 = 章标题，叶节点 = 知识点，🎯 考点用橙色边框 |
| **推导链图** | §3.3 末尾 | 从左到右或从上到下 | 假设 → 中间结论 → 最终公式，关键转折用紫色高亮 |
| **概念定位图** | §3.4 | 树形 | 标出本概念在学科中的位置，邻居概念用虚线连接 |
| **对比图** | §3.4 / §4 | 左右并列 | 两列对齐，差异行用底色区分 |
| **过程图** | §4 例题 | 从上到下 | 每步一行，输入 → 处理 → 输出 |

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

/* 窄屏收起目录 */
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

## 10. 打印优化（可选）

```css
@media print {
  .toc { display: none; }
  details[open] > summary { display: none; }
  details > .answer-body { display: block !important; }
  body { max-width: 100%; padding: 1cm; }
}
```