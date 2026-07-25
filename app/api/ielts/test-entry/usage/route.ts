import { NextResponse } from "next/server";

import { reserveAiUsage, getAiLimitResponse, recordAiUsage } from "@/lib/ai/usage-limit";
import { getIeltsMarkdownBookPracticeData } from "@/lib/ielts/markdown-practice";
import { getIeltsTestEntryModel, hasIeltsTestEntryUsage, IELTS_TEST_ENTRY_FEATURE_BY_MODULE, isIeltsTestEntryModule } from "@/lib/ielts/test-entry-usage";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  let body: { moduleType?: unknown; bookNumber?: unknown; testNumber?: unknown };

  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ ok: false, message: "请求内容无效" }, { status: 400 });
  }

  const moduleType = String(body.moduleType ?? "");
  const bookNumber = Number(body.bookNumber);
  const testNumber = Number(body.testNumber);

  if (!isIeltsTestEntryModule(moduleType) || !Number.isFinite(bookNumber) || !Number.isFinite(testNumber)) {
    return NextResponse.json({ ok: false, message: "IELTS test 信息无效" }, { status: 400 });
  }

  const practiceData = await getIeltsMarkdownBookPracticeData(bookNumber, testNumber);
  const testExists = Boolean(practiceData.book && practiceData.tests.some((item) => item.test_number === testNumber));

  if (!testExists) {
    return NextResponse.json({ ok: false, message: "IELTS test 不存在" }, { status: 404 });
  }

  const feature = IELTS_TEST_ENTRY_FEATURE_BY_MODULE[moduleType];
  const model = getIeltsTestEntryModel(moduleType, bookNumber, testNumber);
  const existingUsage = await hasIeltsTestEntryUsage({ userId: user.id, moduleType, bookNumber, testNumber });

  if (existingUsage) {
    return NextResponse.json({ ok: true, reused: true });
  }

  const usageLimit = await reserveAiUsage(user.id, feature);

  if (!usageLimit.allowed) {
    return NextResponse.json(getAiLimitResponse(usageLimit), { status: 403 });
  }

  await recordAiUsage({
    userId: user.id,
    feature,
    model,
    status: "success",
  });

  return NextResponse.json({ ok: true });
}
