import Container from "@/components/site/container";
import IELTSSubnav from "@/components/site/ielts-subnav";
import { requireUser } from "@/lib/auth/require-user";

export default async function IeltsListeningPage() {
  await requireUser("/ielts/listening");

  return (
    <main className="py-12 sm:py-16 lg:py-20">
      <Container>
        <section className="mb-10">
          <h1 className="mb-4 text-3xl font-bold tracking-tight sm:text-4xl">
            雅思听力
          </h1>
          <p className="text-base leading-7 text-gray-600 sm:text-lg">
            听力页面后续开发。
          </p>
        </section>

        <IELTSSubnav current="listening" />
      </Container>
    </main>
  );
}