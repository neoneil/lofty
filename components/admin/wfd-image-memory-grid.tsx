import Image from "next/image";
import Link from "next/link";
import { ImageIcon } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";

export type WfdImageMemoryItem = {
  id: string;
  question_text: string;
  source_question_id: string | null;
  ai_image: string | null;
  created_at: string | null;
};

function chunkItems(items: WfdImageMemoryItem[], size: number) {
  const groups: WfdImageMemoryItem[][] = [];
  for (let index = 0; index < items.length; index += size) {
    groups.push(items.slice(index, index + size));
  }
  return groups;
}

export function WfdImageMemoryGrid({ items }: { items: WfdImageMemoryItem[] }) {
  const completedCount = items.filter((item) => Boolean(item.ai_image?.trim())).length;
  const groups = chunkItems(items, 10);

  return (
    <section className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-6">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Badge>WFD 图片记忆</Badge>
            <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">wfd图片记忆</h1>
            <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">按 WFD 活跃预测题展示 AI 记忆图片，有图片显示图片，没有图片显示占位。</p>
          </div>
          <div className="grid grid-cols-2 gap-2 text-sm sm:min-w-[260px]">
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--text-faint)]">总数</p>
              <p className="mt-1 text-xl font-bold text-[var(--text)]">{items.length}</p>
            </div>
            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
              <p className="text-xs font-semibold text-[var(--text-faint)]">已有图片</p>
              <p className="mt-1 text-xl font-bold text-[var(--primary)]">{completedCount}</p>
            </div>
          </div>
        </div>
      </div>

      {groups.map((group, groupIndex) => {
        const start = groupIndex * 10 + 1;
        const end = start + group.length - 1;
        const groupCompletedCount = group.filter((item) => Boolean(item.ai_image?.trim())).length;

        return (
          <section key={start} className="space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3 shadow-[var(--shadow-sm)]">
              <div>
                <h2 className="text-base font-bold text-[var(--text)]">第 {start}-{end} 张</h2>
                <p className="mt-1 text-xs font-medium text-[var(--text-faint)]">按生成展示顺序，每 10 张一组</p>
              </div>
              <Badge>{groupCompletedCount}/{group.length} 已生成</Badge>
            </div>
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {group.map((item, itemIndex) => {
                const imageUrl = item.ai_image ? normalizePublicStorageUrl(item.ai_image, "pte-images") : "";
                const displayIndex = start + itemIndex;

                return (
                  <Link key={item.id} href={`/pte/listening/wfd/${item.id}`} className="group overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)] [content-visibility:auto] [contain-intrinsic-size:26rem] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)]">
                    <div className="relative aspect-square bg-[var(--bg-soft)]">
                      {imageUrl ? (
                        <Image src={imageUrl} alt={item.question_text} fill sizes="(max-width: 768px) 100vw, (max-width: 1280px) 50vw, 33vw" className="object-cover transition duration-300 group-hover:scale-[1.02]" />
                      ) : (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-3 text-[var(--text-faint)]">
                          <span className="flex h-12 w-12 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border-strong)] bg-[var(--card)]">
                            <ImageIcon size={22} />
                          </span>
                          <span className="text-xs font-semibold uppercase tracking-[0.16em]">No Image</span>
                        </div>
                      )}
                      <div className="absolute left-3 top-3 flex flex-wrap gap-2">
                        <span className="rounded-full bg-[var(--card)]/90 px-2.5 py-1 text-xs font-bold text-[var(--text)] shadow-[var(--shadow-sm)]">{displayIndex}</span>
                        {item.source_question_id ? <span className="rounded-full bg-[var(--card)]/90 px-2.5 py-1 text-xs font-semibold text-[var(--text-soft)] shadow-[var(--shadow-sm)]">{item.source_question_id}</span> : null}
                      </div>
                    </div>
                    <div className="p-4">
                      <p className="line-clamp-2 min-h-[3rem] text-sm font-semibold leading-6 text-[var(--text)]">{item.question_text}</p>
                      <p className="mt-3 truncate font-mono text-[11px] text-[var(--text-faint)]">{item.id}</p>
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        );
      })}
    </section>
  );
}
