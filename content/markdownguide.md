# Markdown Specification

> Lofty Course Markdown 语法规范 v1.0

本文档定义 Lofty 课程支持的 Markdown 扩展语法。以后所有课程（PTE、IELTS、Grammar、Vocabulary 等）均应遵循本规范生成 Markdown。

---

# 1. Front Matter

每个课程文件必须以 YAML Front Matter 开头。

```yaml
---
id:
title:
subtitle:
course:
module:
question_type:
lesson:
mode:
difficulty:
duration:
estimated_read_time:
author:
tags:
cover:
video:
quiz:
published:
updated:
---
```

其中：

* `mode` 支持 `article` 或 `slides`，默认 `article`。
* `tags` 使用数组格式。
* `published` 使用 `true / false`。

---

# 2. 课程模式

## Article

```yaml
mode: article
```

适用于连续阅读、知识库、长篇课程。

## Slides

```yaml
mode: slides
```

适用于分页课程，支持缩略图、键盘翻页和底部导航。

---

# 3. Slide 分页

使用下面的分隔符创建新页面：

```html
<!-- slide -->
```

例如：

```markdown
第一页内容

<!-- slide -->

第二页内容

<!-- slide -->

第三页内容
```

---

# 4. Admonition（课程卡片）

统一格式：

```markdown
> [!TYPE]
> 内容
```

支持类型：

* GOAL
* KEYPOINT
* NOTE
* TIP
* WARNING
* COMMON-MISTAKE
* INFO
* SUCCESS
* QUESTION
* SUMMARY
* EXAMPLE
* HOMEWORK

示例：

```markdown
> [!GOAL]
> 本节课学习目标。
```

---

# 5. Highlight（重点高亮）

语法：

```markdown
==重点内容==
```

用于：

* 考试重点
* 定义
* 核心结论
* 重要规则

---

# 6. 彩色文字

支持以下颜色：

```text
{red}内容{/red}
{green}内容{/green}
{yellow}内容{/yellow}
{blue}内容{/blue}
{purple}内容{/purple}
```

建议：

* red：错误、警告
* green：正确表达
* yellow：考试重点
* blue：知识点
* purple：高级表达

---

# 7. Badge

语法：

```text
[badge: Beginner]
```

例如：

```text
[badge: Beginner]
[badge: High Frequency]
[badge: PTE Speaking]
```

---

# 8. Divider

普通 Markdown 分隔线：

```markdown
---
```

系统会自动渲染为 Lofty Divider，无需额外语法。

---

# 9. Animation

动画格式：

```markdown
> [!ANIMATE:动画名称]
> 内容
```

支持：

* fade-in
* slide-up
* zoom-in
* highlight
* typing

未知动画类型将自动降级为普通 NOTE 卡片。

---

# 10. 标准 Markdown

除上述扩展外，完整支持标准 Markdown，包括：

* 标题（#、##、###）
* 粗体、斜体
* 无序列表
* 有序列表
* Checkbox
* 引用
* 表格
* 图片
* 链接
* 代码块

---

# 11. 完整示例

```markdown
---
title: Read Aloud Lesson 01
mode: slides
lesson: 1
difficulty: beginner
published: true
---

# 什么是 Read Aloud？

欢迎来到 **PTE Speaking**。

> [!GOAL]
> 学会 RA 的评分标准。

==Fluency 比 Pronunciation 更重要==

{red}不要逐词朗读{/red}

[badge: Beginner]

<!-- slide -->

# 常见错误

> [!COMMON-MISTAKE]
> 不要停顿过长。

> [!WARNING]
> 不要回读。

<!-- slide -->

# Homework

> [!HOMEWORK]
> - [ ] 练习 5 遍
> - [ ] 录音一次
```
