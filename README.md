# Skills Dashboard · 技能仪表盘

> 把散落在 `.claude/skills/` 里的 SKILL.md 变成一张可搜索、可筛选、可展开探索的 HTML 仪表盘。
> Turn scattered SKILL.md files into a searchable, filterable, expandable HTML dashboard.

---

## 这解决什么问题？ · What Problem Does This Solve?

Claude Code 的技能越装越多，到最后自己都记不清有哪些。打开 `.claude/skills/` 目录，几十个文件夹——哪个是干嘛的？什么时候触发？能解决什么问题？

Skills pile up fast. Before you know it, your `.claude/skills/` directory has dozens of folders — which one does what? When does it trigger? What problem does it actually solve?

这个项目做一件事：**把全部技能扫一遍，生成一张暖色笔记本风格的 HTML 页面**，每个技能一张可展开的卡片，7 个维度说清楚 —— 从"我是谁"一路问到"产出能不能用"。

This project does exactly one thing: **scan every skill you have and generate a warm-notebook-themed HTML page**, with an expandable card per skill covering 7 dimensions — from "who am I?" all the way to "does the output actually work?"

---

## 效果预览 · Preview

打开 `skills-dashboard.html`，一个 3 Tab 的页面：
Open `skills-dashboard.html` and you get a 3-tab page:

| Tab | 内容 · Content |
|-----|----------------|
| 我的技能库 · My Skills | 卡片网格，搜索/分类筛选，点击展开查看 7 维度详情 — Card grid, search & filter by category, click to expand all 7 dimensions |
| 什么是 Skill？ · What's a Skill? | 7 维度框架教学 + brand-guidelines 源码逐行解读 + 填空模板 — 7-dimension framework deep-dive + annotated source walkthrough + fill-in-the-blank template |
| 技能教程 · Tutorial | 3 种加载方法 + 7 步创建新技能清单 — 3 ways to load skills + 7-step checklist to create one |

暖色笔记本主题 —— 米色纸、格线底纹、衬线标题。不搞"AI 塑料感"。
Warm notebook aesthetic — beige paper, grid-line texture, serif headings. Deliberately avoiding AI-slop aesthetics.

---

## 7 维度分析框架 · The 7-Dimension Framework

这套框架是我在打磨这个项目的过程中总结出来的。每个合格的 SKILL.md 都应该回答 7 个问题：
I distilled this framework while iterating on this project. Every well-written SKILL.md should answer 7 questions:

| # | 维度 · Dimension | 问什么 · Core Question |
|---|------------------|------------------------|
| 1 | 元数据 · Metadata | 我是谁？什么时候触发？Who am I? When should I be triggered? |
| 2 | 边界 · Boundary | 管什么？不管什么？What do I handle? What do I NOT handle? |
| 3 | 流程 · Process | 分几步？每步输入→输出→决策？What are the steps? Input → Action → Output → Decision? |
| 4 | 工具 · Tools | 靠什么干活？精确到文件名、色值、命令？What concrete resources? Files, values, commands? |
| 5 | 容错 · Fallback | 失败了怎么办？有 B 方案吗？What if something fails? Is there a Plan B? |
| 6 | 评测 · Evaluation | 怎么证明做好了？能写成是/非题吗？How to prove it's done right? Can it be a yes/no checklist? |
| 7 | 验证 · Verification | 产出在真实环境里能用吗？Does the output actually work in the real world? |

维度 1-2 定义**身份和边界**，3-5 定义**行为**，6-7 定义**质量门**。缺维度 2 会在不对的场合触发，缺维度 5 碰见意外就默默失败，缺维度 7 产出看起来对但实际不能用。
Dimensions 1-2 define **identity and scope**. 3-5 define **behavior**. 6-7 define **quality gates**. Miss dimension 2 → fires in wrong contexts. Miss dimension 5 → fails silently. Miss dimension 7 → output looks right but is broken.

---

## 架构：3 个文件 · 零依赖 · Architecture: 3 Files, Zero Dependencies

```
你的项目目录/                    ← Your project folder
├── skills-dashboard.html        ← 在浏览器打开这个 · Open this in a browser
├── generate-skills-data.js      ← Node.js 脚本（零依赖），跑一次就行 · Run once, zero deps
└── skills-data.js               ← 脚本自动生成 · Auto-generated (window.__SKILLS_DATA__ = {...})
```

`generate-skills-data.js` 是核心引擎：扫描 `~/.claude/skills/`，解析每个 SKILL.md 的 YAML 和 Markdown，应用三层翻译流水线（手写中文 > 短语词典 > 保留英文），输出 `skills-data.js`。HTML 侧零逻辑 —— 纯加载数据、渲染、交互。

`generate-skills-data.js` is the engine: it scans `~/.claude/skills/`, parses each SKILL.md's YAML frontmatter and Markdown body, applies a three-tier translation pipeline (hand-written Chinese > phrase dictionary > keep English original), and outputs `skills-data.js`. The HTML side has zero logic — just loads data, renders, handles interaction.

---

## 快速开始 · Quick Start

```bash
# 1. 复制模板到你的目录 · Copy templates to your project folder
cp templates/* your-project-folder/

# 2. 运行数据生成脚本（零依赖，纯 Node.js 内置模块）
#    Run the generation script (zero deps, Node.js built-ins only)
node generate-skills-data.js

# 3. 在浏览器打开 · Open in browser
open skills-dashboard.html
```

脚本跑完会打印一行统计：`51 个技能, 16 个分类, 3 个来源` —— 看一眼就知道对不对。
The script prints a one-line summary: `51 skills, 16 categories, 3 sources` — you know at a glance if it's right.

---

## 预填数据 · Pre-Filled Data

模板脚本里已经预填了这些数据，别人拿到手跑一次就能出全中文仪表盘：
The template script ships with all of this pre-filled. Anyone who runs it gets a fully localized dashboard immediately:

- **ENRICHMENTS**: 19+ 个技能的 7 维度中文描述 · 19+ skills with Chinese 7-dimension descriptions
- **BUILTIN_SKILLS**: 8 个 Claude Code 系统技能 · 8 Claude Code system skills
- **LARK_SKILLS_MAP**: 24 个技能的分类/场景/工具映射 · 24 skills with category/scenario/tool mappings
- **PHRASE_DICT**: 50+ 条英文→中文短语词典（自动翻译后备）· 50+ English→Chinese phrase pairs as translation fallback

如果你有自己独特的中文技能，往 `ENRICHMENTS` 里加一条就行。
Have your own custom skills? Add one entry to `ENRICHMENTS` and you're done.

---

## 迭代过程（元教训）· The Iterative Journey (A Meta-Lesson)

这个仪表盘本身经历了 8+ 轮迭代才到满意版本。回头看，一上来不可能想清楚所有细节：
This dashboard itself went through 8+ iterations before reaching its current form. In hindsight, you can't possibly nail every detail upfront:

1. 6 维度原型 → 2. 中文翻译 → 3. 自动翻译后备 → 4. 第 7 维度分离 → 5. Tab 2 重写 → 6. 维度顺序修正 → 7. 自动刷新机制 → 8. 卡片动画 + 最终打磨
1. 6-dimension prototype → 2. Chinese translation → 3. Auto-translation fallback → 4. 7th dimension split → 5. Tab 2 rewrite → 6. Dimension ordering fix → 7. Auto-refresh mechanism → 8. Card animations + final polish

这里面有一个 meta 道理：**做技能仪表盘本身，就是一个技能工程的练习。** 生成脚本是引擎，花时间打磨 enrichment 数据和分类逻辑，仪表盘就自动变好。

The meta-lesson here: **building a skills dashboard is itself a skill-engineering exercise.** The generation script is the engine — invest time in enrichment data and categorization logic, and the dashboard improves automatically.

---

## 自定义 · Customization

- **换颜色/风格 · Change colors/style**：改 HTML 里 `:root` 的 CSS 变量 — Edit the CSS custom properties in `:root`
- **换整个主题 · Redesign the whole look**：搭配 `theme-factory` 或 `frontend-design` 技能 — Invoke `theme-factory` or `frontend-design`
- **加新技能的中文描述 · Add Chinese descriptions**：编辑 `generate-skills-data.js` 里的 `ENRICHMENTS` — Edit `ENRICHMENTS` in the generation script
- **技能变更后 · After skill changes**：重跑 `node generate-skills-data.js`，刷新浏览器 — Re-run the script, refresh the browser

---

## License

MIT — 随便用、改、商用，保留署名即可。Use, modify, and sell freely — just keep the attribution.