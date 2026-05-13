# SVG 制图规范

所有图表用内联 SVG。统一约定。

---

## 通用属性

```
viewBox: 按实际内容设，常用 "0 0 800 400"（横向流程）或 "0 0 600 800"（纵向树形）
xmlns: "http://www.w3.org/2000/svg"
font-family: var(--font-heading) 在 SVG 里不生效，写死 "Noto Sans SC, system-ui, sans-serif"
font-size: 节点标签 14px，小注释 11px
```

---

## 节点样式

| 类型 | fill | stroke | stroke-width | rx |
|---|---|---|---|---|
| 普通节点 | `#e8e8f0` | `#4a4a6a` | 1.5 | 6 |
| 高亮节点（关键步骤） | `#ede9fe` | `#7c3aed` | 2.5 | 6 |
| 考点节点（🎯） | `#fffbeb` | `#d97706` | 2 | 6 |

---

## 箭头定义（每个 SVG 文件内复制一次）

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

---

## 常见图类型

| 图类型 | 用在 | 布局 | 要点 |
|---|---|---|---|
| **知识地图** | §1 末尾 | 树形或径向 | 根节点 = 章标题，叶节点 = 知识点，🎯 考点用橙色边框 |
| **推导链图** | §3.3 末尾 | 从左到右或从上到下 | 假设 → 中间结论 → 最终公式，关键转折用紫色高亮 |
| **概念定位图** | §3.4 | 树形 | 标出本概念在学科中的位置，邻居概念用虚线连接 |
| **对比图** | §3.4 / §4 | 左右并列 | 两列对齐，差异行用底色区分 |
| **过程图** | §4 例题 | 从上到下 | 每步一行，输入 → 处理 → 输出 |
