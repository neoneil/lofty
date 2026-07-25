import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { WfdImageMemoryGrid, type WfdImageMemoryItem } from "@/components/admin/wfd-image-memory-grid";
import wfdImageMemoryOrder from "@/data/wfd-image-memory-order.json";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";

export const dynamic = "force-dynamic";

const generatedOrder = new Map((wfdImageMemoryOrder as string[]).map((id, index) => [id, index]));

export default async function WfdImageMemoryAdminPage() {
  await requireAdminOrEditor("/admin/wfd-image-memory");
  const supabase = createAdminClient();

  const { data, error } = await supabase
    .schema("pte")
    .from("wfd")
    .select("id, question_text, source_question_id, ai_image, created_at")
    .eq("is_prediction", true)
    .order("created_at", { ascending: false })
    .order("source_question_id", { ascending: true });

  const items = [...((data ?? []) as WfdImageMemoryItem[])].sort((first, second) => {
    const firstHasImage = Boolean(first.ai_image?.trim());
    const secondHasImage = Boolean(second.ai_image?.trim());

    if (firstHasImage !== secondHasImage) return firstHasImage ? -1 : 1;
    if (!firstHasImage || !secondHasImage) return 0;

    const firstOrder = generatedOrder.get(first.id) ?? Number.MAX_SAFE_INTEGER;
    const secondOrder = generatedOrder.get(second.id) ?? Number.MAX_SAFE_INTEGER;

    if (firstOrder !== secondOrder) return firstOrder - secondOrder;
    return 0;
  });

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-6 text-[var(--text)] sm:px-6 sm:py-8 lg:px-8">
      <section className="mx-auto max-w-7xl space-y-5">
        <Link href="/admin" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]"><ArrowLeft size={16} />返回管理中心</Link>
        {error ? (
          <div className="rounded-[var(--radius-lg)] border border-[color:var(--danger)]/30 bg-[var(--danger-soft)] p-5 text-sm text-[var(--danger)]">WFD 图片记忆加载失败：{error.message}</div>
        ) : (
          <WfdImageMemoryGrid items={items} />
        )}
      </section>
    </main>
  );
}
