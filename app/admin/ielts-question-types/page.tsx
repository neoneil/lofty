import { AlertTriangle, BadgeCheck, BookOpenText, Headphones, Layers3, ListChecks, Search, Target, Timer } from "lucide-react";
import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";
import { requireAdminOrEditor } from "@/lib/auth/require-admin";
import questionTypeData from "@/content/ielts_listening_reading_question_types.json";

type QuestionTypeData = typeof questionTypeData;
type Section = QuestionTypeData["sections"][number];
type QuestionType = Section["question_types"][number];
type PartStructureItem = { part: number; context_cn: string; examples: string[]; typical_difficulty: string };
type TestVariantItem = { id: string; name_cn: string; name_en: string; description_cn: string };

function formatDifficulty(value: string) {
  const map: Record<string, string> = {
    easy: "基础",
    easy_to_medium: "基础-中等",
    medium: "中等",
    medium_to_hard: "中等-较难",
    hard: "较难",
  };
  return map[value] ?? value.replaceAll("_", " ");
}

function SectionIcon({ sectionId, size = 20 }: { sectionId: string; size?: number }) {
  return sectionId === "listening" ? <Headphones size={size} /> : <BookOpenText size={size} />;
}

function getSectionTone(sectionId: string) {
  return sectionId === "listening" ? "from-[var(--primary-soft)] via-[var(--card)] to-[var(--bg-soft)]" : "from-[var(--success-soft)] via-[var(--card)] to-[var(--bg-soft)]";
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string | number; icon: typeof Target }) {
  return <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]"><div className="flex items-center justify-between gap-3"><p className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-faint)]">{label}</p><span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><Icon size={17} /></span></div><p className="mt-3 text-2xl font-bold text-[var(--text)]">{value}</p></div>;
}

function TagList({ items, variant = "secondary" }: { items: string[]; variant?: "secondary" | "outline" | "default" }) {
  if (!items.length) return null;
  return <div className="flex flex-wrap gap-2">{items.map((item) => <Badge key={item} variant={variant}>{item}</Badge>)}</div>;
}

function getTypicalParts(item: QuestionType) {
  return "typical_parts" in item && Array.isArray(item.typical_parts) ? item.typical_parts : [];
}

function getPartStructure(section: Section): PartStructureItem[] {
  return "part_structure" in section && Array.isArray(section.part_structure) ? section.part_structure : [];
}

function getTestVariants(section: Section): TestVariantItem[] {
  return "test_variants" in section && Array.isArray(section.test_variants) ? section.test_variants : [];
}

function TextList({ title, items, icon: Icon }: { title: string; items: string[]; icon: typeof Target }) {
  if (!items.length) return null;
  return <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Icon size={15} className="text-[var(--primary)]" />{title}</div><ul className="space-y-2">{items.map((item) => <li key={item} className="rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2 text-sm leading-6 text-[var(--text-soft)]">{item}</li>)}</ul></div>;
}

function QuestionTypeCard({ item }: { item: QuestionType }) {
  const keywords = item.frontend?.search_keywords ?? [];
  const typicalParts = getTypicalParts(item);
  return <Card className="h-full rounded-[var(--radius-lg)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)]"><CardHeader className="flex-col items-start gap-3 border-b border-[var(--border)]"><div className="flex w-full flex-wrap items-start justify-between gap-3"><div><Badge>{item.frontend?.badge ?? item.short_name}</Badge><CardTitle className="mt-3 text-lg">{item.name_cn}</CardTitle><CardDescription className="mt-1">{item.name_en}</CardDescription></div><Badge variant="outline">{formatDifficulty(item.difficulty)}</Badge></div><p className="text-sm leading-7 text-[var(--text-soft)]">{item.description_cn}</p></CardHeader><CardContent className="space-y-5 p-5"><div className="grid gap-3 sm:grid-cols-2"><div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><p className="text-xs font-semibold text-[var(--text-faint)]">答案形式</p><p className="mt-1 text-sm font-semibold leading-6 text-[var(--text)]">{item.answer_format}</p></div><div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3"><p className="text-xs font-semibold text-[var(--text-faint)]">官方题族</p><p className="mt-1 text-sm font-semibold leading-6 text-[var(--text)]">{item.official_family.replaceAll("_", " ")}</p></div></div>{typicalParts.length ? <div><p className="mb-2 text-sm font-semibold text-[var(--text)]">常见部分</p><TagList items={typicalParts.map((part) => `Part ${part}`)} /></div> : null}<div><p className="mb-2 text-sm font-semibold text-[var(--text)]">考察能力</p><TagList items={item.skills_tested} variant="outline" /></div><TextList title="解题技巧" items={item.strategies} icon={ListChecks} /><TextList title="常见陷阱" items={item.common_traps} icon={AlertTriangle} />{keywords.length ? <div><div className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]"><Search size={15} className="text-[var(--primary)]" />搜索关键词</div><TagList items={keywords} variant="secondary" /></div> : null}</CardContent></Card>;
}

function SectionBlock({ section }: { section: Section }) {
  const overview = section.overview;
  const isListening = section.id === "listening";
  const partStructure = getPartStructure(section);
  const testVariants = getTestVariants(section);

  return <section id={section.id} className="scroll-mt-24 space-y-6"><div className={`rounded-[var(--radius-xl)] border border-[var(--border)] bg-gradient-to-br ${getSectionTone(section.id)} p-5 shadow-[var(--shadow-sm)] sm:p-7`}><div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"><div><div className="flex items-center gap-3"><span className="flex h-11 w-11 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"><SectionIcon sectionId={section.id} /></span><div><Badge variant="secondary">{section.name_en}</Badge><h2 className="mt-2 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">{section.name_cn}</h2></div></div><p className="mt-5 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{isListening ? questionTypeData.source_scope.listening : questionTypeData.source_scope.reading}</p></div><Badge variant="default">{section.question_types.length} 个题型</Badge></div><div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4"><StatCard label="考试时长" value={overview.duration_minutes ? `${overview.duration_minutes} 分钟` : "60 分钟"} icon={Timer} /><StatCard label="题目数量" value={overview.question_count} icon={Target} /><StatCard label={isListening ? "Part 数量" : "文章数量"} value={isListening ? overview.parts ?? "-" : "3"} icon={Layers3} /><StatCard label={isListening ? "播放次数" : "考试版本"} value={isListening ? overview.audio_played_times ?? "-" : "A / GT"} icon={BadgeCheck} /></div></div>{partStructure.length ? <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">{partStructure.map((part) => <div key={part.part} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-4 shadow-[var(--shadow-sm)]"><Badge>Part {part.part}</Badge><p className="mt-3 text-sm font-semibold leading-6 text-[var(--text)]">{part.context_cn}</p><p className="mt-2 text-xs text-[var(--text-faint)]">{formatDifficulty(part.typical_difficulty)}</p><div className="mt-3 flex flex-wrap gap-2">{part.examples.map((example) => <Badge key={example} variant="secondary">{example}</Badge>)}</div></div>)}</div> : null}{testVariants.length ? <div className="grid gap-3 md:grid-cols-2">{testVariants.map((variant) => <div key={variant.id} className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]"><Badge>{variant.name_en}</Badge><h3 className="mt-3 text-lg font-semibold text-[var(--text)]">{variant.name_cn}</h3><p className="mt-2 text-sm leading-7 text-[var(--text-soft)]">{variant.description_cn}</p></div>)}</div> : null}<Card className="rounded-[var(--radius-xl)]"><CardHeader className="flex-col items-start gap-1"><CardTitle>全局解题原则</CardTitle><CardDescription>适用于本模块的大方向技巧，适合课前导入或复习。</CardDescription></CardHeader><CardContent><div className="grid gap-3 md:grid-cols-2">{section.global_strategies.map((strategy, index) => <div key={strategy} className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4"><span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--primary)] text-xs font-bold text-white">{index + 1}</span><p className="text-sm leading-7 text-[var(--text-soft)]">{strategy}</p></div>)}</div></CardContent></Card><div className="grid gap-5 xl:grid-cols-2">{section.question_types.map((item) => <QuestionTypeCard key={item.id} item={item} />)}</div></section>;
}

export default async function IeltsQuestionTypesAdminPage() {
  await requireAdminOrEditor("/admin/ielts-question-types");

  return <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8"><section className="mx-auto max-w-7xl space-y-8"><div className="rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-md)] sm:p-8"><div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between"><div><Badge>IELTS Teacher Toolkit</Badge><h1 className="mt-4 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">{questionTypeData.title_cn}</h1><p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{questionTypeData.title_en}</p><p className="mt-3 max-w-4xl text-sm leading-7 text-[var(--text-soft)]">{questionTypeData.source_scope.note}</p></div><div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]"><p className="font-semibold text-[var(--text)]">Updated: {questionTypeData.updated_at}</p><p className="mt-1">Schema: {questionTypeData.schema_version}</p></div></div><div className="mt-6 flex flex-wrap gap-2">{questionTypeData.intended_use.map((item) => <Badge key={item} variant="secondary">{item}</Badge>)}</div></div><div className="grid gap-4 md:grid-cols-2">{questionTypeData.sections.map((section) => <a key={section.id} href={`#${section.id}`} className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)]"><div className="flex items-start justify-between gap-4"><div><Badge variant="secondary">{section.name_en}</Badge><h2 className="mt-3 text-xl font-bold text-[var(--text)] group-hover:text-[var(--primary)]">{section.name_cn}</h2><p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">{section.question_types.length} 个题型 · {section.global_strategies.length} 条全局技巧</p></div><span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]"><SectionIcon sectionId={section.id} /></span></div></a>)}</div>{questionTypeData.sections.map((section) => <SectionBlock key={section.id} section={section} />)}</section></main>;
}
