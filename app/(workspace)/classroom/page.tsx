"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { CheckCircle2, ExternalLink, History, Link2, Loader2, Lock, MonitorPlay, Sparkles, UserRound, Video } from "lucide-react";

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

function getEmbeddedZoomUrl(meetingNumber: string, password: string, userName: string) {
  const params = new URLSearchParams({
    meetingNumber: meetingNumber.replace(/\s/g, ""),
    name: userName || "Student",
    v: String(Date.now()),
  });

  if (password.trim()) {
    params.set("password", password.trim());
  }

  return `/zoom/embedded?${params.toString()}`;
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

export default function ClassroomPage() {
  const adminZoomWindowRef = useRef<Window | null>(null);

  const [meetingNumber, setMeetingNumber] = useState("");
  const [password, setPassword] = useState("");
  const [userName, setUserName] = useState("");
  const [shouldJoin, setShouldJoin] = useState(false);
  const [status, setStatus] = useState("");
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
  const [adminMessage, setAdminMessage] = useState("");

  const selectedStudent = adminStudents.find((student) => student.id === selectedStudentId) ?? null;
  const selectedStudentClassrooms = adminClassrooms.filter((classroom) => classroom.student_id === selectedStudentId);
  const selectedStudentClassroomsOldestFirst = [...selectedStudentClassrooms].sort((a, b) => new Date(getClassroomTime(a)).getTime() - new Date(getClassroomTime(b)).getTime());
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

          if (params.get("autoJoin") === "1") {
            setShouldJoin(true);
          }
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
    setShouldJoin(true);
  }

  function handleOpenZoomPage() {
    const cleanMeetingNumber = meetingNumber.replace(/\s/g, "");

    if (!cleanMeetingNumber) {
      setStatus("请输入 Meeting ID");
      return;
    }

    window.open(getZoomJoinUrl(cleanMeetingNumber, password), "_blank", "noopener,noreferrer");
  }

  function joinNotification(notification: ZoomNotification) {
    const cleanMeetingNumber = getMeetingId(notification);

    if (!cleanMeetingNumber) {
      setStatus("课堂链接缺少 Meeting ID");
      return;
    }

    setMeetingNumber(cleanMeetingNumber);
    setPassword(notification.meeting_password ?? "");
    setShouldJoin(true);
  }

  function openNotificationPage(notification: ZoomNotification) {
    const cleanMeetingNumber = getMeetingId(notification);

    if (!cleanMeetingNumber) {
      setStatus("课堂链接缺少 Meeting ID");
      return;
    }

    window.open(getZoomJoinUrl(cleanMeetingNumber, notification.meeting_password ?? ""), "_blank", "noopener,noreferrer");
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

  if (shouldJoin) {
    return (
      <main className="relative h-[calc(100dvh-var(--topbar-height)-0.5rem)] w-full overflow-hidden bg-black">
        {status ? (
          <div className="absolute left-1/2 top-6 z-50 -translate-x-1/2 rounded-full border border-white/15 bg-white/90 px-5 py-2 text-sm font-semibold text-black shadow-lg backdrop-blur-md dark:bg-[var(--card)]/90 dark:text-[var(--text)]">
            {status}
          </div>
        ) : null}

        <iframe title="Zoom Classroom" src={getEmbeddedZoomUrl(meetingNumber, password, userName)} allow="camera; microphone; fullscreen; display-capture; autoplay" allowFullScreen className="h-full w-full border-0" />
      </main>
    );
  }

  return (
    <main className="flex flex-1 items-center justify-center bg-[var(--bg)] px-4 py-8 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="grid w-full max-w-6xl gap-6 lg:grid-cols-[1fr_430px] lg:items-stretch">
        <div className="relative overflow-hidden rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8 lg:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.10),transparent_30%)]" />

          <div className="relative">
            <Badge variant="default">Live Classroom</Badge>

            <h1 className="mt-5 max-w-2xl text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              Join your online classroom
            </h1>

            <p className="mt-4 max-w-2xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              选择老师发来的课堂链接直接进入，或者在右侧手动输入 Meeting ID 和密码。
            </p>

            <div className="mt-8 grid gap-3 sm:grid-cols-3">
              <InfoTile
                icon={<Video size={18} />}
                title="Zoom SDK"
                text="Embedded class room"
              />
              <InfoTile
                icon={<MonitorPlay size={18} />}
                title="Live Lesson"
                text="Join from browser"
              />
              <InfoTile
                icon={<Sparkles size={18} />}
                title="Teacher Led"
                text="Real-time support"
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
                    <div className="grid gap-3 sm:grid-cols-[1fr_auto]">
                      <select value={selectedStudentId} onChange={(event) => { setSelectedStudentId(event.target.value); setAdminMessage(""); }} className="h-11 w-full rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-4 text-sm font-semibold text-[var(--text)] outline-none transition focus:border-[var(--primary)] focus:ring-4 focus:ring-[var(--primary-soft)]">
                        {adminStudents.map((student) => (
                          <option key={student.id} value={student.id}>
                            {student.full_name?.trim() || student.email || student.id}
                            {student.is_my_student ? " · 内部学生" : ""}
                          </option>
                        ))}
                      </select>
                      <Button type="button" onClick={startAdminClassroom} disabled={adminStarting || Boolean(selectedActiveClassroom)} className="gap-2">
                        {adminStarting ? <Loader2 size={16} className="animate-spin" /> : <Video size={16} />}
                        {selectedActiveClassroom ? "课堂进行中" : "一键开启"}
                      </Button>
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
                  </div>
                )}

                {adminMessage ? <div className={`mt-3 rounded-[var(--radius-md)] border px-4 py-3 text-sm font-semibold ${adminMessage.includes("已") ? "border-[var(--success)]/20 bg-[var(--success-soft)] text-[var(--success)]" : "border-[var(--danger)]/20 bg-[var(--danger-soft)] text-[var(--danger)]"}`}>{adminMessage}</div> : null}
              </div>
            ) : null}

            <div className="mt-6 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-4">
              <div className="mb-3 flex items-center justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 text-sm font-bold text-[var(--text)]">
                    <Link2 size={16} className="text-[var(--primary)]" />
                    课堂链接
                  </div>
                  <p className="mt-1 text-xs text-[var(--text-soft)]">老师开启课堂后，这里会出现可直接进入的链接。</p>
                </div>
                <Badge variant="secondary">{notifications.length}</Badge>
              </div>

              {notificationsLoading ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-5 text-sm text-[var(--text-soft)]">Loading classroom links...</div>
              ) : notifications.length === 0 ? (
                <div className="rounded-[var(--radius-md)] border border-dashed border-[var(--border)] bg-[var(--card)] px-4 py-5 text-sm text-[var(--text-soft)]">暂无课堂链接，也可以用右侧 Meeting ID 加入。</div>
              ) : (
                <div className="space-y-3">
                  {notifications.slice(0, 3).map((notification) => {
                    const notificationMeetingId = getMeetingId(notification);

                    return (
                      <div key={notification.id} className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] p-3">
                        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                          <div className="min-w-0">
                            <div className="truncate text-sm font-bold text-[var(--text)]">{notification.title || "Zoom Classroom"}</div>
                            <div className="mt-1 text-xs text-[var(--text-soft)]">Meeting ID: {notificationMeetingId || "—"} · {formatClassroomDate(notification.created_at)}</div>
                          </div>
                          <div className="flex shrink-0 flex-wrap gap-2">
                            <button type="button" onClick={() => joinNotification(notification)} className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)] px-3 text-xs font-bold text-white transition hover:bg-[var(--primary-hover)]">
                              点击进入
                            </button>
                            <button type="button" onClick={() => openNotificationPage(notification)} className="inline-flex h-9 items-center justify-center rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--bg-soft)] px-3 text-xs font-bold text-[var(--text)] transition hover:border-[var(--primary)]/40">
                              单页打开
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        <Card className="rounded-[var(--radius-lg)]">
          <CardHeader className="flex-col items-start gap-1">
            <CardTitle>Meeting Details</CardTitle>
            <CardDescription>
              Use the Meeting ID and password from your classroom invitation.
            </CardDescription>
          </CardHeader>

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

              {status ? (
                <div className="rounded-[var(--radius-md)] border border-[var(--danger)]/25 bg-[var(--danger-soft)] px-4 py-3 text-sm font-medium text-[var(--danger)]">
                  {status}
                </div>
              ) : null}

              <div className="grid gap-3 sm:grid-cols-2">
                <Button type="submit" fullWidth size="lg">
                  Join Meeting
                </Button>
                <Button type="button" variant="secondary" fullWidth size="lg" onClick={handleOpenZoomPage} className="gap-2">
                  <ExternalLink size={16} />
                  Open Page
                </Button>
              </div>
            </form>
          </CardContent>
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
