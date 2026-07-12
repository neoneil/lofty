import Container from "@/components/site/container";
import { requireAdmin } from "@/lib/auth/require-admin";
import { createAdminClient } from "@/lib/supabase/admin";
import StartClassroomButton from "@/app/admin/students/[userId]/start-classroom-button";
import { formatDate } from "@/lib/date";

type StudentProfile = {
  id: string;
  full_name: string | null;
  email: string | null;
  avatar_url: string | null;
  role: string | null;
};

type ClassroomRecord = {
  id: string;
  student_id: string;
  zoom_meeting_id: string;
  status: string | null;
  created_at: string;
};

export const dynamic = "force-dynamic";

export default async function AdminStartClassroomPage() {
  await requireAdmin("/admin");

  const supabase = createAdminClient();

  const [studentsRes, classroomsRes] = await Promise.all([
    supabase.from("profiles").select("id, full_name, email, avatar_url, role").eq("role", "user").order("created_at", { ascending: false }),

    supabase.schema("zoom").from("classrooms").select("id, student_id, zoom_meeting_id, status, created_at").order("created_at", { ascending: false }),
  ]);

  if (studentsRes.error) {
    console.error("LOAD STUDENTS ERROR", studentsRes.error);
  }

  if (classroomsRes.error) {
    console.error("LOAD CLASSROOM HISTORY ERROR", classroomsRes.error);
  }

  const studentList = (studentsRes.data ?? []) as StudentProfile[];
  const classroomList = (classroomsRes.data ?? []) as ClassroomRecord[];

  const classroomMap = new Map<string, ClassroomRecord[]>();

  for (const classroom of classroomList) {
    const list = classroomMap.get(classroom.student_id) ?? [];
    list.push(classroom);
    classroomMap.set(classroom.student_id, list);
  }

  return (
    <Container className="py-8">
      <div className="mb-8">
        <div className="inline-flex rounded-full bg-[var(--primary)]/10 px-4 py-2 text-sm font-medium text-[var(--primary)]">
          Admin Classroom
        </div>

        <h1 className="mt-4 text-3xl font-bold text-[var(--text)]">
          Start Zoom Classroom
        </h1>

        <p className="mt-2 max-w-2xl text-sm text-[var(--text-soft)]">
          Select a student, create a Zoom classroom invitation, and view previous class history.
        </p>
      </div>

      {studentList.length === 0 ? (
        <div className="rounded-2xl border border-[var(--border)] bg-white p-6 text-sm text-[var(--text-soft)] shadow-sm">
          No students found.
        </div>
      ) : (
        <section className="space-y-4">
          {studentList.map((student) => {
            const displayName = student.full_name?.trim() || student.email || "Unnamed Student";
            const avatarLetter = displayName.slice(0, 1).toUpperCase();
            const history = classroomMap.get(student.id) ?? [];

            return (
              <div key={student.id} className="rounded-2xl border border-[var(--border)] bg-white p-5 shadow-sm transition hover:bg-[var(--card-hover)]">
                <div className="flex items-start justify-between gap-4">
                  <div className="flex min-w-0 items-start gap-4">
                    {student.avatar_url ? (
                      <img src={student.avatar_url} alt={displayName} referrerPolicy="no-referrer" className="h-14 w-14 rounded-2xl border border-[var(--border)] object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-2xl border border-[var(--border)] bg-[var(--bg-soft)] text-lg font-semibold text-[var(--text-soft)]">
                        {avatarLetter}
                      </div>
                    )}

                    <div className="min-w-0">
                      <h2 className="truncate text-base font-semibold text-[var(--text)]">
                        {displayName}
                      </h2>

                      <p className="mt-1 truncate text-sm text-[var(--text-soft)]">
                        {student.email || student.id}
                      </p>

                      <div className="mt-4">
                        <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-faint)]">
                          Class History ({history.length})
                        </p>

                        {history.length === 0 ? (
                          <p className="mt-2 text-sm text-[var(--text-faint)]">
                            No class history yet.
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {history.slice(0, 5).map((item, index) => (
                              <div key={item.id} className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-soft)]">
                                <span className="rounded-full bg-[var(--primary)]/10 px-2 py-0.5 text-xs font-semibold text-[var(--primary)]">
                                  {history.length - index}
                                </span>

                                <span>
                                  {formatDate(item.created_at)}
                                </span>

                                <span className="text-xs text-[var(--text-faint)]">
                                  Meeting ID: {item.zoom_meeting_id}
                                </span>

                                {item.status ? (
                                  <span className="rounded-full bg-gray-50 px-2 py-0.5 text-xs text-[var(--text-soft)]">
                                    {item.status}
                                  </span>
                                ) : null}
                              </div>
                            ))}

                            {history.length > 5 ? (
                              <p className="text-xs text-[var(--text-faint)]">
                                + {history.length - 5} more classes
                              </p>
                            ) : null}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StartClassroomButton studentId={student.id} />
                  </div>
                </div>
              </div>
            );
          })}
        </section>
      )}
    </Container>
  );
}
