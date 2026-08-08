"use client";

import Link from "next/link";

import {
  ArrowRight,
  BookOpen,
  Layers3,
  Search,
} from "lucide-react";

import { Badge } from "@/components/ui-v2/badge";
import { Button } from "@/components/ui-v2/button";
import { Card, CardContent } from "@/components/ui-v2/card";
import { Input } from "@/components/ui-v2/input";
import { firstGrammarTopic, grammarSections } from "@/lib/grammar/topics";

export default function GrammarPage() {
  return (
    <div className="min-h-screen bg-[var(--bg)]">
      <div className="mx-auto flex w-full max-w-[1850px] gap-6 px-4 py-6 lg:px-6">
        <main className="min-w-0 flex-1">
          <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <div className="mb-1 text-3xl font-bold tracking-tight text-[var(--text)]">
                Grammar Knowledge Base
              </div>

              <div className="text-sm text-[var(--text-soft)]">
                Master English grammar for PTE & IELTS with AI explanations
              </div>
            </div>

            <div className="flex w-full gap-3 lg:w-auto">
              <div className="relative flex-1 lg:w-[360px]">
                <Search size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--text-soft)]" />

                <Input
                  placeholder="Search grammar topic..."
                  className="h-11 rounded-2xl border-[var(--border)] bg-[var(--card)] pl-11"
                />
              </div>

              <Button className="h-11 rounded-2xl px-5">
                Search
              </Button>
            </div>
          </div>

          <Card className="overflow-hidden border-[var(--border)] bg-gradient-to-br from-[var(--primary-soft)] via-[var(--card)] to-[var(--card)] shadow-[var(--shadow-sm)]">
            <CardContent className="p-6">
              <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
                <div>
                  <Badge className="mb-4 rounded-full">
                    AI Grammar Assistant
                  </Badge>

                  <div className="mb-3 text-4xl font-bold tracking-tight text-[var(--text)]">
                    Grammar Learning Platform
                  </div>

                  <div className="mb-2 text-lg font-medium text-[var(--primary)]">
                    AI 驱动英语语法学习系统
                  </div>

                  <div className="mb-6 max-w-[720px] text-sm leading-7 text-[var(--text-soft)]">
                    Learn grammar structures, academic writing, sentence patterns, and PTE-focused English through AI-generated explanations and intelligent practice systems.
                  </div>

                  <Link
                    href={`/grammar/${firstGrammarTopic.slug}`}
                    className="inline-flex h-11 items-center gap-2 rounded-2xl bg-[var(--primary)] px-5 text-sm font-medium text-white shadow-[var(--shadow-sm)] transition-all duration-200 hover:bg-[var(--primary-hover)]"
                  >
                    <BookOpen size={16} />
                    开始学习
                    <ArrowRight size={16} />
                  </Link>
                </div>

                <div className="rounded-[28px] border border-[var(--border)] bg-[var(--card)]/80 p-6 backdrop-blur">
                  <div className="mb-5">
                    <div className="mb-1 text-sm font-medium text-[var(--text)]">
                      Grammar Statistics
                    </div>

                    <div className="text-xs text-[var(--text-soft)]">
                      Knowledge Overview
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                      <span className="text-sm text-[var(--text)]">
                        Grammar Topics
                      </span>

                      <Badge>
                        120+
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                      <span className="text-sm text-[var(--text)]">
                        Academic Structures
                      </span>

                      <Badge variant="secondary">
                        500+
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between rounded-2xl bg-[var(--bg-soft)] px-4 py-3">
                      <span className="text-sm text-[var(--text)]">
                        PTE Grammar Coverage
                      </span>

                      <Badge variant="secondary">
                        Full
                      </Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="mt-6 grid gap-4 md:grid-cols-2 2xl:grid-cols-3">
            {grammarSections.map((section) => (
              <Card key={section.titleEn} className="border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-sm)]">
                <CardContent className="p-5">
                  <div className="mb-4 flex items-center justify-between gap-4">
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
                    {section.topics.map((topic) => (
                      <Link
                        key={topic.slug}
                        href={`/grammar/${topic.slug}`}
                        className="flex min-h-14 w-full items-center justify-between gap-3 rounded-2xl px-4 py-3 text-left transition-all hover:bg-[var(--bg-soft)]"
                      >
                        <span className="min-w-0">
                          <span className="block text-sm font-semibold text-[var(--text)]">
                            {topic.zh}
                          </span>

                          <span className="mt-0.5 block text-xs text-[var(--text-soft)]">
                            {topic.en}
                          </span>
                        </span>

                        <Layers3 size={15} className="shrink-0 text-[var(--text-soft)]" />
                      </Link>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </main>
      </div>
    </div>
  );
}
