import { ArrowRight } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { CategoryStrip } from "@/components/CategoryStrip";
import { HomeVariantSwitcher } from "@/components/HomeVariantSwitcher";
import { SiteHeader } from "@/components/SiteHeader";
import { ProductCard } from "@/features/catalog/ProductCard";
import { grafs, products } from "@/features/catalog/sample-data";
import { GrafCard } from "@/features/graf/GrafCard";
import { HomeCategories } from "./HomeCategories";

export function HomeB() {
  const graf = grafs[0];
  return (
    <>
      <SiteHeader />
      <CategoryStrip />
      <main className="commerce-home commerce-home--b" id="main-content">
        <section className="curated-hero">
          <div className="curated-hero__image">
            <Image
              src={graf.image}
              alt={graf.alt}
              fill
              priority
              sizes="100vw"
            />
          </div>
          <div className="curated-hero__copy shell">
            <p>GRAF MATERIAL EDIT 01</p>
            <h1>공간을 완성한 재료</h1>
            <span>빛이 오래 머무는 스톤 리빙에 사용된 자재를 만나보세요.</span>
            <div>
              <Link className="filled-link" href="#selection">
                사용 상품 보기
              </Link>
              <Link className="line-link" href={`/graf/${graf.slug}`}>
                GRAF 보기 <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </section>

        <section className="compact-section shell category-intro">
          <div className="commerce-heading">
            <div>
              <span>QUICK CATEGORY</span>
              <h2>어떤 자재를 찾고 있나요?</h2>
            </div>
          </div>
          <HomeCategories compact />
        </section>

        <section className="selection-section" id="selection">
          <div className="shell selection-section__inner">
            <div className="selection-section__story">
              <span>WEEKLY MATERIAL EDIT</span>
              <h2>
                차분한 아이보리와
                <br />
                브러시드 메탈
              </h2>
              <p>
                따뜻한 바탕에 선명한 디테일을 더하는 이번 주 자재 셀렉션입니다.
              </p>
              <Link className="line-link" href="#selection">
                셀렉션 전체 보기 <ArrowRight size={15} />
              </Link>
            </div>
            <div className="selection-products">
              {products.slice(0, 4).map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>

        <section className="compact-section shell">
          <div className="commerce-heading">
            <div>
              <span>NEW GRAF</span>
              <h2>새로운 공간</h2>
            </div>
            <Link href="#graf-b">
              전체 보기 <ArrowRight size={15} />
            </Link>
          </div>
          <div className="editorial-graf-grid" id="graf-b">
            <GrafCard graf={grafs[0]} />
            <div>
              {grafs.slice(1).map((item) => (
                <GrafCard key={item.slug} graf={item} />
              ))}
            </div>
          </div>
        </section>
      </main>
      <HomeVariantSwitcher active="b" />
    </>
  );
}
