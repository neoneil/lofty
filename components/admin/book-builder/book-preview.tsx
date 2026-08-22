"use client";

import { FileDown, Printer, X } from "lucide-react";
import { useEffect } from "react";

import CourseMarkdownBody from "@/components/course-markdown/CourseMarkdownBody";
import { Button } from "@/components/ui-v2/button";
import type { BookContentBlock, BookPreviewDocument } from "@/lib/book-builder/types";

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en-AU", { day: "2-digit", month: "long", year: "numeric" }).format(new Date(value));
}

function BookBlock({ block }: { block: BookContentBlock }) {
  if (block.type === "html") {
    return <div className="book-rich-content" dangerouslySetInnerHTML={{ __html: block.html }} />;
  }

  if (block.type === "markdown") {
    return <div className="book-markdown-content"><CourseMarkdownBody content={block.markdown} /></div>;
  }

  if (block.type === "image") {
    return (
      <figure className="book-content-image">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={block.src} alt={block.alt} />
        {block.caption ? <figcaption>{block.caption}</figcaption> : null}
      </figure>
    );
  }

  if (block.type === "notice") {
    return (
      <section className="book-notice">
        <h4>{block.title}</h4>
        {block.body.split(/\n{2,}/).map((paragraph, index) => <p key={`${block.title}-${index}`}>{paragraph}</p>)}
      </section>
    );
  }

  return (
    <div className="book-question-list">
      {block.items.map((question) => (
        <article key={question.id} className="book-pte-question">
          <div className="book-question-number">{String(question.number).padStart(2, "0")}</div>
          <div className="book-question-main">
            {question.title ? <h4>{question.title}</h4> : null}
            <div className="book-rich-content" dangerouslySetInnerHTML={{ __html: question.bodyHtml }} />
            {question.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={question.imageUrl} alt={question.title || `Question ${question.number}`} className="book-question-image" />
            ) : null}
            {question.answerHtml ? (
              <details className="book-question-answer" open>
                <summary>Reference answer</summary>
                <div className="book-rich-content" dangerouslySetInnerHTML={{ __html: question.answerHtml }} />
              </details>
            ) : null}
          </div>
        </article>
      ))}
    </div>
  );
}

export function BookPreview({ document: book, onClose }: { document: BookPreviewDocument; onClose: () => void }) {
  useEffect(() => {
    const previous = window.document.body.style.overflow;
    window.document.body.style.overflow = "hidden";
    return () => {
      window.document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div className="book-preview-layer" role="dialog" aria-modal="true" aria-label="PDF 书籍预览">
      <header className="book-preview-toolbar">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase text-[var(--primary)]">A4 PDF Preview</p>
          <h2 className="truncate text-base font-semibold text-[var(--text)]">{book.title}</h2>
        </div>
        <div className="flex items-center gap-2">
          <Button type="button" variant="primary" size="sm" onClick={() => window.print()} className="gap-2"><Printer size={16} />打印 / 保存 PDF</Button>
          <Button type="button" variant="secondary" size="icon" onClick={onClose} title="关闭预览" aria-label="关闭预览"><X size={18} /></Button>
        </div>
      </header>

      <div className="book-preview-scroll">
        <article id="lofty-book-print-root" className="book-print-root">
          <section className={`book-cover ${book.coverDataUrl ? "book-cover--custom" : "book-cover--default"}`} style={book.coverDataUrl ? { backgroundImage: `url(${book.coverDataUrl})` } : undefined}>
            {book.coverDataUrl ? <div className="book-cover-shade" /> : null}
            <div className="book-cover-brand">
              <span>小马哥教育</span>
              <strong>LOFTY EDUCATION</strong>
            </div>
            <div className="book-cover-title">
              <p>{book.exam.toUpperCase()} · PRIVATE STUDY EDITION</p>
              <h1>{book.title}</h1>
              {book.subtitle ? <h2>{book.subtitle}</h2> : null}
            </div>
            <div className="book-cover-student">
              <span>PREPARED EXCLUSIVELY FOR</span>
              <strong>{book.student?.name || "Lofty Student"}</strong>
              {book.student?.email ? <small>{book.student.email}</small> : null}
            </div>
          </section>

          <section className="book-front-page">
            <div className="book-front-rule" />
            <p className="book-front-kicker">小马哥教育 · {book.exam.toUpperCase()}</p>
            <h1>{book.title}</h1>
            {book.subtitle ? <p className="book-front-subtitle">{book.subtitle}</p> : null}
            <dl className="book-edition-details">
              <div><dt>Edition</dt><dd>{formatDate(book.generatedAt)}</dd></div>
              <div><dt>Contents</dt><dd>{book.chapters.length} chapters · {book.itemCount} content units</dd></div>
              <div><dt>Answer edition</dt><dd>{book.includeAnswers ? "Questions with answers" : "Question book"}</dd></div>
              <div><dt>Student</dt><dd>{book.student?.name || "General edition"}</dd></div>
            </dl>
            <p className="book-copyright">Prepared by Lofty Education, Australia. This personalised study material is intended for the named learner and classroom use.</p>
          </section>

          <section className="book-toc-page">
            <div className="book-section-label">CONTENTS</div>
            <h1>目录</h1>
            <div className="book-toc-list">
              {book.chapters.map((chapter, index) => (
                <div key={chapter.id} className="book-toc-row">
                  <span className="book-toc-number">{String(index + 1).padStart(2, "0")}</span>
                  <div><strong>{chapter.title}</strong><small>{chapter.sourceLabel} · {chapter.sections.length} sections</small></div>
                  <span className="book-toc-line" />
                  <span className="book-toc-marker">CH {index + 1}</span>
                </div>
              ))}
            </div>
          </section>

          {book.chapters.map((chapter, chapterIndex) => (
            <section key={chapter.id} className="book-chapter">
              <header className="book-chapter-opener">
                <span>{String(chapterIndex + 1).padStart(2, "0")}</span>
                <p>{chapter.sourceLabel}</p>
                <h2>{chapter.title}</h2>
                <div className="book-chapter-meta">{chapter.sections.length} sections · {book.exam.toUpperCase()}</div>
              </header>

              {chapter.sections.map((section) => (
                <section key={section.id} className={`book-content-section ${section.pageBreakBefore ? "book-content-section--break" : ""}`}>
                  <header className="book-content-heading">
                    {section.eyebrow ? <p>{section.eyebrow}</p> : null}
                    <h3>{section.title}</h3>
                  </header>
                  {section.blocks.map((block, blockIndex) => <BookBlock key={`${section.id}-block-${blockIndex}`} block={block} />)}
                </section>
              ))}
            </section>
          ))}
          <footer className="book-final-page">
            <FileDown size={28} />
            <p>小马哥教育 · {book.exam.toUpperCase()}</p>
            <h2>End of book</h2>
            <span>{book.student?.email || "www.loftypte.com.au"}</span>
          </footer>
        </article>
      </div>

      <style jsx global>{`
        .book-preview-layer { position: fixed; inset: 0; z-index: 100; display: flex; flex-direction: column; background: rgba(7, 12, 18, .82); backdrop-filter: blur(8px); }
        .book-preview-toolbar { display: flex; min-height: 68px; align-items: center; justify-content: space-between; gap: 16px; border-bottom: 1px solid var(--border); background: var(--card); padding: 12px 18px; box-shadow: var(--shadow-md); }
        .book-preview-scroll { flex: 1; overflow: auto; padding: 24px 12px 56px; }
        .book-print-root { --text: #14212a; --text-soft: #42525d; --text-faint: #71808a; --border: #d8dee1; --bg-soft: #f2f5f5; --card: #ffffff; --primary: #12645c; --primary-soft: #e2f1ee; width: 210mm; min-height: 297mm; margin: 0 auto; background: #fff; color: #14212a; box-shadow: 0 24px 70px rgba(0, 0, 0, .35); font-family: Arial, "Microsoft YaHei", "Noto Sans CJK SC", sans-serif; letter-spacing: 0; }
        .book-cover { position: relative; display: flex; min-height: 297mm; flex-direction: column; overflow: hidden; padding: 20mm 18mm; color: #fff; background-position: center; background-size: cover; page: book-cover; }
        .book-cover--default { background: #102e38; }
        .book-cover--default::before { content: ""; position: absolute; inset: 0 0 auto; height: 13mm; background: #d6a739; }
        .book-cover--default::after { content: ""; position: absolute; right: 18mm; top: 45mm; bottom: 45mm; width: 4mm; background: #c94a45; }
        .book-cover-shade { position: absolute; inset: 0; background: rgba(9, 22, 29, .66); }
        .book-cover-brand, .book-cover-title, .book-cover-student { position: relative; z-index: 1; }
        .book-cover-brand { display: flex; align-items: baseline; justify-content: space-between; border-bottom: 1px solid rgba(255,255,255,.45); padding-bottom: 7mm; }
        .book-cover-brand span { font-size: 18px; font-weight: 800; }
        .book-cover-brand strong { font-size: 10px; letter-spacing: 2px; }
        .book-cover-title { margin-top: 54mm; max-width: 148mm; }
        .book-cover-title p { margin: 0 0 7mm; color: #e7c76f; font-size: 11px; font-weight: 800; letter-spacing: 1.4px; }
        .book-cover-title h1 { margin: 0; font-size: 38px; line-height: 1.2; overflow-wrap: anywhere; }
        .book-cover-title h2 { margin: 7mm 0 0; max-width: 125mm; font-size: 17px; font-weight: 500; line-height: 1.6; }
        .book-cover-student { margin-top: auto; align-self: flex-end; width: 84mm; border-top: 2px solid #e7c76f; background: rgba(5, 16, 22, .8); padding: 6mm; text-align: right; }
        .book-cover-student span { display: block; color: #e7c76f; font-size: 9px; font-weight: 800; letter-spacing: 1px; }
        .book-cover-student strong { display: block; margin-top: 3mm; font-size: 18px; overflow-wrap: anywhere; }
        .book-cover-student small { display: block; margin-top: 2mm; color: rgba(255,255,255,.78); font-size: 10px; overflow-wrap: anywhere; }
        .book-front-page, .book-toc-page { min-height: 267mm; padding: 24mm 22mm; break-after: page; }
        .book-front-rule { width: 28mm; height: 2mm; background: #c94a45; }
        .book-front-kicker, .book-section-label { margin: 12mm 0 0; color: #12645c; font-size: 10px; font-weight: 800; letter-spacing: 1.4px; }
        .book-front-page h1, .book-toc-page h1 { margin: 5mm 0 0; font-family: Georgia, "Songti SC", serif; font-size: 31px; line-height: 1.25; }
        .book-front-subtitle { max-width: 135mm; margin-top: 7mm; color: #52616a; font-size: 15px; line-height: 1.7; }
        .book-edition-details { display: grid; grid-template-columns: 1fr 1fr; gap: 0; margin: 28mm 0 0; border-top: 1px solid #cad2d5; }
        .book-edition-details div { min-height: 27mm; border-bottom: 1px solid #cad2d5; padding: 5mm 4mm 4mm 0; }
        .book-edition-details div:nth-child(odd) { border-right: 1px solid #cad2d5; }
        .book-edition-details div:nth-child(even) { padding-left: 6mm; }
        .book-edition-details dt { color: #71808a; font-size: 9px; font-weight: 800; letter-spacing: .8px; text-transform: uppercase; }
        .book-edition-details dd { margin: 3mm 0 0; font-size: 13px; font-weight: 700; }
        .book-copyright { margin-top: 44mm; border-left: 3px solid #d6a739; padding-left: 5mm; color: #71808a; font-size: 10px; line-height: 1.6; }
        .book-toc-list { margin-top: 18mm; }
        .book-toc-row { display: grid; grid-template-columns: 13mm minmax(55mm, auto) 1fr auto; align-items: end; gap: 4mm; border-bottom: 1px solid #d8dee1; padding: 5mm 0; break-inside: avoid; }
        .book-toc-number { color: #c94a45; font-family: Georgia, serif; font-size: 20px; }
        .book-toc-row strong { display: block; font-size: 13px; line-height: 1.4; }
        .book-toc-row small { display: block; margin-top: 1.5mm; color: #71808a; font-size: 9px; }
        .book-toc-line { border-bottom: 1px dotted #aab4b9; transform: translateY(-2mm); }
        .book-toc-marker { color: #12645c; font-size: 9px; font-weight: 800; }
        .book-chapter { break-before: page; }
        .book-chapter-opener { display: flex; min-height: 190mm; flex-direction: column; justify-content: flex-end; background: #163d46; padding: 22mm; color: #fff; break-after: page; }
        .book-chapter-opener > span { color: #d6a739; font-family: Georgia, serif; font-size: 64px; line-height: 1; }
        .book-chapter-opener p { margin: 11mm 0 0; font-size: 10px; font-weight: 800; letter-spacing: 1.3px; text-transform: uppercase; }
        .book-chapter-opener h2 { max-width: 145mm; margin: 5mm 0 0; font-family: Georgia, "Songti SC", serif; font-size: 31px; line-height: 1.25; overflow-wrap: anywhere; }
        .book-chapter-meta { margin-top: 15mm; border-top: 1px solid rgba(255,255,255,.35); padding-top: 5mm; color: rgba(255,255,255,.72); font-size: 10px; }
        .book-content-section { padding: 18mm 19mm; }
        .book-content-section--break { break-before: page; }
        .book-content-heading { margin-bottom: 10mm; border-bottom: 2px solid #163d46; padding-bottom: 5mm; }
        .book-content-heading p { margin: 0 0 2mm; color: #c94a45; font-size: 9px; font-weight: 800; letter-spacing: .9px; text-transform: uppercase; }
        .book-content-heading h3 { margin: 0; font-family: Georgia, "Songti SC", serif; font-size: 22px; line-height: 1.3; }
        .book-rich-content { color: #263740; font-size: 11px; line-height: 1.72; }
        .book-rich-content h3 { margin: 11mm 0 5mm; border-left: 3px solid #c94a45; padding-left: 4mm; font-size: 17px; }
        .book-rich-content h4 { margin: 8mm 0 4mm; color: #163d46; font-size: 14px; }
        .book-rich-content h5 { margin: 6mm 0 3mm; font-size: 12px; }
        .book-rich-content p { margin: 3mm 0; }
        .book-rich-content table { width: 100%; margin: 5mm 0; border-collapse: collapse; font-size: 10px; break-inside: avoid; }
        .book-rich-content th { background: #e8efef; color: #163d46; font-weight: 800; }
        .book-rich-content th, .book-rich-content td { border: 1px solid #aebbbf; padding: 2.5mm; vertical-align: top; }
        .book-rich-content img { display: block; max-width: 100%; max-height: 210mm; margin: 6mm auto; object-fit: contain; }
        .book-instruction { margin: 5mm 0; border-left: 3px solid #d6a739; background: #f4f6f4; padding: 4mm 5mm; color: #34454e; break-inside: avoid; }
        .book-answer-blank { display: inline-block; min-width: 34mm; color: #12645c; font-weight: 800; }
        .book-options { display: grid; grid-template-columns: 1fr 1fr; gap: 2mm 5mm; margin: 4mm 0 6mm; border: 1px solid #cbd4d7; padding: 4mm; break-inside: avoid; }
        .book-options div { font-size: 10.5px; line-height: 1.5; }
        .book-question-statements { margin: 4mm 0; padding-left: 9mm; }
        .book-question-statements li { margin: 2mm 0; padding-left: 2mm; }
        .book-answer-key { display: grid; gap: 3mm; }
        .book-answer-row { display: grid; grid-template-columns: 13mm 1fr; gap: 2mm 4mm; border-bottom: 1px solid #d8dee1; padding: 3mm 0; break-inside: avoid; }
        .book-answer-row strong { color: #c94a45; }
        .book-answer-row > span { font-weight: 800; }
        .book-answer-row p { grid-column: 2; margin: 0; color: #53636c; font-size: 9.5px; line-height: 1.65; }
        .book-content-image { margin: 0; break-inside: avoid; }
        .book-content-image img { display: block; width: 100%; max-height: 235mm; object-fit: contain; }
        .book-content-image figcaption { margin-top: 3mm; color: #71808a; font-size: 9px; text-align: center; }
        .book-notice { margin: 8mm 0; border: 1px solid #bdc9cc; border-top: 4px solid #12645c; background: #f6f8f8; padding: 6mm; }
        .book-notice h4 { margin: 0 0 4mm; color: #12645c; font-size: 14px; }
        .book-notice p { margin: 3mm 0; color: #34454e; font-size: 10.5px; line-height: 1.7; white-space: pre-wrap; }
        .book-markdown-content { font-size: 11px; }
        .book-markdown-content [data-course-markdown-content] { color: #263740; }
        .book-question-list { display: grid; gap: 5mm; }
        .book-pte-question { display: grid; grid-template-columns: 12mm 1fr; gap: 5mm; border-top: 1px solid #cbd4d7; padding-top: 5mm; break-inside: avoid; }
        .book-question-number { color: #c94a45; font-family: Georgia, serif; font-size: 18px; }
        .book-question-main h4 { margin: 0 0 3mm; color: #163d46; font-size: 13px; }
        .book-question-image { display: block; max-width: 100%; max-height: 110mm; margin: 4mm auto; object-fit: contain; }
        .book-question-answer { margin-top: 4mm; border-left: 3px solid #d6a739; background: #f5f6f3; padding: 3mm 4mm; }
        .book-question-answer summary { color: #12645c; font-size: 9px; font-weight: 800; text-transform: uppercase; }
        .book-structured { margin: 3mm 0; color: #53636c; font-size: 9px; }
        .book-structured pre { overflow: hidden; white-space: pre-wrap; }
        .book-final-page { display: flex; min-height: 267mm; flex-direction: column; align-items: center; justify-content: center; background: #f2f5f5; color: #163d46; text-align: center; break-before: page; }
        .book-final-page p { margin: 6mm 0 0; color: #c94a45; font-size: 10px; font-weight: 800; letter-spacing: 1px; }
        .book-final-page h2 { margin: 3mm 0 0; font-family: Georgia, serif; font-size: 28px; }
        .book-final-page span { margin-top: 7mm; color: #71808a; font-size: 10px; }
        @page { size: A4; margin: 0; }
        @media (max-width: 900px) {
          .book-preview-toolbar { align-items: flex-start; }
          .book-preview-toolbar > div:last-child { flex-shrink: 0; }
          .book-preview-toolbar button:first-child { padding-inline: 12px; }
          .book-preview-scroll { padding-inline: 8px; }
          .book-print-root { width: 210mm; transform-origin: top left; }
        }
        @media print {
          html, body { margin: 0 !important; background: #fff !important; }
          body * { visibility: hidden !important; }
          .book-preview-layer, .book-preview-scroll, #lofty-book-print-root, #lofty-book-print-root * { visibility: visible !important; }
          .book-preview-layer { position: static !important; display: block !important; background: #fff !important; }
          .book-preview-toolbar { display: none !important; }
          .book-preview-scroll { overflow: visible !important; padding: 0 !important; }
          #lofty-book-print-root { position: absolute !important; inset: 0 auto auto 0 !important; margin: 0 !important; box-shadow: none !important; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
          .book-cover { min-height: 297mm; }
          .book-front-page, .book-toc-page, .book-final-page { min-height: 297mm; box-sizing: border-box; }
          .book-chapter-opener { min-height: 297mm; box-sizing: border-box; }
        }
      `}</style>
    </div>
  );
}
