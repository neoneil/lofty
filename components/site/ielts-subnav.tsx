import Link from "next/link";

type Props = {
  current: "listening" | "speaking" | "reading" | "writing";
};

export default function IELTSSubnav({ current }: Props) {
  const tabs = [
    { key: "listening", label: "听力", href: "/ielts/listening" },
    { key: "speaking", label: "口语", href: "/ielts/speaking" },
    { key: "reading", label: "阅读", href: "/ielts/reading" },
    { key: "writing", label: "写作", href: "/ielts/writing" },
  ];

  return (
    <div className="mb-8 flex flex-wrap gap-3 rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--card)] p-2 shadow-[var(--shadow-sm)]">
      {tabs.map((tab) => {
        const active = current === tab.key;

        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={
              active
                ? "rounded-[var(--radius-md)] bg-[var(--primary)] px-4 py-2 text-sm font-medium text-white shadow-[var(--shadow-sm)]"
                : "rounded-[var(--radius-md)] px-4 py-2 text-sm font-medium text-[var(--text-soft)] transition-all duration-200 hover:bg-[var(--bg-soft)] hover:text-[var(--primary)]"
            }
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
