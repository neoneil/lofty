import { submitKeywordSpeaking } from "@/lib/pte-speaking/submit-keyword-speaking";

export async function POST(req: Request) {
  return submitKeywordSpeaking(req, {
    questionTable: "rl",
    questionType: "RL",
    questionSource: "rl",
    aiFeature: "pte_rl",
    storageFolder: "rl",
    contentFocus: "录音中的核心主题、人物、事件和关键细节",
  });
}
