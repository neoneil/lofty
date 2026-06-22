
import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

const adminModules = [
  {
    title: "学生练习管理",
    desc: "查看学生练习记录、分数趋势、听说读写进步情况。",
    href: "/admin/dashboard",
    tag: "Students",
  },
  {
    title: "文章管理",
    desc: "创建、编辑和管理 IELTS / PTE 文章。",
    href: "/admin/posts",
    tag: "Posts",
  },
  {
    title: "作文批改",
    desc: "批改学生作文。",
    href: "/ielts-writing",
    tag: "PTE / IELTS",
  },
  {
    title: "PTE 题库下载管理",
    desc: "管理 WFD、SST、HIW 等题型与音频资源。",
    href: "/downloads",
    tag: "PTE",
  },
  {
    title: "IELTS 题库下载管理",
    desc: "管理写作、口语、阅读、听力相关题目内容。",
    href: "/admin/ielts",
    tag: "IELTS",
  },
  {
    title: "留言 / 评论",
    desc: "查看用户留言、评论和网站互动内容。",
    href: "/admin/chat",
    tag: "Messages",
  },
  {
    title: "下载中心",
    desc: "导出 PDF、题库资料和学生学习材料。",
    href: "/admin/downloads",
    tag: "Export",
  },
   {
    title: "selective",
    desc: "selective history。",
    href: "/admin/selective/history",
    tag: "selective",
  },
  {
    title: "上课明细",
    desc: "各学生上课次数。",
    href: "/admin/start-classroom",
    tag: "Zoom 会议",
  },
  {
    title: "学生作文AI批改",
    desc: "AI - PTE - IELTS writing",
    href: "/admin/analyze_answer",
    tag: "AI response",
  },
  {
    title: "生成PTE 作文答案与句子库",
    desc: "AI 反馈",
    href: "/admin/generate_essay_answer",
    tag: "AI response",
  },
  {
    title: "AI 使用额度管理",
    desc: "查看用户 AI 使用量，调整每日/月度额度和无限额度。",
    href: "/admin/ai-usage",
    tag: "AI Usage",
  },
  {
    title: "WFD操作",
    desc: "活跃题目待定",
    href: "/admin/db-playground",
    tag: "WFD",
  },
];

export default async function AdminPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("email, role")
    .eq("id", user.id)
    .single();

  if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
    redirect("/");
  }

  return (
    <main className="min-h-screen bg-[var(--bg)] px-4 py-10 text-[var(--text)] sm:px-6 lg:px-8">
      <section className="mx-auto max-w-6xl">
        <div className="mb-8 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] backdrop-blur-xl sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="mb-3 text-sm font-semibold text-[var(--text-soft)]">
                Lofty Education Admin
              </p>

              <h1 className="text-2xl font-bold tracking-tight text-[var(--text)] md:text-3xl">
                后台管理
              </h1>
            </div>

            <div className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--bg-soft)] px-5 py-4 text-sm text-[var(--text-soft)]">
              <p className="font-semibold text-[var(--text)]">{profile.email}</p>
              <p className="mt-1">
                Role:{" "}
                <span className="font-semibold capitalize text-[var(--primary)]">
                  {profile.role}
                </span>
              </p>
            </div>
          </div>
        </div>

        <div className="mb-6 ml-5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--text)]">
              管理模块
            </h2>
            <p className="mt-1 text-sm text-[var(--text-soft)]">
              选择一个模块开始管理。
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {adminModules.map((item) => (
            <Link
              key={item.title}
              href={item.href}
              className="group rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] transition-all duration-300 hover:-translate-y-1 hover:border-[var(--primary)]/40 hover:bg-[var(--card-hover)] hover:shadow-[var(--shadow-md)]"
            >
              <div className="mb-6 flex items-center justify-between">
                <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-soft)]">
                  {item.tag}
                </span>

                <span className="flex h-9 w-9 items-center justify-center rounded-[var(--radius-md)] bg-[var(--primary)] text-white shadow-[var(--shadow-sm)] transition-all duration-300 group-hover:translate-x-1 group-hover:bg-[var(--primary-hover)]">
                  →
                </span>
              </div>

              <h3 className="text-xl font-bold tracking-tight text-[var(--text)]">
                {item.title}
              </h3>

              <p className="mt-3 text-sm leading-6 text-[var(--text-soft)]">
                {item.desc}
              </p>
            </Link>
          ))}
        </div>
      </section>
    </main>
  );
}

// import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";

// export default async function AdminPage() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     redirect("/login");
//   }

//   const { data: profile } = await supabase
//     .from("profiles")
//     .select("email, role")
//     .eq("id", user.id)
//     .single();

//   if (!profile || (profile.role !== "admin" && profile.role !== "editor")) {
//     redirect("/");
//   }

//   return (
//     <main className="mx-auto max-w-4xl px-6 py-12 mt-5">
//       <h1 className="mb-4 text-3xl font-bold">Admin Dashboard</h1>
//       <p>Welcome, {profile.email}</p>
//       <p>Role: {profile.role}</p>
//     </main>
//   );
// }
