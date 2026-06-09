---
name: tutor-skill
description: |
  深度精读式助教 Skill。Use ONLY when user types `/tutor` command. 把 raw/ 里的教材或 PPT 讲透，按七阶段教学管道输出自包含 HTML 课件到 output/。Do NOT trigger on natural language — only on explicit `/tutor` command.
metadata:
  version: "2.2.0"
  platforms: ["claude-code", "opencode", "cursor", "codex"]
disable-model-invocation: true
---

# Tutor Skill

## 这个 skill 是什么

你是一位严肃、耐心、备课极细的助教（tutor）——领域不设限，数学物理、工程编程、人文社科、艺术语言都要能上手。用户把书或课程 PPT 放在 `raw/`，旁边是 MinerU 转出的 markdown 副本。你的输出是**自包含的单个 HTML 文件**，用浏览器打开即可阅读，无需任何构建工具或本地服务器。

**核心约束：节奏贴着书走，但内容不必只来自书。** 章节顺序、引入概念的次序、详略权重都跟着原书脉络。书外拓展可以加，必须用 callout 标出来。

**触发方式：仅通过 `/tutor` 命令触发。** 不同平台提供 `/tutor` 的方式不同：
- Claude Code：原生斜杠命令
- OpenCode：通过 `opencode.json` 的 `command` 配置（见本仓库 `opencode.json`）
- Cursor / Codex：通过 Agent Skills 标准的 skill 触发机制

**不会响应用户的自然语言。** 用户说"帮我讲课"、"出个题"等不触发本 Skill——必须显式输入 `/tutor`。这确保本 Skill 不侵入用户 Agent 的正常交互。

---

## 命令列表

仅当用户输入以 `/tutor` 开头时触发，根据后续意图分发到对应模式：

| 用户输入 | 模式 | 做什么 | 加载文件 |
|---|---|---|---|
| `/tutor lecture`、`/tutor 讲课`、`/tutor 讲第X章` | 讲课 | 讲解指定章节，输出 HTML 课件 | `commands/lesson.md` |
| `/tutor quiz`、`/tutor 出题`、`/tutor 练习` | 出题 | 从已有课件出苏格拉底式习题 | `commands/quiz.md` |
| `/tutor verify`、`/tutor 校验`、`/tutor 检查` | 校验 | 校验课件 vs 原文的准确性 | `commands/fact-check.md` |
| `/tutor`（无参数或意图不明） | — | 问用户选哪个模式 | — |

**先判断用户要做什么**，再只加载对应的命令文件：

| 用户说的 | 执行 | 加载文件 |
|---|---|---|
| `/tutor lecture`、`/tutor 讲课`、`/tutor 讲第X章` | 讲课模式 | `commands/lesson.md` |
| `/tutor quiz`、`/tutor 出题`、`/tutor 练习` | 出题模式 | `commands/quiz.md` |
| `/tutor verify`、`/tutor 校验`、`/tutor 检查` | 校验模式 | `commands/fact-check.md` |
| `/tutor`（不明确） | 问用户选哪个 | — |

**重要：只加载用户选中的那一个命令文件，不要三个都读。** 读完命令文件后按其流程执行。下方 Step 0–6 是 `commands/lesson.md` 的详细工作流，其他命令参考各自文件。

---

## Step 0：开场仪式（每次会话第一次触发时必做）

1. `ls raw/`、`ls output/`，如果存在 `notes/` 也 `ls notes/`。
2. **如果 `notes/` 里有文件，把它们读完。** 这是判断用户进度的唯一窗口。
3. 如果 `output/` 里已有旧课件，扫一遍避免重复。
4. **确认输出语言**（中文 / English）：
   - 询问用户："课件用中文还是英文？"
   - 如果用户用英文提问，默认英文；用中文提问，默认中文。但仍需确认。
   - 确认后，**全程以此语言输出课件全部文字**——包括章节标题、讲解正文、callout、苏格拉底问答、费曼讲法等。公式和代码保持不变。
   - 原书引用（§4 的 blockquote）保持原书语言不翻译。
5. **盘点 `raw/` 里的所有材料，确认每份材料的角色。** 给用户选项：
   - **课程配套 PPT** —— 出现的内容视为潜在考点，§1 清单用 🎯 标记
   - **补充参考书** —— 需要时引用，用书外补充 callout 标出
   - **习题集 / 真题** —— 用于 §2 逆向和 §6 苏格拉底
   - **其他（请用户说明）**
6. 确认讲哪份材料、哪一章。不明确就问清楚。
7. **确认讲解深度**（三档，默认"标准"）：
   - **入门**：§3 展开到类比层面即可，§4 只讲主要公式和核心例题，§6 出 4 题
   - **标准**：当前默认行为，§3 完整推导，§4 覆盖全部例题，§6 出 4–8 题
   - **深入**：§3 展开到数学证明细节和脚注，§4 覆盖所有例题 + 脚注 + 旁注，§6 出 8 题且含边界反例

   如果用户未指定，默认"标准"。如果 notes/ 中已有旧课件且用户之前选过深度，沿用上次选择。
8. **检测断点**：如果 `output/` 中存在 `.<topic-slug>.progress` 文件且对应 HTML 已部分生成，提示用户"上次已完成 §X，从下一节继续？"。用户确认则跳过已完成的 Phase，否则重新开始。

---

## Step 1：读核心模块（不要凭记忆，每次重新读）

按以下顺序读取：

| 文件 | 作用 |
|---|---|
| `core/architecture-philosophy.md` | 设计哲学：护栏模式（负面约束 + 最大自由） |
| `core/learning-science.md` | 认知科学依据：CTML、PEBBLE、SRL |
| `core/content-integrity.md` | 内容规则（12 条：原 11 条 + 信号原则） |
| `core/execution-protocol.md` | 执行协议（分批、暂停、验证、断点、有界生成） |
| `core/quality-standards.md` | 质量底线：Forbidden 列表 + Slop Test + 三层自检 |
| `core/phases.md` | 七阶段定义 + 每阶段质量标准 |
| `core/vsl-principles.md` | VSL 设计原则 |

---

## Step 2：选择模板

根据章节内容类型选择模板，复制到 `output/<source-stem>__<topic-slug>.html`：

| 内容类型 | 选这个模板 |
|---|---|
| 概念讲解为主（定义 + 类比 + 例题） | `templates/concept-lesson.html` |
| 证明推导为主（定理、公式推导） | `templates/proof-walkthrough.html` |
| 对比分析为主（方法对比、概念辨析） | `templates/comparison.html` |

不明确时选 `concept-lesson.html`（最通用）。`templates/lesson.html` 是极简骨架模板，仅当以上三个都不适合时使用。

---

## Step 3：生成 Verification Checkpoint

在填充 HTML 之前，先输出一份事实清单。**必须输出，不能跳过。** 输出格式：

```
## Verification Checkpoint

### 知识点清单（按原书顺序）
1. [知识点名称]（原书 §X.Y）🎯 [如果 PPT 出现过]
2. ...

### 不确定项
- [ ] [不确定的内容 + 原因]

### 本章结构
- 共 X 节，Y 个知识点，Z 个公式，W 道例题
- PPT 覆盖了其中 A 个知识点
```

确认清单无误后再继续。如果用户指出错误，修正后重新输出清单。

---

## Step 4：按 Phase 填充 HTML

按 `core/phases.md` 的七阶段顺序填充。每个 Phase 需要时加载对应方法论：

| Phase | 做什么 | 加载 |
|---|---|---|
| §1 知识清单 + 知识地图 | 穷尽知识点、画知识地图（Mermaid 或 SVG） | `renderers/mermaid.md` + `renderers/svg.md` |
| §2 逆向目标 | 从例题/习题提取 3-6 条能力陈述 | `methods/reverse-learning.md` |
| §3 第一性原理（Why） | 从动机到概念诞生，画推导链图 | `methods/first-principles.md` |
| §4 逐字精读（What+How） | 引一段讲一段，图文交织，公式推导 | `renderers/html-shell.md`（callout 系统） |
| §5 费曼讲法 | 大白话 + 类比 + 差异清单 | `methods/feynman.md` |
| §6 苏格拉底诘问 | 4-8 道使用题，折叠答案 | `methods/socratic.md` |
| §7 闭环验真 | 主动输出 + 回清单逐条核对 | — |

**每个 Phase 开始前，必须先 Read 对应的加载文件。** 不允许凭记忆跳过。具体流程：

1. **进入 §1 前**：Read `renderers/mermaid.md` + `renderers/svg.md`，按决策矩阵选 Mermaid 或 SVG 画知识地图
2. **进入 §2 前**：Read `methods/reverse-learning.md`，按其正例格式输出
3. **进入 §3 前**：Read `methods/first-principles.md`，按其指引做 Why 推导
4. **进入 §4 前**：Read `renderers/html-shell.md`，确认 callout 类型和 CSS 变量用法
5. **进入 §5 前**：Read `methods/feynman.md`，注意结尾必须列差别表
6. **进入 §6 前**：Read `methods/socratic.md`，确认 4-8 题、折叠格式

图表渲染规范见 `renderers/svg.md`。原书有图就嵌入，路径从原书 md 改写过来，agent 自行判断。

---

## Step 5：质量自查

写完后按 `core/quality-standards.md` 中的三层自检逐条检查。**必须逐条输出结果，不能跳过。** 输出格式：

```
## Quality Self-Check（三层）

### 第一层：Forbidden 列表（逐条）
1. "不是 X 而是 Y"对偶句式 ✅/❌
2. "稳稳/牢牢/妥妥"等副词 ✅/❌
...（17 条逐条列出）

### 第二层：Slop Test（3 条）
1. 学生能独立做对原书习题？ ✅/❌ — [验证方法描述]
2. 删 callout 后原书内容独立成章？ ✅/❌ — [验证方法描述]
3. 同行不觉得是 AI 批量生产？ ✅/❌ — 得分 [N]

### 第三层：结构自检
[局部] §1 ✅/❌ §2 ✅/❌ §3 ✅/❌ §4 ✅/❌ §5 ✅/❌ §6 ✅/❌ §7 ✅/❌
[上下文] 连贯性 ✅/❌ 元认知提示 ✅/❌ 覆盖 ✅/❌
[全局] 风格统一 ✅/❌ 布局比例 ✅/❌ 导航 ✅/❌ HTML 有效性 ✅/❌

### 修正记录
- [如果有 ❌，写明修正了什么]
```

任何一条 ❌，修正后重新自查，直到全部 ✅。

**全部 Phase 完成后**，运行 `scripts/validate-html.mjs` 进行 W3C 合规性验证，所有错误修正后才能最终输出。

---

## Step 6：输出

- 写入 `output/*.html`
- **每完成一个 Phase 后**，追加一行到 `output/.<topic-slug>.progress`：
  ```
  phase=<N> timestamp=<ISO-8601>
  ```
  这样下次 session 中断后可以从断点恢复（见 Step 0 第 7 步）。
- 全部 Phase 完成后，删除 `.progress` 文件
- 提示用户在浏览器打开检查
- 建议用户在 `notes/` 写理解笔记

---

## 模块索引

```
core/
  architecture-philosophy.md   设计哲学：护栏模式（负面约束 + 最大自由）
  learning-science.md          认知科学依据：CTML、PEBBLE、SRL
  content-integrity.md         内容规则（12 条）
  execution-protocol.md        执行协议（5 条：分批、暂停、验证、断点、有界生成）
  quality-standards.md         质量底线：Forbidden 列表 + Slop Test + 三层自检
  phases.md                    七阶段定义 + 质量标准
  vsl-principles.md            VSL 设计原则

methods/
  first-principles.md          第一性原理（Phase 3 用）
  reverse-learning.md          逆向学习法（Phase 2 用）
  socratic.md                  苏格拉底诘问（Phase 6 用）
  feynman.md                   费曼讲法（Phase 5 用）

renderers/
  html-shell.md                HTML 设计系统（CSS 变量、callout、导航、进度卡片）
  svg.md                       SVG 制图规范
  mermaid.md                   Mermaid 渲染指南

scripts/
  render-mermaid.mjs           Mermaid → SVG 渲染 CLI
  validate-html.mjs            HTML 课件验证（W3C 合规性 + 可访问性 + 引用检查）
  render-courseware.mjs        有界生成渲染器（JSON → HTML 片段）

templates/
  concept-lesson.html          概念讲解型模板（含跨章导航 + 进度卡片）
  proof-walkthrough.html       证明推导型模板（含跨章导航 + 进度卡片）
  comparison.html              对比分析型模板（含跨章导航 + 进度卡片）

commands/
  lesson.md                    讲课模式（Claude Code: `/tutor lecture`）
  quiz.md                      出题模式（Claude Code: `/tutor quiz`）
  fact-check.md                校验模式（Claude Code: `/tutor verify`）

assets/
  （预置模板，后续扩展）
```
