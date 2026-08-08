import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { products } from "@/features/catalog/sample-data";

const categories = [
  {
    name: "타일",
    caption: "타일 · 빅슬랩",
    product: products[0],
  },
  {
    name: "수전",
    caption: "세면 · 주방 · 샤워",
    product: products[1],
  },
  {
    name: "조명",
    caption: "펜던트 · 천장 · 벽",
    product: products[3],
  },
];

export function HomeCategories({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={
        compact ? "home-categories home-categories--compact" : "home-categories"
      }
      id="categories"
    >
      {categories.map(({ name, caption, product }) => (
        <Link className="home-category" href="#products" key={name}>
          <div className="home-category__image">
            <Image
              src={product.image}
              alt=""
              fill
              sizes="(max-width: 620px) 33vw, 25vw"
            />
          </div>
          <div>
            <strong>
              {name} <ArrowRight size={15} strokeWidth={1.7} />
            </strong>
            <span>{caption}</span>
          </div>
        </Link>
      ))}
    </div>
  );
}
