import Link from "next/link";

type PageCardProps = {
  title: string;
  description: string;
  href: string;
};

export default function PageCard({
  title,
  description,
  href,
}: PageCardProps) {
  return (
    <Link
      href={href}
      className="block rounded border border-(--border-color) bg-(--bg-card) p-6 shadow-sm transition-all duration-200 hover:-translate-y-1 hover:shadow-md"
    >
      <h2 className="text-xl font-semibold text-(--text-main)">{title}</h2>
      <p className="mt-2 text-sm leading-6 text-(--text-secondary)">
        {description}
      </p>
    </Link>
  );
}