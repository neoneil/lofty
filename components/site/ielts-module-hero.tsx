import Image from "next/image";
import type { ReactNode } from "react";

import { Badge } from "@/components/ui-v2/badge";

type IeltsModuleHeroProps = {
  badge: string;
  title: string;
  description: string;
  image: string;
  imageAlt: string;
  detail?: ReactNode;
};

export default function IeltsModuleHero({
  badge,
  title,
  description,
  image,
  imageAlt,
  detail,
}: IeltsModuleHeroProps) {
  return (
    <section className="overflow-hidden rounded-[var(--radius-xl)] border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-md)]">
      <div className="grid min-h-[230px] lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.42fr)]">
        <div className="flex flex-col justify-center p-5 sm:p-7 lg:p-8">
          <Badge className="mb-3 w-fit">{badge}</Badge>
          <h1 className="text-3xl font-bold tracking-tight text-[var(--text)] sm:text-4xl">
            {title}
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-[var(--text-soft)] sm:text-base">
            {description}
          </p>
          {detail ? <div className="mt-5">{detail}</div> : null}
        </div>

        <div className="relative min-h-[190px] overflow-hidden border-t border-[var(--border)] bg-[var(--bg-soft)] lg:min-h-full lg:border-l lg:border-t-0">
          <Image
            src={image}
            alt={imageAlt}
            fill
            sizes="(min-width: 1024px) 38vw, 100vw"
            className="object-cover"
            priority={false}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-[var(--card)] via-transparent to-transparent lg:bg-gradient-to-r lg:from-[var(--card)] lg:via-[color:var(--card)]/45 lg:to-transparent" />
        </div>
      </div>
    </section>
  );
}
