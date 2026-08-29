"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { CheckCircle2, Headphones, Maximize2, Play, Search, Sparkles, Volume2, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";
import { cn } from "@/lib/utils";
import type { PronunciationAsset, PronunciationCategory } from "@/lib/pronunciation/assets";
import { phonemicChartUrl, pronunciationCategoryLabels } from "@/lib/pronunciation/assets";

const categoryOrder: PronunciationCategory[] = ["short-vowels", "long-vowels", "diphthongs", "consonant-pairs"];
type ChartOverlayState = "closed" | "open" | "closing";
const CHART_CLOSE_ANIMATION_MS = 260;

function matchesSearch(item: PronunciationAsset, query: string) {
  if (!query.trim()) return true;
  const normalized = query.trim().toLowerCase();
  return [item.symbol, item.title, item.subtitle, ...item.exampleWords].join(" ").toLowerCase().includes(normalized);
}

export default function PronunciationClient({ assets }: { assets: PronunciationAsset[] }) {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [activeCategory, setActiveCategory] = useState<PronunciationCategory>("short-vowels");
  const [activeAssetId, setActiveAssetId] = useState(assets[0]?.id ?? "");
  const [autoPlayKey, setAutoPlayKey] = useState(0);
  const [search, setSearch] = useState("");
  const [playError, setPlayError] = useState("");
  const [chartOverlayState, setChartOverlayState] = useState<ChartOverlayState>("closed");

  const activeAsset = assets.find((item) => item.id === activeAssetId) ?? assets[0];
  const filteredAssets = useMemo(() => assets.filter((item) => item.category === activeCategory && matchesSearch(item, search)), [activeCategory, assets, search]);
  const categoryCounts = useMemo(() => Object.fromEntries(categoryOrder.map((category) => [category, assets.filter((item) => item.category === category).length])) as Record<PronunciationCategory, number>, [assets]);
  const chartIsMounted = chartOverlayState !== "closed";

  function selectAsset(item: PronunciationAsset) {
    setActiveAssetId(item.id);
    setActiveCategory(item.category);
    setPlayError("");
    setAutoPlayKey((value) => value + 1);
  }

  function openChartOverlay() {
    setChartOverlayState("open");
  }

  function closeChartOverlay() {
    setChartOverlayState("closing");
    window.setTimeout(() => setChartOverlayState("closed"), CHART_CLOSE_ANIMATION_MS);
  }

  useEffect(() => {
    if (!chartIsMounted) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") closeChartOverlay();
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [chartIsMounted]);

  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1850px] flex-col gap-6 px-4 py-6 lg:px-6">
        <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="grid gap-0 lg:grid-cols-[minmax(0,1.15fr)_minmax(360px,0.85fr)]">
            <div className="relative overflow-hidden border-b border-[var(--border)] p-5 sm:p-7 lg:border-b-0 lg:border-r">
              <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.16),transparent_36%),linear-gradient(135deg,rgba(20,184,166,0.10),transparent_38%)]" />
              <div className="relative">
                <Badge className="mb-4 w-fit gap-1.5"><Sparkles size={13} />Pronunciation Studio</Badge>
                <h1 className="max-w-3xl text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">发音训练</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">点击音标或发音项目即可播放 R2 音频。页面使用静态资源渲染，适合 IELTS / PTE 学生做基础音素、弱读与易混音训练。</p>
                <div className="mt-5 grid gap-3 sm:grid-cols-3">
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="text-2xl font-bold text-[var(--text)]">{assets.length}</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-[var(--text-faint)]">Audio clips</div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="text-2xl font-bold text-[var(--success)]">4</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-[var(--text-faint)]">Sound groups</div>
                  </div>
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="text-2xl font-bold text-[var(--primary)]">R2</div>
                    <div className="mt-1 text-xs font-semibold uppercase text-[var(--text-faint)]">Static media</div>
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-[var(--bg-soft)] p-4 sm:p-5">
              <button type="button" onClick={openChartOverlay} className="group relative block w-full overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-left shadow-[var(--shadow-xs)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-md)]" aria-label="Open phonemic chart">
                <Image src={phonemicChartUrl} alt="English phonemic chart" width={1000} height={762} className="h-auto w-full object-contain" priority />
                <span className="absolute right-3 top-3 inline-flex items-center gap-2 rounded-full border border-[var(--border)] bg-[var(--card)]/95 px-3 py-2 text-xs font-bold text-[var(--text)] shadow-[var(--shadow-sm)] backdrop-blur transition group-hover:border-[var(--primary)]/40 group-hover:text-[var(--primary)]">
                  <Maximize2 size={14} />
                  Phonemic Chart
                </span>
              </button>
            </div>
          </div>
        </section>

        <section className="grid gap-6 xl:grid-cols-[320px_minmax(0,1fr)_420px]">
          <Card className="h-fit border-[var(--border)] bg-[var(--card)]">
            <CardContent className="p-4">
              <div className="mb-4 flex items-center gap-2">
                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Headphones size={17} /></span>
                <div>
                  <h2 className="text-base font-bold text-[var(--text)]">训练分类</h2>
                  <p className="text-xs text-[var(--text-soft)]">按音素类型快速切换</p>
                </div>
              </div>
              <div className="space-y-2">
                {categoryOrder.map((category) => {
                  const meta = pronunciationCategoryLabels[category];
                  const active = activeCategory === category;
                  return (
                    <button key={category} type="button" onClick={() => setActiveCategory(category)} className={cn("w-full rounded-[var(--radius-md)] border p-3 text-left transition", active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]")}>
                      <span className="flex items-center justify-between gap-3">
                        <span>
                          <span className="block text-sm font-bold text-[var(--text)]">{meta.label}</span>
                          <span className="mt-0.5 block text-xs text-[var(--text-faint)]">{meta.english}</span>
                        </span>
                        <span className="rounded-full bg-[var(--card)] px-2 py-1 text-xs font-semibold text-[var(--text-soft)]">{categoryCounts[category]}</span>
                      </span>
                      <span className="mt-2 block text-xs leading-5 text-[var(--text-soft)]">{meta.description}</span>
                    </button>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          <Card className="border-[var(--border)] bg-[var(--card)]">
            <CardContent className="p-4 sm:p-5">
              <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h2 className="text-lg font-bold text-[var(--text)]">{pronunciationCategoryLabels[activeCategory].label}</h2>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">{pronunciationCategoryLabels[activeCategory].description}</p>
                </div>
                <div className="relative w-full sm:w-72">
                  <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" />
                  <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="搜索音标 / 单词" className="h-10 pl-9" />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-2 2xl:grid-cols-3">
                {filteredAssets.map((item) => {
                  const active = activeAsset?.id === item.id;
                  return (
                    <button key={item.id} type="button" onClick={() => selectAsset(item)} className={cn("group flex min-h-[154px] flex-col rounded-[var(--radius-md)] border p-4 text-left transition", active ? "border-[var(--primary)] bg-[var(--primary-soft)] shadow-[var(--shadow-md)]" : "border-[var(--border)] bg-[var(--bg-soft)] hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-sm)]")}>
                      <span className="flex items-start justify-between gap-3">
                        <span className="text-3xl font-black leading-none text-[var(--text)]">{item.symbol}</span>
                        <span className={cn("flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] transition", active ? "bg-[var(--primary)] text-white" : "bg-[var(--card)] text-[var(--primary)] group-hover:bg-[var(--primary-soft)]")}><Play size={16} fill="currentColor" /></span>
                      </span>
                      <span className="mt-3 text-sm font-bold text-[var(--text)]">{item.title}</span>
                      <span className="mt-1 line-clamp-2 text-xs leading-5 text-[var(--text-soft)]">{item.subtitle}</span>
                      <span className="mt-auto flex flex-wrap gap-1.5 pt-3">
                        {item.exampleWords.map((word) => <span key={word} className="rounded-full border border-[var(--border)] bg-[var(--card)] px-2 py-0.5 text-[11px] font-semibold text-[var(--text-soft)]">{word}</span>)}
                      </span>
                    </button>
                  );
                })}
              </div>
              {filteredAssets.length === 0 ? <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-8 text-center text-sm text-[var(--text-soft)]">没有找到匹配的发音项目。</div> : null}
            </CardContent>
          </Card>

          <Card className="h-fit overflow-hidden border-[var(--border)] bg-[var(--card)] xl:sticky xl:top-24">
            <CardContent className="p-0">
              <div className="border-b border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <Badge variant="secondary" className="mb-3 w-fit gap-1.5"><Volume2 size={13} />Now Playing</Badge>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="text-4xl font-black text-[var(--text)]">{activeAsset?.symbol}</div>
                    <h2 className="mt-2 text-lg font-bold text-[var(--text)]">{activeAsset?.title}</h2>
                    <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{activeAsset?.subtitle}</p>
                  </div>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--success-soft)] text-[var(--success)]"><CheckCircle2 size={20} /></span>
                </div>
              </div>
              <div className="space-y-4 p-5">
                {activeAsset ? <SecureAudioPlayer ref={audioRef} src={activeAsset.audioUrl} title={`${activeAsset.symbol} ${activeAsset.title}`} description="点击左侧项目会自动播放，也可以在这里手动控制。" autoPlay={autoPlayKey > 0} autoPlayKey={autoPlayKey} preload="metadata" showMeta onPlayError={() => setPlayError("浏览器阻止了自动播放，请点击播放按钮。")} /> : null}
                {playError ? <div className="rounded-[var(--radius-md)] border border-[var(--warning)]/30 bg-[var(--warning-soft)] p-3 text-sm font-semibold text-[var(--warning)]">{playError}</div> : null}
                <div>
                  <div className="mb-2 text-xs font-semibold uppercase text-[var(--text-faint)]">Example words</div>
                  <div className="flex flex-wrap gap-2">
                    {activeAsset?.exampleWords.map((word) => <span key={word} className="rounded-full bg-[var(--primary-soft)] px-3 py-1 text-xs font-bold text-[var(--primary)]">{word}</span>)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </section>
      </div>

      {chartIsMounted ? (
        <div className={cn("fixed inset-0 z-[110] flex items-center justify-center bg-black/72 p-3 backdrop-blur-sm sm:p-6", chartOverlayState === "closing" ? "animate-pronunciation-chart-backdrop-out" : "animate-pronunciation-chart-backdrop-in")} role="dialog" aria-modal="true" aria-label="Phonemic Chart">
          <div className={cn("relative max-h-[calc(100dvh-1.5rem)] w-full max-w-6xl overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border-strong)] bg-[var(--card)] shadow-[var(--shadow-lg)] sm:max-h-[calc(100dvh-3rem)]", chartOverlayState === "closing" ? "animate-pronunciation-chart-close" : "animate-pronunciation-chart-open")}>
            <div className="flex items-center justify-between gap-4 border-b border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 sm:px-5">
              <div>
                <div className="text-sm font-bold text-[var(--text)]">Phonemic Chart</div>
                <p className="mt-0.5 text-xs text-[var(--text-soft)]">点击关闭后会回到右上角预览位置</p>
              </div>
              <button type="button" onClick={closeChartOverlay} className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] shadow-[var(--shadow-xs)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--text)]" aria-label="Close phonemic chart">
                <X size={19} />
              </button>
            </div>
            <div className="max-h-[calc(100dvh-6.75rem)] overflow-auto bg-[var(--card)] p-3 sm:max-h-[calc(100dvh-8.25rem)] sm:p-5">
              <Image src={phonemicChartUrl} alt="English phonemic chart full screen" width={1600} height={1220} className="mx-auto h-auto w-full max-w-5xl rounded-[var(--radius-md)] object-contain" priority />
            </div>
          </div>
        </div>
      ) : null}

      <style jsx global>{`
        @keyframes pronunciation-chart-backdrop-in {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }

        @keyframes pronunciation-chart-backdrop-out {
          from {
            opacity: 1;
          }
          to {
            opacity: 0;
          }
        }

        @keyframes pronunciation-chart-open {
          from {
            opacity: 0;
            transform: translate(36vw, -36vh) scale(0.22);
          }
          to {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
        }

        @keyframes pronunciation-chart-close {
          from {
            opacity: 1;
            transform: translate(0, 0) scale(1);
          }
          to {
            opacity: 0;
            transform: translate(36vw, -36vh) scale(0.22);
          }
        }

        .animate-pronunciation-chart-backdrop-in {
          animation: pronunciation-chart-backdrop-in 220ms ease-out both;
        }

        .animate-pronunciation-chart-backdrop-out {
          animation: pronunciation-chart-backdrop-out ${CHART_CLOSE_ANIMATION_MS}ms ease-in both;
        }

        .animate-pronunciation-chart-open {
          animation: pronunciation-chart-open 320ms cubic-bezier(0.22, 1, 0.36, 1) both;
          transform-origin: top right;
        }

        .animate-pronunciation-chart-close {
          animation: pronunciation-chart-close ${CHART_CLOSE_ANIMATION_MS}ms cubic-bezier(0.4, 0, 1, 1) both;
          transform-origin: top right;
        }
      `}</style>
    </div>
  );
}
