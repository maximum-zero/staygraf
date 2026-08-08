import Link from "next/link";

const categories = ["타일·빅슬랩", "수전", "조명", "신상품", "GRAF"];

export function CategoryStrip() {
  return (
    <nav className="category-strip" aria-label="상품 카테고리">
      <div className="shell category-strip__inner">
        {categories.map((category) => (
          <Link key={category} href="#categories">
            {category}
          </Link>
        ))}
      </div>
    </nav>
  );
}
