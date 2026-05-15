---
description: "讲解指定章节——从 raw/ 取材，输出自包含 HTML 课件到 output/"
---

# /tutor:lesson

## 参数

- `$1` — 章节号（可选，如"第3章"、"chapter-3"）
- `$@` — 主题描述（可选，如"万有引力定律"）

## 流程

### 1. 读编排层

Read `SKILL.md`，按其 Step 0–6 执行。本命令是 SKILL.md 工作流的标准化入口，不替代其中任何步骤。

### 2. 开场仪式

```
1. ls raw/、ls output/，如果 notes/ 存在则 ls notes/
2. 读 notes/ 里的全部文件
3. 盘点 raw/ 材料角色（PPT / 参考书 / 习题集 / 其他）
4. 如果 $1 或 $@ 提供了具体章节/主题，直接使用
5. 如果没有参数，问用户要讲哪份材料、哪一章
```

### 3. 读核心模块

按顺序 Read（不要凭记忆，每次重新读）：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `core/rules.md` | 硬性规则 + Forbidden 列表 + Slop Test |
| 2 | `core/phases.md` | 七阶段定义 + 质量标准 |
| 3 | `core/vsl-principles.md` | VSL 设计原则 |

### 4. 选择模板

按内容类型选：

| 内容类型 | 模板 |
|---|---|
| 概念为主（定义 + 类比 + 例题） | `templates/concept-lesson.html` |
| 推导为主（定理、公式推导） | `templates/proof-walkthrough.html` |
| 对比为主（方法对比、概念辨析） | `templates/comparison.html` |

不明确时选 `concept-lesson.html`（最通用）。

### 5. Verification Checkpoint

输出事实清单，确认无误再继续（详见 SKILL.md Step 3）。

### 6. 按 Phase 填充

每个 Phase 开始前必须 Read 对应加载文件。**输出厚度按 Step 0 确认的深度档位调整**：

| Phase | 加载 | 入门 | 标准 | 深入 |
|---|---|---|---|---|
| §1 | `renderers/mermaid.md` + `renderers/svg.md` | 同标准 | — | 同标准 |
| §2 | `methods/reverse-learning.md` | 3 条 | 3–6 条 | 6 条 |
| §3 | `methods/first-principles.md` | 类比层面，不写数学证明 | 完整推导 | 展开到证明细节 + 脚注 |
| §4 | `renderers/html-shell.md` | 只讲主要公式和核心例题 | 覆盖全部例题 | 覆盖所有例题 + 脚注 + 旁注 |
| §5 | `methods/feynman.md` | 同标准 | — | 同标准 |
| §6 | `methods/socratic.md` | 4 题 | 4–8 题 | 8 题，含边界反例 |
| §7 | — | 同标准 | — | 同标准 |

**分批规则**（见 `core/rules.md` 规则 12）：单次不超 3 个 Phase，写完暂停等确认。每个 Phase 完成后写入 progress 文件（见 SKILL.md Step 6）。

### 7. 质量自查

逐条输出 Forbidden 列表和 Slop Test 结果（详见 SKILL.md Step 5）。

### 8. 输出

- 写入 `output/<source-stem>__<topic-slug>.html`
- 提示用户在浏览器打开
- 建议用户在 `notes/` 写理解笔记
