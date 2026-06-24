import type { Metadata } from "next";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui-v2/card";

export const metadata: Metadata = {
  title: "课程视频 Demo | 致远英语",
  description: "致远英语 IELTS 与 PTE 听说读写课程视频 Demo 展示。",
};

type ExamName = "雅思" | "PTE";
type SkillName = "听力" | "口语" | "阅读" | "写作";

type DemoVideo = {
  id: string;
  title: string;
  source: string;
  tag: string;
};

type SkillSection = {
  skill: SkillName;
  videos: DemoVideo[];
};

type ExamSection = {
  exam: ExamName;
  description: string;
  sections: SkillSection[];
};

const speakingVideos: DemoVideo[] = [
  {
    id: "7uyRAfXbHFs",
    title: "IELTS Speaking Test with Feedback - Band 8.5",
    source: "IELTS Advantage",
    tag: "Speaking Sample",
  },
  {
    id: "gfKS-p7thDU",
    title: "Band 9.0 IELTS Practice Speaking Exam",
    source: "IELTS Advantage",
    tag: "Band 9",
  },
  {
    id: "k4715CJ0Ii8",
    title: "IELTS Speaking Test - Perfect Band 9",
    source: "IELTS Advantage",
    tag: "Full Test",
  },
  {
    id: "gdzrv2N40II",
    title: "Shadow This Band 9 IELTS Speaking Test",
    source: "IELTS Advantage",
    tag: "Shadowing",
  },
  {
    id: "ZITN5qjA2Kk",
    title: "This Student Made Band 9 Speaking Look Easy",
    source: "IELTS Advantage",
    tag: "Model Answer",
  },
  {
    id: "2oC-dXJUYqY",
    title: "IELTS Speaking Band 9 - Pronunciation + Vocabulary",
    source: "IELTS Advantage",
    tag: "Vocabulary",
  },
  {
    id: "Jf1OvqVwi1U",
    title: "How to Start Speaking in IELTS: Part 1",
    source: "English Speaking Success",
    tag: "Part 1",
  },
  {
    id: "b6_zfUHwlw8",
    title: "IELTS Speaking Band 9: Perfect Pronunciation",
    source: "IELTS Advantage",
    tag: "Pronunciation",
  },
];

const skillVideos: Record<SkillName, DemoVideo[]> = {
  听力: [speakingVideos[0], speakingVideos[4], speakingVideos[1], speakingVideos[6]],
  口语: [speakingVideos[0], speakingVideos[1], speakingVideos[2], speakingVideos[3]],
  阅读: [speakingVideos[4], speakingVideos[5], speakingVideos[6], speakingVideos[7]],
  写作: [speakingVideos[2], speakingVideos[5], speakingVideos[3], speakingVideos[7]],
};

const demoSections: ExamSection[] = [
  {
    exam: "雅思",
    description: "雅思听说读写 Demo。当前先使用公开 IELTS Speaking 视频作为临时预览素材。",
    sections: [
      { skill: "听力", videos: skillVideos.听力 },
      { skill: "口语", videos: skillVideos.口语 },
      { skill: "阅读", videos: skillVideos.阅读 },
      { skill: "写作", videos: skillVideos.写作 },
    ],
  },
  {
    exam: "PTE",
    description: "PTE 听说读写 Demo。当前先使用公开 IELTS Speaking 视频占位，后续可替换为你的 YouTube 内容。",
    sections: [
      { skill: "听力", videos: skillVideos.听力 },
      { skill: "口语", videos: skillVideos.口语 },
      { skill: "阅读", videos: skillVideos.阅读 },
      { skill: "写作", videos: skillVideos.写作 },
    ],
  },
];

function VideoCard({ video, exam, skill }: { video: DemoVideo; exam: ExamName; skill: SkillName }) {
  return (
    <Card className="overflow-hidden rounded-[var(--radius-md)] bg-[var(--card)]">
      <div className="aspect-video w-full overflow-hidden bg-[var(--bg-soft)]">
        <iframe className="h-full w-full" src={`https://www.youtube-nocookie.com/embed/${video.id}`} title={`${exam} ${skill} ${video.title}`} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowFullScreen loading="lazy" />
      </div>
      <CardContent className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-2.5 py-1 text-[11px] font-semibold text-[var(--primary)]">{video.tag}</span>
          <span className="text-xs text-[var(--text-faint)]">{video.source}</span>
        </div>
        <h3 className="text-sm font-semibold leading-6 text-[var(--text)]">{video.title}</h3>
      </CardContent>
    </Card>
  );
}

export default function DemosPage() {
  return (
    <main className="min-h-screen bg-[var(--bg)] text-[var(--text)]">
      <section className="px-4 pt-20 pb-8 sm:px-6 sm:pt-24 lg:px-8">
        <div className="mx-auto max-w-6xl">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-5 shadow-[var(--shadow-sm)] sm:p-7">
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[var(--primary)]">Video Demos</p>
            <h1 className="mt-3 text-2xl font-black tracking-tight text-[var(--text)] sm:text-3xl">课程视频 Demo</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)]">所有视频都在本页直接预览播放，不跳转到其它页面。当前先放公开 IELTS Speaking 视频作为临时素材，后续可以替换成你的 YouTube 视频链接。</p>
          </div>
        </div>
      </section>

      <section className="px-4 pb-14 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-6xl space-y-10">
          {demoSections.map((examSection) => (
            <div key={examSection.exam} className="space-y-5">
              <Card className="rounded-[var(--radius-lg)] bg-[var(--card)]">
                <CardHeader className="flex-col items-start gap-1 p-5 sm:p-6">
                  <CardTitle className="text-xl font-black">{examSection.exam}</CardTitle>
                  <CardDescription>{examSection.description}</CardDescription>
                </CardHeader>
              </Card>

              <div className="space-y-8">
                {examSection.sections.map((section) => (
                  <section key={`${examSection.exam}-${section.skill}`} className="space-y-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
                      <div>
                        <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[var(--text-faint)]">{examSection.exam}</p>
                        <h2 className="text-lg font-bold text-[var(--text)]">{section.skill}</h2>
                      </div>
                      <span className="w-fit rounded-full border border-[var(--border)] bg-[var(--bg-soft)] px-3 py-1 text-xs font-semibold text-[var(--text-soft)]">4 个视频</span>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
                      {section.videos.map((video) => (
                        <VideoCard key={`${examSection.exam}-${section.skill}-${video.id}`} video={video} exam={examSection.exam} skill={section.skill} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
