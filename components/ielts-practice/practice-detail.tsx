/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { FileAudio2, FileImage, Headphones, Mic, PenTool, Rows3 } from "lucide-react";

import { CollapsibleAnswer } from "@/components/ielts-practice/collapsible-answer";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
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
};

type AudioItem = {
  asset: IeltsAsset;
  title: string;
  subtitle: string;
  sectionId?: string;
};

export function IeltsPracticeDetail({ data, selectedTestNumber }: Props) {
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
        <TestBlock key={test.id} test={test} data={data} />
      ))}
    </div>
  );
}

function TestBlock({ test, data }: { test: IeltsTest; data: IeltsBookPracticeData }) {
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
            return <ModuleBlock key={moduleInfo.type} moduleInfo={moduleInfo} ieltsModule={ieltsModule} data={data} testNumber={test.test_number} />;
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function ModuleBlock({ moduleInfo, ieltsModule, data, testNumber }: { moduleInfo: (typeof MODULES)[number]; ieltsModule?: IeltsModule; data: IeltsBookPracticeData; testNumber: number }) {
  const Icon = moduleInfo.icon;
  const sections = ieltsModule ? data.sections.filter((section) => section.module_id === ieltsModule.id) : [];
  const assets = ieltsModule ? data.assets.filter((asset) => asset.module_id === ieltsModule.id) : [];
  const audioItems = buildAudioItems({
    assets: assets.filter((asset) => asset.asset_type === "audio"),
    sections,
    bookNumber: data.book?.book_number,
    testNumber,
  });
  const fullAudioItems = audioItems.filter((item) => !item.sectionId);
  const imageAssets = assets.filter((asset) => asset.asset_type === "image");

  return (
    <section id={`test-${testNumber}-${moduleInfo.type}`} className="scroll-mt-24 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)]/55 p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--card)] text-[var(--primary)] shadow-[var(--shadow-sm)]"><Icon size={20} /></div>
          <div>
            <h3 className="text-base font-semibold text-[var(--text)]">{moduleInfo.label}</h3>
            <p className="text-xs text-[var(--text-soft)]">{moduleInfo.description}</p>
          </div>
        </div>
        <Badge variant={sections.length > 0 ? "success" : "secondary"}>{sections.length > 0 ? `${sections.length} 个 Section` : "待开发"}</Badge>
      </div>

      {sections.length === 0 ? (
        <PendingModule moduleType={moduleInfo.type} />
      ) : (
        <div className="space-y-4">
          {fullAudioItems.length > 0 && <AssetAudioList items={fullAudioItems} />}
          {imageAssets.length > 0 && <AssetImageList assets={imageAssets} />}
          {sections.map((section) => <SectionBlock key={section.id} section={section} data={data} moduleType={moduleInfo.type} audioItems={audioItems.filter((item) => item.sectionId === section.id)} />)}
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
      {items.map((item) => (
        <div key={item.asset.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
          <div className="mb-3 flex items-start gap-2">
            <FileAudio2 size={17} className="mt-0.5 shrink-0 text-[var(--primary)]" />
            <div>
              <div className="text-sm font-semibold text-[var(--text)]">{item.title}</div>
              <div className="mt-0.5 text-xs text-[var(--text-soft)]">{item.subtitle}</div>
            </div>
          </div>
          {item.asset.public_url ? <audio controls preload="none" src={item.asset.public_url} className="w-full" /> : <p className="text-sm text-[var(--text-soft)]">音频链接暂不可用。</p>}
        </div>
      ))}
    </div>
  );
}

function AssetImageList({ assets }: { assets: IeltsAsset[] }) {
  return (
    <div className="grid gap-3 md:grid-cols-2">
      {assets.map((asset, index) => (
        <figure key={asset.id} className="overflow-hidden rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)]">
          {asset.public_url ? <img src={asset.public_url} alt={`剑桥雅思图片资料 ${index + 1}`} className="h-auto w-full object-contain" /> : <div className="p-4 text-sm text-[var(--text-soft)]">图片链接暂不可用。</div>}
          <figcaption className="flex items-center gap-2 border-t border-[var(--border)] px-4 py-2 text-xs text-[var(--text-soft)]"><FileImage size={14} />图片资料 {index + 1}</figcaption>
        </figure>
      ))}
    </div>
  );
}

function SectionBlock({ section, data, moduleType, audioItems }: { section: IeltsSection; data: IeltsBookPracticeData; moduleType: ModuleType; audioItems: AudioItem[] }) {
  const questions = data.questions.filter((question) => question.section_id === section.id);
  const raw = section.raw_data;

  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 sm:p-5">
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-sm font-semibold text-[var(--text)]">Section {section.section_number}</div>
          <h4 className="mt-1 text-lg font-semibold text-[var(--text)]">{section.title || section.passage_title || "练习内容"}</h4>
          {section.instruction && <p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{stripHtml(section.instruction)}</p>}
        </div>
        <Badge variant="outline">{questions.length} 组题</Badge>
      </div>

      {audioItems.length > 0 && <div className="mb-4"><AssetAudioList items={audioItems} /></div>}

      <RichHtml html={section.passage_text || stringValue(raw, "content")} />

      <div className="mt-4 space-y-3">
        {questions.map((question) => (
          <QuestionBlock key={question.id} question={question} answer={data.answers.find((item) => item.question_id === question.id)} moduleType={moduleType} />
        ))}
      </div>
    </div>
  );
}

function QuestionBlock({ question, answer, moduleType }: { question: IeltsQuestion; answer?: IeltsAnswer; moduleType: ModuleType }) {
  const questionRange = question.question_number_end && question.question_number_end !== question.question_number_start ? `${question.question_number_start}-${question.question_number_end}` : `${question.question_number_start}`;
  const sourceQuestions = arrayValue(question.content, "questions");
  const pageContent = stringValue(question.content, "page_content") || stringValue(question.content, "part_content");
  const sectionDesc = stringValue(question.content, "section_desc") || question.instruction;

  return (
    <article className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)]/65 p-4">
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>{moduleType.toUpperCase()}</Badge>
          <Badge variant="secondary">Questions {questionRange}</Badge>
          <Badge variant="outline">{question.question_type}</Badge>
        </div>
      </div>
      {question.prompt && <h5 className="mb-2 text-sm font-semibold text-[var(--text)]">{stripHtml(question.prompt)}</h5>}
      {sectionDesc && <RichHtml html={sectionDesc} compact />}
      <RichHtml html={pageContent} compact />
      {sourceQuestions.length > 0 && <QuestionList questions={sourceQuestions} />}
      {question.options.length > 0 && <OptionList options={question.options} />}
      {answer && <AnswerBlock answer={answer} />}
    </article>
  );
}

function QuestionList({ questions }: { questions: Record<string, unknown>[] }) {
  const visibleQuestions = questions
    .map((question, index) => {
      const label = stringValue(question, "questionNo") || stringValue(question, "sort") || `${index + 1}`;
      const title = stringValue(question, "title") || stringValue(question, "content") || "";
      return { label, title, index };
    })
    .filter((question) => !isRedundantBlankQuestion(question.label, question.title));

  if (visibleQuestions.length === 0) return null;

  return (
    <div className="mt-3 space-y-2">
      {visibleQuestions.map((question) => {
        return (
          <div key={`${question.label}-${question.index}`} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
            <div className="mb-1 text-xs font-semibold text-[var(--primary)]">Question {question.label}</div>
            <RichHtml html={question.title} compact />
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
        <div key={`${stringValue(option, "id") || stringValue(option, "optionId") || index}`} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-sm text-[var(--text-soft)]">
          <RichHtml html={stringValue(option, "title") || stringValue(option, "content") || stringValue(option, "value")} compact />
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
  return <div className={cn("max-w-none text-sm leading-7 text-[var(--text-soft)] [&_*]:!border-[var(--border)] [&_*]:!bg-transparent [&_*]:!text-[var(--text-soft)] [&_a]:!text-[var(--primary)] [&_em]:!text-[var(--text)] [&_img]:my-3 [&_img]:max-w-full [&_img]:rounded-[var(--radius-md)] [&_p]:my-2 [&_strong]:!text-[var(--text)] [&_table]:my-3 [&_table]:w-full [&_table]:border-collapse [&_td]:border [&_td]:border-[var(--border)] [&_td]:p-2 [&_th]:border [&_th]:border-[var(--border)] [&_th]:p-2 [&_u]:!text-[var(--text)]", compact && "leading-6")} dangerouslySetInnerHTML={{ __html: normalizeQuestionBlanks(html) }} />;
}

function arrayValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object" && !Array.isArray(item)) : [];
}

function stringValue(record: Record<string, unknown>, key: string) {
  const value = record[key];
  if (typeof value === "string") return value;
  if (typeof value === "number") return `${value}`;
  return "";
}

function stripHtml(value: string) {
  return normalizeQuestionBlanks(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
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

function buildAudioItems({ assets, sections, bookNumber, testNumber }: { assets: IeltsAsset[]; sections: IeltsSection[]; bookNumber?: number; testNumber: number }) {
  const sectionSources = new Map<string, IeltsSection>();
  sections.forEach((section) => {
    const audio = stringValue(section.raw_data, "audio");
    const analysisAudio = stringValue(section.raw_data, "analysisAudio");
    if (audio) sectionSources.set(audio, section);
    if (analysisAudio) sectionSources.set(analysisAudio, section);
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
  return value.replace(/#{2,}\s*-\s*(\d{1,3})\s*-\s*#{2,}/g, "_____$1______");
}
