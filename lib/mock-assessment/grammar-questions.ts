import type { ChoiceQuestion } from "@/lib/mock-assessment/types";

export const grammarAssessmentQuestions: ChoiceQuestion[] = [
  {
    id: "grammar-1",
    prompt: "Had the policy been introduced earlier, the company ___ the current shortage.",
    options: ["might have avoided", "might avoid", "will have avoided", "had avoided"],
    answer: "might have avoided",
    explanation: "这是对过去情况的虚拟条件句，主句使用 might have + 过去分词。",
  },
  {
    id: "grammar-2",
    prompt: "The research team recommended that each participant ___ a written consent form.",
    options: ["sign", "signs", "signed", "has signed"],
    answer: "sign",
    explanation: "recommend that 后使用虚拟语气，动词采用原形。",
  },
  {
    id: "grammar-3",
    prompt: "Only after the data had been independently verified ___ the findings.",
    options: ["did the journal publish", "the journal published", "the journal did publish", "published the journal"],
    answer: "did the journal publish",
    explanation: "Only + 状语置于句首时，主句需要部分倒装。",
  },
  {
    id: "grammar-4",
    prompt: "The proposal, together with several supporting documents, ___ under review.",
    options: ["is", "are", "were", "have been"],
    answer: "is",
    explanation: "together with 不改变主语单复数，核心主语 proposal 为单数。",
  },
  {
    id: "grammar-5",
    prompt: "There is growing evidence ___ regular exercise can improve cognitive performance.",
    options: ["that", "which", "what", "where"],
    answer: "that",
    explanation: "that 引导同位语从句，说明 evidence 的具体内容。",
  },
];
