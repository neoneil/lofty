import Container from "@/components/site/container";
import QuestionPdfDownloadCenter from "@/components/site/question-pdf-download-center";
import { Badge } from "@/components/ui-v2/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";

export default async function DownloadsPage() {
  await requireUser("/downloads");

  return (
    <main className="min-h-screen bg-[var(--bg)] py-28 text-[var(--text)] sm:py-32 lg:py-36">
      <Container>
        <section className="mb-8 grid gap-6 lg:grid-cols-[1fr_360px] lg:items-stretch">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-6 shadow-[var(--shadow-sm)] sm:p-8">
            <Badge variant="default">Download Center</Badge>

            <h1 className="mt-5 text-3xl font-semibold tracking-tight text-[var(--text)] sm:text-4xl">
              题库 PDF 下载中心
            </h1>

            <p className="mt-4 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
              点击对应题型按钮，直接下载该题型数据库里的全部题目 PDF。适合课前预习、集中刷题和离线复盘。
            </p>
          </div>

          <Card className="rounded-[var(--radius-lg)] bg-[var(--card-soft)]">
            <CardHeader className="flex-col items-start gap-1">
              <CardTitle>下载说明</CardTitle>
              <CardDescription>
                PDF 会按题型导出，下载前请确认当前账号已登录。
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-3 gap-3">
              {["PTE", "PDF", "题库"].map((item) => (
                <div
                  key={item}
                  className="rounded-[var(--radius-md)] border border-[var(--border)] bg-[var(--card)] px-3 py-4 text-center text-sm font-semibold text-[var(--text)]"
                >
                  {item}
                </div>
              ))}
            </CardContent>
          </Card>
        </section>

        <QuestionPdfDownloadCenter />
      </Container>
    </main>
  );
}
