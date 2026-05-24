import {
  ArrowRight,
  BookOpen,
  Brain,
  Flame,
  Headphones,
  Mic,
  PenTool,
  Video,
} from "lucide-react";

import { StatsCard } from "@/components/dashboard-v2/stats-card";
import { Card, CardContent, CardDescription, CardHeader, CardTitle, } from "@/components/ui-v2/card";

import { Badge } from "@/components/ui-v2/badge";

import { Button } from "@/components/ui-v2/button";

const practiceModules = [
  {
    title: "Read Aloud",
    icon: <Mic size={20} />,
    progress: 72,
  },
  {
    title: "Repeat Sentence",
    icon: <Headphones size={20} />,
    progress: 61,
  },
  {
    title: "Write From Dictation",
    icon: <PenTool size={20} />,
    progress: 84,
  },
  {
    title: "Vocabulary",
    icon: <BookOpen size={20} />,
    progress: 43,
  },
];

export default function DashboardPage() {
  return (
    <div>
      <div className="space-y-6">
        <section className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
          <Card className="overflow-hidden">
            <CardContent className="relative flex min-h-[260px] flex-col justify-between p-8">
              <div className="absolute right-0 top-0 h-64 w-64 rounded-full bg-[var(--primary-soft)] blur-3xl" />

              <div className="relative z-10">
                <Badge>AI Powered Learning</Badge>

                <h1 className="mt-5 max-w-[520px] text-4xl font-semibold leading-tight tracking-tight text-[var(--text)]">
                  Welcome back, Vivi 👋
                </h1>

                <p className="mt-4 max-w-[560px] text-base leading-8 text-[var(--text-soft)]">
                  Continue improving your PTE skills with AI feedback, live
                  classrooms, and adaptive practice modules.
                </p>
              </div>

              <div className="relative z-10 mt-8 flex items-center gap-3">
                <Button size="lg">Continue Learning</Button>

                <Button variant="secondary" size="lg">
                  View Analytics
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Daily Progress</CardTitle>

              <CardDescription>Your learning activity today</CardDescription>
            </CardHeader>

            <CardContent className="space-y-5">
              <div className="flex items-center justify-between rounded-[var(--radius-md)] bg-[var(--bg-soft)] p-4">
                <div>
                  <div className="text-sm text-[var(--text-soft)]">
                    Study Time
                  </div>

                  <div className="mt-1 text-2xl font-semibold text-[var(--text)]">
                    2.4h
                  </div>
                </div>

                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                  <Flame size={20} />
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-[var(--text-soft)]">Weekly Goal</span>

                  <span className="font-medium text-[var(--text)]">74%</span>
                </div>

                <div className="h-3 overflow-hidden rounded-full bg-[var(--border-soft)]">
                  <div className="h-full w-[74%] rounded-full bg-[var(--primary)]" />
                </div>
              </div>
            </CardContent>
          </Card>
        </section>

        <section className="grid gap-6 xl:grid-cols-[1.4fr_1fr]">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between ">
                <div>
                  <CardTitle>Practice Modules</CardTitle>

                  <CardDescription>
                    Continue your daily training
                  </CardDescription>
                </div>

                <Button variant="ghost">
                  View All
                  <ArrowRight size={16} />
                </Button>
              </div>
            </CardHeader>

            <CardContent className="grid gap-4 sm:grid-cols-2">
              {practiceModules.map((module) => (
                <div
                  key={module.title}
                  className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--bg-soft)] p-5 transition-all duration-200 hover:border-[var(--border-strong)] hover:bg-white"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      {module.icon}
                    </div>

                    <Badge variant="secondary">{module.progress}%</Badge>
                  </div>

                  <div className="mt-5">
                    <div className="text-sm font-medium text-[var(--text)]">
                      {module.title}
                    </div>

                    <div className="mt-3 h-2 overflow-hidden rounded-full bg-[var(--border-soft)]">
                      <div
                        className="h-full rounded-full bg-[var(--primary)]"
                        style={{
                          width: `${module.progress}%`,
                        }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Class</CardTitle>

                <CardDescription>Your next live classroom</CardDescription>
              </CardHeader>

              <CardContent>
                <div className="rounded-[var(--radius-lg)] bg-[var(--bg-soft)] p-5">
                  <div className="flex items-center gap-3">
                    <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                      <Video size={20} />
                    </div>

                    <div>
                      <div className="font-medium text-[var(--text)]">
                        WFD Intensive Class
                      </div>

                      <div className="mt-1 text-sm text-[var(--text-soft)]">
                        Today · 7:30 PM
                      </div>
                    </div>
                  </div>

                  <Button className="mt-5 w-full">Join Classroom</Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>AI Feedback</CardTitle>

                <CardDescription>Latest performance analysis</CardDescription>
              </CardHeader>

              <CardContent className="space-y-4">
                <div className="flex items-start gap-3 rounded-[var(--radius-lg)] bg-[var(--bg-soft)] p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--primary-soft)] text-[var(--primary)]">
                    <Brain size={18} />
                  </div>

                  <div>
                    <div className="text-sm font-medium text-[var(--text)]">
                      Fluency improved by 12%
                    </div>

                    <p className="mt-1 text-sm leading-6 text-[var(--text-soft)]">
                      Your speaking pace and pronunciation consistency are
                      improving steadily.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
          <Card>
            <CardHeader>
              <CardTitle>Weekly Performance</CardTitle>

              <CardDescription>
                Your learning progress over the last 7 days
              </CardDescription>
            </CardHeader>


          </Card>
        </section>
        <section className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          <StatsCard
            title="Study Time"
            value="24.5h"
            change="+12%"
            description="vs last week"
            icon={<Flame size={20} />}
          />

          <StatsCard
            title="Questions Completed"
            value="1,238"
            change="+18%"
            icon={<BookOpen size={20} />}
          />
        </section>
      </div>
    </div>
  );
}
