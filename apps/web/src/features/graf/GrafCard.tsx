import Image from "next/image";
import Link from "next/link";
import type { Graf } from "@/features/catalog/sample-data";

export function GrafCard({
  graf,
  priority = false,
}: {
  graf: Graf;
  priority?: boolean;
}) {
  return (
    <article className="graf-card">
      <Link href={`/graf/${graf.slug}`} className="graf-card__image">
        <Image
          src={graf.image}
          alt={graf.alt}
          fill
          priority={priority}
          sizes="(max-width: 760px) 100vw, 33vw"
        />
      </Link>
      <div className="graf-card__body">
        <Link href={`/graf/${graf.slug}`}>
          <h3>{graf.title}</h3>
        </Link>
        <p className="graf-card__meta">
          {graf.spaceType} · {graf.area}
        </p>
      </div>
    </article>
  );
}
