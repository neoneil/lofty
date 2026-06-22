import { NextResponse } from "next/server";

import { checkAiUsageLimit } from "@/lib/ai/usage-limit";
import { createClient } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return NextResponse.json({ ok: false, message: "未登录" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const feature = searchParams.get("feature") || "ai_feedback";
  const limit = await checkAiUsageLimit(user.id, feature);

  return NextResponse.json({
    ok: true,
    allowed: limit.allowed,
    code: limit.allowed ? null : limit.code,
    message: limit.allowed ? null : limit.message,
    is_unlimited: limit.isUnlimited,
    today_used: limit.todayUsed,
    daily_limit: limit.dailyLimit,
    month_used: limit.monthUsed,
    monthly_limit: limit.monthlyLimit,
  });
}
