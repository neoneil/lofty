import { submitKeywordSpeaking } from "@/lib/pte-speaking/submit-keyword-speaking";

export async function POST(req: Request) {
  return submitKeywordSpeaking(req, {
    questionTable: "rts",
    questionType: "RTS",
    questionSource: "rts",
    aiFeature: "pte_rts",
    storageFolder: "rts",
    contentFocus: "对话中的情境、人物关系、核心问题和回应要点",
  });
}
