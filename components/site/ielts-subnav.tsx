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
    <div className="mb-8 flex flex-wrap gap-3">
      {tabs.map((tab) => {
        const active = current === tab.key;

        return (
          <Link
            key={tab.href}
            href={tab.href}
           className={
  active
    ? "rounded border border-(--theme) px-4 py-2 text-sm font-medium text-(--theme)"
    : "rounded px-4 py-2 text-sm text-(--theme) hover:bg-(--theme) hover:text-white transition-all duration-200"
}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}