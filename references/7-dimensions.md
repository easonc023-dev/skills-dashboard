# 7 维度技能框架

## 概述

每个合格的 SKILL.md 都回答 7 个问题。缺任何一个维度，都会产生盲区。

维度 1-2 定义技能的身份和边界。维度 3-5 定义行为。维度 6-7 定义质量门。

---

## 维度 1：元数据 (Metadata)

- **核心问题**: 我是谁？AI 什么时候该读我？什么时候该跳过？
- **在 SKILL.md 中的位置**: YAML frontmatter（`name` + `description` 字段）
- **brand-guidelines 例子**:
  ```yaml
  name: brand-guidelines
  description: "Applies Anthropic's official brand colors and typography to any sort of artifact..."
  ```
- **为什么重要**: 这是 AI 在决定是否触发技能前**唯一看到的内容**。如果描述模糊，技能永远不会被触发。
- **常犯错误**: 描述写了技能"是什么"，却没写"什么时候触发"。description 必须同时包含"干什么 + 触发时机"。

---

## 维度 2：边界 (Boundary)

- **核心问题**: 我管什么？明确不管什么？有什么前置条件？
- **在 SKILL.md 中的位置**: 正文第一段（概述 / 范围）
- **brand-guidelines 例子**:
  ```
  It covers colors and fonts only. It does NOT handle layout,
  animation, illustration style, or voice & tone.
  ```
- **为什么重要**: 没有明确的边界，技能会越界干不该干的，或试图做它做不了的事。
- **常犯错误**: 只列"管什么"，没有"不管什么"。边界 = 管什么 + 不管什么 + 前置条件，三者缺一不可。

---

## 维度 3：流程 (Process)

- **核心问题**: 分几步做？每步：输入是什么 → 做什么 → 输出什么 → 下一步去哪？
- **在 SKILL.md 中的位置**: `## Execution Steps` / `## 执行步骤`
- **brand-guidelines 例子**:
  ```
  Step 1: Determine the artifact type.
    → If unknown → ask user "What format are you outputting to?"
  Step 2: Select color roles.
    → If high-contrast context → use white text on dark background
  ```
- **为什么重要**: AI 需要决策树，不是散文。分支逻辑（if→then）防止 AI 在不确定时瞎猜。
- **常犯错误**: 把步骤写成平铺的清单，没有条件分支。每一步都应该是"输入→处理→输出→判断"的完整闭环。

---

## 维度 4：工具 (Tools)

- **核心问题**: 靠什么干活？精确到文件名、色值、URL、命令？
- **在 SKILL.md 中的位置**: `## Color Palette` / `## Tools` / `## Scripts` / 数据表
- **brand-guidelines 例子**:
  ```
  | Role    | Hex     | Usage          |
  | Primary | #141413 | Headings, body |
  | CTA     | #f59e0b | Buttons, links |
  ```
- **为什么重要**: 精确数据消除歧义。"深灰色"没用，`#141413` 才是可执行的。给 AI 越精确的原料，输出越一致。
- **常犯错误**: 模糊描述工具，而不是列出精确的文件名、色值、命令。告诉 AI "用某个工具"不如告诉它"运行 `python scripts/helper.py`"。

---

## 维度 5：容错 (Fallback)

- **核心问题**: 每种可能的失败都有 B 方案吗？出错了怎么办？
- **在 SKILL.md 中的位置**: `## Fallback Strategy` / `## 异常处理` / 流程中的 if→else
- **brand-guidelines 例子**:
  ```
  - Poppins unavailable → fall back to Arial
  - Primary color contrast fails → switch to black text
  ```
- **为什么重要**: 没有容错方案，AI 遇到意外会默默产出坏结果或直接卡住。每个外部依赖（字体、API、文件）都需要备选方案。
- **常犯错误**: 假设一切正常。其实字体可能没装、API 可能超时、文件可能不存在——每一样都该有"万一……那就……"。

---

## 维度 6：评测 (Evaluation)

- **核心问题**: 怎么证明做好了？能写成可验证的是/非题吗？
- **在 SKILL.md 中的位置**: `## Verification Checklist`
- **brand-guidelines 例子**:
  ```
  - [ ] Are all headings in Poppins?
  - [ ] Are all CTAs using #f59e0b?
  - [ ] Do colors pass WCAG AA contrast ratio?
  ```
- **为什么重要**: 主观判断（"好看吗？"）没法验证。客观是非题（"按钮颜色是 #f59e0b 吗？"）才是可验证的。
- **常犯错误**: 写了需要审美判断的检查项（"看起来专业吗？"），而不是事实性检查（"字体是 Poppins 吗？"）。

---

## 维度 7：验证 (Verification)

- **核心问题**: 输出在真实环境里能用吗？结果可复现吗？跨环境一致吗？
- **在 SKILL.md 中的位置**: `## Post-Output Validation` / `## 最终验证`
- **brand-guidelines 例子**:
  ```
  - Output file opens correctly in target application
  - Brand colors render identically across Chrome / Safari / Firefox
  - Text contrast ≥ 4.5:1 when measured with a contrast checker
  ```
- **为什么重要**: 维度 6 检查"我按规范做了吗"，维度 7 检查"做出来的东西能用吗"。一个问过程，一个问结果。两者不同。
- **常犯错误**: 把验证和评测混为一谈。评测 = 自查过程，验证 = 外部检查结果。技能需要两个都写。

---

## 维度互锁关系

| 维度组 | 包含 | 作用 |
|--------|------|------|
| 身份层 (1-2) | 元数据 + 边界 | 定义技能是谁、管什么、不管什么 |
| 行为层 (3-5) | 流程 + 工具 + 容错 | 定义技能怎么干活、用什么干、出问题怎么办 |
| 质量层 (6-7) | 评测 + 验证 | 定义怎么算干好、怎么证明结果正确 |

- 缺维度 2 → 技能在不该触发的时候触发
- 缺维度 5 → 遇到意外时默默失败
- 缺维度 7 → 输出看起来正确但实际不能用
- 三个层都写满 → 技能在任何情况下都有明确行为，不会让 AI 猜