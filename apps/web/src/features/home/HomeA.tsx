import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CommerceHeader } from "@/components/CommerceHeader";
import { ProductCard } from "@/features/catalog/ProductCard";
import { grafs, products } from "@/features/catalog/sample-data";
import { GrafCard } from "@/features/graf/GrafCard";
import { HomeCategories } from "./HomeCategories";

export function HomeA() {
  return (
    <>
      <CommerceHeader />
      <main className="commerce-home commerce-home--a" id="main-content">
        <section className="commercial-hero shell">
          <div className="commercial-hero__main">
            <Image
              src={grafs[0].image}
              alt={grafs[0].alt}
              fill
              priority
              sizes="(max-width: 760px) 100vw, 76vw"
            />
            <div className="commercial-hero__copy">
              <p>STAYGRAF MATERIAL SHOP</p>
              <h1>
                공간에서 발견한 자재를
                <br />
                실제 구매까지
              </h1>
              <Link href="#products">
                상품 둘러보기 <ArrowRight size={17} />
              </Link>
            </div>
          </div>
          <Link
            className="commercial-hero__side"
            href={`/graf/${grafs[1].slug}`}
          >
            <Image src={grafs[1].image} alt="" fill sizes="24vw" />
            <div>
              <span>새로운 GRAF</span>
              <strong>{grafs[1].title}</strong>
            </div>
          </Link>
        </section>

        <section className="compact-section shell">
          <div className="commerce-heading">
            <div>
              <h2>카테고리로 찾기</h2>
              <p>필요한 자재를 종류별로 살펴보세요.</p>
            </div>
          </div>
          <HomeCategories compact />
        </section>

        <section className="compact-section shell" id="products">
          <div className="commerce-heading">
            <div>
              <h2>이번 주 자재 셀렉션</h2>
              <p>공간의 바탕과 디테일을 만드는 자재를 모았습니다.</p>
            </div>
          </div>
          <div className="commerce-products">
            {products.slice(0, 4).map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>

        <section className="compact-section graf-commerce-section">
          <div className="shell">
            <div className="commerce-heading">
              <div>
                <h2>새로운 GRAF</h2>
                <p>완성된 공간에서 사용 자재를 함께 확인하세요.</p>
              </div>
            </div>
            <div className="graf-grid graf-grid--minimal" id="graf">
              {grafs.map((graf) => (
                <GrafCard key={graf.slug} graf={graf} />
              ))}
            </div>
          </div>
        </section>
      </main>
    </>
  );
}
