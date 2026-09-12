import Link from "next/link";
import { ArrowRight } from "lucide-react";

type IeltsSectionKey = "listening" | "speaking" | "reading" | "writing";

type Props = {
  current: IeltsSectionKey;
};

const tabs: Array<{
  key: IeltsSectionKey;
  label: string;
  english: string;
  description: string;
  href: string;
  image: string;
  accent: string;
}> = [
  {
    key: "listening",
    label: "听力",
    english: "Listening",
    description: "剑桥雅思听力机考练习",
    href: "/ielts/listening",
    image: "/SVG/listening_Peason.svg",
    accent: "bg-[#e6f7ff]",
  },
  {
    key: "speaking",
    label: "口语",
    english: "Speaking",
    description: "Part 1-3 口语题库训练",
    href: "/ielts/speaking",
    image: "/SVG/speaking_Peason.svg",
    accent: "bg-[#eef8ed]",
  },
  {
    key: "reading",
    label: "阅读",
    english: "Reading",
    description: "静态 Markdown 阅读题库",
    href: "/ielts/reading",
    image: "/SVG/reading_Peason.svg",
    accent: "bg-[#fff3df]",
  },
  {
    key: "writing",
    label: "写作",
    english: "Writing",
    description: "Task 1/2 写作题库训练",
    href: "/ielts/writing",
    image: "/SVG/writing_Peason.svg",
    accent: "bg-[#f1ecff]",
  },
];

export default function IELTSSubnav({ current }: Props) {
  return (
    <nav className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4" aria-label="IELTS practice sections">
      {tabs.map((tab) => {
        const active =
          current === tab.key;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            aria-current={active ? "page" : undefined}
            className={`group flex min-h-[132px] overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--card)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-md)] ${
              active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-[var(--border)]"
            }`}
          >
            <span className={`flex w-28 shrink-0 items-center justify-center ${tab.accent} sm:w-32`}>
              <span
                aria-hidden="true"
                className="h-16 w-16 bg-contain bg-center bg-no-repeat sm:h-20 sm:w-20"
                style={{ backgroundImage: `url(${tab.image})` }}
              />
            </span>
            <span className="flex min-w-0 flex-1 flex-col justify-between p-4">
              <span>
                <span className="text-xs font-bold uppercase tracking-[0.14em] text-[var(--text-faint)]">
                  IELTS {tab.english}
                </span>
                <span className="mt-1 block text-lg font-bold text-[var(--text)]">
                  {tab.label}
                </span>
                <span className="mt-1 line-clamp-2 text-sm leading-6 text-[var(--text-soft)]">
                  {tab.description}
                </span>
              </span>
              <span className="mt-3 flex items-center gap-2 text-sm font-semibold text-[var(--primary)]">
                进入
                <ArrowRight size={15} className="transition group-hover:translate-x-1" />
              </span>
            </span>
          </Link>
        );
      })}
    </nav>
  );
}
