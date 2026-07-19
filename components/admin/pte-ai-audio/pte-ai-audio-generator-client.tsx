"use client";

import { useState } from "react";
import { AudioLines, Loader2, Wand2 } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Textarea } from "@/components/ui-v2/textarea";

type QuestionType = "rs" | "wfd";

type ApiResult = {
  ok?: boolean;
  message?: string;
  result?: {
    questionId?: string;
  };
};

export function PteAiAudioGeneratorClient() {
  const [questionType, setQuestionType] = useState<QuestionType>("rs");
  const [questionText, setQuestionText] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const generate = async () => {
    setLoading(true);
    setMessage("");

    try {
      const response = await fetch("/api/admin/pte-ai-audio/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questionType, questionText }),
      });
      const json = (await response.json()) as ApiResult;

      if (!response.ok || !json.ok) {
        throw new Error(json.message || "生成失败");
      }

      setQuestionText("");
      setMessage(`题目已新增，四音色已生成并上传 R2。Question ID：${json.result?.questionId ?? "-"}`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "生成失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grid gap-4 lg:grid-cols-[0.9fr_1.1fr]">
      <Card className="rounded-[var(--radius-lg)]">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><AudioLines size={20} /></span>
            <div>
              <h2 className="text-lg font-bold text-[var(--text)]">生成设置</h2>
              <p className="text-sm text-[var(--text-soft)]">每题生成 Marin / Cedar / Alloy / Ash 四个声音。</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant={questionType === "rs" ? "primary" : "secondary"} onClick={() => setQuestionType("rs")}>RS</Button>
            <Button type="button" size="sm" variant={questionType === "wfd" ? "primary" : "secondary"} onClick={() => setQuestionType("wfd")}>WFD</Button>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-semibold text-[var(--text)]">新增句子</label>
            <Textarea value={questionText} onChange={(event) => setQuestionText(event.target.value)} placeholder={questionType === "rs" ? "输入一条 RS 句子，例如：The lecture today focuses on renewable energy." : "输入一条 WFD 句子，例如：Students should submit their assignments before the deadline."} className="min-h-36 resize-y rounded-[var(--radius-md)] border-[var(--border)] bg-[var(--card)] text-[var(--text)] placeholder:text-[var(--text-faint)]" />
            <p className="text-xs leading-6 text-[var(--text-soft)]">保存后默认写入 <span className="font-semibold text-[var(--text)]">is_prediction = true</span>，并立即生成 Marin / Cedar / Alloy / Ash 四个声音。</p>
            <Button type="button" disabled={loading || !questionText.trim()} onClick={generate} className="gap-2">{loading ? <Loader2 size={16} className="animate-spin" /> : <Wand2 size={16} />}新增并生成四音色</Button>
          </div>

          {message ? <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-semibold text-[var(--text)]">{message}</div> : null}
        </CardContent>
      </Card>

      <Card className="rounded-[var(--radius-lg)] border-[var(--primary)]/20 bg-[var(--primary-soft)]/20">
        <CardContent className="space-y-4 p-5 sm:p-6">
          <Badge>R2 Path</Badge>
          <h2 className="text-lg font-bold text-[var(--text)]">固定路径规则</h2>
          <div className="space-y-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 font-mono text-xs leading-6 text-[var(--text-soft)]">
            <p>pte-audio/PTE/speaking/RS/&lt;question_id&gt;/marin.mp3</p>
            <p>pte-audio/PTE/speaking/RS/&lt;question_id&gt;/cedar.mp3</p>
            <p>pte-audio/PTE/listening/WFD/&lt;question_id&gt;/alloy.mp3</p>
            <p>pte-audio/PTE/listening/WFD/&lt;question_id&gt;/ash.mp3</p>
          </div>
          <p className="text-sm leading-7 text-[var(--text-soft)]">生成成功后，题目详情页会默认随机播放一个声音；用户也可以手动选择指定声音。未生成的题仍然回退旧音频。</p>
        </CardContent>
      </Card>
    </div>
  );
}
