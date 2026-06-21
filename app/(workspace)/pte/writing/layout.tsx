import type { ReactNode } from "react";

import PTETopNav from "@/components/site/pte-top-nav";
import Container from "@/components/site/container";

export default function WritingLayout({ children }: { children: ReactNode }) {
  return (
    <main
      className="relative py-1">
      <Container className="relative z-10">
        <PTETopNav currentMain="writing" />

        <div className="mt-2">{children}</div>
      </Container>
    </main>
  );
}
