"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CalendarClock, CheckCircle2, ExternalLink, History, Link2, Loader2, Lock, MonitorPlay, Sparkles, Trash2, UserRound, Video } from "lucide-react";

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
import { createClient } from "@/lib/supabase/client";

type ZoomNotification = {
  id: string;
  title: string;
  message: string;
  meeting_id: string | null;
  meeting_password: string | null;
  join_url?: string | null;
  class_number?: number | null;
  completed_class_count?: number | null;
  total_class_count?: number | null;
  created_at: string;
};

type AdminStudent = {
  id: string;
  full_name: string | null;
  email: string | null;
  is_my_student: boolean | null;
};

type TeacherRoom = {
  id: string;
  zoom_meeting_id: string;
  zoom_password: string | null;
};

type ClassroomRecord = {
  id: string;
  student_id: string;
  zoom_meeting_id: string;
  zoom_password: string | null;
  status: string | null;
  created_at: string;
  started_at: string | null;
  ended_at: string | null;
  title: string | null;
};

function getZoomJoinUrl(meetingNumber: string, password?: string) {
  const cleanMeetingNumber = meetingNumber.replace(/\s/g, "");
  const params = new URLSearchParams();

  if (password?.trim()) {
    params.set("pwd", password.trim());
  }

  const suffix = params.toString() ? `?${params.toString()}` : "";

  return `https://zoom.us/j/${cleanMeetingNumber}${suffix}`;
}

function getMeetingId(notification: ZoomNotification) {
  if (notification.meeting_id) {
    return notification.meeting_id.replace(/\s/g, "");
  }

  const match = notification.message.match(/Meeting ID:\s*([0-9\s]+)/i);

  return match?.[1]?.replace(/\s/g, "") || "";
}

function formatClassroomDate(value: string) {
  return new Date(value).toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function isClassroomEnded(classroom: ClassroomRecord) {
  return classroom.status === "ended" || Boolean(classroom.ended_at);
}

function getClassroomTime(classroom: ClassroomRecord) {
  return classroom.started_at ?? classroom.created_at;
}

function getNotificationJoinUrl(notification: ZoomNotification) {
  const meetingId = getMeetingId(notification);

  if (!meetingId) {
    return "";
  }

  return notification.join_url || getZoomJoinUrl(meetingId, notification.meeting_password ?? "");
}

export default function ClassroomPage() {
  const adminZoomWindowRef = useRef<Window | null>(null);

  const [meetingNumber, setMeetingNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [status, setStatus] = useState("");
  const [showManualJoin, setShowManualJoin] = useState(false);
  const [userProfileLoaded, setUserProfileLoaded] = useState(false);
  const [canManageClassrooms, setCanManageClassrooms] = useState(false);
  const [notifications, setNotifications] = useState<ZoomNotification[]>([]);
  const [notificationsLoading, setNotificationsLoading] = useState(true);
  const [teacherRoom, setTeacherRoom] = useState<TeacherRoom | null>(null);
  const [adminStudents, setAdminStudents] = useState<AdminStudent[]>([]);
  const [adminClassrooms, setAdminClassrooms] = useState<ClassroomRecord[]>([]);
  const [selectedStudentId, setSelectedStudentId] = useState("");
  const [adminLoading, setAdminLoading] = useState(true);
  const [adminStarting, setAdminStarting] = useState(false);
  const [endingClassroomId, setEndingClassroomId] = useState("");
  const [deletingClassroomId, setDeletingClassroomId] = useState("");
  const [adminMessage, setAdminMessage] = useState("");

  const selectedStudent = adminStudents.find((student) => student.id === selectedStudentId) ?? null;
  const selectedStudentClassrooms = adminClassrooms.filter((classroom) => classroom.student_id === selectedStudentId);
  const selectedStudentClassroomsOldestFirst = [...selectedStudentClassrooms].sort((a, b) => new Date(getClassroomTime(a)).getTime() - new Date(getClassroomTime(b)).getTime());
  const selectedStudentClassroomList = [...selectedStudentClassroomsOldestFirst]
    .map((classroom, index) => ({
      classroom,
      classNumber: index + 1,
    }))
    .reverse();
  const selectedActiveClassroom = selectedStudentClassrooms.find((classroom) => classroom.status === "started" && !classroom.ended_at) ?? null;
  const selectedCompletedClassCount = selectedStudentClassrooms.filter(isClassroomEnded).length;
  const selectedTotalClassCount = selectedStudentClassrooms.length;
  const selectedActiveClassNumber = selectedActiveClassroom ? selectedStudentClassroomsOldestFirst.findIndex((classroom) => classroom.id === selectedActiveClassroom.id) + 1 : null;
  const selectedNextClassNumber = selectedTotalClassCount + 1;

  useEffect(() => {
    let cancelled = false;
    let animationFrame = 0;

    async function loadInitialMeetingState() {
      const params = new URLSearchParams(window.location.search);
      const urlMeetingNumber = params.get("meetingNumber") ?? params.get("meetingId") ?? "";
      const cleanMeetingNumber = urlMeetingNumber.replace(/\s/g, "");
      const urlName = params.get("name")?.trim();
      let defaultName = urlName || "Student";
      let canManage = false;

      try {
        const supabase = createClient();
        const { data: authData } = await supabase.auth.getUser();
        const currentUser = authData.user;

        if (currentUser) {
          const { data: profile } = await supabase.from("profiles").select("full_name, email, role").eq("id", currentUser.id).maybeSingle();
          const profileName = profile?.full_name?.trim();
          const profileEmail = profile?.email?.trim() || currentUser.email?.trim() || "";

          if (!urlName) {
            defaultName = profileName || profileEmail.split("@")[0] || "Student";
          }

          canManage = ["admin", "teacher", "editor"].includes(profile?.role ?? "");
        }
      } catch (error) {
        console.warn("LOAD CLASSROOM USER NAME ERROR", error);
      }

      if (cancelled) {
        return;
      }

      animationFrame = window.requestAnimationFrame(() => {
        setUserName(defaultName);
        setCanManageClassrooms(canManage);

        if (cleanMeetingNumber) {
          setMeetingNumber(cleanMeetingNumber);
          setPassword(params.get("password") ?? params.get("pwd") ?? "");
        }

        setUserProfileLoaded(true);
      });
    }

    void loadInitialMeetingState();

    return () => {
      cancelled = true;
      if (animationFrame) window.cancelAnimationFrame(animationFrame);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadAdminContext() {
      try {
        const response = await fetch("/api/zoom/create-classroom");
        const data = await response.json();

        if (response.status === 401 || response.status === 403) {
          return;
        }

        if (!response.ok || !data.ok) {
          console.warn("LOAD CLASSROOM ADMIN CONTEXT FAILED", data);
          return;
        }

        if (!cancelled) {
          const students = (data.students ?? []) as AdminStudent[];
          setTeacherRoom(data.teacherRoom ?? null);
          setAdminStudents(students);
          setAdminClassrooms((data.classrooms ?? []) as ClassroomRecord[]);
          setSelectedStudentId((current) => current || students[0]?.id || "");
        }
      } catch (error) {
        console.warn("LOAD CLASSROOM ADMIN CONTEXT ERROR", error);
      } finally {
        if (!cancelled) {
          setAdminLoading(false);
        }
      }
    }

    if (!userProfileLoaded) {
      return () => {
        cancelled = true;
      };
    }

    if (!canManageClassrooms) {
      return () => {
        cancelled = true;
      };
    }

    void loadAdminContext();

    return () => {
      cancelled = true;
    };
  }, [canManageClassrooms, userProfileLoaded]);

  useEffect(() => {
    let cancelled = false;

    async function loadNotifications() {
      try {
        const response = await fetch("/api/zoom/student-notifications");
        const data = await response.json();

        if (!response.ok || !data.ok) {
          console.warn("LOAD CLASSROOM NOTIFICATIONS FAILED", data);
          return;
        }

        if (!cancelled) {
          setNotifications(data.notifications ?? []);
        }
      } catch (error) {
        console.warn("LOAD CLASSROOM NOTIFICATIONS ERROR", error);
      } finally {
        if (!cancelled) {
          setNotificationsLoading(false);
        }
      }
    }

    void loadNotifications();

    return () => {
      cancelled = true;
    };
  }, []);

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    const cleanMeetingNumber = meetingNumber.replace(/\s/g, "");

    if (!cleanMeetingNumber) {
      setStatus("请输入 Meeting ID");
      return;
    }

    setMeetingNumber(cleanMeetingNumber);
    window.open(getZoomJoinUrl(cleanMeetingNumber, password), "_blank", "noopener,noreferrer");
    setStatus("Zoom 课堂已在新页面打开。");
  }

  function openNotificationZoom(notification: ZoomNotification) {
    const zoomUrl = getNotificationJoinUrl(notification);

    if (!zoomUrl) {
      setStatus("课堂链接缺少 Meeting ID");
      return;
    }

    setMeetingNumber(getMeetingId(notification));
    setPassword(notification.meeting_password ?? "");
    window.open(zoomUrl, "_blank", "noopener,noreferrer");
    setStatus("Zoom 课堂已在新页面打开，密码已自动带入。");
  }

  async function startAdminClassroom() {
    if (!selectedStudentId) {
      setAdminMessage("请选择学生。");
      return;
    }

    if (selectedActiveClassroom) {
      setAdminMessage("当前学生正在上课，请先结束后再开启下一次。");
      return;
    }

    setAdminStarting(true);
    setAdminMessage("");

    const meetingWindow = window.open("", "_blank");

    try {
      const response = await fetch("/api/zoom/create-classroom", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          studentId: selectedStudentId,
        }),
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        meetingWindow?.close();
        throw new Error(data.message || "Create classroom failed");
      }

      const zoomUrl = getZoomJoinUrl(data.meetingId, data.password);

      if (meetingWindow) {
        adminZoomWindowRef.current = meetingWindow;
        meetingWindow.location.href = zoomUrl;
      } else {
        window.open(zoomUrl, "_blank", "noopener,noreferrer");
      }

      if (data.classroom) {
        setAdminClassrooms((current) => [data.classroom as ClassroomRecord, ...current.filter((classroom) => classroom.id !== data.classroom.id)]);
      }

      const classNumber = typeof data.classNumber === "number" ? data.classNumber : selectedNextClassNumber;
      setAdminMessage(`第 ${classNumber} 次课堂已开始，学生通知已发送，Zoom 已打开。`);
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Create classroom failed");
    } finally {
      setAdminStarting(false);
    }
  }

  async function endAdminClassroom(classroomId: string) {
    setEndingClassroomId(classroomId);
    setAdminMessage("");

    try {
      const response = await fetch(`/api/zoom/classrooms/${classroomId}/end`, {
        method: "POST",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "End classroom failed");
      }

      if (data.classroom) {
        setAdminClassrooms((current) => current.map((classroom) => (classroom.id === data.classroom.id ? (data.classroom as ClassroomRecord) : classroom)));
      }

      try {
        if (adminZoomWindowRef.current && !adminZoomWindowRef.current.closed) {
          adminZoomWindowRef.current.close();
        }
      } catch (closeError) {
        console.warn("CLOSE ADMIN ZOOM WINDOW WARNING", closeError);
      } finally {
        adminZoomWindowRef.current = null;
      }

      setAdminMessage("课堂记录已结束，请在 Zoom 中手动结束会议。");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "End classroom failed");
    } finally {
      setEndingClassroomId("");
    }
  }

  async function deleteAdminClassroom(classroomId: string) {
    const confirmed = window.confirm("确定删除这次课堂记录吗？对应学生通知也会一起删除。");

    if (!confirmed) {
      return;
    }

    setDeletingClassroomId(classroomId);
    setAdminMessage("");

    try {
      const response = await fetch(`/api/zoom/classrooms/${classroomId}`, {
        method: "DELETE",
      });
      const data = await response.json();

      if (!response.ok || !data.ok) {
        throw new Error(data.message || "Delete classroom failed");
      }

      setAdminClassrooms((current) => current.filter((classroom) => classroom.id !== classroomId));
      setAdminMessage("课堂记录已删除，对应学生通知也已删除。");
    } catch (error) {
      setAdminMessage(error instanceof Error ? error.message : "Delete classroom failed");
    } finally {
      setDeletingClassroomId("");
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_430px] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_30%)]" />

          <div className="relative">
            <Badge variant="default">Live Classroom</Badge>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              小马哥在线课堂
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              老师开启课堂后，你可以直接一键进入课堂房间；手动输入仅作为备用方式。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<Video size={18} />}
                title="Online Classroom"
                text="One-click entry"
              />
              <InfoTile
                icon={<MonitorPlay size={18} />}
                title="Live Lesson"
                text="Teacher-led class"
              />
              <InfoTile
                icon={<Sparkles size={18} />}
                title="Progress"
                text="Class count tracked"
              />
            </div>

            {!adminLoading && (teacherRoom || adminStudents.length > 0) ? (
              <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--primary)]/25 bg-[var(--primary-soft)] p-4">
                <div className="mb-3 flex items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                      <Video size={16} className="text-[var(--primary)]" />
                      老师一键开启课堂
                    </div>
                    <p className="mt-1 text-xs text-[var(--text-soft)]">创建课堂记录，给学生发送课堂通知，并打开你的固定 Zoom 房间。</p>
                  </div>
                  <Badge variant="default">{teacherRoom?.zoom_meeting_id ?? "No Room"}</Badge>
                </div>

                {!teacherRoom ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-5 text-sm text-[var(--text-soft)]">没有找到你的 active Zoom room。</div>
                ) : adminStudents.length === 0 ? (
                  <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-5 text-sm text-[var(--text-soft)]">没有可发送通知的学生。</div>
                ) : (
                  <div className="space-y-3">
                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                      <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-end">
                        <label className="block">
                          <span className="mb-2 flex items-center gap-2 text-xs font-bold uppercase tracking-wide text-[var(--text-faint)]">
                            <UserRound size={14} />
                            选择学生
                          </span>
                          <select value={selectedStudentId} onChange={(event) => { setSelectedStudentId(event.target.value); setAdminMessage(""); }} className="h-12 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-4 text-sm font-bold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]">
                            {adminStudents.map((student) => (
                              <option key={student.id} value={student.id}>
                                {student.full_name?.trim() || student.email || student.id}
                                {student.is_my_student ? " · 内部学生" : ""}
                              </option>
                            ))}
                          </select>
                        </label>
                        <Button type="button" onClick={startAdminClassroom} disabled={adminStarting || Boolean(selectedActiveClassroom)} className="h-12 gap-2">
                          {adminStarting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                          {selectedActiveClassroom ? "课堂进行中" : "一键开启课堂"}
                        </Button>
                      </div>

                      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
                        <span className="rounded-full bg-[var(--primary-soft)] px-2 py-1 font-semibold text-[var(--primary)]">{selectedStudent?.full_name?.trim() || selectedStudent?.email || "Selected student"}</span>
                        {selectedStudent?.email ? <span>{selectedStudent.email}</span> : null}
                        {selectedStudent?.is_my_student ? <span className="rounded-full border border-[var(--border)] px-2 py-1 font-semibold">内部学生</span> : null}
                      </div>
                    </div>

                    <div className="grid gap-2 sm:grid-cols-3">
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                          <CheckCircle2 size={13} />
                          已完成
                        </div>
                        <div className="mt-1 text-xl font-bold text-[var(--text)]">{selectedCompletedClassCount}</div>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                          <History size={13} />
                          课堂记录
                        </div>
                        <div className="mt-1 text-xl font-bold text-[var(--text)]">{selectedTotalClassCount}</div>
                      </div>
                      <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-2">
                        <div className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                          <Video size={13} />
                          {selectedActiveClassroom ? "当前第" : "下次第"}
                        </div>
                        <div className="mt-1 text-xl font-bold text-[var(--primary)]">{selectedActiveClassNumber ?? selectedNextClassNumber}</div>
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                        <div className="min-w-0">
                          <div className="truncate text-sm font-bold text-[var(--text)]">{selectedStudent?.full_name?.trim() || selectedStudent?.email || "Selected student"}</div>
                          <div className="mt-1 text-xs text-[var(--text-soft)]">
                            {selectedActiveClassroom ? `进行中 · ${formatClassroomDate(getClassroomTime(selectedActiveClassroom))}` : selectedStudentClassrooms[0] ? `最近一次 · ${formatClassroomDate(getClassroomTime(selectedStudentClassrooms[0]))}` : "还没有课堂记录"}
                          </div>
                        </div>
                        {selectedActiveClassroom ? (
                          <Button type="button" variant="secondary" onClick={() => endAdminClassroom(selectedActiveClassroom.id)} disabled={endingClassroomId === selectedActiveClassroom.id} className="gap-2">
                            {endingClassroomId === selectedActiveClassroom.id ? <Loader2 size={16} className="animate-spin" /> : <CheckCircle2 size={16} />}
                            结束课堂
                          </Button>
                        ) : null}
                      </div>
                    </div>

                    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                      <div className="mb-3 flex items-center justify-between gap-3">
                        <div>
                          <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                            <CalendarClock size={15} className="text-[var(--primary)]" />
                            学生课堂记录
                          </div>
                          <p className="mt-1 text-xs text-[var(--text-soft)]">列出当前学生每次课堂时间，可删除单次记录。</p>
                        </div>
                        <Badge variant="secondary">{selectedStudentClassroomList.length}</Badge>
                      </div>

                      {selectedStudentClassroomList.length === 0 ? (
                        <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-sm text-[var(--text-soft)]">
                          该学生暂无课堂记录。
                        </div>
                      ) : (
                        <div className="max-h-72 space-y-2 overflow-y-auto pr-1">
                          {selectedStudentClassroomList.map(({ classroom, classNumber }) => {
                            const isDeleting = deletingClassroomId === classroom.id;

                            return (
                              <div key={classroom.id} className="flex flex-col gap-3 rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] p-3 sm:flex-row sm:items-center sm:justify-between">
                                <div className="min-w-0">
                                  <div className="flex flex-wrap items-center gap-2">
                                    <span className="rounded-full bg-[var(--primary-soft)] px-2 py-0.5 text-xs font-bold text-[var(--primary)]">第 {classNumber} 次</span>
                                    <span className="text-sm font-bold text-[var(--text)]">{formatClassroomDate(getClassroomTime(classroom))}</span>
                                    <span className="rounded-full border border-[var(--border)] px-2 py-0.5 text-xs font-semibold text-[var(--text-soft)]">{classroom.status || "unknown"}</span>
                                  </div>
                                  <div className="mt-1 text-xs text-[var(--text-soft)]">
                                    Meeting ID: {classroom.zoom_meeting_id}
                                    {classroom.ended_at ? ` · 结束：${formatClassroomDate(classroom.ended_at)}` : ""}
                                  </div>
                                </div>
                                <button type="button" onClick={() => deleteAdminClassroom(classroom.id)} disabled={isDeleting} className="inline-flex h-9 shrink-0 items-center justify-center gap-2 rounded-[var(--radius-sm)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-3 text-xs font-bold text-[var(--danger)] transition hover:border-[var(--danger)]/50 disabled:cursor-not-allowed disabled:opacity-60">
                                  {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
                                  删除
                                </button>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {adminMessage ? <div className={`mt-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold ${adminMessage.includes("已") ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{adminMessage}</div> : null}
              </div>
            ) : null}

            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--primary)]/30 bg-[var(--card)] p-5 shadow-[var(--shadow-sm)]">
              <div className="mb-4 flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-base font-bold text-[var(--text)]">
                    <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Link2 size={17} />
                    </span>
                    当前课堂
                  </div>
                  <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">老师开启课堂后，这里会显示一键进入入口和课次信息。</p>
                </div>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>

              {notificationsLoading ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-sm text-[var(--text-soft)]">Loading classroom links...</div>
              ) : notifications.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] px-4 py-5 text-sm text-[var(--text-soft)]">暂无进行中的课堂。老师开启课堂后会自动出现在这里。</div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => {
                    const notificationMeetingId = getMeetingId(notification);
                    const classNumber = notification.class_number ?? notification.total_class_count ?? null;
                    const completedClassCount = notification.completed_class_count ?? 0;
                    const totalClassCount = notification.total_class_count ?? classNumber ?? 0;

                    return (
                      <div key={notification.id} className="rounded-[var(--radius-md)] border border-[var(--primary)]/20 bg-[var(--primary-soft)] p-4">
                        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                          <div className="min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="truncate text-base font-bold text-[var(--text)]">{notification.title || "Zoom Classroom"}</div>
                              {classNumber ? <Badge variant="default">第 {classNumber} 次课堂</Badge> : null}
                            </div>
                            <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-[var(--text-soft)]">
                              <span>Meeting ID: {notificationMeetingId || "—"}</span>
                              <span>·</span>
                              <span>{formatClassroomDate(notification.created_at)}</span>
                            </div>
                            <div className="mt-2 flex flex-wrap gap-2">
                              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--text-soft)]">已完成 {completedClassCount} 次</span>
                              <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2 py-0.5 text-xs font-semibold text-[var(--text-soft)]">累计记录 {totalClassCount} 次</span>
                            </div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button type="button" onClick={() => openNotificationZoom(notification)} className="inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-[var(--radius-sm)] bg-[var(--primary)] px-5 text-sm font-bold text-white shadow-[var(--shadow-sm)] transition hover:bg-[var(--primary-hover)]">
                              <ExternalLink size={14} />
                              一键进入 Zoom
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {status ? (
                <div className={`mt-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold ${status.includes("已打开") ? "border-[var(--success)]/25 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/25 bg-[var(--danger-soft)] text-[var(--danger)]"}`}>
                  {status}
                </div>
              ) : null}
            </div>
          </div>
        </div>

        <Card className="rounded-[var(--radius-lg)] border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
          <CardHeader className="flex-col items-start gap-3">
            <div className="flex w-full items-start justify-between gap-4">
              <div>
                <div className="mb-2 flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--bg-soft)] text-[var(--primary)]">
                  <MonitorPlay size={18} />
                </div>
                <CardTitle>备用加入方式</CardTitle>
                <CardDescription>
                  通常不需要手动输入，仅在一键进入不可用时展开。
                </CardDescription>
              </div>
              <Button type="button" variant="secondary" onClick={() => setShowManualJoin((current) => !current)} className="shrink-0 whitespace-nowrap px-4">
                {showManualJoin ? "收起" : "展开"}
              </Button>
            </div>
          </CardHeader>

          {showManualJoin ? (
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <UserRound size={15} className="text-[var(--primary)]" />
                  Your name
                </span>
                <Input
                  value={userName}
                  onChange={(event) => setUserName(event.target.value)}
                  placeholder="Your name"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <MonitorPlay size={15} className="text-[var(--primary)]" />
                  Meeting ID
                </span>
                <Input
                  value={meetingNumber}
                  onChange={(event) => setMeetingNumber(event.target.value)}
                  placeholder="840 7968 1327"
                />
              </label>

              <label className="block">
                <span className="mb-2 flex items-center gap-2 text-sm font-semibold text-[var(--text)]">
                  <Lock size={15} className="text-[var(--primary)]" />
                  Password
                </span>
                <Input
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder="No password? Leave it empty"
                />
              </label>

              <div className="grid gap-3">
                <Button type="submit" fullWidth size="lg" className="gap-2">
                  <ExternalLink size={16} />
                  打开 Zoom
                </Button>
              </div>
            </form>
          </CardContent>
          ) : (
            <CardContent>
              <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--bg-soft)] p-4">
                <div className="text-sm font-semibold text-[var(--text)]">无需手动输入</div>
                <p className="mt-2 text-sm leading-6 text-[var(--text-soft)]">请优先使用左侧课堂卡片的一键进入。系统会自动带入固定会议号和密码。</p>
              </div>
            </CardContent>
          )}
        </Card>
      </section>
    </main>
  );
}

function InfoTile({
  icon,
  title,
  text,
}: {
  icon: React.ReactNode;
  title: string;
  text: string;
}) {
  return (
    <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card-soft)] p-4">
      <div className="flex h-10 w-10 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary-soft)] text-[var(--primary)]">
        {icon}
      </div>
      <div className="mt-4 text-sm font-semibold text-[var(--text)]">
        {title}
      </div>
      <div className="mt-1 text-xs leading-5 text-[var(--text-soft)]">
        {text}
      </div>
    </div>
  );
}
