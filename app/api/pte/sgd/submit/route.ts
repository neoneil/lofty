import { submitKeywordSpeaking } from "@/lib/pte-speaking/submit-keyword-speaking";

export async function POST(req: Request) {
  return submitKeywordSpeaking(req, {
    questionTable: "sgd",
    questionType: "SGD",
    questionSource: "sgd",
    aiFeature: "pte_sgd",
    storageFolder: "sgd",
    contentFocus: "讨论中的核心主题、不同观点、关键细节和结论",
  });
}
