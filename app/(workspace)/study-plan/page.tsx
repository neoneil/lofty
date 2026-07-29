"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Calendar,
  CheckCircle2,
  Clock3,
  GraduationCap,
  Loader2,
  Sparkles,
  Target,
  TrendingUp,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { BusinessDatePicker } from "@/components/ui-v2/business-date-picker";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";
import { apiGet, apiPut } from "@/lib/api/client";

type ExamType = "PTE" | "IELTS";

type StudyGoal =
  | "485 Work Visa"
  | "190 State Nomination"
  | "Employer Sponsorship"
  | "Skills Assessment"
  | "University Admission"
  | "Other";

type DailyHours = "0-1 Hours" | "1-2 Hours" | "2-4 Hours" | "4+ Hours";

type StudyPlan = {
  id?: string;

  exam_type: ExamType;

  overall_target: string;
  overall_current: string;

  listening_target: string;
  listening_current: string;

  reading_target: string;
  reading_current: string;

  writing_target: string;
  writing_current: string;

  speaking_target: string;
  speaking_current: string;

  exam_deadline: string;

  study_goal: StudyGoal;

  daily_study_hours: DailyHours;

  additional_notes: string;
};

const initialForm: StudyPlan = {
  exam_type: "PTE",

  overall_target: "",
  overall_current: "",

  listening_target: "",
  listening_current: "",

  reading_target: "",
  reading_current: "",

  writing_target: "",
  writing_current: "",

  speaking_target: "",
  speaking_current: "",

  exam_deadline: "",

  study_goal: "485 Work Visa",

  daily_study_hours: "1-2 Hours",

  additional_notes: "",
};

const studyGoalLabels: Record<StudyGoal, string> = {
  "485 Work Visa": "485 工作签证",
  "190 State Nomination": "190 州担保",
  "Employer Sponsorship": "雇主担保",
  "Skills Assessment": "职业评估",
  "University Admission": "大学申请",
  Other: "其他",
};

const dailyHoursLabels: Record<DailyHours, string> = {
  "0-1 Hours": "0-1 小时",
  "1-2 Hours": "1-2 小时",
  "2-4 Hours": "2-4 小时",
  "4+ Hours": "4 小时以上",
};

export default function StudyPlanPage() {
  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [hasExistingPlan, setHasExistingPlan] = useState(false);

  const [saveMessage, setSaveMessage] = useState("");

  const [form, setForm] = useState<StudyPlan>(initialForm);

  const today = useMemo(() => {
    return new Date().toISOString().split("T")[0];
  }, []);

  const daysRemaining = useMemo(() => {
    if (!form.exam_deadline) {
      return null;
    }

    const todayDate = new Date();

    const examDate = new Date(form.exam_deadline);

    const diff = examDate.getTime() - todayDate.getTime();

    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));

    return days > 0 ? days : 0;
  }, [form.exam_deadline]);

  useEffect(() => {
    async function loadStudyPlan() {
      console.log("Loading study plan...");

      setLoading(true);

      try {
        const response = await apiGet<{ plan: StudyPlan | null }>("/api/study-plan");
        const data = response.plan;

        console.log("Fetched study plan:", data);

        if (data) {
        console.log("Existing study plan found.");

        setHasExistingPlan(true);

        setForm({
          id: data.id,

          exam_type: data.exam_type,

          overall_target: data.overall_target?.toString() || "",
          overall_current: data.overall_current?.toString() || "",

          listening_target: data.listening_target?.toString() || "",
          listening_current: data.listening_current?.toString() || "",

          reading_target: data.reading_target?.toString() || "",
          reading_current: data.reading_current?.toString() || "",

          writing_target: data.writing_target?.toString() || "",
          writing_current: data.writing_current?.toString() || "",

          speaking_target: data.speaking_target?.toString() || "",
          speaking_current: data.speaking_current?.toString() || "",

          exam_deadline: data.exam_deadline,

          study_goal: data.study_goal,

          daily_study_hours: data.daily_study_hours,

          additional_notes: data.additional_notes || "",
        });
        } else {
        console.log("No existing study plan found.");

        setHasExistingPlan(false);
        }
      } catch (error) {
        console.error("Study plan fetch error:", error);
      }

      setLoading(false);

      console.log("Study plan load complete.");
    }

    loadStudyPlan();
  }, []);

  function updateField(key: keyof StudyPlan, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.listening_target) {
      return "请填写听力目标分。";
    }

    if (!form.reading_target) {
      return "请填写阅读目标分。";
    }

    if (!form.writing_target) {
      return "请填写写作目标分。";
    }

    if (!form.speaking_target) {
      return "请填写口语目标分。";
    }

    if (!form.overall_target) {
      return "请填写总分目标。";
    }

    if (!form.exam_deadline) {
      return "请选择考试日期。";
    }

    return null;
  }

  async function handleSave() {
    console.log("Saving study plan...");

    const validationError = validateForm();

    if (validationError) {
      console.error("Validation failed:", validationError);

      setSaveMessage(validationError);

      return;
    }

    setSaving(true);

    setSaveMessage("");

    const payload = {
      exam_type: form.exam_type,

      overall_target: Number(form.overall_target),
      overall_current: form.overall_current
        ? Number(form.overall_current)
        : null,

      listening_target: Number(form.listening_target),
      listening_current: form.listening_current
        ? Number(form.listening_current)
        : null,

      reading_target: Number(form.reading_target),
      reading_current: form.reading_current
        ? Number(form.reading_current)
        : null,

      writing_target: Number(form.writing_target),
      writing_current: form.writing_current
        ? Number(form.writing_current)
        : null,

      speaking_target: Number(form.speaking_target),
      speaking_current: form.speaking_current
        ? Number(form.speaking_current)
        : null,

      exam_deadline: form.exam_deadline,

      study_goal: form.study_goal,

      daily_study_hours: form.daily_study_hours,

      additional_notes: form.additional_notes,
    };

    console.log("Payload:", payload);

    try {
      const response = await apiPut<{ plan: StudyPlan; created: boolean }>("/api/study-plan", payload);
      const data = response.plan;

      if (data?.id) {
        setHasExistingPlan(true);

        setForm((prev) => ({
          ...prev,
          id: data.id,
        }));
      }

      setSaveMessage(response.created ? "学习计划已创建。" : "学习计划已更新。");
    } catch (error) {
      console.error("Study plan save error:", error);
      setSaveMessage(error instanceof Error ? error.message : "学习计划保存失败。");
    }

    setSaving(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[var(--bg)]">
        <Loader2 className="animate-spin text-[var(--primary)]" size={28} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 lg:px-6">
        <section className="grid gap-6 lg:grid-cols-[1fr_420px]">
          <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_30%)]" />
            <div className="relative">
              <Badge variant="default">学习计划</Badge>
              <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
                个性化学习路线
              </h1>
              <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
                设置目标分数、考试日期、学习目标和每日学习时间。老师可以根据你的学习档案更准确地安排训练节奏和跟进重点。
              </p>
            </div>
          </div>

          <Card className="rounded-[var(--radius-lg)] bg-[var(--card-soft)]">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle>计划概览</CardTitle>
              <CardDescription>快速查看你当前的目标设置。</CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-3">
              <SnapshotItem label="考试" value={form.exam_type} />
              <SnapshotItem label="目标" value={form.overall_target || "-"} />
              <SnapshotItem
                label="考试日期"
                value={form.exam_deadline || "-"}
              />
              <SnapshotItem
                label="剩余天数"
                value={daysRemaining !== null ? `${daysRemaining}` : "-"}
              />
            </CardContent>
          </Card>
        </section>

        <div className="grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_minmax(420px,0.9fr)]">
          <div className="min-w-0">
            <Card className="h-full min-h-[720px] overflow-hidden rounded-[var(--radius-lg)]">
              <CardHeader className="border-b border-[var(--border)] bg-[var(--card-soft)] pb-5">
                <div>
                  <Badge className="mb-3">智能学习计划</Badge>

                  <CardTitle>你的个性化路线</CardTitle>

                  <CardDescription>
                    根据目标分数、考试时间和每日学习时间生成学习建议。
                  </CardDescription>
                </div>
              </CardHeader>

              <CardContent className="space-y-5 p-5 sm:p-6">
                <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                  <RoadmapMetric
                    icon={<GraduationCap size={17} />}
                    label="考试类型"
                    value={form.exam_type}
                  />
                  <RoadmapMetric
                    icon={<Target size={17} />}
                    label="总分目标"
                    value={form.overall_target || "-"}
                  />
                  <RoadmapMetric
                    icon={<Calendar size={17} />}
                    label="考试日期"
                    value={form.exam_deadline || "-"}
                  />
                  <RoadmapMetric
                    icon={<Clock3 size={17} />}
                    label="剩余天数"
                    value={daysRemaining !== null ? `${daysRemaining} 天` : "-"}
                  />
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                  <div className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                    <TrendingUp size={17} className="text-[var(--primary)]" />
                    学习概览
                  </div>

                  <div className="grid gap-3 text-sm leading-7 text-[var(--text-soft)] sm:grid-cols-2">
                    <SummaryLine label="考试类型" value={form.exam_type} />
                    <SummaryLine
                      label="总分目标"
                      value={form.overall_target || "-"}
                    />
                    <SummaryLine
                      label="考试日期"
                      value={form.exam_deadline || "-"}
                    />
                    <SummaryLine
                      label="每日学习时间"
                      value={dailyHoursLabels[form.daily_study_hours]}
                    />
                    <SummaryLine
                      label="剩余天数"
                      value={
                        daysRemaining !== null ? `${daysRemaining} 天` : "-"
                      }
                    />
                    <SummaryLine
                      label="学习目标"
                      value={studyGoalLabels[form.study_goal]}
                    />
                  </div>
                </div>

                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                  <div className="mb-3 flex items-center gap-2 text-base font-semibold text-[var(--text)]">
                    <Sparkles size={17} className="text-[var(--primary)]" />
                    学习建议
                  </div>

                  <div className="space-y-3 text-sm leading-7 text-[var(--text-soft)]">
                    <SuggestionItem text="每天优先练习高频题型，保持稳定输入和复盘。" />

                    <SuggestionItem text="听力和口语通常最依赖持续练习，建议固定每天训练。" />

                    <SuggestionItem text="随着你完成更多练习，学习路线会更贴合你的真实薄弱项。" />

                    {daysRemaining !== null && daysRemaining <= 30 && (
                      <SuggestionItem text="考试时间较近，建议提高每日复习强度并集中处理高频失分点。" />
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="min-w-0">
            <Card className="overflow-hidden rounded-[var(--radius-lg)]">
              <CardHeader className="border-b border-[var(--border)] bg-[var(--card-soft)] pb-5">
                <div>
                  <Badge variant="secondary" className="mb-3">
                    学习档案
                  </Badge>

                  <CardTitle>个性化学习计划</CardTitle>

                  <CardDescription>
                    根据你的目标考试、目标分数和考试时间，建立更清晰的学习路线。
                  </CardDescription>
                </div>

                <div className={`mt-5 rounded-[var(--radius-lg)] border p-4 text-sm leading-6 ${hasExistingPlan ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--text-soft)]" : "border-[var(--warning)]/25 bg-[var(--warning-soft)] text-[var(--text-soft)]"}`}>
                  {hasExistingPlan ? (
                    <span>
                      当前学习计划已保存。你可以直接修改右侧字段，然后点击 <span className="font-bold text-[var(--text)]">Update plan</span>。
                    </span>
                  ) : (
                    <span>
                      还没有学习计划。请先填写目标分数、考试日期和每日学习时间，系统会生成你的个性化路线。
                    </span>
                  )}
                </div>
              </CardHeader>

              <CardContent className="space-y-6 p-5 sm:p-6">
                <div className="space-y-3">
                  <UpdateSectionTitle icon={<GraduationCap size={16} />} title="考试信息" />

                  <div className="grid grid-cols-2 gap-3">
                    {["PTE", "IELTS"].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => updateField("exam_type", type)}
                        className={`flex h-11 items-center justify-center rounded-[var(--radius-md)] border text-sm font-medium transition-all duration-200 ${
                          form.exam_type === type
                            ? "border-transparent bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                            : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)]"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <UpdateSectionTitle icon={<Target size={16} />} title="目标分数" />

                  <div className="grid grid-cols-2 gap-3">
                    <Input value={form.listening_target} onChange={(e) => updateField("listening_target", e.target.value)} placeholder="听力目标分" />
                    <Input value={form.listening_current} onChange={(e) => updateField("listening_current", e.target.value)} placeholder="听力当前分" />
                    <Input value={form.reading_target} onChange={(e) => updateField("reading_target", e.target.value)} placeholder="阅读目标分" />
                    <Input value={form.reading_current} onChange={(e) => updateField("reading_current", e.target.value)} placeholder="阅读当前分" />
                    <Input value={form.writing_target} onChange={(e) => updateField("writing_target", e.target.value)} placeholder="写作目标分" />
                    <Input value={form.writing_current} onChange={(e) => updateField("writing_current", e.target.value)} placeholder="写作当前分" />
                    <Input value={form.speaking_target} onChange={(e) => updateField("speaking_target", e.target.value)} placeholder="口语目标分" />
                    <Input value={form.speaking_current} onChange={(e) => updateField("speaking_current", e.target.value)} placeholder="口语当前分" />
                    <Input value={form.overall_target} onChange={(e) => updateField("overall_target", e.target.value)} placeholder="总分目标" className="col-span-2" />
                  </div>
                </div>

                <div className="space-y-4">
                  <UpdateSectionTitle icon={<Calendar size={16} />} title="考试日期" />

                  <BusinessDatePicker min={today} value={form.exam_deadline} onChange={(value) => updateField("exam_deadline", value)} placeholder="选择考试日期" />
                </div>

                <div className="space-y-4">
                  <UpdateSectionTitle title="学习目标" />

                  <div className="grid grid-cols-2 gap-3">
                    {[
                      "485 Work Visa",
                      "190 State Nomination",
                      "Employer Sponsorship",
                      "Skills Assessment",
                      "University Admission",
                      "Other",
                    ].map((goal) => (
                      <button
                        key={goal}
                        type="button"
                        onClick={() => updateField("study_goal", goal)}
                        className={`flex min-h-[48px] items-center justify-center rounded-[var(--radius-md)] border px-4 text-center text-sm font-medium transition-all duration-200 ${
                          form.study_goal === goal
                            ? "border-transparent bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                            : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                        }`}
                      >
                        {studyGoalLabels[goal as StudyGoal]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <UpdateSectionTitle icon={<Clock3 size={16} />} title="每日学习时间" />

                  <div className="grid grid-cols-2 gap-3">
                    {["0-1 Hours", "1-2 Hours", "2-4 Hours", "4+ Hours"].map((hour) => (
                      <button
                        key={hour}
                        type="button"
                        onClick={() => updateField("daily_study_hours", hour)}
                        className={`flex h-11 items-center justify-center rounded-[var(--radius-md)] border text-sm font-medium transition-all duration-200 ${
                          form.daily_study_hours === hour
                            ? "border-transparent bg-[var(--primary)] text-white shadow-[var(--shadow-sm)]"
                            : "border-[var(--border)] bg-[var(--card)] text-[var(--text-soft)] hover:bg-[var(--bg-soft)] hover:text-[var(--text)]"
                        }`}
                      >
                        {dailyHoursLabels[hour as DailyHours]}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <UpdateSectionTitle title="补充说明" />

                  <Textarea value={form.additional_notes} onChange={(e) => updateField("additional_notes", e.target.value)} placeholder="可以补充你的备考情况、薄弱项、目标或时间安排..." />
                </div>

                {saveMessage && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm font-medium text-[var(--text-soft)]">
                    {saveMessage}
                  </div>
                )}

                <Button fullWidth onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      保存中...
                    </div>
                  ) : hasExistingPlan ? (
                    "Update plan"
                  ) : (
                    "Create plan"
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

function SnapshotItem({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
      <div className="text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </div>
      <div className="mt-2 truncate text-sm font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function SummaryLine({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
      <span className="font-semibold text-[var(--text)]">{label}:</span>{" "}
      <span>{value || "-"}</span>
    </div>
  );
}

function UpdateSectionTitle({ icon, title }: { icon?: React.ReactNode; title: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
        {icon ? <span className="text-[var(--primary)]">{icon}</span> : null}
        {title}
      </div>
      <Badge variant="secondary" className="text-[10px] uppercase tracking-wide">
        Update
      </Badge>
    </div>
  );
}

function RoadmapMetric({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="mt-4 text-xs font-semibold uppercase tracking-[0.12em] text-[var(--text-soft)]">
        {label}
      </div>
      <div className="mt-1 truncate text-sm font-semibold text-[var(--text)]">
        {value}
      </div>
    </div>
  );
}

function SuggestionItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
      <CheckCircle2
        size={16}
        className="mt-0.5 shrink-0 text-[var(--primary)]"
      />
      <span>{text}</span>
    </div>
  );
}
