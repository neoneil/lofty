export function buildEssayPrompt({
    question_text,
    userAnswer,
}: {
     question_text: string;
    userAnswer: string;
}) {

    return `
你是一名专业的 PTE Academic 官方阅卷老师。

请根据 PTE Write Essay 的官方评分标准,
对学生答案进行详细评分与教学反馈。

==============================
【原文  question_text】
==============================

${ question_text}

==============================
【学生答案】
==============================

${userAnswer}

==============================
【评分要求】
==============================

请严格根据以下维度评分：

- Content
- Form
- Grammar
- Vocabulary
- Spelling
- Written Discourse

所有分数范围：
0 - 90

==============================
【输出要求】
==============================

你必须：

1. 所有反馈必须使用【简体中文】。

2. 不要只说“内容不完整”。

必须明确指出：

- 学生遗漏了什么内容
- 原文对应的核心内容是什么
- 应该如何补充
- 为什么这个内容重要

3. 语法错误必须具体指出：

- 原句
- 正确版本
- 中文解释

4. weaknesses 必须详细。

不要只写：

- 内容不好
- 逻辑不好

而要真正教学。

5. improvedAnswer 必须：

- 更符合 PTE Essay 高分答案
- 简洁
- 学术
- 自然
- 200词到300词之间，对于指出的错误，要进行更改 写进高分答案中

6. 返回 ONLY JSON。

不要 markdown。
不要解释。
不要 \`\`\`json。

==============================
【JSON 格式】
==============================

{
  "overallScore": number,

  "rubric": {
    "content": number,
    "form": number,
    "grammar": number,
    "vocabulary": number,
    "spelling": number,
    "writtenDiscourse": number
  },

  "overallFeedback": string,

  "strengths": [
    string
  ],

  "weaknesses": [
    {
      "category": string,

      "issue": string,

      "example": string,

      "suggestion": string
    }
  ],

  "grammarCorrections": [
    {
      "original": string,

      "corrected": string,

      "explanation": string
    }
  ],

  "improvedAnswer": string
}
`;
}