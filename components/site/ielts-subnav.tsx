import Link from "next/link";
import Image from "next/image";
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
  imageAlt: string;
}> = [
  {
    key: "listening",
    label: "听力",
    english: "Listening",
    description: "剑桥雅思听力机考练习",
    href: "/ielts/listening",
    image: "/ielts-nav/listening.webp",
    imageAlt: "IELTS Listening audio practice",
  },
  {
    key: "speaking",
    label: "口语",
    english: "Speaking",
    description: "Part 1-3 口语题库训练",
    href: "/ielts/speaking",
    image: "/ielts-nav/speaking.webp",
    imageAlt: "IELTS Speaking interview practice",
  },
  {
    key: "reading",
    label: "阅读",
    english: "Reading",
    description: "静态 Markdown 阅读题库",
    href: "/ielts/reading",
    image: "/ielts-nav/reading.webp",
    imageAlt: "IELTS Reading academic passage practice",
  },
  {
    key: "writing",
    label: "写作",
    english: "Writing",
    description: "Task 1/2 写作题库训练",
    href: "/ielts/writing",
    image: "/ielts-nav/writing.webp",
    imageAlt: "IELTS Writing essay practice",
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
            className={`group block overflow-hidden rounded-[var(--radius-lg)] border bg-[var(--card)] shadow-[var(--shadow-sm)] transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/45 hover:shadow-[var(--shadow-md)] ${
              active ? "border-[var(--primary)] ring-2 ring-[var(--primary)]/10" : "border-[var(--border)]"
            }`}
          >
            <span className="relative block aspect-[16/9] overflow-hidden bg-[var(--bg-soft)]">
              <Image
                src={tab.image}
                alt={tab.imageAlt}
                fill
                sizes="(min-width: 1280px) 25vw, (min-width: 640px) 50vw, 100vw"
                className="object-cover transition duration-500 group-hover:scale-[1.03]"
              />
              <span className="absolute inset-0 bg-gradient-to-t from-black/35 via-black/0 to-white/10" />
            </span>
            <span className="flex min-h-[148px] flex-col justify-between p-4">
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
