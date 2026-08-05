import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, BookOpenText, FileText } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { getGeneratedVocabularyDocument } from "@/lib/vocabulary/generated";

type PageProps = {
  params: Promise<{ slug: string }>;
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat("zh-CN", { year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date(value));
}

export default async function GeneratedVocabularyDetailPage({ params }: PageProps) {
  const { slug } = await params;
  const document = await getGeneratedVocabularyDocument(slug);
  if (!document) notFound();
  const isTextOnly = document.vocabulary.length === 0;

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-4 text-[var(--text)] sm:px-6 lg:px-8">
      <div className="mx-auto w-full max-w-7xl space-y-5">
        <Link href="/vocabulary" className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--text-soft)] transition hover:text-[var(--primary)]">
          <ArrowLeft size={16} />
          返回词汇中心
        </Link>

        <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-7">
          <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <Badge variant="secondary">{document.category}</Badge>
              <h1 className="mt-3 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">{document.title}</h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">{document.summary}</p>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:min-w-[320px]">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"><BookOpenText size={14} />Words</div>
                <div className="mt-2 text-2xl font-bold text-[var(--text)]">{document.vocabulary.length}</div>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-soft)]"><FileText size={14} />Updated</div>
                <div className="mt-2 text-sm font-bold text-[var(--text)]">{formatDate(document.updatedAt)}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {document.sourceFiles.map((file) => <Badge key={file.fileName} variant="outline">{file.fileName}</Badge>)}
          </div>
        </section>

        {isTextOnly ? (
          <Card className="rounded-[var(--radius-lg)]">
            <CardContent className="p-5 sm:p-6">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-bold text-[var(--text)]">提取文字</h2>
                  <p className="mt-1 text-sm text-[var(--text-soft)]">图片或文档已转成可复制文本。</p>
                </div>
                <Badge variant="secondary">{document.rawText.length} chars</Badge>
              </div>
              <pre className="max-h-[720px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 text-sm leading-7 text-[var(--text)]">{document.rawText}</pre>
            </CardContent>
          </Card>
        ) : (
          <section className="grid gap-4 lg:grid-cols-2">
            {document.vocabulary.map((item) => (
            <Card key={item.term} className="rounded-[var(--radius-md)]">
              <CardContent className="p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-xl font-bold text-[var(--text)]">{item.term}</h2>
                    <p className="mt-1 text-sm font-semibold text-[var(--primary)]">{item.chineseMeaning || item.partOfSpeech}</p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <Badge variant="secondary">{item.partOfSpeech}</Badge>
                    <Badge>{item.difficulty}</Badge>
                  </div>
                </div>
                {item.englishDefinition ? <p className="mt-4 text-sm leading-7 text-[var(--text-soft)]">{item.englishDefinition}</p> : null}
                {item.example ? <p className="mt-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 text-sm leading-7 text-[var(--text)]">{item.example}</p> : null}
                {item.collocations.length > 0 ? <div className="mt-4 flex flex-wrap gap-2">{item.collocations.map((phrase) => <Badge key={phrase} variant="outline">{phrase}</Badge>)}</div> : null}
                {item.sourceContext ? <p className="mt-4 text-xs leading-6 text-[var(--text-faint)]">Context: {item.sourceContext}</p> : null}
              </CardContent>
            </Card>
            ))}
          </section>
        )}

        {!isTextOnly ? (
          <details className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <summary className="cursor-pointer text-sm font-bold text-[var(--text)]">查看提取原文</summary>
            <pre className="mt-4 max-h-[520px] overflow-auto whitespace-pre-wrap rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-4 text-xs leading-6 text-[var(--text-soft)]">{document.rawText}</pre>
          </details>
        ) : null}
      </div>
    </main>
  );
}
