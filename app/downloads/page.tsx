import Container from "@/components/site/container";
import QuestionPdfDownloadCenter from "@/components/site/question-pdf-download-center";
import { requireUser } from "@/lib/auth/require-user";

export default async function DownloadsPage() {
  await requireUser("/downloads");

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10">
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
            DOWNLOAD CENTER
          </p>

          <h1 className="mb-5 text-3xl font-bold tracking-tight text-(--theme) sm:text-4xl">
            题库 PDF 下载中心
          </h1>

          <p className="max-w-3xl text-base leading-7 text-gray-600 sm:text-lg sm:leading-8">
            点击对应题型按钮，直接下载该题型数据库里的全部题目 PDF。
          </p>
        </section>

        <QuestionPdfDownloadCenter />
      </Container>
    </main>
  );
}