import { Download, FileText } from "lucide-react";

import CourseArticleView from "@/components/course-markdown/CourseArticleView";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { CourseMetadata } from "@/lib/course-markdown/parse-course-markdown";

type CourseOutlineAdminViewProps = {
  content: string;
  metadata: CourseMetadata;
  eyebrow: string;
  pdfUrl: string;
  downloadName: string;
};

export function CourseOutlineAdminView({ content, metadata, eyebrow, pdfUrl, downloadName }: CourseOutlineAdminViewProps) {
  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl space-y-6">
        <Card className="overflow-hidden rounded-[var(--radius-xl)]">
          <CardContent className="p-5 sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-3xl">
                <Badge>{eyebrow}</Badge>
                <h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">{metadata.title}</h1>
                {metadata.subtitle ? <p className="mt-3 text-sm leading-7 text-[var(--text-soft)]">{metadata.subtitle}</p> : null}
                <div className="mt-4 flex flex-wrap gap-2">{metadata.tags.map((tag) => <Badge key={tag} variant="secondary">{tag}</Badge>)}</div>
              </div>

              <div className="flex flex-col gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4 shadow-[var(--shadow-sm)] sm:flex-row sm:items-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><FileText size={20} /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--text)]">课程概要 PDF</p>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">可下载发送给学生或家长。</p>
                </div>
                <a href={pdfUrl} download={downloadName}>
                  <Button type="button" className="gap-2 whitespace-nowrap"><Download size={16} />下载 PDF</Button>
                </a>
              </div>
            </div>
          </CardContent>
        </Card>

        <CourseArticleView content={content} />
      </section>
    </main>
  );
}
