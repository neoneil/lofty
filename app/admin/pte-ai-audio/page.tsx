import { PteAiAudioGeneratorClient } from "@/components/admin/pte-ai-audio/pte-ai-audio-generator-client";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import { PTE_AI_AUDIO_MODEL, PTE_AI_AUDIO_VOICES } from "@/lib/pte-ai-audio/voices";

export default async function PteAiAudioAdminPage() {
  await requireAdminOrEditor("/admin/pte-ai-audio");

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden rounded-[var(--radius-lg)]">
          <CardContent className="p-5 sm:p-7">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
              <div>
                <Badge>PTE Audio</Badge>
                <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">PTE 四音色音频生成</h1>
                <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">逐条新增 RS / WFD 预测题，自动生成 OpenAI TTS 四音色音频，上传到 R2，并更新 Supabase 音频字段。</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
                <span className="font-semibold text-[var(--text)]">{PTE_AI_AUDIO_VOICES.length}</span> voices · {PTE_AI_AUDIO_MODEL}
              </div>
            </div>
          </CardContent>
        </Card>

        <PteAiAudioGeneratorClient />
      </section>
    </main>
  );
}
