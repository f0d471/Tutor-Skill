# 图片路径处理指南

MinerU 转出的 markdown 里图片引用是相对于 md 文件本身的路径。当我们把讲解写到 `output/` 时，必须改写这些路径，**否则 Obsidian 渲染不出图，整份课件就降级成"纯文字版"——这违反 SKILL.md 第 2 条硬性规则**。

这份指南覆盖各种边界情况。

---

## 0. 路径处理的总原则

**默认：路径仿写。** MinerU md 里写什么相对路径，你在前面加 `../raw/`（你的输出在 `output/`，要退一级再进 `raw/`）就对。这是 O(1)、确定性、不需要文件系统调用的做法。

**仅当**仿写后的路径在磁盘上找不到对应文件（MinerU 路径里有错别字、unicode 问题、或图片真的没被提取出来），才退化到第二步：

```bash
# 在 raw/ 下按文件名找
find raw -name "<filename>" -type f
```

如果搜得到，把搜出的路径加 `../` 前缀写进课件。如果搜不到，按本文件第 6 节"图片缺失"处理。

**不要默认就跑全局搜索** —— 它慢、且同名文件存在时有歧义。仿写优先，搜索兜底。

---

## 1. 标准情况

**项目结构：**
```
project/
├── raw/
│   ├── book.md            ← 这里
│   └── assert/
│       └── img-001.png    ← 实际图片
└── output/
    └── lesson.md          ← 你写到这里
```

**MinerU md 里的引用：**
```markdown
![图 4.1](assert/img-001.png)
```

这个路径是相对于 `raw/book.md` 的。从 `raw/book.md` 出发，`assert/img-001.png` 解析为 `raw/assert/img-001.png`。

**改写到你的 lesson.md：**
```markdown
![图 4.1](../raw/assert/img-001.png)
```

从 `output/lesson.md` 出发，`../raw/assert/img-001.png` 解析为 `raw/assert/img-001.png`，路径正确。

**改写规则一句话：**
> 把 MinerU md 引用里的相对路径前面加上 `../raw/`。

---

## 2. 不同的资产文件夹名

用户写的是 `assert`（这个名字其实是错别字，正确英文是 `asset`），但有人会用：

| 文件夹名 | 来源 |
|---|---|
| `assert/` | 用户原话用的名字（asset 的常见手滑） |
| `assets/` | MinerU 默认 |
| `images/` | 部分工具 |
| `<book-name>_imgs/` | MinerU 多文档模式 |

**做法：** 不要硬编码文件夹名。**先 `ls raw/` 看实际有什么**，然后照着用。

```bash
ls raw/
# 如果看到 assert/，路径前缀就是 ../raw/assert/
# 如果看到 assets/，路径前缀就是 ../raw/assets/
```

更稳的做法：直接读 MinerU md 的前 50 行，看图片引用长什么样，然后把那个路径前缀加上 `../raw/`。

---

## 3. 子目录嵌套（每本书有自己的图片目录）

部分 MinerU 配置会给每本书一个独立子文件夹：

```
raw/
├── book-A/
│   ├── book-A.md
│   └── assert/
│       └── img-001.png
└── book-B/
    ├── book-B.md
    └── assert/
        └── img-001.png
```

book-A.md 里的引用还是 `![](assert/img-001.png)`（相对它自己的位置），但从 `output/lesson.md` 看路径要改成：

```markdown
![](../raw/book-A/assert/img-001.png)
```

**规则同上**：在 MinerU 的相对路径前面加上"从 output/ 到 md 文件所在目录的相对路径"。

---

## 4. 共享 assert 文件夹（你说的情况）

你描述的是：所有书的图片**都集中**在 `raw/assert/` 里。这种情况下 MinerU 输出的 md 里引用大概率是：

```markdown
![](assert/some-img.jpg)
```

或者 MinerU 用了绝对一点的相对路径：

```markdown
![](../assert/some-img.jpg)
```

具体是哪种，**读 md 头部看一眼就知道**，不要猜。

改写做法：

| MinerU 写的 | 你改成 |
|---|---|
| `![](assert/x.jpg)` | `![](../raw/assert/x.jpg)` |
| `![](./assert/x.jpg)` | `![](../raw/assert/x.jpg)` |
| `![](../assert/x.jpg)` | `![](../raw/assert/x.jpg)`（已经退一级了，再加上 `../raw/` 不对——这种情况下原路径是相对于 raw/ 的子目录，要按实际计算） |

最后一种情况罕见但值得警惕——如果遇到，老老实实手算一遍：MinerU 的 md 在哪？图片实际在哪？从 output/lesson.md 出发的相对路径是什么？算清楚再写。

---

## 5. 如果使用 Obsidian Wiki 链接

Obsidian 也支持 wiki 风格图片引用：

```markdown
![[img-001.png]]
```

这种引用要求图片在 vault 里被 Obsidian 索引。如果用户的 vault 根目录是项目目录，且没有指定特殊的 attachment folder，Obsidian 会自动找到 `raw/assert/img-001.png`。

**默认仍然用 markdown 标准语法 `![](../raw/assert/xxx.png)`** ——它最稳，跨工具兼容性最好（GitHub 预览、VS Code 预览也能渲染）。仅当用户明确要求 wiki 链接时再用 `![[...]]`。

---

## 6. 图片缺失的情况

有时候 MinerU 提取失败，md 里有 `![](assert/x.png)` 但 `raw/assert/` 里其实没有 `x.png`（被识别失败、被跳过、文件名 unicode 出问题）。

**先检查再写**。在写 §4 那一节之前：

```bash
ls raw/assert/ | head -50
# 或针对性检查
ls raw/assert/<filename>
```

如果图丢了：
- **不要写**一个找不到文件的 `![](...)`——Obsidian 渲染出一个红叉，比没有图还糟。
- 用文字明示这件事："（原书图 X.Y——MinerU 提取此图失败，请直接看 PDF 第 N 页）"
- 然后**用文字详细描述**这张图在表达什么，让用户哪怕只看你的描述也能跟上推理。

---

## 7. 扫描页 / 整页图

有些书是扫描版，MinerU 会把整页当图片提取，文件名往往是 `page-007.png` 这种。**这种图不是"图 X.Y"，是整页**。引用时用相对路径正常嵌入，但配文要写清"以下为原书第 N 页（扫描）："。

如果整章都是扫描页，逐字精读会很苦——因为你拿不到可搜索的文字。这种情况下：
- 在 §1 清单里如实标"本章为扫描版，无可机读文本"。
- §4 改成"图—文"模式：贴一页扫描，写下你从图里读出的这一页大意，然后扣关键句讲。
- 提醒用户：如果想要更高质量的精读，可以考虑对扫描页跑一次 OCR 把文字弄出来。

---

## 8. PPT 导出的 md（每张幻灯片一节）

MinerU 处理 PPT 时通常一张幻灯片产出一节 md，每节内嵌幻灯片截图：

```markdown
## 第 5 张

![](assert/slide-005.png)

幻灯片标题：…
正文：…
```

**对待 PPT 的精读策略和书略不同**：PPT 的"原文"密度远低于书，所以 §4 不是"逐字"，而是"逐张幻灯片"——每张图都嵌进来，把上面的要点扣讲，并补全 PPT 略掉的中间推理（PPT 经常只列结论不列推导，§3 第一性原理在 PPT 类材料里**反而要更厚**，因为要补 PPT 没讲的）。

---

## 9. 自检 checklist

写完一份课件要 commit / 给用户看之前，做一遍这个自检：

- [ ] 课件里所有 `![](...)` 路径都用 `../raw/` 前缀了吗？
- [ ] 在 Obsidian 里打开这份课件，每张图都能渲染出来吗？（可以让用户帮你确认一次）
- [ ] §1 清单里登记的"图 X.Y"，是否都在 §4 里被实际嵌入了？（清单和实际不能对不上）
- [ ] 缺失的图有用文字明示并补全描述吗？

第一份课件出来时建议**让用户在 Obsidian 里开一下确认能渲染**——一次性把路径模式确认下来，后面所有课件都安全了。