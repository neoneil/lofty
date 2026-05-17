import Image from "next/image";
import Link from "next/link";

type CardItem = {
  title: string;
  href: string;
  image?: string;
  description?: string;
};

const cards: CardItem[] = [
  {
    title: "雅思考试",
    href: "/ielts",
    image: "/images/ielts.png",
    description: "系统学习雅思听说读写考试技巧",
  },
  {
    title: "PTE考试",
    href: "/ielts",
    image: "/images/pte.png",
    description: "高效掌握PTE题型与提分技巧",
  },
  {
    title: "语法总纲",
    href: "/",
    image: "/images/grammar.png",
    description: "建立完整语法框架体系",
  },
  {
    title: "单词奥秘",
    href: "/",
    image: "/images/vocabulary.png",
    description: "词根词缀与高频词系统学习",
  },
];

export default function ExamCardsSection() {
  return (
    <section className="container-main py-10 sm:py-12 lg:py-16">
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-4">
        {cards.map((card) => (
          <Link
            key={card.title}
            href={card.href}
            className="group overflow-hidden rounded border border-(--border) bg-(--bg) shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative aspect-16/10 w-full overflow-hidden bg-(--card-soft)">
              {card.image ? (
                <Image
                  src={card.image}
                  alt={card.title}
                  fill
                  sizes="(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 25vw"
                  className="object-cover transition duration-300 group-hover:scale-105"
                  priority={false}
                />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-(--muted)">
                  {card.title}
                </div>
              )}
            </div>

            <div className="p-5">
              <h3 className="text-lg font-semibold text-(--text)">
                {card.title}
              </h3>

              <p className="mt-2 text-sm leading-6 text-(--muted)">
                {card.description}
              </p>

              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-(--primary)">
                了解更多
                <span className="transition-transform group-hover:translate-x-1">
                  →
                </span>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}