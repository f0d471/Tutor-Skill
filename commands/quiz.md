---
description: "从已有课件出题——扫描 output/，生成苏格拉底式互动习题"
---

# `/tutor quiz` — 出题模式

## 参数

- `$@` — 可选：指定课件文件名（如"ch3__gravity"），不指定则取 output/ 最新的

## 流程

### 1. 定位课件

```
1. ls output/
2. 如果 $@ 指定了文件 → 找到对应 .html
3. 如果没有参数 → 取 output/ 中最新的 .html 文件
4. 如果 output/ 为空 → 提示用户先讲课
```

### 2. 读方法论

按顺序 Read：

| 顺序 | 文件 | 作用 |
|---|---|---|
| 1 | `core/content-integrity.md` + `core/quality-standards.md` | 内容规则 + Forbidden 列表 |
| 2 | `methods/socratic.md` | 苏格拉底出题规则 |
| 3 | `core/phases.md` | 理解七阶段结构（定位 §3 和 §4） |

### 3. 提取知识点

从课件 HTML 中提取：

1. **§3 第一性原理**：最小核心是什么、关键转折步骤、最终结论
2. **§4 逐字精读**：每个定义、公式、定理、例题
3. **§6 苏格拉底**（如果已有）：已出过的题目——避免重复

### 4. 生成题目

按 `methods/socratic.md` 的规则生成 4–8 道题：

- 难度递进：Q1 戳核心 → Q2 戳细节 → Q3+ 边界/反例
- 每题必须是**使用题**（给情境、算结果），不是背诵题
- 每题用 `<details><summary>` 折叠答案
- 每题答案预测错答模式 + 指向课件的回查位置
- 至少一道"故意挖坑"题

### 5. 输出

- 使用 `templates/concept-lesson.html` 的 CSS（复制其 `<style>` 块）
- 输出到 `output/<原课件stem>__quiz.html`
- HTML 结构：标题 → 元信息（从哪个课件出的题）→ 题目列表
- 提示用户在浏览器打开，先别看答案
