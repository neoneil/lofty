import type { ReactNode } from "react";

import PTETopNav from "@/components/site/pte-top-nav";
import Container from "@/components/site/container";

export default function ReadingLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative py-1">
      <Container className="relative z-10">
        <PTETopNav currentMain="reading" />

        <div className="mt-4">{children}</div>
      </Container>
    </main>
  );
}
