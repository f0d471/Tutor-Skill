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

## 布局网格系统（防重叠核心）

**所有 SVG 图表必须使用下方预定义的网格坐标，不得自由计算像素值。** 先选模板、再填内容、最后用碰撞检查表验证。

### 碰撞检查表（画完必做）

每张 SVG 输出前，逐条过一遍：

- [ ] 同一行（row）的相邻节点水平间距 ≥ 15px
- [ ] 相邻行（row）的节点垂直间距 ≥ 25px
- [ ] 图例（legend）位于所有内容节点下方，且间距 ≥ 15px
- [ ] 虚线连接线的标签不与任何节点重叠
- [ ] viewBox 高度能容纳最底部元素 + 10px 余量
- [ ] 所有箭头的 marker-end 不被节点遮挡

**任何一条不满足，调整坐标后重新检查。**

---

## 图类型 A：知识地图（§1 末尾）

### 三列模板（3 个 section，最常见）

列定义（viewBox `0 0 900 XXX`，XXX 按行数定）：

| 列 | center-x | 内容区范围 | 节点左边缘（宽度 →） |
|---|---|---|---|
| 左列 | 170 | x: 10–330 | small(80): 130, medium(120): 110, large(140): 100 |
| 中列 | 450 | x: 340–560 | small(80): 410, medium(120): 390, large(160): 370 |
| 右列 | 730 | x: 570–890 | small(80): 690, medium(120): 670, large(160): 650 |

列间距：340 − 330 = 10px 最小（实际节点不会触边，所以安全）。

### 行定义

| 行号 | 名称 | y 范围 | 用途 |
|---|---|---|---|
| R0 | title | y=28 | SVG 标题 `<text>` |
| R1 | root | y=45–81 | 章标题节点（36px 高） |
| R2 | section | y=115–147 | section 标题节点（32px 高） |
| R3 | child-1 | y=175–225 | section 的第一层子节点（50px 高） |
| R4 | child-2 | y=255–305 | 第二层子节点（50px 高） |
| R5 | result | y=335–375 | 最终公式/结论节点（40px 高） |
| R6 | strategy-bar | y=400–436 | 横贯全章的策略条（36px 高） |
| R7 | strategy-child | y=450–486 | 策略子节点（36px 高） |
| R8 | legend | y=508+ | 图例（必须在所有节点下方） |

行间距：R3 顶部 y=175，R2 底部 y=147，间距 = 28px（≥25 ✓）。

### 箭头连线坐标

从 section（R2，底边 y=147）到 children（R3，顶边 y=175）：

```
左列 section 中心 170 → children 分支:
  左 child 中心 50:  line x1=130 y1=147 x2=50  y2=175
  中 child 中心 170: line x1=170 y1=147 x2=170 y2=175
  右 child 中心 290: line x1=210 y1=147 x2=290 y2=175
```

从 child（R3，底边 y=225）到 grandchild（R4，顶边 y=255）：

```
line x1={child-center-x} y1=225 x2={grandchild-center-x} y2=255
```

从 grandchild（R4，底边 y=305）到 result（R5，顶边 y=335）：

```
line x1={center-x} y1=305 x2={center-x} y2=335
```

**规则：箭头 y1 始终 = 起点行的底边 y，y2 始终 = 终点行的顶边 y。** 不要自由计算。

### 跨列虚线连接

在 R5（result）行水平连接相邻列：

```
左列 result 右边缘 → 中列 result 左边缘:
  line x1={左列result右边缘} y1=355 x2={中列result左边缘} y2=355
  标签文字放在连线中点上方 y=348 和下方 y=368
```

**中点 x = (x1+x2)/2。** 标签 text-anchor="middle"。

### 图例位置

```
右下角，R8 行，y 起始 = 508（R7 底边 486 + 22px 间距）
x 固定 = 650（在右列内容区内）
三项纵向排列，每项占 18px（rect 14px + 4px 间距）
```

### viewBox 高度计算

```
viewBox 高度 = legend 最底部 + 15px 余量
例：legend 终止 y=553 → viewBox 高度 = 568（取整到 570 或 580）
```

### 完整骨架（复制后填内容）

```html
<svg viewBox="0 0 900 580" xmlns="http://www.w3.org/2000/svg"
     style="font-family: 'Noto Sans SC', system-ui, sans-serif;">
  <defs>
    <marker id="arrow" viewBox="0 0 10 7" refX="10" refY="3.5"
      markerWidth="8" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#92400e"/>
    </marker>
    <marker id="arrow-accent" viewBox="0 0 10 7" refX="10" refY="3.5"
      markerWidth="8" markerHeight="6" orient="auto-start-reverse">
      <path d="M 0 0 L 10 3.5 L 0 7 z" fill="#b45309"/>
    </marker>
  </defs>

  <!-- R0: Title -->
  <text x="450" y="28" text-anchor="middle" font-size="17" font-weight="bold" fill="#3b2a1a">第 X 章 XXX — 知识地图</text>

  <!-- R1: Root -->
  <rect x="350" y="45" width="200" height="36" rx="8" fill="#fef9f0" stroke="#92400e" stroke-width="2.5"/>
  <text x="450" y="68" text-anchor="middle" font-size="14" font-weight="bold" fill="#3b2a1a">第 X 章 XXX</text>

  <!-- R1→R2 arrows -->
  <line x1="400" y1="81" x2="170" y2="115" stroke="#92400e" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="450" y1="81" x2="450" y2="115" stroke="#92400e" stroke-width="1.5" marker-end="url(#arrow)"/>
  <line x1="500" y1="81" x2="730" y2="115" stroke="#92400e" stroke-width="1.5" marker-end="url(#arrow)"/>

  <!-- R2: Section headers — 按列填入 -->
  <!-- 左列 section: center=170 -->
  <rect x="60" y="115" width="220" height="32" rx="6" fill="#fff4ed" stroke="#c2410c" stroke-width="2"/>
  <text x="170" y="136" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b2a1a">§X.1 XXX</text>

  <!-- 中列 section: center=450 -->
  <rect x="340" y="115" width="220" height="32" rx="6" fill="#fef9f0" stroke="#b45309" stroke-width="2"/>
  <text x="450" y="136" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b2a1a">§X.2 XXX</text>

  <!-- 右列 section: center=730 -->
  <rect x="620" y="115" width="220" height="32" rx="6" fill="#fef9f0" stroke="#b45309" stroke-width="2"/>
  <text x="730" y="136" text-anchor="middle" font-size="13" font-weight="bold" fill="#3b2a1a">§X.3 XXX</text>

  <!-- R3: Children — 每列最多 3 个，按需删除 -->
  <!-- 左列 children (centers: 50, 170, 290) -->
  <!-- 中列 children (centers: 380, 450, 520) 注意：380 和 520 与列边界留 10px -->
  <!-- 右列 children (centers: 660, 730, 800) -->

  <!-- R4, R5, R6, R7 按需添加，y 坐标查表取值 -->

  <!-- R8: Legend (y=508+) -->
  <rect x="650" y="508" width="14" height="14" rx="3" fill="#fff4ed" stroke="#c2410c" stroke-width="2"/>
  <text x="670" y="520" font-size="10" fill="#6b5441">PPT 考点</text>
  <rect x="650" y="526" width="14" height="14" rx="3" fill="#ede9fe" stroke="#7c3aed" stroke-width="2.5"/>
  <text x="670" y="538" font-size="10" fill="#6b5441">关键转折</text>
  <rect x="650" y="544" width="14" height="14" rx="3" fill="#fef9f0" stroke="#b45309" stroke-width="1.5"/>
  <text x="670" y="556" font-size="10" fill="#6b5441">普通节点</text>
</svg>
```

### 非三列（2 列或 4 列）

viewBox 宽度仍为 900。按列数等分：

| 列数 | 列 centers | 每列宽度 |
|---|---|---|
| 2 | 225, 675 | 400 |
| 3 | 170, 450, 730 | 260 |
| 4 | 130, 350, 570, 790 | 190 |

行定义不变。y 坐标通用。

---

## 图类型 B：推导链图（§3.3 末尾）

### 横向步进模板

viewBox `"0 0 {总宽} 120"`。每步一个节点，从左到右排列。

| 要素 | 值 |
|---|---|
| 节点高度 | 50px |
| 节点 y 范围 | y=35–85 |
| 步间距 | 节点宽度 + 30px |
| 箭头 | y1=60, y2=60（水平对齐）|
| 起始 x | 20 |

节点宽度按内容定（80–160），但 **相邻节点左边缘间距 = 前一个节点宽度 + 30px**。

关键转折节点用紫色高亮样式，两侧加 5px 的视觉呼吸空间（即 x 比普通间距多 5px）。

### 纵向步进模板

viewBox `"0 0 400 {总高}"`。每步从上到下。

| 要素 | 值 |
|---|---|
| 节点宽度 | 300px（居中 x=200）|
| 节点 x 范围 | x=50–350 |
| 步间距 | 节点高度 + 30px |
| 箭头 | x1=200, x2=200（垂直对齐）|
| 起始 y | 20 |

---

## 图类型 C：概念定位图（§3.4）

### 水平树模板

```
viewBox "0 0 700 200"

本概念: x=300, y=75, 宽=100, 高=50 (中心 350)
上游概念(左): x=50-150, y=50-100 (中心 100)
邻居概念(上/下): x=250-450, y=10-40 或 140-180
下游概念(右): x=500-650, y=50-100 (中心 575)

连线从源节点右边缘到目标节点左边缘（横向），
或从源节点上/下边缘到目标节点下/上边缘（纵向）。
```

---

## 图类型 D：过程图（§4 例题）

### 纵向步进模板（同推导链的纵向模板）

每步节点居中，宽度按最长的步骤内容定。步骤编号用左侧小圆标记：

```
<circle cx="25" cy="{step-center-y}" r="12" fill="#ede9fe" stroke="#7c3aed" stroke-width="1.5"/>
<text x="25" y="{step-center-y+4}" text-anchor="middle" font-size="11" font-weight="bold" fill="#7c3aed">{序号}</text>
```

节点 x 起始于 50，给左侧步骤编号留空间。

---

## 常见错误 & 修正

| 错误 | 原因 | 修正 |
|---|---|---|
| 相邻节点 x 重叠 | 手算宽度忘了加间距 | 用列模板，不要算绝对坐标 |
| 图例和节点重叠 | 图例 y 随意放 | 图例固定在 R8（y=508+），所有内容节点不超过 R7 |
| viewBox 高度不够 | 没算图例位置 | viewBox 高度 = 图例最底部 + 15px |
| 跨列虚线标签被遮挡 | 标签 y 和节点 y 一样 | 标签 y = 连线 y ± 7px，确认不与 result 节点重叠 |
| 箭头被 marker 遮挡 | marker 在节点 rect 下层 | SVG 后绘制的在上层，把箭头画在节点之前 |
