"use client";

import { ReactNode } from "react";

import Link from "next/link";

import {
  BookOpen,
  Layers3,
} from "lucide-react";

import { usePathname } from "next/navigation";

import { Badge } from "@/components/ui-v2/badge";
import { Card, CardContent } from "@/components/ui-v2/card";
import { grammarSections } from "@/lib/grammar/topics";

export default function GrammarLayout({
  children,
}: {
  children: ReactNode;
}) {

  const pathname =
    usePathname();

  return (
    <div className="min-h-screen bg-[var(--bg)]">

      <div className="flex w-full">

        {/* Sidebar */}

        <aside className="hidden w-[260px] shrink-0 lg:block">

          <Card className="sticky top-0 h-screen overflow-hidden border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">

            <CardContent className="h-full overflow-y-auto p-6 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">

              <div className="mb-8 flex items-center gap-4">

                <div className="flex h-14 w-14 items-center justify-center rounded-3xl bg-[var(--primary-soft)] text-[var(--primary)]">
                  <BookOpen size={26} />
                </div>

                <div>

                  <div className="text-lg font-semibold tracking-tight text-[var(--text)]">
                    Grammar Hub
                  </div>

                  <div className="text-sm text-[var(--text-soft)]">
                    AI 英语语法知识库
                  </div>

                </div>

              </div>

              <div className="space-y-7">

                {grammarSections.map((section) => (

                  <div key={section.titleEn}>

                    <div className="mb-4 flex items-center justify-between">

                      <div>

                        <div className="text-base font-semibold text-[var(--text)]">
                          {section.titleZh}
                        </div>

                        <div className="text-sm text-[var(--text-soft)]">
                          {section.titleEn}
                        </div>

                      </div>

                      <Badge variant="secondary">
                        {section.topics.length}
                      </Badge>

                    </div>

                    <div className="space-y-1.5">

                      {section.topics.map((topic) => {

                        const isActive =
                          pathname.startsWith(`/grammar/${topic.slug}`);

                        return (

                          <Link
                            key={topic.slug}
                            href={`/grammar/${topic.slug}`}
                            className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left transition-all ${isActive ? "bg-[var(--primary-soft)]" : "hover:bg-[var(--bg-soft)]"}`}
                          >

                            <div>

                              <div className={`text-sm font-semibold ${isActive ? "text-[var(--primary)]" : "text-[var(--text)]"}`}>
                                {topic.zh}
                              </div>

                              <div className={`mt-0.5 text-xs tracking-wide ${isActive ? "text-[var(--primary)] opacity-80" : "text-[var(--text-soft)]"}`}>
                                {topic.en}
                              </div>

                            </div>

                            <Layers3
                              size={15}
                              className={isActive ? "text-[var(--primary)]" : "text-[var(--text-soft)]"}
                            />

                          </Link>

                        );

                      })}

                    </div>

                  </div>

                ))}

              </div>

            </CardContent>

          </Card>

        </aside>

        {/* Main */}

        <main className="min-w-0 flex-1">
          {children}
        </main>

      </div>

    </div>
  );

}
