import { BookOpenCheck, FileAudio, FileText, LockKeyhole, Sparkles } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import type { CambridgeIeltsDownloadBook } from "@/lib/ielts/cambridge-downloads";

function formatFileSize(sizeBytes: number | null) {
  if (!sizeBytes) return null;
  const units = ["B", "KB", "MB", "GB"];
  let size = sizeBytes;
  let unitIndex = 0;
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024;
    unitIndex += 1;
  }
  return `${size.toFixed(unitIndex === 0 ? 0 : 1)} ${units[unitIndex]}`;
}

function DownloadLink({ href, download, children, variant = "primary" }: { href: string; download: string; children: React.ReactNode; variant?: "primary" | "secondary" }) {
  return (
    <a href={href} download={download} target="_blank" rel="noreferrer" className={variant === "primary" ? "inline-flex h-10 items-center justify-center gap-2 rounded-[var(--radius-md)] bg-[var(--primary)] px-4 text-sm font-semibold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]" : "inline-flex h-9 items-center justify-center gap-2 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 text-xs font-semibold text-[var(--text)] transition hover:border-[var(--primary)]/40 hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"}>
      {children}
    </a>
  );
}

function DisabledPartButton({ label }: { label: string }) {
  return (
    <span className="inline-flex h-9 items-center justify-center rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-3 text-xs font-semibold text-[var(--text-faint)]">
      {label} 待补
    </span>
  );
}

export function CambridgeIeltsDownloadCenter({ books }: { books: CambridgeIeltsDownloadBook[] }) {
  const audioBookCount = books.filter((book) => book.audioTests.length > 0).length;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="grid gap-0 lg:grid-cols-[1.4fr_0.9fr]">
          <div className="p-6 sm:p-8">
            <Badge variant="default">Cambridge IELTS</Badge>
            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">剑桥雅思下载</h1>
            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">登录学生可下载剑桥雅思 04-21 PDF版本与听力音频，按 Test 和 Part 拆分下载，后续资料等待补齐。</p>
            <div className="mt-6 flex flex-wrap gap-2">
              <Badge variant="secondary">截至2026年， 剑桥雅思04-21</Badge>
              <Badge variant="success">听力音频 剑桥雅思16-21</Badge>
              <Badge variant="danger">内部学生可下载</Badge>
            </div>
          </div>
          <div className="border-t border-[var(--border)] bg-[var(--bg-soft)] p-6 sm:p-8 lg:border-l lg:border-t-0">
            <div className="grid grid-cols-3 gap-3">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-5">
                <p className="text-xs font-semibold text-[var(--text-faint)]">PDF</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">{books.length}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-5">
                <p className="text-xs font-semibold text-[var(--text-faint)]">音频书籍</p>
                <p className="mt-2 text-2xl font-bold text-[var(--primary)]">{audioBookCount}</p>
              </div>
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-5">
                <p className="text-xs font-semibold text-[var(--text-faint)]">范围</p>
                <p className="mt-2 text-2xl font-bold text-[var(--text)]">04-21</p>
              </div>
            </div>
            <div className="mt-4 flex items-start gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 text-sm leading-6 text-[var(--text-soft)]">
              <LockKeyhole className="mt-0.5 shrink-0 text-[var(--primary)]" size={17} />
              <span>只有登录的内部学生可下载</span>
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-4">
        {books.map((book) => (
          <Card key={book.bookNumber} className="overflow-hidden rounded-[var(--radius-lg)]">
            <CardContent className="p-0">
              <details open={book.bookNumber >= 20} className="group">
                <summary className="flex cursor-pointer list-none flex-col gap-4 border-b border-[var(--border)] bg-[var(--card)] p-5 transition hover:bg-[var(--bg-soft)] sm:flex-row sm:items-center sm:justify-between sm:p-6">
                  <div className="flex min-w-0 items-center gap-4">
                    <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                      <BookOpenCheck size={22} />
                    </span>
                    <div className="min-w-0">
                      <h2 className="text-lg font-bold tracking-tight text-[var(--text)]">剑桥雅思 {book.displayNumber}</h2>
                      <p className="mt-1 truncate text-sm text-[var(--text-soft)]">{book.title}</p>
                    </div>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant={book.audioTests.length > 0 ? "success" : "secondary"}>{book.audioTests.length > 0 ? "含听力音频" : "音频待补"}</Badge>
                    <DownloadLink href={book.pdf.url} download={book.pdf.fileName}>
                      <FileText size={16} />
                      PDF 下载
                    </DownloadLink>
                  </div>
                </summary>

                <div className="space-y-5 bg-[var(--bg-soft)] p-5 sm:p-6">
                  <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
                    <Sparkles size={16} className="text-[var(--primary)]" />
                    <span>PDF：剑桥雅思 {book.displayNumber} PDF 下载</span>
                  </div>

                  {book.audioTests.length > 0 ? (
                    <div className="grid gap-4 lg:grid-cols-2">
                      {book.audioTests.map((test) => (
                        <div key={test.testNumber} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                          <div className="mb-3 flex items-center justify-between gap-3">
                            <h3 className="text-sm font-bold text-[var(--text)]">Test {test.testNumber} 音频</h3>
                            <Badge variant="secondary">Part 1-4</Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
                            {test.parts.map((part) => (
                              part.url && part.fileName ? (
                                <DownloadLink key={part.partNumber} href={part.url} download={part.fileName} variant="secondary">
                                  <FileAudio size={14} />
                                  Part {part.partNumber}
                                  {formatFileSize(part.sizeBytes) ? <span className="hidden text-[10px] text-[var(--text-faint)] xl:inline">{formatFileSize(part.sizeBytes)}</span> : null}
                                </DownloadLink>
                              ) : (
                                <DisabledPartButton key={part.partNumber} label={`Part ${part.partNumber}`} />
                              )
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-6 text-[var(--text-soft)]">这本书的配套听力音频后续补充；当前先开放 PDF 下载。</div>
                  )}
                </div>
              </details>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
