"use client";

import { useMemo, useState } from "react";
import TarotCard from "@/components/tarot/tarot-card";
import TarotDeck from "@/components/tarot/tarot-deck";
import TarotReadingPanel from "@/components/tarot/tarot-reading-panel";
import { majorArcana } from "@/lib/tarot/major-arcana";
import { drawThreeCards } from "@/lib/tarot/draw";
import type { DrawnTarotCard } from "@/types/tarot";

export default function TarotClient() {
  const cardsSource = useMemo(() => majorArcana, []);
  const [question, setQuestion] = useState("");
  const [drawnCards, setDrawnCards] = useState<DrawnTarotCard[]>([]);
  const [reading, setReading] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleDraw() {
    const nextCards = drawThreeCards(cardsSource);
    setDrawnCards(nextCards);
    setReading("");
    setLoading(true);

    try {
      const res = await fetch("/api/tarot-reading", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question,
          cards: nextCards,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data?.error || "Failed to generate reading.");
      }

      setReading(data.reading ?? "");
    } catch (error) {
      console.error(error);
      setReading(
        error instanceof Error
          ? `解读生成失败：${error.message}`
          : "解读生成失败，请稍后再试。"
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,rgba(110,80,180,0.32),transparent_28%),linear-gradient(180deg,#0a0813_0%,#120d22_55%,#0b0815_100%)] text-white">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-8 max-w-3xl">
          <p className="mb-2 text-sm uppercase tracking-[0.35em] text-purple-200/70">
            Tarot Reading
          </p>
          <h1 className="text-4xl font-semibold tracking-tight sm:text-5xl">
            三张塔罗牌解读
          </h1>
          <p className="mt-4 text-base leading-7 text-purple-100/80">
            输入你的问题，抽取过去、现在、未来三张牌，由 AI 为你生成一份温和而清晰的中文解读。
          </p>
        </div>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1.15fr_1fr_220px]">
          <section className="space-y-6">
            <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
              <label className="mb-3 block text-sm font-medium text-purple-100">
                你的问题
              </label>
              <textarea
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                placeholder="例如：我接下来三个月的感情发展会怎样？"
                className="min-h-30 w-full rounded-2xl border border-white/10 bg-black/20 px-4 py-3 text-white outline-none placeholder:text-purple-200/40 focus:border-purple-300/40"
              />
              <div className="mt-4 flex flex-wrap gap-3">
                <button
                  onClick={handleDraw}
                  disabled={loading}
                  className="rounded-full bg-white px-5 py-3 text-sm font-semibold text-black transition hover:scale-[1.02] hover:bg-purple-100 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? "正在抽牌..." : "抽三张牌"}
                </button>

                <button
                  onClick={() => {
                    setQuestion("");
                    setDrawnCards([]);
                    setReading("");
                    setLoading(false);
                  }}
                  className="rounded-full border border-white/15 px-5 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/10"
                >
                  重置
                </button>
              </div>
            </div>

            <TarotReadingPanel reading={reading} loading={loading} />
          </section>

          <section className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-xl font-semibold">你的三张牌</h2>
              <span className="text-sm text-purple-200/75">过去 / 现在 / 未来</span>
            </div>

            {drawnCards.length === 0 ? (
              <div className="flex min-h-105 items-center justify-center rounded-3xl border border-dashed border-white/10 text-center text-purple-100/60">
                点击“抽三张牌”后，牌会显示在这里
              </div>
            ) : (
              <div className="flex min-h-105 flex-wrap items-center justify-center gap-4">
                {drawnCards.map((card, index) => (
                  <TarotCard key={`${card.id}-${card.position}`} card={card} index={index} />
                ))}
              </div>
            )}
          </section>

          <aside className="flex items-center justify-center lg:justify-end">
            <TarotDeck disabled={loading} />
          </aside>
        </div>
      </div>
    </div>
  );
}
