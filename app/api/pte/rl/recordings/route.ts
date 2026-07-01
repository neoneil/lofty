import { NextRequest } from "next/server";

import { getSpeakingRecordings } from "@/lib/pte-speaking/get-speaking-recordings";

export async function GET(req: NextRequest) {
  return getSpeakingRecordings(req, { questionType: "RL", questionSource: "rl" });
}
