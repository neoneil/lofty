

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Container from "@/components/site/container";
import ExamTabs from "@/components/site/exam-tabs";

export default async function ExamPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login?next=/exam");
  }

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-12">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
            EXAM PRACTICE
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-(--theme) sm:text-4xl">
            考试练习
          </h1>

          <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            登录后可查看 IELTS 和 PTE 的听、说、读、写内容。后续可继续扩展做题记录、
            收藏、AI 批改和学习追踪功能。
          </p>
        </section>

        <ExamTabs />
      </Container>
    </main>
  );
}
// import Link from "next/link";
// import { redirect } from "next/navigation";
// import { createClient } from "@/lib/supabase/server";
// import Container from "@/components/site/container";

// export default async function IELTSPage() {
//   const supabase = await createClient();

//   const {
//     data: { user },
//   } = await supabase.auth.getUser();

//   if (!user) {
//     redirect("/login?next=/ielts");
//   }

//   const sections = [
//     {
//       title: "听力 Listening",
//       href: "/ielts/listening",
//       description: "后续可接入听力题库、练习记录和错题回顾。",
//     },
//     {
//       title: "口语 Speaking",
//       href: "/ielts/speaking",
//       description: "查看口语题库，后续可扩展 Part 1 / Part 2 / Part 3。",
//     },
//     {
//       title: "阅读 Reading",
//       href: "/ielts/reading",
//       description: "后续可接入阅读文章、题目和计时训练。",
//     },
//     {
//       title: "写作 Writing",
//       href: "/ielts/writing",
//       description: "查看写作题库，后续可接入 AI 批改与提交记录。",
//     },
//   ];

//   return (
//     <main className="py-12 sm:py-16 lg:py-20">
//       <Container>
//         <section className="mb-12">
//           <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
//             IELTS EXAM
//           </p>

//           <h1 className="mb-5 text-3xl font-bold tracking-tight sm:text-4xl text-(--theme)">
//             雅思考试
//           </h1>

//           <p className="max-w-2xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
//             登录后可查看雅思听、说、读、写内容。后续你还可以继续加做题、收藏、提交作业、AI 批改和学习追踪。
//           </p>
//         </section>

//         <section>
//           <div className="grid gap-5 sm:gap-6 md:grid-cols-2">
//             {sections.map((item) => (
//               <Link
//                 key={item.href}
//                 href={item.href}
//                 className="card block"
//               >
//                 <h2 className="mb-3 text-xl font-semibold sm:text-2xl  text-(--theme)">
//                   {item.title}
//                 </h2>
//                 <p className="text-sm leading-7 text-gray-600 sm:text-base">
//                   {item.description}
//                 </p>
//               </Link>
//             ))}
//           </div>
//         </section>
//       </Container>
//     </main>
//   );
// }