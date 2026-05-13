# Tutor-Skill 演进方案

> 调研日期：2026-05-13 ~ 05-14
> 状态：草案，待讨论定稿

---

## 目录

1. [我们现在的样子](#1-我们现在的样子)
2. [项目一：Pretty-mermaid-skills 深度拆解](#2-项目一pretty-mermaid-skills-深度拆解)
3. [项目二：visual-explainer 深度拆解](#3-项目二visual-explainer-深度拆解)
4. [项目三：Manim 深度拆解](#4-项目三manim-深度拆解)
5. [三项目横向对比：行为差异矩阵](#5-三项目横向对比行为差异矩阵)
6. [我们能拿走什么：逐项清单](#6-我们能拿走什么逐项清单)
7. [我们的 skill 如何改造：具体行为设计](#7-我们的-skill-如何改造具体行为设计)
8. [实施计划](#8-实施计划)
9. [待讨论问题](#9-待讨论问题)

---

## 1. 我们现在的样子

### 当前文件结构

```
tutor-skill/
├── SKILL.md                         # 主入口（300+ 行，包含所有规则、流程、设计原则）
├── references/
│   ├── Html design.md               # HTML 视觉规范（CSS 变量、callout、SVG、导航）
│   ├── Html template.md             # 完整 HTML 骨架（可直接复制）
│   └── teaching-methods.md          # 四种教学法的操作指南
└── EVOLUTION.md                     # 本文件
```

### 当前行为

1. 用户说"讲解/教我/精读" → 触发 skill
2. Agent 读 SKILL.md → 执行开场仪式（ls raw/、读 notes/、确认材料角色）
3. Agent 读 references/teaching-methods.md → 了解四种教学法
4. Agent 读 references/Html design.md → 了解视觉规范
5. Agent 读 references/Html template.md → 复制 HTML 骨架
6. 按七阶段填充 HTML → 输出到 output/*.html

### 当前问题

| 问题                 | 具体表现                                                             |
| ------------------ | ---------------------------------------------------------------- |
| SKILL.md 是铁板一块     | 300+ 行全塞在一个文件里。改规则会影响流程描述，改流程会破坏规则完整性                            |
| 渲染方式单一             | 只支持手写 SVG + KaTeX CDN。画一张知识地图要手写 50+ 行 SVG，效率低                   |
| 没有斜杠命令             | 只有"讲解"一个触发方式。不能 `/quiz` 出题、不能 `/slides` 做幻灯片、不能 `/fact-check` 校验 |
| 没有模板系统             | 每次从零填充 Html template.md 的占位符，没有按内容类型（概念讲解 vs 证明推导 vs 代码分析）区分的模板  |
| 没有质量校验机制           | §7 闭环只让"回清单逐条核对"，没有自动化的准确性校验                                     |
| references/ 文件名不规范 | 有空格（"Html design.md"），不是小写连字符                                    |

---

## 2. 项目一：Pretty-mermaid-skills 深度拆解

### 2.1 完整文件树

```
Pretty-mermaid-skills/
├── .gitignore
├── LICENSE                          # MIT
├── README.md
├── README_CN.md
├── SKILL.md                        # 触发条件 + 操作手册（cookbook 格式）
├── package.json                    # npm 包定义，声明 3 个 bin 命令
├── assets/
│   └── example_diagrams/           # 5 个 .mmd 模板文件
│       ├── class.mmd
│       ├── er.mmd
│       ├── flowchart.mmd
│       ├── sequence.mmd
│       └── state.mmd
├── references/
│   ├── DIAGRAM_TYPES.md            # 5 种图的 Mermaid 语法参考
│   ├── THEMES.md                   # 15 主题参考（中英双语）
│   └── api_reference.md            # 占位符，未填充
└── scripts/
    ├── batch.mjs                   # 批量渲染
    ├── render.mjs                  # 单文件渲染
    └── themes.mjs                  # 列出主题
```

### 2.2 核心行为：渲染管线

**输入 → 输出流程：**

```
.mmd 文件（Mermaid 语法）
  ↓
render.mjs --input diagram.mmd --output diagram.svg --theme tokyo-night
  ↓
loadBeautifulMermaid()  →  尝试 import('beautiful-mermaid')
  │                        如果不存在，自动 npm install，然后重试
  ↓
readFileSync(input, 'utf8')  →  读取 Mermaid 源码字符串
  ↓
分支：
  --format svg   →  renderMermaid(code, { bg, fg, font, transparent, ...colors })  →  SVG 字符串
  --format ascii →  renderMermaidAscii(code, { useAscii, paddingX, paddingY })     →  ASCII 字符串
  ↓
writeFileSync(output, result)  或  console.log(result)
```

**依赖**：唯一依赖 `beautiful-mermaid` (^0.1.3)，底层是 Mermaid.js + 无头渲染。不需要浏览器/Puppeteer。

**三个命令：**

| 命令 | 脚本 | 功能 |
|---|---|---|
| `render-mermaid` | `scripts/render.mjs` | 单文件渲染，支持 svg/ascii 两种格式 |
| `batch-mermaid` | `scripts/batch.mjs` | 批量渲染整个目录，默认 4 并发（`Promise.allSettled`） |
| `list-mermaid-themes` | `scripts/themes.mjs` | 列出 15 个可用主题 |

### 2.3 主题系统设计

主题**不是 CSS 文件**，而是 JavaScript 对象：

```javascript
// beautiful-mermaid 导出的 THEMES 映射
THEMES["tokyo-night"] = { bg: '#1a1b26', fg: '#a9b1d6', accent: '#7aa2f7', muted: '#565f89', line: '#414868', surface: '#24283b', border: '#414868' }
```

**两级主题机制**：
1. **命名主题**（15 个内置）：通过字符串名查表，零配置
2. **自定义颜色**：通过 `--bg`、`--fg`、`--accent` 等 CLI 参数覆盖任意主题值

主题值直接传入 `renderMermaid()` 函数，库内部处理 SVG 的 fill/stroke 注入。

### 2.4 SKILL.md 的 cookbook 格式

SKILL.md 不是规范文档，是**给 agent 的操作手册**：
- 开头是 YAML frontmatter（name + description + 触发条件列表）
- 正文是决策树 + 具体命令 + 示例
- Agent 的工作就是：(1) 写 .mmd 文件 (2) 调 CLI 命令 (3) 展示结果
- Agent 不直接调库 API，只编排 CLI

### 2.5 可借鉴的点

| 编号 | 具体模式 | 在 Pretty-mermaid 中的实现 | tutor-skill 如何用 |
|---|---|---|---|
| P1 | **SKILL.md 前置条件列表** | YAML frontmatter 中 `description` 字段列出编号触发条件 | 我们的触发条件目前是一段话，改成编号列表更清晰 |
| P2 | **cookbook 格式** | 正文是"决策树 + 具体命令 + 示例"，不是规范描述 | SKILL.md 流程部分改成 cookbook 格式：Step 1 确认材料 → Step 2 选择深度 → Step 3 选择输出 |
| P3 | **auto-install 模式** | `loadBeautifulMermaid()` 先 try import，失败则 npm install 再重试 | 如果我们集成 Mermaid CLI，需要类似的首次使用自动安装逻辑 |
| P4 | **模板文件** | 5 个 .mmd 文件覆盖最常见图表类型 | 我们应该有 `assets/` 目录放预置模板（知识地图模板、推导链模板等） |
| P5 | **reference 拆分** | DIAGRAM_TYPES.md 和 THEMES.md 独立于 SKILL.md | 我们的方法论已经拆到 references/ 了，但目录结构可以更清晰 |
| P6 | **批量处理 + 并发** | `Promise.allSettled` + 可配置 worker 数 | 可以批量处理一本书的多个章节，每个章节独立渲染一个 HTML |
| P7 | **stdout 输出** | --output 省略时输出到 stdout | 支持预览模式——不写文件，直接在终端看 HTML |

### 2.6 局限

- 只支持 5 种 Mermaid 图表类型（但底层 Mermaid.js 支持更多，如 mindmap、gantt、pie）
- `loadBeautifulMermaid()` 在三个脚本中重复——代码坏味道
- 没有错误处理（无效主题名静默 fallback）
- 没有 stdin 输入（不能管道传递 Mermaid 代码）

---

## 3. 项目二：visual-explainer 深度拆解

### 3.1 完整文件树

```
.claude-plugin/
  marketplace.json                        # 市场级身份：名称、所有者、版本、pluginRoot
  plugin.json                             # 根插件桩
.gitignore
CHANGELOG.md                             # 19.5 KB 变更日志
LICENSE
README.md
banner.png
configs/                                  # 多平台适配器
  codex/AGENTS.md
  cursor/visual-explainer.mdc
  openclaw/AGENTS.md
  opencode/AGENTS.md
  pi/AGENTS.md
install-pi.sh                            # Pi 安装脚本
package.json                             # npm 包 + pi 元数据
plugins/visual-explainer/
  .claude-plugin/plugin.json             # 实际插件清单（声明 skills: ["./"]）
  SKILL.md                               # 37.5 KB — 工作流 + 设计原则（核心文件）
  commands/                              # 8 个斜杠命令
    diff-review.md                       # 8.5 KB — 可视化 diff 评审
    fact-check.md                        # 4.7 KB — 准确性校验
    generate-slides.md                   # 2.0 KB — 幻灯片生成
    generate-visual-plan.md              # 7.0 KB — 可视化实现计划
    generate-web-diagram.md              # 913 B — 最简单的图表生成
    plan-review.md                       # 9.4 KB — 计划 vs 代码库对比
    project-recap.md                     # 7.2 KB — 项目上下文快照
    share-page.md                        # 2.3 KB — 部署到 Vercel
  references/                            # 4 个参考文档
    css-patterns.md                      # 44.5 KB — CSS 模式大全
    libraries.md                         # 21.4 KB — Mermaid/Chart.js/字体/动画库指南
    responsive-nav.md                    # 5.8 KB — 响应式导航
    slide-patterns.md                    # 45.2 KB — 幻灯片引擎
  scripts/
    share.sh                             # 2.1 KB — Vercel 部署脚本
  templates/                             # 4 个 HTML 模板
    architecture.html                    # 17.5 KB — CSS Grid 架构布局
    data-table.html                      # 16.2 KB — 数据表格 + KPI 卡片
    mermaid-flowchart.html               # 21.4 KB — Mermaid 图表 + 缩放平移引擎
    slide-deck.html                      # 35.6 KB — 完整幻灯片引擎（10 种幻灯片类型）
```

**总文本量**：~290 KB（SKILL.md 37.5 KB + references 116.9 KB + templates 90.7 KB + commands 46.1 KB）

### 3.2 插件/市场架构

**双层身份**：

```
根层 (.claude-plugin/)           →  市场身份（谁发布的、在哪找插件目录）
  └── pluginRoot: "./plugins"
       └── plugins/visual-explainer/
            └── .claude-plugin/plugin.json  →  实际插件清单（skills: ["./"]）
```

**安装路径（6 个平台）**：

| 平台 | 安装方式 | 更新方式 |
|---|---|---|
| Claude Code | `/plugin marketplace add nicobailon/visual-explainer` → `/plugin install` | `/plugin update` |
| Pi | `pi install git:github.com/nicobailon/visual-explainer` | 重新 `pi install` |
| Codex CLI | 手动 `cp -R` 到 `~/.codex/skills/` | 手动重新克隆 |
| OpenCode | 手动 `cp -R` 到 `~/.config/opencode/skill/` | 手动重新克隆 |
| Cursor | 基于 `.mdc` rules 文件 | 手动更新 |
| OpenClaw | `AGENTS.md` 引导文件 | 手动更新 |

**关键设计**：所有平台共享同一个 `plugins/visual-explainer/` 源码，适配器只做路径映射。

### 3.3 命令系统

**8 个命令**，每个是 `.md` 文件，结构如下：

```markdown
---
description: "简短描述，用于斜杠命令发现"
---

# 命令名

详细的 prompt 模板，编号步骤：
1. 加载 skill
2. 读特定 reference 文件
3. 执行多阶段数据收集（git 命令、文件读取、grep 搜索）
4. 生成 verification checkpoint（结构化事实清单）
5. 按特定页面结构生成 HTML
6. 写入 ~/.agent/diagrams/ 并打开浏览器

Ultrathink
$@
```

**具体命令行为**：

| 命令 | 输入 | 做什么 | 输出 |
|---|---|---|---|
| `generate-web-diagram` | `$@` 自由文本 | 读 SKILL.md → 生成任意主题的 HTML 图表 | `~/.agent/diagrams/*.html` |
| `generate-visual-plan` | 功能描述 | 读 SKILL.md + css-patterns.md → 生成状态机 + 代码片段 + 边界情况的可视化计划 | HTML |
| `generate-slides` | `$@` 自由文本 | 读 slide-deck.html 模板 + slide-patterns.md → 生成幻灯片 | HTML |
| `diff-review` | 分支名 | 执行 git diff → 生成架构对比 + Good/Bad/Ugly 代码评审 + 决策日志 | HTML |
| `plan-review` | 计划文件 | 对比计划 vs 实际代码库 → 风险评估 + 认知债务分析 | HTML |
| `project-recap` | 时间窗口 | 扫描 git 历史 → 生成心智模型快照（决策、债务热点） | HTML |
| `fact-check` | HTML 文件 | 逐条校验已生成页面的每个声明 vs 实际代码，就地修正 | 修正后的 HTML |
| `share-page` | HTML 文件 | 调用 share.sh → 部署到 Vercel → 返回 URL | Vercel URL |

**参数传递**：`$1` 用于特定参数（分支名、文件路径），`$@` 传递剩余自由文本。复杂命令末尾有 `Ultrathink` 指令启用扩展思考。

### 3.4 模板系统

**4 个模板**，每个是完整自包含的 HTML 文件：

| 模板 | 色板 | 用途 | 关键特性 |
|---|---|---|---|
| `architecture.html` | Terracotta + sage（暖色） | CSS Grid 架构卡片 | 卡片深度层级（hero/elevated/recessed/glass） |
| `data-table.html` | Rose + cranberry | 数据表格 + KPI | 粘性表头、交替行、状态徽章、可折叠区域 |
| `mermaid-flowchart.html` | Teal + cyan | Mermaid 图表 | ~200 行 JS 缩放/平移/适配引擎 |
| `slide-deck.html` | Midnight navy + gold | 幻灯片 | 10 种幻灯片类型、键盘/触控/滚轮导航 |

**每个模板的共同设计**：
- 独特的、非通用色板（禁止 indigo/violet）
- `prefers-color-scheme` 暗色/亮色双模式
- Google Fonts 加载（每个模板不同字体配对）
- CSS 自定义属性主题系统
- 交错淡入动画（通过 `--i` CSS 变量控制延迟）
- `prefers-reduced-motion` 尊重
- 大量 HTML 注释解释模板教了什么模式

**Agent 如何选择模板**——SKILL.md 中有显式路由表：

| 内容类型 | 渲染方式 | 对应模板 |
|---|---|---|
| 流程图/序列图/状态图/ER/类图/C4 | Mermaid | `mermaid-flowchart.html` |
| 文本密集型架构概览 | CSS Grid 卡片 | `architecture.html` |
| 数据表/对比/审计/特性矩阵 | HTML 表格 | `data-table.html` |
| 幻灯片 | 幻灯片引擎 | `slide-deck.html` + `slide-patterns.md` |
| 仪表盘 | CSS Grid + Chart.js | 无固定模板，组合使用 |
| 时间线 | CSS（中线 + 卡片） | 无固定模板 |

Agent 被要求**每次重新读模板**（不要凭记忆），模板是参考模式而非固定蓝图。

### 3.5 reference 系统

**4 个参考文档，按需加载**：

| 文件 | 大小 | 内容 | 何时读 |
|---|---|---|---|
| `css-patterns.md` | 44.5 KB | 主题设置、背景氛围、链接样式、section/card 组件（4 层深度）、代码块、目录树、溢出保护、Mermaid 容器（含完整缩放/平移引擎）、网格布局、连接器（CSS 箭头、SVG 弧线）、动画（fadeUp/fadeScale/drawIn/countUp）、响应式、徽章、KPI 卡片、折叠区域、排版元素 | 每次生成都读 |
| `libraries.md` | 21.4 KB | Mermaid CDN 导入（ESM + ELK 布局）、Mermaid 主题指南（themeVariables、CSS 覆盖、classDef）、Chart.js 设置、5 种字体配对推荐、anime.js 编排动画、布局方向指导 | 用到 Mermaid/Chart.js 时读 |
| `responsive-nav.md` | 5.8 KB | 粘性侧边栏 TOC（4+ 章节时）、移动端水平滚动导航、IntersectionObserver 活跃章节跟踪 | 页面有 4+ 章节时读 |
| `slide-patterns.md` | 45.2 KB | 幻灯片引擎 CSS、10 种幻灯片类型（Title/SectionDivider/Content/Split/Diagram/Dashboard/Table/Code/Quote/FullBleed）、电影级转场、4 套预设、组合多样性规则、surf-cli AI 图片生成 | 做幻灯片时读 |

**关键设计**：references 不塞进 SKILL.md，而是按需加载。保持主文件精简，需要深度知识时再读对应 reference。指令是"Don't memorize — 每次重新读"。

### 3.6 HTML 生成规范

**输出**：单个自包含 `.html` 文件。外部依赖仅 CDN 链接（Google Fonts、Mermaid/Chart.js/anime.js from jsdelivr）。

**HTML 骨架**：

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>描述性标题</title>
  <link href="https://fonts.googleapis.com/css2?family=...&display=swap" rel="stylesheet">
  <style>/* 所有 CSS 内联 */</style>
</head>
<body>
  <!-- 语义化 HTML 内容 -->
  <!-- 可选 <script> 用于 Mermaid、Chart.js、anime.js -->
</body>
</html>
```

**CSS**：不用 Tailwind/Bootstrap，全部手写内联。模式编码在 `css-patterns.md` 中，每次生成时参考。

**暗色模式**：通过 `@media (prefers-color-scheme: dark/light)` 媒体查询。CSS 变量定义 `--bg`、`--surface`、`--border`、`--text`、`--text-dim`、`--accent` 及语义强调色。

**输出位置**：`~/.agent/diagrams/`（跨会话持久化）。

### 3.7 渲染管线决策矩阵

SKILL.md 中有显式决策逻辑：

**Step 1 Think**：确定内容类型、受众、美学方向。

**Step 2 Structure**：根据内容类型选择渲染方式：

- **Mermaid**：流程图、序列图、数据流、ER/模式、状态机、思维导图、类图、C4 架构。始终用 `theme: 'base'` + 自定义 `themeVariables` + `layout: 'elk'`（复杂图）。始终用完整 `diagram-shell` 缩放/平移模式（不用裸 `<pre class="mermaid">`）。
- **CSS Grid 卡片**：文本密集型架构概览，卡片内容（描述、代码、工具列表）比拓扑更重要。
- **HTML `<table>`**：数据表、对比、审计、特性矩阵。粘性表头、交替行、状态徽章。
- **CSS 时间线**：简单线性布局（中线 + 卡片）。
- **Chart.js**：仪表盘中的真实图表（柱状、折线、饼图）。
- **混合**（Mermaid 概览 + CSS 卡片）：复杂架构（15+ 元素）。

**缩放规则**：
- 10 个元素以下：Mermaid
- 10-15 个元素：CSS Grid 或 Mermaid（fontSize 18-20px，zoom 1.5-1.6x）
- 15+ 个元素：混合模式（5-8 节点 Mermaid 概览 + 详细 CSS 卡片）

**主动渲染触发**：如果 agent 即将渲染 4+ 行或 3+ 列的表格，应该自动生成 HTML，不需要用户请求。

### 3.8 质量门禁：Anti-Slop 系统

SKILL.md 中的 **Forbidden 列表**——强制禁止的视觉元素：

- 禁止 Inter 字体
- 禁止 indigo/violet 主色
- 禁止渐变文字
- 禁止 emoji 做标题
- 禁止三点窗口装饰
- 禁止动画光晕

**Slop Test**（AI 味检测）：如果一个开发者看到这个页面会想"这是 AI 生成的"，就说明设计不够好。

**美学多样性强制**：每次生成必须选择不同的字体配对和色板。**替换测试**——把你的样式换成通用暗色主题，如果看不出区别，说明你没在"设计"。

### 3.9 可借鉴的点

| 编号 | 具体模式 | 在 visual-explainer 中的实现 | tutor-skill 如何用 |
|---|---|---|---|
| V1 | **斜杠命令 = .md 文件** | `commands/*.md`，YAML frontmatter + prompt 模板体 | 新增 `commands/` 目录：`/tutor:lesson`（讲一章）、`/tutor:quiz`（出题）、`/tutor:fact-check`（校验）、`/tutor:slides`（幻灯片） |
| V2 | **reference-as-context** | SKILL.md 精简，references 按需加载，指令"Don't memorize — 每次重新读" | 我们已部分实现（teaching-methods.md 独立），但可以做得更好：按 Phase 加载对应 reference |
| V3 | **模板 + 路由表** | 4 个模板 + SKILL.md 中的显式路由表 | 我们需要按内容类型区分模板（概念讲解 vs 证明推导 vs 对比分析） |
| V4 | **verification checkpoint** | 每个命令要求 agent 先生成"事实清单"再生成 HTML | §3 第一性原理前加一步：agent 先列出"我将讲解哪些概念、每个概念的来源是什么" |
| V5 | **Anti-Slop / 质量门禁** | Forbidden 列表 + Slop Test | 我们的规则 12（禁用 AI 味句式）可以扩展为完整的 Forbidden 列表 |
| V6 | **`--slides` 标志** | 任何命令加 `--slides` 变幻灯片 | 加 `--quiz` 标志变互动习题、`--slides` 变幻灯片 |
| V7 | **主动渲染触发** | 4+ 行表格自动生成 HTML | 3+ 子概念自动生成 SVG 图、推导步骤 5+ 步自动生成推导链图 |
| V8 | **fact-check 命令** | 逐条校验已生成页面的声明 vs 实际代码，就地修正 | 新增 `/tutor:fact-check`，校验已生成课件的每条引用 vs raw/ 原文 |
| V9 | **多平台适配器** | configs/ 目录放各平台的引导文件 | 暂不需要（我们只跑在 Claude Code 上），但架构上预留 |
| V10 | **CSS 深度层级** | hero / elevated / recessed / glass 四层 | 可以引入——§1 清单用 elevated 卡片、§3 推导用 hero 卡片、§4 引用用 recessed 卡片 |
| V11 | **字体配对系统** | 5 套预定义配对，每次随机选一套 | 我们目前只用 Noto Serif/Sans，可以加 2-3 套配对供选择 |
| V12 | **交错动画** | 通过 `--i` CSS 变量控制每个元素的动画延迟 | 知识地图节点可以交错出现、推导步骤可以逐步展开 |

### 3.10 局限

- 参考文件巨大（css-patterns.md 44.5 KB、slide-patterns.md 45.2 KB），每次读取烧大量 token
- 无测试套件——质量完全靠模型能力，没有程序化安全网
- share.sh 强依赖 Pi 平台的 vercel-deploy skill
- Windows 支持有缺口（浏览器打开用 `open`/`xdg-open`，无 `start`）
- 无无障碍指引（ARIA、键盘导航、对比度）

---

## 4. 项目三：Manim 深度拆解

### 4.1 最小可行脚本

```python
from manim import *

class MyScene(Scene):
    def construct(self):
        title = MathTex(r"E = mc^2")
        self.play(Write(title))
        self.wait()
```

渲染：`manim -pql my_file.py MyScene`

### 4.2 关键 API（按 tutor-skill 场景分类）

#### A. 推导链逐步展开

| API | 作用 | 典型用法 |
|---|---|---|
| `MathTex(r"{{a^2}} + {{b^2}} = {{c^2}}")` | 渲染 LaTeX 数学，`{{}}` 分出可独立动画的子对象 | 分步渲染公式的不同部分 |
| `TransformMatchingTex(old, new)` | 在两个 MathTex 之间变形，匹配共享的上下标 | 展示推导的下一步 |
| `ReplacementTransform(a, b)` | 完全替换一个对象 | 公式整体变换 |
| `Indicate(mobject)` | 闪烁/高亮一个子对象 | 标记关键转折步骤 |
| `SurroundingRectangle(mobject)` | 在对象周围画方框 | 框出最终结果 |
| `Arrow(start, end)` | 连接箭头 | 推导步骤之间的连接 |
| `FadeIn / FadeOut` | 显示/隐藏 | 假设和旁注的出现/消失 |

**推导链示例模式**：

```python
step1 = MathTex(r"\frac{d}{dx}\int_a^x f(t)\,dt")
self.play(Write(step1))
self.wait()
step2 = MathTex(r"\frac{d}{dx}\int_a^x f(t)\,dt = f(x)")
self.play(TransformMatchingTex(step1, step2))
self.play(Indicate(step2[-1]))  # 高亮 f(x)
```

#### B. 函数绘图

| API | 作用 |
|---|---|
| `Axes(x_range, y_range, ...)` | 创建坐标系 |
| `axes.plot(lambda x: x**2)` | 绘制函数曲线 |
| `axes.get_graph_label(curve, label)` | 在曲线上放 LaTeX 标签 |
| `Dot(axes.coords_to_point(x, y))` | 在特定坐标放点 |
| `NumberPlane` | 带网格的坐标平面 |

#### C. 知识地图（图/网络）

| API | 作用 |
|---|---|
| `Graph(vertices, edges, layout="tree"/"kamada_kawai"/... , labels=True)` | 无向图 |
| `DiGraph(vertices, edges, ...)` | 有向图 |
| `layout_scale` | 控制节点间距 |
| `vertex_config / edge_config` | 自定义颜色、大小、形状 |

#### D. 3D 几何

| API | 作用 |
|---|---|
| `ThreeDScene` | 3D 场景基类 |
| `ThreeDAxes(...)` | 3D 坐标系 |
| `Surface(func, u_range, v_range)` | 参数曲面 |
| `Sphere / Cone / Cylinder / Torus` | 内置 3D 原语 |
| `self.move_camera(...)` | 相机动画 |

### 4.3 渲染 CLI

| 标志 | 作用 |
|---|---|
| `-ql` | 低质量（854x480, 15fps）— 快速预览 |
| `-qh` | 高质量（1920x1080, 60fps） |
| `-s` | **只保存最后一帧为 PNG**（最关键——不需要 FFmpeg，不需要视频编码） |
| `--format png` | 输出 PNG 帧 |
| `--format mp4` | 默认 MP4 视频 |
| `-o NAME` | 自定义输出文件名 |
| `--media_dir PATH` | 自定义输出目录 |

**agent 集成关键命令**：
```bash
# 静态 PNG（最快，不需要 FFmpeg）
manim -ql -s --format png my_script.py MyScene

# 视频
manim -ql --format mp4 my_script.py MyScene
```

### 4.4 依赖

| 依赖 | 必须？ | 重量 |
|---|---|---|
| Python 3.8+ | 是 | 轻 |
| FFmpeg | 视频输出必须 | 中 |
| **LaTeX（TeXLive/MiKTeX）** | **MathTex 必须** | **重（500MB~3GB）** |
| Cairo + Pango | 是 | 轻（pycairo wheel 自带） |
| NumPy, SciPy | 是 | 轻（pip 自带） |
| NetworkX | 可选 | 轻 |

### 4.5 可借鉴的点

| 编号 | 具体模式 | tutor-skill 如何用 |
|---|---|---|
| M1 | **`MathTex` 的 `{{}}` 分段** | §3.3 推导链可以生成 Manim 脚本，每步用 `{{}}` 分段高亮 |
| M2 | **`TransformMatchingTex` 推导变形** | 推导步骤之间的平滑变形，比静态 SVG 箭头生动得多 |
| M3 | **`Graph` / `DiGraph` 知识地图** | §1 知识地图可以生成 Manim 脚本，用 tree/kamada_kawai 布局自动排列 |
| M4 | **`Axes.plot` 函数绘图** | 数学/物理课程的函数图像自动绘制 |
| M5 | **`-s` 只渲染最后一帧** | 不需要 FFmpeg，不需要视频——只出 PNG 快照，~2-5 秒 |
| M6 | **纯 Python = LLM 可生成** | Manim 的声明式 API 非常适合 agent 自动生成 .py 脚本 |

### 4.6 局限与障碍

| 障碍 | 严重程度 | 说明 |
|---|---|---|
| LaTeX 依赖太重 | **严重** | TeXLive 最小安装 ~500MB。我们目前用 KaTeX CDN（~500KB），Manim 是回归 |
| 破坏自包含设计 | **严重** | Manim 输出 PNG/MP4，嵌入 HTML 需要 base64 编码或外部文件引用 |
| LLM 生成 Manim 代码不可靠 | 中等 | submobject 索引容易错、TransformMatchingTex 要求子对象数量严格匹配、布局容易重叠/出界 |
| 渲染延迟 | 中等 | PNG 快照 ~2-5s，视频 5-15s。SVG 是即时的 |
| 不可交互 | 低 | 输出是静态图片/视频，用户不能滚动、缩放、检查 |
| 进程隔离复杂度 | 低 | 需要子进程调用、捕获 stderr、处理超时、清理临时文件 |

### 4.7 结论：Manim vs CSS+JS

**CSS+JS（当前方案）在以下方面胜出**：
- 零外部依赖，自包含 HTML
- KaTeX 渲染数学效果与 Manim LaTeX 相同
- CSS 动画 + JS 可以做到"下一步展示"、"高亮术语"、"画箭头"
- 即时渲染，无子进程
- 可滚动、可交互、可嵌入聊天 UI、移动端可用

**Manim 在以下方面胜出**：
- 平滑运动图形（对象沿曲线运动、3D 相机平移、形状变形）
- 真正的函数绘图（坐标系 + 曲线 + 标注）
- 3D 几何可视化
- 复杂图布局（NetworkX 自动布局）
- 专业级数学动画（3Blue1Brown 风格）

**建议**：保持 CSS+KaTeX+SVG 作为核心。Manim 作为可选的"高级可视化"能力，仅在以下场景启用：
- 话题需要动画函数绘图（如微积分展示极限过程）
- 需要 3D 几何（物理/工程话题）
- 用户明确要求视频输出

即使在这些场景，**D3.js 嵌入 HTML** 也是更轻的替代方案——SVG 绘图 + 浏览器内动画，无需服务端渲染。

---

## 5. 三项目横向对比：行为差异矩阵

| 维度 | Pretty-mermaid | visual-explainer | Manim | tutor-skill（当前） |
|---|---|---|---|---|
| **输出格式** | SVG / ASCII | 自包含 HTML | MP4 / PNG / GIF | 自包含 HTML |
| **渲染引擎** | beautiful-mermaid（Node.js） | 浏览器内（Mermaid CDN + CSS + Chart.js） | Python + FFmpeg + LaTeX | 浏览器内（SVG + KaTeX CDN） |
| **图表能力** | 5 种 Mermaid 类型 | Mermaid + CSS Grid + Chart.js + HTML 表格 | 坐标系、函数、3D、图/网络、LaTeX | 手写 SVG |
| **主题系统** | 15 命名主题（JS 对象） | CSS 变量 + 4 套模板色板 | 无（代码中设色） | CSS 变量（1 套亮 + 1 套暗） |
| **模块化** | SKILL.md + scripts/ + references/ | SKILL.md + commands/ + references/ + templates/ | 不适用（纯库） | SKILL.md + references/（扁平） |
| **命令系统** | 无（单触发） | 8 个斜杠命令（.md 文件） | 不适用 | 无（单触发） |
| **模板系统** | 5 个 .mmd 示例 | 4 个 HTML 模板 + 路由表 | 不适用 | 1 个 HTML 骨架 |
| **质量门禁** | 无 | Anti-Slop 列表 + Slop Test | 不适用 | 规则 12（禁 AI 味句式） |
| **校验机制** | 无 | verification checkpoint + fact-check 命令 | 不适用 | §7 手动闭环 |
| **安装/依赖** | npm install（自动） | plugin marketplace | pip + FFmpeg + LaTeX（~1-3GB） | 无（纯文件） |
| **多平台** | 无 | 6 个平台适配器 | 不适用 | 无 |

---

## 6. 我们能拿走什么：逐项清单

按"可操作性"排序——从最容易实施到最复杂：

### 立即可做（改文件结构）

| 编号 | 来源 | 具体改动 | 改什么文件 |
|---|---|---|---|
| 1 | V5 | 规则 12 扩展为完整 Forbidden 列表 + Slop Test | 新建 `core/anti-patterns.md` |
| 2 | P1 | SKILL.md frontmatter 的 description 改成编号触发条件列表 | `SKILL.md` |
| 3 | P2 | SKILL.md 正文流程部分改成 cookbook 格式（决策树 + 具体步骤） | `SKILL.md` |
| 4 | V2 | references 按 Phase 加载（agent 读 SKILL.md 时知道"做 §3 时读 first-principles.md"） | `SKILL.md` |
| 5 | P5 | 文件名规范化——小写连字符，去掉空格 | rename `Html design.md` → `html-design.md` 等 |

### 短期可做（新增文件/目录）

| 编号 | 来源 | 具体改动 | 新建什么文件 |
|---|---|---|---|
| 6 | V1 | 新增 commands/ 目录，定义 3-4 个斜杠命令 | `commands/lesson.md`、`commands/quiz.md`、`commands/fact-check.md`、`commands/slides.md` |
| 7 | V3 | 新增 templates/ 目录，按内容类型区分模板 | `templates/concept-lesson.html`（概念讲解）、`templates/proof-walkthrough.html`（证明推导）、`templates/comparison.html`（对比分析） |
| 8 | V4 | §3 前加 verification checkpoint：agent 先列事实清单再讲解 | `SKILL.md` 流程部分 |
| 9 | V10 | CSS 引入深度层级（hero/elevated/recessed） | `references/html-design.md` 或新建 `renderers/html-shell.md` |
| 10 | P4 | 新增 assets/ 目录放预置模板 | `assets/knowledge-map.html`、`assets/derivation-chain.html` |

### 中期可做（新渲染器）

| 编号 | 来源 | 具体改动 | 新建什么文件 |
|---|---|---|---|
| 11 | P3+P6 | Mermaid 渲染器——agent 写 .mmd → 调 CLI → SVG 嵌入 HTML | `renderers/mermaid.md` + `scripts/render-mermaid.mjs` |
| 12 | V12 | CSS 交错动画——知识地图节点逐步出现、推导步骤逐步展开 | `renderers/animations.md` |
| 13 | V6 | `--quiz` 标志——同一内容同时输出课件和互动习题 | `commands/quiz.md` |

### 长期可做（重依赖）

| 编号 | 来源 | 具体改动 | 条件 |
|---|---|---|---|
| 14 | M1-M6 | Manim 集成——生成 .py 脚本 → 渲染 PNG → base64 嵌入 HTML | 用户本地有 Python + LaTeX |
| 15 | V8 | fact-check 命令——校验课件声明 vs raw/ 原文 | 需要定义"声明"的结构化格式 |
| 16 | reveal.js | slides 模式——同一内容输出滚动页 + 幻灯片 | 视觉探索者需要"讲课"场景 |

---

## 7. 我们的 skill 如何改造：具体行为设计

### 7.1 改造后的目录结构

```
tutor-skill/
├── SKILL.md                        # 编排层：触发条件 + 开场仪式 + 工作流 + 模块引用
│
├── core/                           # 不变的核心
│   ├── rules.md                    # 硬性规则（含扩展的 Forbidden 列表）
│   ├── phases.md                   # 七阶段定义 + 每阶段的输入/输出/质量标准
│   └── vsl-principles.md           # VSL 设计原则
│
├── methods/                        # 四种教学法
│   ├── first-principles.md         # 第一性原理（Phase 3 用）
│   ├── reverse-learning.md         # 逆向学习法（Phase 2 用）
│   ├── socratic.md                 # 苏格拉底诘问（Phase 6 用）
│   └── feynman.md                  # 费曼讲法（Phase 5 用）
│
├── renderers/                      # 渲染规范
│   ├── html-shell.md               # HTML 骨架 + CSS 设计系统 + 深度层级
│   ├── svg.md                      # SVG 制图规范
│   ├── mermaid.md                  # Mermaid 渲染指南（何时用、怎么用）
│   └── animations.md               # CSS 交错动画 + 逐步展开模式
│
├── templates/                      # 按内容类型区分的 HTML 模板
│   ├── concept-lesson.html         # 概念讲解型（定义 + 类比 + 例题）
│   ├── proof-walkthrough.html      # 证明推导型（假设链 + 推导链图）
│   └── comparison.html             # 对比分析型（并列表格 + 差异高亮）
│
├── commands/                       # 斜杠命令
│   ├── lesson.md                   # /tutor:lesson — 讲解指定章节
│   ├── quiz.md                     # /tutor:quiz — 从已讲内容出题
│   ├── fact-check.md               # /tutor:fact-check — 校验课件准确性
│   └── slides.md                   # /tutor:slides — 从课件生成幻灯片
│
├── assets/                         # 预置示例/模板
│   ├── knowledge-map-template.html # 知识地图 SVG 模板
│   └── derivation-chain-template.html  # 推导链 SVG 模板
│
└── references/                     # 旧文件（逐步迁移）
    ├── Html design.md              # → renderers/html-shell.md
    ├── Html template.md            # → templates/concept-lesson.html
    └── teaching-methods.md         # → methods/ 下四个文件
```

### 7.2 SKILL.md 改造后的行为

**前置**（YAML frontmatter）：

```yaml
---
name: tutor-skill
description: |
  深度精读式助教。把 raw/ 里的书或 PPT 讲透，输出自包含 HTML 课件到 output/。
  触发条件：
  1. 用户说"讲解/教我/给我讲讲/tutor/explain/学习/精读"且涉及 raw/ 的内容
  2. 用户说"/tutor:lesson"调用斜杠命令
  3. 用户说"/tutor:quiz"对已讲内容出题
  4. 用户说"/tutor:fact-check"校验课件
  不触发：用户只是问一次性问题（"这是什么意思"）
version: "2.0.0"
---
```

**正文**（cookbook 格式，不再长篇规范）：

```markdown
# Tutor Skill — 工作流

## Step 0：开场仪式
1. ls raw/、ls output/，如果 notes/ 存在则 ls notes/
2. 读 notes/ 里的文件（判断用户进度）
3. 盘点 raw/ 材料，确认每份角色（课程 PPT / 参考书 / 习题集 / 其他）
4. 确认讲哪份、哪一章。不明确就问。

## Step 1：读核心模块
按顺序读以下文件（不要凭记忆，每次重新读）：
- core/rules.md → 了解硬性规则
- core/phases.md → 了解七阶段流程
- core/vsl-principles.md → 了解 VSL 设计原则

## Step 2：选择内容类型 → 加载对应模板
根据章节内容选择模板：
- 概念为主（定义 + 类比 + 例题） → templates/concept-lesson.html
- 推导为主（定理证明、公式推导） → templates/proof-walkthrough.html
- 对比为主（方法对比、概念辨析） → templates/comparison.html
复制模板到 output/<source-stem>__<topic-slug>.html

## Step 3：生成 verification checkpoint
在填充 HTML 之前，先输出一份事实清单：
- 本章有哪些知识点（按原书顺序）
- 每个知识点在原书的出处（§X.Y）
- PPT 中出现过的标 🎯
- 有任何不确定的地方，标记出来
确认清单无误后再继续。

## Step 4：按 Phase 填充
按 phases.md 的七阶段顺序填充 HTML。每个 Phase 需要时加载对应方法论：

| Phase | 加载 |
|---|---|
| §1 知识清单 + 知识地图 | renderers/svg.md 或 renderers/mermaid.md |
| §2 逆向目标 | methods/reverse-learning.md |
| §3 第一性原理 | methods/first-principles.md + renderers/animations.md |
| §4 逐字精读 | renderers/html-shell.md（callout 系统、图文交织） |
| §5 费曼讲法 | methods/feynman.md |
| §6 苏格拉底诘问 | methods/socratic.md |
| §7 闭环验真 | （无需额外加载） |

## Step 5：质量自查
写完后按 core/rules.md 中的 Forbidden 列表和 Slop Test 自查。
任何一条不通过，修正后再继续。

## Step 6：输出
- 写入 output/*.html
- 提示用户在浏览器打开
- 建议用户在 notes/ 写理解笔记
```

### 7.3 斜杠命令的具体行为

#### `/tutor:lesson [章节号] [主题]`

```
行为：
1. 读 SKILL.md（编排层）
2. 执行 Step 0-6（同 SKILL.md 工作流）
3. 输出 output/*.html

参数：
  $1 — 章节号（可选，如 "第3章"）
  $@ — 主题描述（可选，如 "万有引力定律"）
```

#### `/tutor:quiz`

```
行为：
1. 扫描 output/ 找最近的课件
2. 读 methods/socratic.md
3. 从课件的 §3（第一性原理）和 §4（精读内容）中提取知识点
4. 生成 4-8 道使用题（不是背诵题），用 <details> 折叠答案
5. 输出到 output/<stem>__quiz.html
6. 每题答案预测错答模式

参数：
  $@ — 可选：指定从哪个课件出题
```

#### `/tutor:fact-check`

```
行为：
1. 扫描 output/ 找最近的课件
2. 读 raw/ 原文（MinerU markdown）
3. 逐条校验课件中的：
   - 原文引用是否准确（有没有误引、漏引）
   - 书外补充是否标了 callout
   - 公式/定理的编号是否正确
   - 图片路径是否有效
4. 标记不准确的地方，就地修正 HTML
5. 输出校验报告（哪些条目通过、哪些修正了）

参数：
  $@ — 可选：指定要校验的课件文件
```

#### `/tutor:slides`

```
行为：
1. 扫描 output/ 找最近的课件
2. 读课件的七个 section
3. 按 reveal.js 幻灯片结构重新组织内容：
   - §1 清单 → 1 张总览幻灯片
   - §3 第一性原理 → 3-5 张推导演示
   - §4 精读 → 每小节 1-2 张
   - §5 费曼 → 1 张类比总结
   - §6 苏格拉底 → 每题 1 张（先问题后答案）
4. 输出到 output/<stem>__slides.html（内嵌 reveal.js CDN）

参数：
  $@ — 可选：指定从哪个课件生成
```

### 7.4 模板系统设计

#### concept-lesson.html（概念讲解型）

**适用**：章节以概念定义、分类、性质为主（如"什么是向量"、"集合的运算"）

**结构特点**：
- §1 知识清单用卡片网格（elevated 深度）
- §3 推导链用水平箭头流
- §4 图文交织——图紧贴在引出它的句子后面
- §6 苏格拉底用折叠卡片

**色板**：暖色系（琥珀 + 棕褐），区别于 visual-explainer 的任何色板

#### proof-walkthrough.html（证明推导型）

**适用**：章节以定理证明、公式推导为主（如"微积分基本定理的证明"、"拉格朗日乘数法"）

**结构特点**：
- §1 知识清单紧凑（单列）
- §3 推导链用纵向步骤流（假设 → 推论 → 推论 → 最终公式），关键转折用紫色 callout
- §3.3 有 SVG 推导链图
- §4 每步推导配"原文" + "讲解"双栏
- §6 苏格拉底题目偏"改变假设会怎样"

**色板**：冷色系（靛蓝 + 银灰），沉稳、学术感

#### comparison.html（对比分析型）

**适用**：章节以方法对比、概念辨析为主（如"FFT vs DFT"、"牛顿法 vs 梯度下降"）

**结构特点**：
- §1 知识清单分两列
- §3 用对比表代替推导链
- §4 原文用左右并列引用块
- §4 大量 HTML 表格 + 色带区分
- §6 苏格拉底题目偏"什么时候用 A、什么时候用 B"

**色板**：对比色系（蓝绿对），左列蓝、右列绿

### 7.5 渲染器选择策略（renderers/ 目录下的决策指南）

| 图表场景 | 渲染器 | 原因 |
|---|---|---|
| §1 知识地图（<15 节点） | Mermaid | `mindmap` 或 `flowchart TD`，自动生成布局，快 |
| §1 知识地图（15+ 节点） | SVG | 需要精确控制节点位置，Mermaid 布局会混乱 |
| §3.3 推导链（静态） | SVG | 精确控制每步位置、箭头、高亮区域 |
| §3.3 推导链（动画，可选） | CSS + JS | 用 IntersectionObserver 或 `<details>` 实现逐步展开 |
| §3.4 概念定位图 | Mermaid | `flowchart TD` 或 `graph TD`，层级关系图的强项 |
| §4 例题过程图 | SVG | 需要精确控制每步的布局 |
| §5 费曼类比图 | SVG（手绘风格） | 用 SVG 的 stroke-dasharray 模拟手绘感 |
| §6 苏格拉底 | HTML `<details>` | 纯 HTML 交互，不需要图表引擎 |
| 函数图像（需要时） | D3.js 或 Mermaid xyChart | 嵌入 HTML，浏览器内渲染 |

### 7.6 质量门禁扩展

在 `core/rules.md` 的规则 12 基础上扩展为完整 Forbidden 列表：

**视觉层（借鉴 visual-explainer 的 Anti-Slop）**：
- 禁止渐变文字
- 禁止 emoji 做标题
- 禁止动画光晕
- 每次生成至少尝试一套非常规字体配对

**内容层（教学特有的质量门禁）**：
- 禁止只给定义不给例子
- 禁止只给例子不给反例
- 禁止跳过前置知识直接讲结论
- 禁止用"显然"、"易得"跳步
- 禁止用"像一个盒子"之类的空洞类比

**Slop Test（教学版）**：一个学完这章的学生，能不能用课件里的内容做对原书的习题？不能 = 质量不达标。

---

## 8. 实施计划

### Phase 1：文件重构 + 质量门禁（1-2 天）

**做什么**：
- 建立 core/、methods/、renderers/、templates/、commands/、assets/ 目录
- 把 SKILL.md 拆分到对应目录
- SKILL.md 改写为 cookbook 格式的编排层
- 文件名规范化（小写连字符）
- 扩展 Forbidden 列表 + Slop Test
- 新增 verification checkpoint 步骤

**不做什么**：不引入新渲染器、不引入新命令的具体实现

**验证**：改造后的 skill 能正常讲一章课，输出和改造前质量相当

### Phase 2：斜杠命令 + 模板系统（2-3 天）

**做什么**：
- 实现 commands/lesson.md（包装现有工作流）
- 实现 commands/quiz.md（从课件提取知识点 → 生成苏格拉底题目）
- 实现 commands/fact-check.md（校验课件 vs 原文）
- 实现 3 个内容类型模板（concept-lesson、proof-walkthrough、comparison）
- CSS 引入深度层级 + 交错动画

**验证**：`/tutor:lesson`、`/tutor:quiz`、`/tutor:fact-check` 三个命令都能正常工作

### Phase 3：Mermaid 渲染器（2-3 天）

**做什么**：
- 新建 renderers/mermaid.md（何时用 Mermaid、Mermaid 语法参考、嵌入 HTML 的方式）
- 新建 scripts/render-mermaid.mjs（从 Pretty-mermaid-skills 借鉴，简化版）
- SKILL.md 中加入 Mermaid 渲染决策逻辑
- §1 知识地图默认用 Mermaid 生成

**验证**：知识地图从手写 50 行 SVG 变成写 10 行 Mermaid + 调一次命令

### Phase 4：高级能力（待定）

- `/tutor:slides` 命令（reveal.js 幻灯片）
- D3.js 交互式知识地图
- Manim 集成（仅在用户本地有 LaTeX 时可选启用）

---

## 9. 待讨论问题

1. **模块化粒度**：core/ 下是拆成 3 个文件（rules / phases / vsl）还是合并？拆太碎增加 agent 读取成本
2. **Mermaid 渲染方式**：用 Pretty-mermaid-skills 的 `beautiful-mermaid` 库（自动安装），还是直接用 `@mermaid-js/mermaid-cli`（`mmdc` 命令）？前者更简单，后者更标准
3. **Manim 是否必要**：CSS+JS 动画能否替代 Manim 的"推导链逐步展开"效果？如果能，就不引入 LaTeX 重依赖
4. **模板数量**：3 个模板（概念/推导/对比）是否够？还是需要更多细分？
5. **commands/ 和现有触发方式的关系**：斜杠命令是替代"说关键词触发"还是并存？
6. **旧文件清理时机**：模块化完成后立即删除 references/ 下的旧文件，还是保留一版做过渡？
7. **fact-check 的实现方式**：agent 对比课件声明 vs raw/ 原文，需要结构化"声明"格式吗？还是让 agent 自由发挥？
