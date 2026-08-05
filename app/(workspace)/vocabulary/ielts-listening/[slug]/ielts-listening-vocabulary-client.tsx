"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Headphones, Loader2, Search, Star, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Input } from "@/components/ui-v2/input";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";
import type { IeltsListeningVocabularyDocument, IeltsListeningVocabularyItem, IeltsListeningVocabularyScene } from "@/lib/vocabulary/ielts-listening-types";

type Props = {
  document: IeltsListeningVocabularyDocument;
};

type SignedAudioState = {
  key: string;
  url: string;
  loading: boolean;
  error: string;
};

function getItemSearchText(item: IeltsListeningVocabularyItem, scene: IeltsListeningVocabularyScene) {
  return [item.term, item.translation, item.itemType, scene.title, scene.sectionTitle, item.raw].join(" ").toLowerCase();
}

function chunkItems(items: IeltsListeningVocabularyItem[]) {
  const chunkSize = Math.ceil(items.length / 3) || 1;
  return [items.slice(0, chunkSize), items.slice(chunkSize, chunkSize * 2), items.slice(chunkSize * 2)];
}

function VocabularyTable({ items, scene }: { items: IeltsListeningVocabularyItem[]; scene: IeltsListeningVocabularyScene }) {
  return (
    <div className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
      <table className="w-full table-fixed border-collapse text-left">
        <colgroup>
          <col className="w-9" />
          <col />
          <col className="w-16" />
          <col className="w-[28%]" />
        </colgroup>
        <tbody className="divide-y divide-[var(--border)]">
          {items.map((item, index) => (
            <tr key={`${scene.sceneCode}-${item.number}-${item.term}`} className={`transition hover:bg-[var(--primary-soft)]/40 ${index % 2 === 0 ? "bg-[var(--card)]" : "bg-[var(--bg-soft)]"}`}>
              <td className="px-2.5 py-2 align-top text-xs font-bold tabular-nums text-[var(--primary)]">{item.number}</td>
              <td className="px-2.5 py-2 align-top text-sm font-bold leading-6 text-[var(--text)]">
                <div className="flex min-w-0 items-center gap-1.5">
                  {item.starred ? <Star size={12} className="shrink-0 fill-[var(--warning)] text-[var(--warning)]" /> : null}
                  <span className="truncate">{item.term}</span>
                </div>
              </td>
              <td className="px-2 py-2 align-top text-xs font-semibold leading-6 text-[var(--text-faint)]">{item.itemType}</td>
              <td className="px-2.5 py-2 align-top text-sm leading-6 text-[var(--text-soft)]">{item.translation || "-"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function IeltsListeningVocabularyClient({ document }: Props) {
  const [activeSceneId, setActiveSceneId] = useState(document.scenes[0]?.id ?? "");
  const [searchTerm, setSearchTerm] = useState("");
  const [phrasesOnly, setPhrasesOnly] = useState(false);
  const [audioState, setAudioState] = useState<SignedAudioState>({ key: "", url: "", loading: false, error: "" });

  const activeScene = document.scenes.find((scene) => scene.id === activeSceneId) ?? document.scenes[0];
  const keyword = searchTerm.trim().toLowerCase();

  const filteredItems = useMemo(() => {
    const items = activeScene?.items ?? [];
    return items.filter((item) => {
      if (phrasesOnly && item.itemType !== "Phrase") return false;
      if (!keyword) return true;
      return getItemSearchText(item, activeScene).includes(keyword);
    });
  }, [activeScene, keyword, phrasesOnly]);

  const itemColumns = useMemo(() => chunkItems(filteredItems), [filteredItems]);

  useEffect(() => {
    const key = activeScene?.audio?.r2Key ?? "";
    if (!key) {
      setAudioState({ key: "", url: "", loading: false, error: "" });
      return;
    }

    let cancelled = false;
    setAudioState({ key, url: "", loading: true, error: "" });

    fetch(`/api/storage/private-url?key=${encodeURIComponent(key)}`, { cache: "no-store" })
      .then(async (response) => {
        const payload = await response.json().catch(() => null);
        if (!response.ok || !payload?.ok || !payload?.url) throw new Error(payload?.message || "音频签名失败");
        if (!cancelled) setAudioState({ key, url: payload.url, loading: false, error: "" });
      })
      .catch((error) => {
        if (!cancelled) setAudioState({ key, url: "", loading: false, error: error instanceof Error ? error.message : "音频加载失败" });
      });

    return () => {
      cancelled = true;
    };
  }, [activeScene?.audio?.r2Key]);

  return (
    <main className="min-h-screen bg-[var(--bg)] px-3 py-3 text-[var(--text)] sm:px-5 lg:px-6">
      <div className="mx-auto w-full max-w-[1500px] space-y-3">
        <section className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-3 shadow-[var(--shadow-sm)] sm:px-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="min-w-0">
              <Link href="/vocabulary" className="mb-1 inline-flex items-center gap-1.5 text-xs font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
                <ArrowLeft size={14} />
                词汇中心
              </Link>
              <div className="flex flex-wrap items-center gap-2">
                <h1 className="text-xl font-bold leading-7 text-[var(--text)] sm:text-2xl">{document.title}</h1>
                <Badge>IELTS Listening</Badge>
                <Badge variant="secondary">{document.wordCount} words</Badge>
                <Badge variant="secondary">{document.sceneCount} scenes</Badge>
                <Badge variant="secondary">{document.audioCount} audios</Badge>
              </div>
              <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{document.subtitle}</p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant="outline">{activeScene?.sectionTitle ?? "Section"}</Badge>
              <Badge variant="outline">{activeScene?.sceneCode ?? "Scene"}</Badge>
              <Badge variant="outline">{filteredItems.length} / {activeScene?.itemCount ?? 0}</Badge>
              {keyword ? <Badge variant="outline">Search: {searchTerm.trim()}</Badge> : null}
            </div>
          </div>
        </section>

        <section className="grid gap-3 lg:grid-cols-[minmax(0,1fr)_420px]">
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
            <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5">
              {document.scenes.map((scene) => (
                <button key={scene.id} type="button" onClick={() => setActiveSceneId(scene.id)} className={`min-h-[46px] rounded-[var(--radius-sm)] border px-2 py-1.5 text-center transition ${activeScene?.id === scene.id ? "border-[var(--primary)] bg-[var(--primary-soft)] text-[var(--primary)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"}`}>
                  <span className="block truncate text-[11px] font-bold leading-4">{scene.title}</span>
                  <span className="block text-[10px] font-semibold leading-4 text-[var(--text-faint)]">{scene.sceneCode} · {scene.itemCount}词</span>
                </button>
              ))}
            </div>

            <div className="mt-3 flex flex-col gap-2 border-t border-[var(--border)] pt-3 sm:flex-row sm:items-center sm:justify-end">
              <Button type="button" variant={phrasesOnly ? "primary" : "secondary"} size="sm" onClick={() => setPhrasesOnly((value) => !value)} className="h-8 justify-center px-3 text-xs">
                <Star size={13} />
                短语
              </Button>
              <div className="relative w-full sm:w-[280px]">
                <Search size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />
                <Input value={searchTerm} onChange={(event) => setSearchTerm(event.target.value)} placeholder="Search word or meaning..." className="h-8 pl-9 text-xs" />
                {searchTerm ? (
                  <button type="button" onClick={() => setSearchTerm("")} className="absolute right-2 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="Clear search">
                    <X size={13} />
                  </button>
                ) : null}
              </div>
            </div>
          </div>

          <aside className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 shadow-[var(--shadow-sm)]">
            <div className="mb-3 flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]"><Headphones size={14} />Scene Audio</div>
                <h2 className="mt-1 text-lg font-bold text-[var(--text)]">{activeScene?.title ?? "场景音频"}</h2>
                <p className="mt-1 text-xs leading-5 text-[var(--text-soft)]">{activeScene?.subtitle}</p>
              </div>
              {audioState.loading ? <Loader2 size={18} className="mt-1 animate-spin text-[var(--primary)]" /> : <Badge variant="outline">{activeScene?.audio?.fileName ? "已关联" : "待补充"}</Badge>}
            </div>

            {activeScene?.audio ? (
              audioState.error ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/30 bg-[var(--danger-soft)] p-3 text-sm leading-6 text-[var(--danger)]">{audioState.error}</div>
              ) : (
                <SecureAudioPlayer src={audioState.url || undefined} title={`${activeScene.title} 词汇音频`} description={activeScene.audio.fileName} preload="none" compact />
              )
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm text-[var(--text-soft)]">这个场景的音频还没有上传。</div>
            )}
          </aside>
        </section>

        <section className="grid gap-2 lg:grid-cols-2 2xl:grid-cols-3">
          {activeScene ? itemColumns.map((items, index) => items.length > 0 ? <VocabularyTable key={`${activeScene.sceneCode}-${index}`} items={items} scene={activeScene} /> : null) : null}
        </section>

        {filteredItems.length === 0 ? (
          <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配词条。</div>
        ) : null}

        <div className="h-8" />
      </div>
    </main>
  );
}
