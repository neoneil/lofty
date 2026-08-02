/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FileAudio2, FileImage, Headphones, Mic, PenTool, Rows3 } from "lucide-react";

import { CollapsibleAnswer } from "@/components/ielts-practice/collapsible-answer";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { SecureAudioPlayer } from "@/components/ui-v2/secure-audio-player";
import { sanitizeRichHtml } from "@/lib/html/sanitize";
import { normalizePublicStorageUrl } from "@/lib/storage/public-url";
import { cn } from "@/lib/utils";
import type { IeltsAnswer, IeltsAsset, IeltsBookPracticeData, IeltsModule, IeltsQuestion, IeltsSection, IeltsTest } from "@/lib/ielts/practice";

const MODULES = [
  { type: "listening", label: "听力", description: "音频、题目与答案", icon: Headphones },
  { type: "reading", label: "阅读", description: "文章、题组与答案", icon: Rows3 },
  { type: "writing", label: "写作", description: "Task 题目与图片资料", icon: PenTool },
  { type: "speaking", label: "口语", description: "后续接入口语题库", icon: Mic },
] as const;

type ModuleType = (typeof MODULES)[number]["type"];

type Props = {
  data: IeltsBookPracticeData;
  selectedTestNumber?: number;
  isAdmin?: boolean;
};

type AudioItem = {
  asset: IeltsAsset;
  title: string;
  subtitle: string;
  sectionId?: string;
};

export function IeltsPracticeDetail({ data, selectedTestNumber, isAdmin = false }: Props) {
  if (!data.book) {
    return (
      <Card>
        <CardContent className="p-5 text-sm text-[var(--text-soft)]">没有找到这本剑桥雅思练习题。</CardContent>
      </Card>
    );
  }

  const activeTestNumber = selectedTestNumber ?? data.tests[0]?.test_number;
  const visibleTests = activeTestNumber ? data.tests.filter((test) => test.test_number === activeTestNumber) : data.tests;
  const visibleTestIds = visibleTests.map((test) => test.id);
  const visibleModules = data.modules.filter((item) => visibleTestIds.includes(item.test_id));

  return (
    <div className="space-y-5">
      <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
        <div className="mb-3 flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-base font-semibold text-[var(--text)]">选择 Test</h2>
            <p className="text-xs text-[var(--text-soft)]">把 Test 1-4 分开查看，页面更清楚。</p>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {data.tests.map((test) => (
            <Link key={test.id} href={`/ielts/practice/${data.book?.book_number}?test=${test.test_number}`} className={cn("inline-flex h-11 items-center justify-center rounded-[var(--radius-md)] border px-4 text-sm font-semibold transition", activeTestNumber === test.test_number ? "border-[var(--primary)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]" : "border-[var(--border)] bg-[var(--bg-soft)] text-[var(--text-soft)] hover:border-[var(--primary)] hover:text-[var(--primary)]")}>Test {test.test_number}</Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {MODULES.map((module) => {
          const moduleIds = visibleModules.filter((item) => item.module_type === module.type).map((item) => item.id);
          const count = data.sections.filter((section) => moduleIds.includes(section.module_id)).length;
          const Icon = module.icon;
          return (
            <div key={module.type} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]">
              <div className="mb-3 flex items-center justify-between gap-2">
                <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></div>
                <Badge variant={count > 0 ? "success" : "secondary"}>{count > 0 ? `${count} 组` : "待开发"}</Badge>
              </div>
              <div className="text-sm font-semibold text-[var(--text)]">{module.label}</div>
              <div className="mt-1 text-xs text-[var(--text-soft)]">{module.description}</div>
            </div>
          );
        })}
      </div>

      {visibleTests.map((test) => (
        <TestBlock key={test.id} test={test} data={data} isAdmin={isAdmin} />
      ))}
    </div>
  );
}

function TestBlock({ test, data, isAdmin }: { test: IeltsTest; data: IeltsBookPracticeData; isAdmin: boolean }) {
  const modules = data.modules.filter((module) => module.test_id === test.id);

  return (
    <Card id={`test-${test.test_number}`} className="overflow-hidden">
      <CardContent className="p-4 sm:p-6">
        <div className="mb-5 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Badge className="mb-2 w-fit">Test {test.test_number}</Badge>
            <h2 className="text-xl font-semibold tracking-tight text-[var(--text)]">{test.title}</h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">剑桥雅思 {data.book?.book_number} · 四项模块集中练习</p>
          </div>
          <div className="flex flex-wrap gap-2">
            {MODULES.map((module) => (
              <Link key={module.type} href={`#test-${test.test_number}-${module.type}`} className="inline-flex h-9 items-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-xs font-medium text-[var(--text-soft)] transition hover:border-[var(--primary)] hover:text-[var(--primary)]">{module.label}</Link>
            ))}
          </div>
        </div>

        <div className="space-y-4">
          {MODULES.map((moduleInfo) => {
            const ieltsModule = modules.find((item) => item.module_type === moduleInfo.type);
            return <ModuleBlock key={moduleInfo.type} moduleInfo={moduleInfo} ieltsModule={ieltsModule} data={data} testNumber={test.test_number} isAdmin={isAdmin} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleBlock({ moduleInfo, ieltsModule, data, testNumber, isAdmin }: { moduleInfo: (typeof MODULES)[number]; ieltsModule?: IeltsModule; data: IeltsBookPracticeData; testNumber: number; isAdmin: boolean }) {
  const Icon = moduleInfo.icon;
  const sections = ieltsModule ? data.sections.filter((section) => section.module_id === ieltsModule.id) : [];
  const assets = ieltsModule ? data.assets.filter((asset) => asset.module_id === ieltsModule.id) : [];
  const audioItems = buildAudioItems({
    assets: moduleInfo.type === "reading" ? [] : assets.filter((asset) => asset.asset_type === "audio"),
    sections,
    bookNumber: data.book?.book_number,
    testNumber,
  });
  const fullAudioItems = moduleInfo.type === "reading" ? [] : audioItems.filter((item) => !item.sectionId);
  const imageAssets = assets.filter((asset) => asset.asset_type === "image");

  return (
    <section id={`test-${testNumber}-${moduleInfo.type}`} className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)] sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={20} /></div>
          <div>
            <h3 className="text-base font-semibold tracking-tight text-[var(--text)]">{moduleInfo.label}</h3>
            <p className="text-xs text-[var(--text-soft)]">{moduleInfo.description}</p>
          </div>
        </div>
        <Badge variant={sections.length > 0 ? "success" : "secondary"}>{sections.length > 0 ? `${sections.length} 个 Section` : "待开发"}</Badge>
      </div>

      {sections.length === 0 ? (
        <PendingModule moduleType={moduleInfo.type} />
      ) : (
        <div className="space-y-3">
          {fullAudioItems.length > 0 && <AssetAudioList items={fullAudioItems} />}
          {moduleInfo.type !== "reading" && imageAssets.length > 0 && <AssetImageList assets={imageAssets} />}
          {sections.map((section) => <SectionBlock key={section.id} section={section} data={data} moduleType={moduleInfo.type} audioItems={moduleInfo.type === "reading" ? [] : audioItems.filter((item) => item.sectionId === section.id)} isAdmin={isAdmin} />)}
        </div>
      )}
    </section>
  );
}

function PendingModule({ moduleType }: { moduleType: ModuleType }) {
  const text = moduleType === "speaking" ? "当前数据库还没有剑桥雅思口语模块数据，后续接入后会自动显示。" : "当前数据库暂未导入这个模块，数据准备好后会自动展示题目。";

  return <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-5 text-sm leading-7 text-[var(--text-soft)]">{text}</div>;
}

function AssetAudioList({ items }: { items: AudioItem[] }) {
  return (
    <div className="grid gap-3 lg:grid-cols-2">
      {items.map((item) => {
        const audioUrl = getAssetUrl(item.asset);

        return (
          <div key={item.asset.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
            <div className="mb-3 flex items-start gap-2">
              <FileAudio2 size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" />
              <div>
                <div className="text-sm font-semibold text-[var(--text)]">{item.title}</div>
                <div className="mt-0.5 text-xs text-[var(--text-soft)]">{item.subtitle}</div>
              </div>
            </div>
            {audioUrl ? <SecureAudioPlayer src={audioUrl} preload="none" title={item.title} description={item.subtitle} compact /> : <p className="text-sm text-[var(--text-soft)]">音频链接暂不可用。</p>}
          </div>
        );
      })}
    </div>
  );
}

function AssetImageList({ assets }: { assets: IeltsAsset[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {assets.map((asset, index) => {
        const imageUrl = getAssetUrl(asset);

        return (
          <figure key={asset.id} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
            {imageUrl ? <img src={imageUrl} alt={`剑桥雅思图片资料 ${index + 1}`} className="h-auto w-full object-contain" /> : <div className="p-4 text-sm text-[var(--text-soft)]">图片链接暂不可用。</div>}
            <figcaption className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-soft)]"><FileImage size={14} />图片资料 {index + 1}</figcaption>
          </figure>
        );
      })}
    </div>
  );
}

function getAssetUrl(asset: IeltsAsset) {
  return normalizePublicStorageUrl(asset.public_url || asset.storage_path, asset.bucket || "ielts");
}

function SectionBlock({ section, data, moduleType, audioItems, isAdmin }: { section: IeltsSection; data: IeltsBookPracticeData; moduleType: ModuleType; audioItems: AudioItem[]; isAdmin: boolean }) {
  const questions = data.questions.filter((question) => question.section_id === section.id);
  const raw = section.raw_data;

  return (
    <div className="border-t border-[var(--border)] pt-5 first:border-t-0 first:pt-0">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.16em] text-[var(--primary)]">Section {section.section_number}</div>
          <h4 className="mt-1 text-xl font-semibold tracking-tight text-[var(--text)]">{section.title || section.passage_title || "练习内容"}</h4>
          {section.instruction && <p className="mt-2 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{stripHtml(section.instruction)}</p>}
        </div>
        <Badge variant="outline">{questions.length} 组题</Badge>
      </div>

      {audioItems.length > 0 && <div className="mb-4"><AssetAudioList items={audioItems} /></div>}

      <RichHtml html={section.passage_text || stringValue(raw, "content")} />

      <div className="mt-4 space-y-4">
        {questions.map((question) => (
          <QuestionBlock key={question.id} question={question} answer={data.answers.find((item) => item.question_id === question.id)} moduleType={moduleType} sectionTitle={section.passage_title || section.title || ""} sectionPassage={section.passage_text || stringValue(raw, "content")} isAdmin={isAdmin} />
        ))}
      </div>
    </div>
  );
}

function QuestionBlock({ question, answer, moduleType, sectionTitle, sectionPassage, isAdmin }: { question: IeltsQuestion; answer?: IeltsAnswer; moduleType: ModuleType; sectionTitle: string; sectionPassage: string; isAdmin: boolean }) {
  const questionRange = question.question_number_end && question.question_number_end !== question.question_number_start ? `${question.question_number_start}-${question.question_number_end}` : `${question.question_number_start}`;
  const sourceQuestions = arrayValue(question.content, "questions");
  const pageContent = stringValue(question.content, "page_content") || stringValue(question.content, "part_content");
  const answerValues = getAnswerValues(answer);
  const cleanedPageContent = removeDuplicatePassageTitle(removeDuplicateReadingPassage(removeTrailingInlineAnswers(pageContent, answerValues), sectionTitle, sectionPassage, question.question_number_start), sectionTitle);
  const isAnswerBank = hasBlankPlaceholder(cleanedPageContent) && isAnswerBankOptionList(question.options);
  const shouldShowOptions = question.options.length > 0 && !isAnswerOptionList(question.options, answerValues) && !isAnswerBank;
  const sectionDesc = stringValue(question.content, "section_desc") || question.instruction;

  return (
    <article className="border-l-2 border-[var(--primary)]/35 bg-[var(--bg-soft)]/35 py-4 pl-4 pr-2 sm:pl-5 sm:pr-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{moduleType.toUpperCase()}</Badge>
          <Badge variant="secondary">Questions {questionRange}</Badge>
          <Badge variant="outline">{question.question_type}</Badge>
        </div>
      </div>
      {question.prompt && <h5 className="mb-2 text-base font-semibold tracking-tight text-[var(--text)]">{stripHtml(question.prompt)}</h5>}
      {sectionDesc && <RichHtml html={sectionDesc} compact />}
      <RichHtml html={cleanedPageContent} compact />
      {sourceQuestions.length > 0 && <QuestionList questions={sourceQuestions} />}
      {isAnswerBank && <CollapsibleAnswer label="查看备选答案"><OptionList options={question.options} /></CollapsibleAnswer>}
      {shouldShowOptions && <OptionList options={question.options} />}
      {isAdmin && answer && <AnswerBlock answer={answer} />}
    </article>
  );
}

function QuestionList({ questions }: { questions: Record<string, unknown>[] }) {
  const visibleQuestions = questions
    .map((question, index) => {
      const label = stringValue(question, "questionNo") || stringValue(question, "sort") || `${index + 1}`;
      const title = stringValue(question, "title") || stringValue(question, "content") || "";
      const options = stringArrayValue(question, "option");
      const answers = stringArrayValue(question, "answer");
      return { label, title, options, answers, index };
    })
    .filter((question) => question.options.length > 0 || (!isRedundantBlankQuestion(question.label, question.title) && !isAnswerOnlyQuestion(question.label, question.title, question.answers)));

  if (visibleQuestions.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {visibleQuestions.map((question) => {
        return (
          <div key={`${question.label}-${question.index}`} className="rounded-[var(--radius-sm)] bg-[var(--card)]/70 px-3 py-2">
            <div className="mb-1 text-xs font-semibold text-[var(--primary)]">Question {question.label}</div>
            {question.title ? <RichHtml html={question.title} compact /> : null}
            {question.options.length > 0 ? <div className="mt-2 grid gap-1.5 sm:grid-cols-2">{question.options.map((option, optionIndex) => <div key={`${question.label}-${optionIndex}`} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text-soft)]"><RichHtml html={option} compact /></div>)}</div> : null}
          </div>
        );
      })}
    </div>
  );
}

function OptionList({ options }: { options: Record<string, unknown>[] }) {
  return (
    <div className="mt-3 grid gap-2 sm:grid-cols-2">
      {options.map((option, index) => (
        <div key={`${stringValue(option, "id") || stringValue(option, "optionId") || index}`} className="rounded-[var(--radius-sm)] border border-[var(--border)]/70 bg-[var(--card)]/75 px-3 py-2 text-sm text-[var(--text-soft)]">
          <RichHtml html={optionText(option)} compact />
        </div>
      ))}
    </div>
  );
}

function AnswerBlock({ answer }: { answer: IeltsAnswer }) {
  const rows = answer.answer_data.answers ?? [];
  const options = answer.answer_data.options ?? [];

  return (
    <CollapsibleAnswer>
      {rows.length > 0 ? rows.map((row, index) => (
        <div key={`${stringValue(row, "question_no") || index}`} className="rounded-[var(--radius-sm)] bg-[var(--bg-soft)] px-3 py-2 text-sm text-[var(--text-soft)]">
          <span className="font-semibold text-[var(--text)]">Q{stringValue(row, "question_no") || index + 1}: </span>
          <span>{answerText(row, options) || "暂无答案"}</span>
          {stringValue(row, "answer_explain") && <div className="mt-1 text-xs leading-6 text-[var(--text-faint)]">{stripHtml(stringValue(row, "answer_explain"))}</div>}
        </div>
      )) : <p className="text-sm text-[var(--text-soft)]">暂无结构化答案。</p>}
      {answer.explanation && <div className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--primary-soft)]/30 p-3 text-xs leading-6 text-[var(--text-soft)]">{stripHtml(answer.explanation)}</div>}
    </CollapsibleAnswer>
  );
}

function RichHtml({ html, compact = false }: { html?: string | null; compact?: boolean }) {
  if (!html) return null;
  return <div className={cn("max-w-none text-[15px] leading-8 text-[var(--text-soft)] antialiased [&_*]:!border-[var(--border)] [&_*]:!bg-transparent [&_*]:!text-[var(--text-soft)] [&_a]:!text-[var(--primary)] [&_em]:!text-[var(--text)] [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_li]:my-1.5 [&_p]:my-2.5 [&_strong]:!font-semibold [&_strong]:!text-[var(--text)] [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2.5 [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2.5 [&_u]:!text-[var(--text)]", compact && "text-sm leading-7")} dangerouslySetInnerHTML={{ __html: sanitizeRichHtml(normalizeQuestionBlanks(html)) }} />;
}

function arrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringArrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (Array.isArray(value)) return value.map((item) => typeof item === "string" || typeof item === "number" ? `${item}` : "").filter(Boolean);
  if (typeof value === "string" || typeof value === "number") return [`${value}`];
  return [];
}

function stringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}`;
  return "";
}

function recordValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function stripHtml(value: string) {
  return decodeHtmlEntities(normalizeQuestionBlanks(value).replace(/<[^>]*>/g, " ")).replace(/\s+/g, " ").trim();
}

function decodeHtmlEntities(value: string) {
  return value
    .replace(/&nbsp;|&#160;|&#xA0;/gi, " ")
    .replace(/&amp;/gi, "&")
    .replace(/&lt;/gi, "<")
    .replace(/&gt;/gi, ">")
    .replace(/&quot;/gi, "\"")
    .replace(/&#39;|&apos;/gi, "'");
}

function isRedundantBlankQuestion(label: string, title: string) {
  const cleanLabel = normalizeQuestionLabel(label);
  const cleanTitle = normalizeQuestionLabel(stripHtml(title));
  if (!cleanTitle) return true;
  return cleanTitle === cleanLabel;
}

function normalizeQuestionLabel(value: string) {
  return value.replace(/[.)。．、\s]/g, "").trim();
}

function isAnswerOnlyQuestion(label: string, title: string, answers: string[]) {
  const cleanTitle = normalizeQuestionLabel(stripHtml(title)).toLowerCase();
  if (!cleanTitle || answers.length === 0) return false;
  return answers.some((answer) => {
    const cleanAnswer = normalizeQuestionLabel(stripHtml(answer)).toLowerCase();
    if (!cleanAnswer) return false;
    return cleanTitle === cleanAnswer || cleanTitle === `${normalizeQuestionLabel(label).toLowerCase()}${cleanAnswer}` || cleanTitle === `question${normalizeQuestionLabel(label).toLowerCase()}${cleanAnswer}`;
  });
}

function answerText(row: Record<string, unknown>, options: Record<string, unknown>[]) {
  const direct = stringValue(row, "answer_value");
  if (direct) return stripHtml(direct);
  const optionIds = stringValue(row, "option_ids");
  if (!optionIds) return "";
  const ids = optionIds.split(/[|,]/).map((item) => item.trim()).filter(Boolean);
  return ids.map((id) => {
    const option = options.find((item) => [stringValue(item, "id"), stringValue(item, "optionId"), stringValue(item, "value")].includes(id));
    return option ? stripHtml(stringValue(option, "title") || stringValue(option, "content") || stringValue(option, "value")) : id;
  }).join(" / ");
}

function getAnswerValues(answer?: IeltsAnswer) {
  const rows = answer?.answer_data.answers ?? [];
  return rows.flatMap((row) => {
    const direct = stringValue(row, "answer_value");
    const values = stringArrayValue(row, "answer_values");
    return [...values, direct].flatMap((value) => value.split(/\s*[/|]\s*/)).map((value) => stripHtml(value).trim()).filter(Boolean);
  });
}

function removeTrailingInlineAnswers(html: string, answers: string[]) {
  if (!html || answers.length === 0) return html;
  const lastBlankIndex = Math.max(
    ...[...html.matchAll(/#{2,}\s*-\s*\d{1,3}\s*-\s*#{2,}/g), ...html.matchAll(/\[blank\]\s*\[\/blank\]/gi)].map((match) => match.index ?? -1),
  );
  if (lastBlankIndex < 0) return html;

  const suffix = html.slice(lastBlankIndex);
  const normalizedAnswers = [...new Set(answers.map(normalizeAnswerToken).filter((answer) => answer.length >= 2))];
  const matchedAnswers = normalizedAnswers.filter((answer) => normalizeAnswerToken(suffix).includes(answer));
  if (matchedAnswers.length < Math.min(3, normalizedAnswers.length)) return html;

  const firstAnswerIndex = normalizedAnswers.reduce((earliest, answer) => {
    const index = suffix.toLowerCase().search(new RegExp(escapeRegExp(answer), "i"));
    return index >= 0 ? Math.min(earliest, index) : earliest;
  }, Number.POSITIVE_INFINITY);

  return Number.isFinite(firstAnswerIndex) ? html.slice(0, lastBlankIndex + firstAnswerIndex).trim() : html;
}

function removeDuplicatePassageTitle(html: string, title: string) {
  const cleanTitle = stripHtml(title);
  if (!html || !cleanTitle) return html;
  const escapedTitle = escapeRegExp(cleanTitle);
  return html
    .replace(new RegExp(`(<p[^>]*>\\s*)${escapedTitle}(\\s*</p>)`, "gi"), "")
    .replace(new RegExp(`(<div[^>]*>\\s*)${escapedTitle}(\\s*</div>)`, "gi"), "")
    .replace(new RegExp(`((?:<br\\s*/?>|&nbsp;|\\s)+)${escapedTitle}\\s*$`, "gi"), "")
    .trim();
}

function removeDuplicateReadingPassage(html: string, title: string, passageText: string, questionStart: number) {
  const cleanTitle = stripHtml(title);
  const cleanPassage = stripHtml(passageText);
  if (!html || !cleanTitle) return html;

  const titleMatch = new RegExp(escapeRegExp(cleanTitle), "i").exec(html);
  if (!titleMatch) return html;

  const beforeTitle = html.slice(0, titleMatch.index).trim();
  const afterTitle = html.slice(titleMatch.index + titleMatch[0].length);
  const passageSample = cleanPassage.length >= 300 ? cleanPassage.split(/\s+/).slice(0, 18).join(" ") : "";
  const normalizedSample = normalizeComparableText(passageSample);
  const hasMatchingPassageSample = Boolean(normalizedSample && normalizeComparableText(stripHtml(afterTitle)).includes(normalizedSample));
  const hasDuplicatedPassageShape = looksLikeDuplicatedReadingPassage(afterTitle);
  if (!hasMatchingPassageSample && !hasDuplicatedPassageShape) return html;

  const questionMarkerIndex = findQuestionMarkerIndex(afterTitle, questionStart);
  if (questionMarkerIndex < 0) return beforeTitle;

  return `${beforeTitle}\n\n${afterTitle.slice(questionMarkerIndex).trim()}`.trim();
}

function looksLikeDuplicatedReadingPassage(html: string) {
  const text = stripHtml(html);
  const hasEarlyParagraphA = /(?:^|\s)A\s*\.\s+\S+/i.test(text.slice(0, 600));
  const paragraphLabels = text.match(/(?:^|\s)[A-G]\s*\.\s+/g) ?? [];
  return hasEarlyParagraphA && paragraphLabels.length >= 3;
}

function findQuestionMarkerIndex(html: string, questionStart: number) {
  const exact = new RegExp(`Question(?:\\s|&nbsp;|&#160;|&#xA0;|<[^>]*>)+${questionStart}\\b`, "i").exec(html);
  if (exact?.index !== undefined) return exact.index;
  const any = /Question(?:\s|&nbsp;|&#160;|&#xA0;|<[^>]*>)+\d{1,3}\b/i.exec(html);
  return any?.index ?? -1;
}

function isAnswerOptionList(options: Record<string, unknown>[], answers: string[]) {
  if (options.length === 0 || answers.length === 0) return false;
  const normalizedAnswers = new Set(answers.map(normalizeAnswerToken).filter(Boolean));
  const optionTexts = options.map((option) => normalizeAnswerToken(optionText(option))).filter(Boolean);
  if (optionTexts.length === 0) return false;
  const matchedCount = optionTexts.filter((option) => normalizedAnswers.has(option)).length;
  return matchedCount >= Math.min(3, optionTexts.length) && matchedCount / optionTexts.length >= 0.7;
}

function hasBlankPlaceholder(value: string) {
  return /#{2,}\s*-\s*\d{1,3}\s*-\s*#{2,}/.test(value) || /\[blank\]\s*\[\/blank\]/i.test(value) || /_{3,}\s*\d{1,3}\s*_{3,}/.test(value);
}

function isAnswerBankOptionList(options: Record<string, unknown>[]) {
  const optionTexts = options.map(optionText).map(stripHtml).map((text) => text.trim()).filter(Boolean);
  if (optionTexts.length < 3) return false;
  const choiceLikeCount = optionTexts.filter((text) => /^[A-Z]\s+/.test(text) || /^[A-Z][.)]\s*/.test(text)).length;
  if (choiceLikeCount >= Math.ceil(optionTexts.length * 0.5)) return false;
  const shortTextCount = optionTexts.filter((text) => text.split(/\s+/).length <= 4 && !/[?.!。？！]/.test(text)).length;
  return shortTextCount / optionTexts.length >= 0.8;
}

function optionText(option: Record<string, unknown>) {
  return stringValue(option, "title") || stringValue(option, "content") || stringValue(option, "value") || stringValue(option, "label") || stringValue(option, "text") || stringValue(option, "name");
}

function normalizeAnswerToken(value: string) {
  return stripHtml(value).toLowerCase().replace(/&nbsp;/g, " ").replace(/[^a-z0-9\u4e00-\u9fff]+/gi, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function normalizeComparableText(value: string) {
  return value.toLowerCase().replace(/[^a-z0-9\u4e00-\u9fff]+/gi, " ").replace(/\s+/g, " ").trim();
}

function normalizedSourceAssetUrl(value: string) {
  if (!value) return "";
  if (value.startsWith("//")) return `https:${value}`;
  if (value.startsWith("/")) return `https://www.winielts.com${value}`;
  return value;
}

function buildAudioItems({ assets, sections, bookNumber, testNumber }: { assets: IeltsAsset[]; sections: IeltsSection[]; bookNumber?: number; testNumber: number }) {
  const sectionSources = new Map<string, IeltsSection>();
  sections.forEach((section) => {
    const audio = normalizedSourceAssetUrl(stringValue(section.raw_data, "audio"));
    const analysisAudio = normalizedSourceAssetUrl(stringValue(section.raw_data, "analysisAudio"));
    const detail = recordValue(section.raw_data, "detail");
    const audioUrl = normalizedSourceAssetUrl(stringValue(detail, "audioUrl"));
    const listenAudio = normalizedSourceAssetUrl(stringValue(detail, "listenAudio"));
    if (audio) sectionSources.set(audio, section);
    if (analysisAudio) sectionSources.set(analysisAudio, section);
    if (audioUrl) sectionSources.set(audioUrl, section);
    if (listenAudio) sectionSources.set(listenAudio, section);
  });

  return assets.map((asset) => {
    const sourceUrl = stringValue(asset.metadata, "source_url");
    const matched = sourceUrl ? sectionSources.get(sourceUrl) : undefined;
    if (matched) {
      const title = `剑桥雅思 ${bookNumber ?? ""} Test ${testNumber} Section ${matched.section_number} 音频`.replace(/\s+/g, " ").trim();
      return {
        asset,
        title,
        subtitle: matched.title || "对应本 section 题目",
        sectionId: matched.id,
      };
    }

    return {
      asset,
      title: `剑桥雅思 ${bookNumber ?? ""} Test ${testNumber} 完整听力音频`.replace(/\s+/g, " ").trim(),
      subtitle: "覆盖当前 Test 的完整 Listening 音频",
    };
  });
}

function normalizeQuestionBlanks(value: string) {
  return value
    .replace(/#{2,}\s*-\s*(\d{1,3})\s*-\s*#{2,}/g, "_____$1______")
    .replace(/(\d{1,3})\s*\[blank\]\s*\[\/blank\]/gi, "_____$1______")
    .replace(/\[blank\]\s*(\d{1,3})\s*\[\/blank\]/gi, "_____$1______")
    .replace(/\[blank\]\s*\[\/blank\]\s*(\d{1,3})/gi, "_____$1______")
    .replace(/\[blank\]\s*\[\/blank\]/gi, "______");
}
