import { submitKeywordSpeaking } from "@/lib/pte-speaking/submit-keyword-speaking";

export async function POST(req: Request) {
  return submitKeywordSpeaking(req, {
    questionTable: "di",
    questionType: "DI",
    questionSource: "di",
    aiFeature: "pte_di",
    storageFolder: "di",
    contentFocus: "图表中的数字、趋势、对象和极值",
  });
}
