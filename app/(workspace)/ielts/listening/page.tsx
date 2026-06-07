import Link from "next/link";
import { Headphones } from "lucide-react";

import IELTSSubnav from "@/components/site/ielts-subnav";
import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { requireUser } from "@/lib/auth/require-user";

export default async function IeltsListeningPage() {
  await requireUser("/ielts/listening");

  return (
    <main className="container-main py-8 sm:py-10">
      <section className="mb-8">
        <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-gray-500 sm:text-sm">
          IELTS LISTENING
        </p>

        <h1 className="mb-5 text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
          雅思听力
        </h1>

        <p className="max-w-3xl text-base leading-7 text-[var(--text-soft)] sm:text-lg sm:leading-8">
          IELTS Listening 题库模块正在准备中。
        </p>
      </section>

      <IELTSSubnav current="listening" />

      <Card className="mx-auto mt-8 max-w-2xl">
        <CardContent className="flex flex-col items-center p-8 text-center">
          <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--primary-soft)] text-[var(--primary)]">
            <Headphones size={28} />
          </div>

          <Badge variant="secondary" className="mb-4">
            Coming Soon
          </Badge>

          <h2 className="mb-3 text-xl font-semibold text-[var(--text)]">
            听力练习即将上线
          </h2>

          <p className="mb-6 max-w-lg text-sm leading-7 text-[var(--text-soft)]">
            后续会接入 IELTS Listening 题库、音频播放与练习记录。
            目前可以先使用口语、写作和阅读模块。
          </p>

          <Link href="/ielts/speaking">
            <Button variant="secondary">返回口语题库</Button>
          </Link>
        </CardContent>
      </Card>
    </main>
  );
}
