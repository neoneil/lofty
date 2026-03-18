"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type TarotReadingPanelProps = {
  reading: string;
  loading?: boolean;
};

export default function TarotReadingPanel({
  reading,
  loading,
}: TarotReadingPanelProps) {
  return (
    <div className="rounded-[28px] border border-white/10 bg-white/5 p-6 backdrop-blur">
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-white">AI 解读</h2>
        {loading ? (
          <span className="text-sm text-purple-200/80">正在生成中...</span>
        ) : null}
      </div>

      {loading && !reading ? (
        <div className="space-y-3">
          <div className="h-4 w-2/3 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-full animate-pulse rounded bg-white/10" />
          <div className="h-4 w-5/6 animate-pulse rounded bg-white/10" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-white/10" />
        </div>
      ) : (
        <div className="prose prose-invert max-w-none prose-headings:text-white prose-p:text-purple-50/90 prose-strong:text-white prose-li:text-purple-50/90">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {reading || "抽出三张牌后，这里会显示 AI 解读结果。"}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
}
