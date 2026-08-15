"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { AlertTriangle, CalendarDays, CheckCircle2, Clock3, GraduationCap, Laptop, Loader2, MapPin, Save, Search, ShieldAlert, Smartphone, Target, Trash2, X } from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { BusinessDatePicker } from "@/components/ui-v2/business-date-picker";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";

type StudyPlanRecord = {
  id: string;
  user_id: string;
  exam_type: "PTE" | "IELTS" | string;
  overall_target: number | null;
  overall_current: number | null;
  listening_target: number | null;
  listening_current: number | null;
  reading_target: number | null;
  reading_current: number | null;
  writing_target: number | null;
  writing_current: number | null;
  speaking_target: number | null;
  speaking_current: number | null;
  exam_deadline: string | null;
  study_goal: string | null;
  daily_study_hours: string | null;
  additional_notes: string | null;
  created_at: string | null;
  updated_at: string | null;
};

type StudentPlanRow = {
  userId: string;
  email: string | null;
  fullName: string | null;
  avatarUrl: string | null;
  role: string | null;
  isMyStudent: boolean | null;
  authCreatedAt: string | null;
  profileCreatedAt: string | null;
  lastSignInAt: string | null;
  deviceCount: number;
  latestDevice: StudentLoginDeviceSummary | null;
  examType: "PTE" | "IELTS" | null;
  plan: StudyPlanRecord | null;
};

type StudentLoginDeviceSummary = {
  deviceLabel: string | null;
  deviceType: string | null;
  browserName: string | null;
  osName: string | null;
  country: string | null;
  city: string | null;
  lastSeenAt: string | null;
  lastLoginAt: string | null;
  isTrusted: boolean | null;
  isBlocked: boolean | null;
};

type StudentLoginDeviceDetail = StudentLoginDeviceSummary & {
  id: string;
  deviceId: string;
  ipAddress: string | null;
  firstSeenAt: string | null;
  revokedAt: string | null;
  currentPath: string | null;
  currentTitle: string | null;
  currentPathSeenAt: string | null;
  isOnline: boolean;
};

type StudentLoginEventDetail = {
  id: string;
  userDeviceId: string | null;
  deviceId: string | null;
  eventType: string | null;
  loginMethod: string | null;
  result: string | null;
  isNewDevice: boolean | null;
  attemptedEmail: string | null;
  ipAddress: string | null;
  country: string | null;
  region: string | null;
  city: string | null;
  timezone: string | null;
  userAgent: string | null;
  createdAt: string | null;
};

type StudentLoginAuditDetail = {
  userId: string;
  email: string | null;
  deviceCount: number;
  recentLoginCount: number;
  activeDeviceCount30d: number;
  onlineDeviceCount: number;
  todayActiveSeconds: number;
  countryCount30d: number;
  failedLoginCount24h: number;
  hasBlockedDevice: boolean;
  isAbnormal: boolean;
  abnormalReasons: string[];
  devices: StudentLoginDeviceDetail[];
  recentEvents: StudentLoginEventDetail[];
};

type StudentDeletionPreview = {
  userId: string;
  email: string | null;
  displayName: string;
  authUserExists: boolean;
  r2AudioObjects: number;
  totalDatabaseRows: number;
  tables: Array<{
    schema: string;
    table: string;
    label: string;
    count: number;
  }>;
};

type StudentDeletionResult = {
  preview: StudentDeletionPreview;
  deletedRows: Record<string, number>;
  authUserDeleted: boolean;
  deletedR2AudioObjects: number;
  r2Errors: string[];
};

type Props = {
  initialRows: StudentPlanRow[];
};

type FormState = {
  id: string | null;
  exam_type: "PTE" | "IELTS" | "";
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
  study_goal: string;
  daily_study_hours: string;
  additional_notes: string;
};

const emptyForm: FormState = {
  id: null,
  exam_type: "",
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

const studyGoalOptions = [
  "485 Work Visa",
  "190 State Nomination",
  "Employer Sponsorship",
  "Skills Assessment",
  "University Admission",
  "Other",
];

const dailyHoursOptions = ["0-1 Hours", "1-2 Hours", "2-4 Hours", "4+ Hours"];

const deletionRowLabels: Record<string, string> = {
  chat_messages: "聊天消息",
  selective_writing_reviews: "写作 AI 批改结果",
  selective_writing_submissions: "写作提交文章",
  zoom_notifications: "课堂通知",
  zoom_classrooms: "课堂记录",
  pte_speaking_attempts: "PTE 口语评分记录",
  student_recordings: "学生录音索引",
  student_attempts: "答题 / 提交记录",
  student_question_stats: "题目练习统计",
  student_wrong_questions: "错题本记录",
  study_plans: "学习计划",
  ai_usage_logs: "AI 使用日志",
  ai_user_limits: "AI 额度设置",
  user_activity_daily: "每日活跃统计",
  login_events: "登录事件",
  user_devices: "登录设备",
  chat_sessions: "聊天会话",
  profiles: "学生 Profile",
};

function getDisplayName(row: StudentPlanRow) {
  return row.fullName?.trim() || row.email?.trim() || row.userId;
}

function planToForm(plan: StudyPlanRecord | null, examType?: "PTE" | "IELTS" | null): FormState {
  if (!plan) return { ...emptyForm, exam_type: examType ?? "" };

  return {
    id: plan.id,
    exam_type: examType ?? (plan.exam_type === "IELTS" ? "IELTS" : plan.exam_type === "PTE" ? "PTE" : ""),
    overall_target: plan.overall_target?.toString() ?? "",
    overall_current: plan.overall_current?.toString() ?? "",
    listening_target: plan.listening_target?.toString() ?? "",
    listening_current: plan.listening_current?.toString() ?? "",
    reading_target: plan.reading_target?.toString() ?? "",
    reading_current: plan.reading_current?.toString() ?? "",
    writing_target: plan.writing_target?.toString() ?? "",
    writing_current: plan.writing_current?.toString() ?? "",
    speaking_target: plan.speaking_target?.toString() ?? "",
    speaking_current: plan.speaking_current?.toString() ?? "",
    exam_deadline: plan.exam_deadline ?? "",
    study_goal: plan.study_goal ?? "485 Work Visa",
    daily_study_hours: plan.daily_study_hours ?? "1-2 Hours",
    additional_notes: plan.additional_notes ?? "",
  };
}

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  });
}

function formatDateTime(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleString("zh-CN", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatActiveDuration(seconds: number | null | undefined) {
  const totalSeconds = Math.max(0, Math.floor(Number(seconds ?? 0)));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  if (hours > 0) return `${hours}h ${minutes}m`;
  return `${minutes}m`;
}

function getDaysLeft(value: string) {
  if (!value) return "—";
  const diff = new Date(value).getTime() - Date.now();
  if (!Number.isFinite(diff)) return "—";
  return `${Math.max(0, Math.ceil(diff / 86_400_000))} 天`;
}

function scoreProgress(current: string, target: string) {
  const currentNumber = Number(current);
  const targetNumber = Number(target);
  if (!Number.isFinite(currentNumber) || !Number.isFinite(targetNumber) || targetNumber <= 0) return 0;
  return Math.max(0, Math.min(100, Math.round((currentNumber / targetNumber) * 100)));
}

export function StudentPlanManagementClient({ initialRows }: Props) {
  const [rows, setRows] = useState(initialRows);
  const [selectedUserId, setSelectedUserId] = useState(initialRows[0]?.userId ?? "");
  const [search, setSearch] = useState("");
  const [form, setForm] = useState<FormState>(() => planToForm(initialRows[0]?.plan ?? null, initialRows[0]?.examType ?? null));
  const [saving, setSaving] = useState(false);
  const [examTypeSaving, setExamTypeSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [deletePreview, setDeletePreview] = useState<StudentDeletionPreview | null>(null);
  const [deleteResult, setDeleteResult] = useState<StudentDeletionResult | null>(null);
  const [deleteConfirmation, setDeleteConfirmation] = useState("");
  const [deleteMessage, setDeleteMessage] = useState("");
  const [deviceDialogOpen, setDeviceDialogOpen] = useState(false);
  const [deviceAudit, setDeviceAudit] = useState<StudentLoginAuditDetail | null>(null);
  const [deviceAuditLoading, setDeviceAuditLoading] = useState(false);
  const [deviceAuditMessage, setDeviceAuditMessage] = useState("");

  const selectedStudent = useMemo(() => rows.find((row) => row.userId === selectedUserId) ?? rows[0] ?? null, [rows, selectedUserId]);

  const filteredRows = useMemo(() => {
    const keyword = search.trim().toLowerCase();
    if (!keyword) return rows;

    return rows.filter((row) => {
      const haystack = [row.userId, row.email, row.fullName, row.examType, row.plan?.study_goal].filter(Boolean).join(" ").toLowerCase();
      return haystack.includes(keyword);
    });
  }, [rows, search]);

  const stats = useMemo(() => {
    const withPlans = rows.filter((row) => row.plan).length;
    const ptePlans = rows.filter((row) => row.examType === "PTE").length;
    const ieltsPlans = rows.filter((row) => row.examType === "IELTS").length;

    return {
      total: rows.length,
      withPlans,
      withoutPlans: rows.length - withPlans,
      ptePlans,
      ieltsPlans,
    };
  }, [rows]);

  function selectStudent(row: StudentPlanRow) {
    setSelectedUserId(row.userId);
    setForm(planToForm(row.plan, row.examType));
    setSaveMessage("");
    setDeletePreview(null);
    setDeleteResult(null);
    setDeleteConfirmation("");
    setDeleteMessage("");
    setDeviceDialogOpen(false);
    setDeviceAudit(null);
    setDeviceAuditMessage("");
  }

  function updateField(key: keyof FormState, value: string) {
    setForm((current) => ({
      ...current,
      [key]: value,
    }));
  }

  async function updateExamType(nextExamType: string) {
    if (!selectedStudent) return;
    if (nextExamType !== "IELTS" && nextExamType !== "PTE") return;

    const normalizedExamType = nextExamType;
    const previousExamType = form.exam_type;
    setForm((current) => ({ ...current, exam_type: normalizedExamType }));
    setExamTypeSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(`/api/admin/student-plans/${selectedStudent.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          exam_type_only: true,
          exam_type: normalizedExamType,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "考试类型保存失败。");
      }

      const savedExamType = json.examType === "IELTS" ? "IELTS" : "PTE";
      setRows((current) => current.map((row) => {
        if (row.userId !== selectedStudent.userId) return row;
        return {
          ...row,
          examType: savedExamType,
          plan: row.plan ? { ...row.plan, exam_type: savedExamType } : row.plan,
        };
      }));
      setForm((current) => ({ ...current, exam_type: savedExamType }));
      setSaveMessage(`考试类型已保存到 Profile：${savedExamType}`);
    } catch (error) {
      setForm((current) => ({ ...current, exam_type: previousExamType }));
      setSaveMessage(error instanceof Error ? error.message : "考试类型保存失败。");
    } finally {
      setExamTypeSaving(false);
    }
  }

  async function savePlan() {
    if (!selectedStudent) return;

    if (!form.exam_type) {
      setSaveMessage("请先选择考试类型。");
      return;
    }

    if (!form.overall_target || !form.listening_target || !form.reading_target || !form.writing_target || !form.speaking_target || !form.exam_deadline) {
      setSaveMessage("考试类型已保存到 Profile；学习计划需要填写目标分和考试日期后再保存。");
      return;
    }

    setSaving(true);
    setSaveMessage("");

    try {
      const response = await fetch(`/api/admin/student-plans/${selectedStudent.userId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(form),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "保存失败。");
      }

      const savedPlan = json.plan as StudyPlanRecord;
      const savedExamType = json.examType === "IELTS" ? "IELTS" : "PTE";
      setRows((current) => current.map((row) => (row.userId === selectedStudent.userId ? { ...row, examType: savedExamType, plan: savedPlan } : row)));
      setForm(planToForm(savedPlan, savedExamType));
      setSaveMessage("学习计划已保存。");
    } catch (error) {
      setSaveMessage(error instanceof Error ? error.message : "保存失败。");
    } finally {
      setSaving(false);
    }
  }

  async function loadDeletePreview() {
    if (!selectedStudent) return;

    setPreviewLoading(true);
    setDeleteMessage("");
    setDeletePreview(null);
    setDeleteResult(null);

    try {
      const response = await fetch(`/api/admin/student-plans/${selectedStudent.userId}/deletion-preview`);
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "读取删除预览失败。");
      }

      setDeletePreview(json.preview as StudentDeletionPreview);
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "读取删除预览失败。");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function deleteStudent() {
    if (!selectedStudent) return;

    setDeleting(true);
    setDeleteMessage("");

    try {
      const response = await fetch(`/api/admin/student-plans/${selectedStudent.userId}`, {
        method: "DELETE",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          confirmation: deleteConfirmation,
        }),
      });
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "删除失败。");
      }

      const nextRows = rows.filter((row) => row.userId !== selectedStudent.userId);
      setRows(nextRows);
      setSelectedUserId(nextRows[0]?.userId ?? "");
      setForm(planToForm(nextRows[0]?.plan ?? null, nextRows[0]?.examType ?? null));
      setDeletePreview(null);
      setDeleteResult(json.result as StudentDeletionResult);
      setDeleteConfirmation("");
      setDeleteMessage("学生与相关数据已删除。");
    } catch (error) {
      setDeleteMessage(error instanceof Error ? error.message : "删除失败。");
    } finally {
      setDeleting(false);
    }
  }

  async function openDeviceAudit() {
    if (!selectedStudent) return;

    setDeviceDialogOpen(true);
    setDeviceAuditLoading(true);
    setDeviceAuditMessage("");

    try {
      const response = await fetch(`/api/admin/student-plans/${selectedStudent.userId}/login-audit`);
      const json = await response.json();

      if (!response.ok || !json.ok) {
        throw new Error(json.message ?? "读取登录设备详情失败。");
      }

      setDeviceAudit(json.audit as StudentLoginAuditDetail);
    } catch (error) {
      setDeviceAuditMessage(error instanceof Error ? error.message : "读取登录设备详情失败。");
    } finally {
      setDeviceAuditLoading(false);
    }
  }

  const selectedDisplayName = selectedStudent ? getDisplayName(selectedStudent) : "未选择学生";
  const confirmationTarget = selectedStudent?.email || selectedStudent?.userId || "";
  const completion = scoreProgress(form.overall_current, form.overall_target);
  const latestDevice = selectedStudent?.latestDevice ?? null;

  return (
    <div className="space-y-6">
      <section className="overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
        <div className="grid gap-0 lg:grid-cols-[1.35fr_0.65fr]">
          <div className="p-5 sm:p-7">
            <Badge variant="default">Admin Operations</Badge>
            <h1 className="mt-4 text-2xl font-bold tracking-tight text-[var(--text)] sm:text-3xl">学生计划管理</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">集中查看、编辑和维护学生学习计划。删除学生前会显示数据库与私有音频影响范围。</p>
          </div>
          <div className="grid grid-cols-2 gap-3 border-t border-[var(--border)] bg-[var(--bg-soft)] p-5 lg:border-l lg:border-t-0">
            <Metric label="学生" value={stats.total} />
            <Metric label="已有计划" value={stats.withPlans} />
            <Metric label="PTE" value={stats.ptePlans} />
            <Metric label="IELTS" value={stats.ieltsPlans} />
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
        <section className="min-w-0 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <div className="border-b border-[var(--border)] p-4">
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-faint)]" size={17} />
              <Input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search students..." className="pl-10" />
            </div>
          </div>

          <div className="max-h-[72vh] space-y-2 overflow-y-auto p-3">
            {filteredRows.length === 0 ? (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-5 text-sm text-[var(--text-soft)]">没有匹配的学生。</div>
            ) : (
              filteredRows.map((row) => {
                const active = row.userId === selectedStudent?.userId;
                const displayName = getDisplayName(row);

                return (
                  <button key={row.userId} type="button" onClick={() => selectStudent(row)} className={`flex w-full items-center gap-3 rounded-[var(--radius-md)] border p-3 text-left transition ${active ? "border-[var(--primary)] bg-[var(--primary-soft)]" : "border-[var(--border)] bg-[var(--bg-soft)] hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)]"}`}>
                    {row.avatarUrl ? <Image src={row.avatarUrl} alt={displayName} referrerPolicy="no-referrer" width={40} height={40} unoptimized className="h-10 w-10 shrink-0 rounded-[var(--radius-md)] border border-[var(--border)] object-cover" /> : <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] text-sm font-black text-[var(--primary)]">{displayName.slice(0, 1).toUpperCase()}</span>}
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-bold text-[var(--text)]">{displayName}</span>
                      <span className="mt-1 block truncate text-xs text-[var(--text-soft)]">{row.email || row.userId}</span>
                    </span>
                    <span className="shrink-0 text-right">
                      <Badge variant={row.examType ? "success" : "secondary"} className="text-[10px]">{row.examType ?? "null"}</Badge>
                      <span className="mt-1 block text-[10px] text-[var(--text-faint)]">{formatDate(row.plan?.updated_at ?? row.lastSignInAt)}</span>
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </section>

        <section className="min-w-0 space-y-5">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline">Selected Student</Badge>
                  {selectedStudent?.isMyStudent ? <Badge variant="success">内部学生</Badge> : null}
                </div>
                <h2 className="mt-3 truncate text-xl font-bold text-[var(--text)]">{selectedDisplayName}</h2>
                <p className="mt-1 truncate text-sm text-[var(--text-soft)]">{selectedStudent?.email || selectedStudent?.userId || "—"}</p>
              </div>
              <div className="grid gap-2 sm:grid-cols-3 lg:min-w-[440px]">
                <SummaryPill icon={GraduationCap} label="考试" value={form.exam_type || "null"} />
                <SummaryPill icon={Target} label="目标" value={form.overall_target || "—"} />
                <SummaryPill icon={Clock3} label="剩余" value={getDaysLeft(form.exam_deadline)} />
              </div>
            </div>

            <div className="mt-5 h-2 overflow-hidden rounded-full bg-[var(--bg-soft)]">
              <div className="h-full rounded-full bg-[var(--primary)] transition-all" style={{ width: `${completion}%` }} />
            </div>
          </div>

          <button type="button" onClick={openDeviceAudit} disabled={!selectedStudent} className="w-full rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 text-left shadow-[var(--shadow-sm)] transition hover:border-[var(--primary)]/35 hover:bg-[var(--card-hover)] disabled:cursor-not-allowed disabled:opacity-70">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[var(--text)]">
                  <Laptop size={18} className="text-[var(--primary)]" />
                  <h3 className="text-lg font-bold">登录设备</h3>
                </div>
                <p className="mt-1 text-sm text-[var(--text-soft)]">根据服务端登录记录识别常用设备和最近活跃。</p>
              </div>
              <Badge variant={selectedStudent?.deviceCount ? "success" : "secondary"}>{selectedStudent?.deviceCount ?? 0} 台设备</Badge>
            </div>

            {latestDevice ? (
              <div className="grid gap-3 lg:grid-cols-3">
                <SummaryPill icon={Laptop} label="最近设备" value={latestDevice.deviceLabel || latestDevice.deviceType || "Unknown"} />
                <SummaryPill icon={Clock3} label="最后活跃" value={formatDate(latestDevice.lastSeenAt ?? latestDevice.lastLoginAt)} />
                <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
                  <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-faint)]">
                    <MapPin size={14} className="text-[var(--primary)]" />
                    位置
                  </div>
                  <div className="mt-1 truncate text-base font-black text-[var(--text)]">{[latestDevice.city, latestDevice.country].filter(Boolean).join(", ") || "—"}</div>
                </div>
              </div>
            ) : (
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-sm text-[var(--text-soft)]">该学生还没有新的设备审计记录。下一次登录或邮箱确认后会自动生成。</div>
            )}
          </button>

          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-lg font-bold text-[var(--text)]">学习计划</h3>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{form.id ? "编辑现有计划" : "为该学生创建计划"}</p>
              </div>
              <Button type="button" onClick={savePlan} disabled={!selectedStudent || saving || examTypeSaving} className="gap-2">
                {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                保存
              </Button>
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
                考试类型
                <select value={form.exam_type} disabled={!selectedStudent || examTypeSaving} onChange={(event) => updateExamType(event.target.value)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)] disabled:cursor-not-allowed disabled:opacity-65">
                  <option value="">null / 未设置</option>
                  <option value="PTE">PTE</option>
                  <option value="IELTS">IELTS</option>
                </select>
                {examTypeSaving ? <span className="text-xs font-medium text-[var(--primary)]">正在保存到 Profile...</span> : null}
              </label>
              <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
                考试日期
                <BusinessDatePicker value={form.exam_deadline} onChange={(value) => updateField("exam_deadline", value)} placeholder="选择考试日期" />
              </label>
              <ScoreFields label="Overall" target={form.overall_target} current={form.overall_current} onTargetChange={(value) => updateField("overall_target", value)} onCurrentChange={(value) => updateField("overall_current", value)} />
              <ScoreFields label="Listening" target={form.listening_target} current={form.listening_current} onTargetChange={(value) => updateField("listening_target", value)} onCurrentChange={(value) => updateField("listening_current", value)} />
              <ScoreFields label="Reading" target={form.reading_target} current={form.reading_current} onTargetChange={(value) => updateField("reading_target", value)} onCurrentChange={(value) => updateField("reading_current", value)} />
              <ScoreFields label="Writing" target={form.writing_target} current={form.writing_current} onTargetChange={(value) => updateField("writing_target", value)} onCurrentChange={(value) => updateField("writing_current", value)} />
              <ScoreFields label="Speaking" target={form.speaking_target} current={form.speaking_current} onTargetChange={(value) => updateField("speaking_target", value)} onCurrentChange={(value) => updateField("speaking_current", value)} />
              <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
                学习目标
                <select value={form.study_goal} onChange={(event) => updateField("study_goal", event.target.value)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]">
                  {studyGoalOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
              <label className="space-y-2 text-sm font-semibold text-[var(--text)]">
                每日学习时间
                <select value={form.daily_study_hours} onChange={(event) => updateField("daily_study_hours", event.target.value)} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]">
                  {dailyHoursOptions.map((option) => <option key={option} value={option}>{option}</option>)}
                </select>
              </label>
            </div>

            <label className="mt-4 block space-y-2 text-sm font-semibold text-[var(--text)]">
              补充说明
              <Textarea value={form.additional_notes} onChange={(event) => updateField("additional_notes", event.target.value)} placeholder="Teacher notes..." />
            </label>

            {saveMessage ? <div className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold ${saveMessage.includes("已") ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{saveMessage}</div> : null}
          </div>

          <div className="rounded-[var(--radius-lg)] border border-[var(--danger)]/25 bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="flex items-center gap-2 text-[var(--danger)]">
                  <ShieldAlert size={18} />
                  <h3 className="text-lg font-bold">Remove</h3>
                  <Badge variant="danger" className="text-[10px] uppercase tracking-wide">Student</Badge>
                </div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">此操作会删除学生账号、学习计划、练习记录、AI 记录、课堂/聊天记录和私有录音对象。</p>
              </div>
              <Button type="button" variant="secondary" onClick={loadDeletePreview} disabled={!selectedStudent || previewLoading} className="gap-2">
                {previewLoading ? <Loader2 className="animate-spin" size={16} /> : <AlertTriangle size={16} />}
                预览影响
              </Button>
            </div>

            {deletePreview ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="grid gap-3 sm:grid-cols-3">
                  <Metric label="数据库行" value={deletePreview.totalDatabaseRows} />
                  <Metric label="R2 音频" value={deletePreview.r2AudioObjects} />
                  <Metric label="Auth 账号" value={deletePreview.authUserExists ? 1 : 0} />
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {deletePreview.tables.map((item) => (
                    <div key={`${item.schema}.${item.table}`} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs">
                      <span className="font-semibold text-[var(--text-soft)]">{item.label}</span>
                      <span className="font-black text-[var(--text)]">{item.count}</span>
                    </div>
                  ))}
                </div>
                <div className="mt-4 grid gap-3 lg:grid-cols-[1fr_auto]">
                  <Input value={deleteConfirmation} onChange={(event) => setDeleteConfirmation(event.target.value)} placeholder={`输入 ${confirmationTarget}`} />
                  <Button type="button" variant="danger" onClick={deleteStudent} disabled={!selectedStudent || deleting || deleteConfirmation !== confirmationTarget} className="gap-2">
                    {deleting ? <Loader2 className="animate-spin" size={16} /> : <Trash2 size={16} />}
                    Remove
                  </Button>
                </div>
              </div>
            ) : null}

            {deleteResult ? (
              <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--success)]/25 bg-[var(--success-soft)] p-4">
                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <div className="flex items-center gap-2 text-[var(--success)]">
                      <CheckCircle2 size={17} />
                      <h4 className="font-bold">删除回执</h4>
                    </div>
                    <p className="mt-1 text-sm text-[var(--text-soft)]">{deleteResult.preview.displayName} 的学生数据清理已执行完成。</p>
                  </div>
                  <div className="grid grid-cols-3 gap-2 sm:min-w-[360px]">
                    <Metric label="DB 删除" value={Object.values(deleteResult.deletedRows).reduce((sum, value) => sum + value, 0)} />
                    <Metric label="R2 删除" value={deleteResult.deletedR2AudioObjects} />
                    <Metric label="Auth 删除" value={deleteResult.authUserDeleted ? 1 : 0} />
                  </div>
                </div>
                <div className="mt-4 grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                  {Object.entries(deleteResult.deletedRows).map(([key, count]) => (
                    <div key={key} className="flex items-center justify-between rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--card)] px-3 py-2 text-xs">
                      <span className="font-semibold text-[var(--text-soft)]">{deletionRowLabels[key] ?? key}</span>
                      <span className="font-black text-[var(--text)]">{count}</span>
                    </div>
                  ))}
                </div>
                {deleteResult.r2Errors.length > 0 ? (
                  <div className="mt-4 rounded-[var(--radius-sm)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] p-3 text-xs font-semibold text-[var(--danger)]">
                    R2 有 {deleteResult.r2Errors.length} 个对象删除失败：{deleteResult.r2Errors.join("；")}
                  </div>
                ) : null}
              </div>
            ) : null}

            {deleteMessage ? <div className={`mt-4 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold ${deleteMessage.includes("已") ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{deleteMessage}</div> : null}
          </div>
        </section>
      </div>

      {deviceDialogOpen ? (
        <div className="fixed inset-0 z-[170] flex items-end bg-black/50 px-0 backdrop-blur-sm sm:items-center sm:px-4">
          <div className="max-h-[92dvh] w-full overflow-hidden rounded-t-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-lg)] sm:mx-auto sm:max-w-5xl sm:rounded-[var(--radius-xl)]">
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] px-5 py-4 sm:px-6">
              <div>
                <Badge variant={deviceAudit?.isAbnormal ? "danger" : "success"}>{deviceAudit?.isAbnormal ? "需要关注" : "正常"}</Badge>
                <h3 className="mt-3 text-xl font-black text-[var(--text)]">设备管理详情</h3>
                <p className="mt-1 text-sm text-[var(--text-soft)]">{selectedDisplayName} · {selectedStudent?.email || selectedStudent?.userId}</p>
              </div>
              <button type="button" onClick={() => setDeviceDialogOpen(false)} className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-[var(--text-soft)] transition hover:bg-[var(--bg-soft)] hover:text-[var(--text)]">
                <X size={18} />
              </button>
            </div>

            <div className="max-h-[calc(92dvh-92px)] overflow-y-auto p-5 pb-[calc(1.25rem+env(safe-area-inset-bottom))] sm:p-6">
              {deviceAuditLoading ? (
                <div className="flex min-h-[320px] items-center justify-center rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] text-sm font-semibold text-[var(--text-soft)]">
                  <Loader2 className="mr-2 animate-spin" size={18} />
                  正在读取登录设备...
                </div>
              ) : deviceAuditMessage ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-semibold text-[var(--danger)]">{deviceAuditMessage}</div>
              ) : deviceAudit ? (
                <div className="space-y-5">
                  <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                    <Metric label="全部设备" value={deviceAudit.deviceCount} />
                    <Metric label="当前在线" value={deviceAudit.onlineDeviceCount} />
                    <Metric label="今日活跃" value={formatActiveDuration(deviceAudit.todayActiveSeconds)} />
                    <Metric label="30天活跃" value={deviceAudit.activeDeviceCount30d} />
                  </div>

                  <div className={`rounded-[var(--radius-lg)] border p-4 ${deviceAudit.isAbnormal ? "border-[var(--danger)]/25 bg-[var(--danger-soft)]" : "border-[var(--success)]/25 bg-[var(--success-soft)]"}`}>
                    <div className={`flex items-center gap-2 text-sm font-black ${deviceAudit.isAbnormal ? "text-[var(--danger)]" : "text-[var(--success)]"}`}>
                      {deviceAudit.isAbnormal ? <ShieldAlert size={17} /> : <CheckCircle2 size={17} />}
                      {deviceAudit.isAbnormal ? "发现异常信号" : "暂无明显异常"}
                    </div>
                    <div className="mt-2 text-sm leading-6 text-[var(--text-soft)]">
                      {deviceAudit.isAbnormal ? deviceAudit.abnormalReasons.join("；") : "设备数量、地区分布和失败登录次数都在正常范围内。"}
                    </div>
                  </div>

                  <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-black text-[var(--text)]">所有设备</h4>
                      <Badge variant="secondary">{deviceAudit.devices.length} devices</Badge>
                    </div>
                    <div className="grid gap-3 lg:grid-cols-2">
                      {deviceAudit.devices.length === 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">暂无设备记录。</div>
                      ) : deviceAudit.devices.map((device) => (
                        <div key={device.id || device.deviceId} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="min-w-0">
                              <div className="flex items-center gap-2 font-black text-[var(--text)]">
                                {device.deviceType === "mobile" ? <Smartphone size={16} className="text-[var(--primary)]" /> : <Laptop size={16} className="text-[var(--primary)]" />}
                                <span className="truncate">{device.deviceLabel || device.browserName || device.osName || "Unknown device"}</span>
                              </div>
                              <div className="mt-1 truncate text-xs text-[var(--text-soft)]">{[device.city, device.country, device.ipAddress].filter(Boolean).join(" · ") || "位置未知"}</div>
                            </div>
                            <div className="flex shrink-0 flex-col items-end gap-1.5">
                              <Badge variant={device.isOnline ? "success" : device.isBlocked ? "danger" : device.isTrusted ? "success" : "secondary"}>{device.isOnline ? "Online" : device.isBlocked ? "Blocked" : device.isTrusted ? "Trusted" : "Observed"}</Badge>
                              {device.currentPathSeenAt ? <span className="text-[10px] text-[var(--text-faint)]">{formatDateTime(device.currentPathSeenAt)}</span> : null}
                            </div>
                          </div>
                          <div className="mt-3 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-2">
                            <div className="text-[10px] font-bold uppercase tracking-wide text-[var(--text-faint)]">当前页面</div>
                            <div className="mt-1 truncate text-xs font-semibold text-[var(--text)]">{device.currentTitle || device.currentPath || "暂无页面心跳"}</div>
                            {device.currentPath ? <div className="mt-0.5 truncate font-mono text-[10px] text-[var(--text-faint)]">{device.currentPath}</div> : null}
                          </div>
                          <div className="mt-3 grid gap-2 text-xs text-[var(--text-soft)] sm:grid-cols-2">
                            <span>首次：{formatDateTime(device.firstSeenAt)}</span>
                            <span>最后：{formatDateTime(device.lastSeenAt ?? device.lastLoginAt)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="font-black text-[var(--text)]">最近 10 次登录</h4>
                      <Badge variant="secondary">{deviceAudit.recentEvents.length} events</Badge>
                    </div>
                    <div className="space-y-2">
                      {deviceAudit.recentEvents.length === 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] p-4 text-sm text-[var(--text-soft)]">暂无登录事件。</div>
                      ) : deviceAudit.recentEvents.map((event) => (
                        <div key={event.id} className="grid gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3 text-sm sm:grid-cols-[1.1fr_0.8fr_0.8fr_auto] sm:items-center">
                          <div>
                            <div className="font-bold text-[var(--text)]">{formatDateTime(event.createdAt)}</div>
                            <div className="mt-0.5 text-xs text-[var(--text-soft)]">{event.attemptedEmail || deviceAudit.email || "—"}</div>
                          </div>
                          <div className="text-xs text-[var(--text-soft)]">{[event.city, event.country, event.ipAddress].filter(Boolean).join(" · ") || "位置未知"}</div>
                          <div className="text-xs font-semibold text-[var(--text-soft)]">{event.loginMethod || "unknown"}{event.isNewDevice ? " · 新设备" : ""}</div>
                          <Badge variant={event.result === "success" ? "success" : event.result === "blocked" ? "danger" : "secondary"}>{event.result || "unknown"}</Badge>
                        </div>
                      ))}
                    </div>
                  </section>
                </div>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 py-3">
      <div className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">{label}</div>
      <div className="mt-1 text-2xl font-black text-[var(--primary)]">{value}</div>
    </div>
  );
}

function SummaryPill({ icon: Icon, label, value }: { icon: typeof CalendarDays; label: string; value: string | number }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3">
      <div className="flex items-center gap-2 text-xs font-semibold text-[var(--text-faint)]">
        <Icon size={14} className="text-[var(--primary)]" />
        {label}
      </div>
      <div className="mt-1 truncate text-base font-black text-[var(--text)]">{value}</div>
    </div>
  );
}

function ScoreFields({ label, target, current, onTargetChange, onCurrentChange }: { label: string; target: string; current: string; onTargetChange: (value: string) => void; onCurrentChange: (value: string) => void }) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
      <div className="mb-3 flex items-center justify-between gap-3">
        <div className="text-sm font-bold text-[var(--text)]">{label}</div>
        {current && target ? <Badge variant="secondary" className="text-[10px]"><CheckCircle2 size={12} /> {scoreProgress(current, target)}%</Badge> : null}
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Target
          <Input inputMode="numeric" value={target} onChange={(event) => onTargetChange(event.target.value)} placeholder="65" />
        </label>
        <label className="space-y-2 text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
          Current
          <Input inputMode="numeric" value={current} onChange={(event) => onCurrentChange(event.target.value)} placeholder="Optional" />
        </label>
      </div>
    </div>
  );
}
