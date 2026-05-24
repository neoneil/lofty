"use client";

import { useEffect, useMemo, useState } from "react";

import {
  Calendar,
  ChevronDown,
  ChevronUp,
  Clock3,
  GraduationCap,
  Loader2,
  Target,
} from "lucide-react";

import { createClient } from "@/lib/supabase/client";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { Textarea } from "@/components/ui-v2/textarea";

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

export default function StudyPlanPage() {
  const supabase = useMemo(() => createClient(), []);

  const [loading, setLoading] = useState(true);

  const [saving, setSaving] = useState(false);

  const [expanded, setExpanded] = useState(false);

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

      const { data: authData, error: authError } =
        await supabase.auth.getUser();

      console.log("Auth user:", authData.user);
      console.log("Current auth user id:", authData.user?.id);

      if (authError) {
        console.error("Auth error:", authError);

        setLoading(false);

        return;
      }

      const user = authData.user;

      if (!user) {
        console.log("No authenticated user found.");

        setLoading(false);

        return;
      }

      const { data, error } = await supabase
        .from("study_plans")
        .select("*")
        .eq("user_id", user.id)
        .maybeSingle();

      console.log("Fetched study plan:", data);
      console.log("Fetched study plan user_id:", data?.user_id);

      if (error) {
        console.error("Study plan fetch error:", error);
      }

      if (data) {
        console.log("Existing study plan found.");

        setHasExistingPlan(true);

        setExpanded(false);

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

        setExpanded(true);
      }

      setLoading(false);

      console.log("Study plan load complete.");
    }

    loadStudyPlan();
  }, [supabase]);

  function updateField(key: keyof StudyPlan, value: string) {
    setForm((prev) => ({
      ...prev,
      [key]: value,
    }));
  }

  function validateForm() {
    if (!form.listening_target) {
      return "Listening target is required.";
    }

    if (!form.reading_target) {
      return "Reading target is required.";
    }

    if (!form.writing_target) {
      return "Writing target is required.";
    }

    if (!form.speaking_target) {
      return "Speaking target is required.";
    }

    if (!form.overall_target) {
      return "Overall target is required.";
    }

    if (!form.exam_deadline) {
      return "Exam deadline is required.";
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

    const { data: authData, error: authError } = await supabase.auth.getUser();

    if (authError) {
      console.error("Auth error:", authError);

      setSaving(false);

      return;
    }

    const user = authData.user;

    if (!user) {
      console.error("No authenticated user.");

      setSaving(false);

      return;
    }

    const payload = {
      user_id: user.id,

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

    if (hasExistingPlan && form.id) {
      console.log("Updating existing study plan...");

      const { error } = await supabase
        .from("study_plans")
        .update(payload)
        .eq("id", form.id);

      if (error) {
        console.error("Update error:", error);

        setSaveMessage("Failed to update study plan.");

        setSaving(false);

        return;
      }

      console.log("Study plan updated successfully.");

      setSaveMessage("Study profile updated successfully.");
    } else {
      console.log("Creating new study plan...");

      const { data, error } = await supabase
        .from("study_plans")
        .insert(payload)
        .select()
        .single();

      if (error) {
        console.error("Insert error:", error);

        setSaveMessage("Failed to create study plan.");

        setSaving(false);

        return;
      }

      console.log("Study plan created:", data);

      if (data) {
        setHasExistingPlan(true);

        setForm((prev) => ({
          ...prev,
          id: data.id,
        }));
      }

      setSaveMessage("Study profile created successfully.");
    }

    setExpanded(false);

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
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1600px] flex-col gap-6 px-4 py-6 lg:flex-row lg:px-6">
        {/* LEFT */}

        <div className="w-full lg:w-[460px]">
          <Card className="overflow-hidden">
            <CardHeader className="border-b border-[var(--border)] pb-5">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <Badge variant="secondary" className="mb-3">
                    Study Profile
                  </Badge>

                  <CardTitle>Personalized Study Plan</CardTitle>

                  <CardDescription>
                    Build your AI-powered roadmap based on your target exam and
                    timeline.
                  </CardDescription>
                </div>

                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() => setExpanded(!expanded)}
                >
                  {expanded ? (
                    <ChevronUp size={18} />
                  ) : (
                    <ChevronDown size={18} />
                  )}
                </Button>
              </div>

              {hasExistingPlan && !expanded && (
                <div className="mt-5 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
                  <div className="mb-2 text-sm font-semibold text-[var(--text)]">
                    Current Study Summary
                  </div>

                  <div className="space-y-1 text-sm leading-7 text-[var(--text-soft)]">
                    <div>
                      {form.exam_type} • Target {form.overall_target}
                    </div>

                    <div>Deadline: {form.exam_deadline}</div>

                    <div>Study Time: {form.daily_study_hours}</div>
                  </div>
                </div>
              )}
            </CardHeader>

            {expanded && (
              <CardContent className="space-y-6">
                {/* EXAM TYPE */}

                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <GraduationCap
                      size={16}
                      className="text-[var(--primary)]"
                    />

                    <div className="text-sm font-semibold text-[var(--text)]">
                      Exam Information
                    </div>
                  </div>

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

                {/* TARGET SCORES */}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Target size={16} className="text-[var(--primary)]" />

                    <div className="text-sm font-semibold text-[var(--text)]">
                      Target Scores
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Input
                      value={form.listening_target}
                      onChange={(e) =>
                        updateField("listening_target", e.target.value)
                      }
                      placeholder="Listening Target"
                    />

                    <Input
                      value={form.listening_current}
                      onChange={(e) =>
                        updateField("listening_current", e.target.value)
                      }
                      placeholder="Listening Current"
                    />

                    <Input
                      value={form.reading_target}
                      onChange={(e) =>
                        updateField("reading_target", e.target.value)
                      }
                      placeholder="Reading Target"
                    />

                    <Input
                      value={form.reading_current}
                      onChange={(e) =>
                        updateField("reading_current", e.target.value)
                      }
                      placeholder="Reading Current"
                    />

                    <Input
                      value={form.writing_target}
                      onChange={(e) =>
                        updateField("writing_target", e.target.value)
                      }
                      placeholder="Writing Target"
                    />

                    <Input
                      value={form.writing_current}
                      onChange={(e) =>
                        updateField("writing_current", e.target.value)
                      }
                      placeholder="Writing Current"
                    />

                    <Input
                      value={form.speaking_target}
                      onChange={(e) =>
                        updateField("speaking_target", e.target.value)
                      }
                      placeholder="Speaking Target"
                    />

                    <Input
                      value={form.speaking_current}
                      onChange={(e) =>
                        updateField("speaking_current", e.target.value)
                      }
                      placeholder="Speaking Current"
                    />

                    <Input
                      value={form.overall_target}
                      onChange={(e) =>
                        updateField("overall_target", e.target.value)
                      }
                      placeholder="Overall Target"
                      className="col-span-2"
                    />
                  </div>
                </div>

                {/* DEADLINE */}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Calendar size={16} className="text-[var(--primary)]" />

                    <div className="text-sm font-semibold text-[var(--text)]">
                      Exam Deadline
                    </div>
                  </div>

                  <Input
                    type="date"
                    min={today}
                    value={form.exam_deadline}
                    onChange={(e) =>
                      updateField("exam_deadline", e.target.value)
                    }
                  />
                </div>

                {/* GOAL */}

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Study Goal
                  </div>

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
                        {goal}
                      </button>
                    ))}
                  </div>
                </div>

                {/* DAILY HOURS */}

                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <Clock3 size={16} className="text-[var(--primary)]" />

                    <div className="text-sm font-semibold text-[var(--text)]">
                      Daily Study Hours
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    {["0-1 Hours", "1-2 Hours", "2-4 Hours", "4+ Hours"].map(
                      (hour) => (
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
                          {hour}
                        </button>
                      ),
                    )}
                  </div>
                </div>

                {/* NOTES */}

                <div className="space-y-4">
                  <div className="text-sm font-semibold text-[var(--text)]">
                    Additional Notes
                  </div>

                  <Textarea
                    value={form.additional_notes}
                    onChange={(e) =>
                      updateField("additional_notes", e.target.value)
                    }
                    placeholder="Tell us more about your study situation, weak areas, or goals..."
                  />
                </div>

                {saveMessage && (
                  <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 py-3 text-sm text-[var(--text-soft)]">
                    {saveMessage}
                  </div>
                )}

                <Button fullWidth onClick={handleSave} disabled={saving}>
                  {saving ? (
                    <div className="flex items-center gap-2">
                      <Loader2 className="animate-spin" size={16} />
                      Saving...
                    </div>
                  ) : (
                    "Save Study Profile"
                  )}
                </Button>
              </CardContent>
            )}
          </Card>
        </div>

        {/* RIGHT */}

        <div className="flex-1">
          <Card className="h-full min-h-[720px]">
            <CardHeader className="border-b border-[var(--border)] pb-5">
              <div>
                <Badge className="mb-3">AI Study Plan</Badge>

                <CardTitle>Your Personalized Roadmap</CardTitle>

                <CardDescription>
                  Smart recommendations based on your target score, timeline,
                  and available study hours.
                </CardDescription>
              </div>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="mb-2 text-base font-semibold text-[var(--text)]">
                  Study Overview
                </div>

                <div className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                  <div>Exam Type: {form.exam_type}</div>

                  <div>Target Overall Score: {form.overall_target || "-"}</div>

                  <div>Deadline: {form.exam_deadline || "-"}</div>

                  <div>Daily Study Hours: {form.daily_study_hours}</div>

                  <div>
                    Days Remaining:{" "}
                    {daysRemaining !== null ? `${daysRemaining} days` : "-"}
                  </div>
                </div>
              </div>

              <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-5">
                <div className="mb-2 text-base font-semibold text-[var(--text)]">
                  AI Suggestions
                </div>

                <div className="space-y-2 text-sm leading-7 text-[var(--text-soft)]">
                  <div>Focus on high-frequency question types daily.</div>

                  <div>
                    Listening and Speaking usually improve fastest with
                    consistency.
                  </div>

                  <div>
                    Your study roadmap will become more personalized as you
                    complete more practice questions.
                  </div>

                  {daysRemaining !== null && daysRemaining <= 30 && (
                    <div>
                      Your exam is approaching soon. Increase your daily
                      revision intensity.
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
