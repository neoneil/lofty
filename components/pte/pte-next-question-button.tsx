"use client";

import { useEffect, useState } from "react";
import { ChevronRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui-v2/button";

export function PteNextQuestionButton({ href }: { href: string }) {
  const router = useRouter();
  const [isNavigating, setIsNavigating] = useState(false);

  useEffect(() => {
    router.prefetch(href);
  }, [href, router]);

  function navigate() {
    if (isNavigating) return;
    setIsNavigating(true);
    router.push(href);
  }

  return (
    <Button type="button" variant="primary" className="gap-1.5" onClick={navigate} disabled={isNavigating}>
      {isNavigating ? (
        <>
          <LoaderCircle size={16} className="animate-spin" />
          Loading
        </>
      ) : (
        <>
          Next
          <ChevronRight size={16} />
        </>
      )}
    </Button>
  );
}
