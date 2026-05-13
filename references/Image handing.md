# 图片路径处理指南

MinerU 转出的 markdown 里图片引用是相对于 md 文件本身的路径。我们的课件写到 `output/*.html`，图片引用要改写成从 `output/` 出发的相对路径。

---

## 0. 路径处理的总原则

**默认：路径仿写。** MinerU md 里写什么相对路径，你在前面加 `../raw/`（你的输出在 `output/`，退一级再进 `raw/`）就对。O(1)、确定性、不需要文件系统调用。

**仅当**仿写后的路径在磁盘上找不到对应文件时，才退化到搜索：

```bash
find raw -name "<filename>" -type f
```

搜得到 → 用搜出的路径加 `../` 前缀。搜不到 → 按第 6 节"图片缺失"处理。

**不要默认就跑全局搜索**——慢、且同名文件有歧义。

---

## 1. 标准情况

MinerU md 里写 `![图 4.1](assert/img-001.png)`。

在 HTML 课件里写：
```html
<figure>
  <img src="../raw/assert/img-001.png" alt="图 4.1">
  <figcaption>图 4.1：标题</figcaption>
</figure>
```

规则一句话：**MinerU 的相对路径前加 `../raw/`，包在 `<figure>` 里。**

保留原图的 alt 文字——那是作者的语言。加 `<figcaption>` 显示图号和标题。

---

## 2. 不同的资产文件夹名

不要硬编码 `assert/`。先 `ls raw/` 看实际文件夹叫什么（`assert/`、`assets/`、`images/`、`<book>_imgs/`），然后照着用。

---

## 3. 子目录嵌套

如果每本书有独立子目录：

```
raw/book-A/book-A.md → 引用 assert/img.png
```

从 `output/lesson.html` 出发：`../raw/book-A/assert/img.png`。

---

## 4. 共享 assert 文件夹

所有书的图片集中在 `raw/assert/`。MinerU md 里引用大概率是 `assert/xxx.jpg`。

改写：`../raw/assert/xxx.jpg`。

如果 MinerU 写的是 `../assert/xxx.jpg`（已经退了一级），要按实际计算——别机械加 `../raw/`。

---

## 5. 图片缺失

MinerU 提取失败时，md 里有引用但文件不存在。**先检查再写**：

```bash
ls raw/assert/<filename>
```

如果图丢了：
- **不要写**一个找不到文件的 `<img>`——浏览器显示破碎图标，比没有图还糟。
- 用文字明示："（原书图 X.Y——MinerU 提取此图失败，请直接看 PDF 第 N 页）"
- 用文字描述这张图在表达什么。

---

## 6. 扫描页 / 整页图

扫描版的整页图（`page-007.png`）正常嵌入，配文写清"以下为原书第 N 页（扫描）"。

---

## 7. PPT 导出的图

MinerU 处理 PPT 时每张幻灯片一张截图（`slide-005.png`）。PPT 的精读策略和书不同：逐张幻灯片而非逐字，§3 反而要更厚（补 PPT 略掉的推导）。

---

## 8. 自检

写完课件提交前：
- [ ] 所有 `<img src="...">` 路径都用 `../raw/` 前缀了吗？
- [ ] 在浏览器打开课件，每张图都正常显示吗？
- [ ] §1 清单里登记的"图 X.Y"都在 §4 里被实际嵌入了吗？
- [ ] 缺失的图有用文字明示并补全描述吗？