import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getGraf, grafs } from "@/features/catalog/sample-data";
import { GrafCard } from "@/features/graf/GrafCard";
import { GrafAllProducts } from "@/features/graf/GrafAllProducts";
import { GrafProductExplorer } from "@/features/graf/GrafProductExplorer";

export function generateStaticParams() {
  return grafs.map((graf) => ({ slug: graf.slug }));
}

export default async function GrafDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const graf = getGraf(slug);
  if (!graf) notFound();
  const [buildingType, roomType] = graf.spaceType.split(" · ");
  const otherGrafs = grafs.filter((item) => item.slug !== graf.slug);
  const sameContractor = otherGrafs.filter(
    (item) => item.contractor === graf.contractor,
  );
  const sameRoom = otherGrafs.filter(
    (item) =>
      item.spaceType.split(" · ")[1] === roomType &&
      item.contractor !== graf.contractor,
  );
  const relatedGrafs = [...sameContractor, ...sameRoom, ...otherGrafs]
    .filter((item, index, list) =>
      list.findIndex((candidate) => candidate.slug === item.slug) === index,
    )
    .slice(0, 2);

  return (
    <>
      <SiteHeader />
      <main className="graf-detail" id="main-content">
        <div className="graf-detail__intro shell">
          <Link className="back-link" href="/graf">
            <ChevronLeft size={18} /> GRAF 목록
          </Link>
          <div className="graf-detail__title-row">
            <div>
              <h1>{graf.title}</h1>
            </div>
          </div>
          <GrafAllProducts products={graf.products} />
          <dl className="graf-detail__facts" aria-label="공간 정보">
            <div>
              <dt>주거 유형</dt>
              <dd>{buildingType}</dd>
            </div>
            <div>
              <dt>공간 유형</dt>
              <dd>{roomType}</dd>
            </div>
            <div>
              <dt>면적</dt>
              <dd>{graf.area}</dd>
            </div>
            <div className="graf-detail__contractor">
              <dt>시공 업체</dt>
              <dd className="contractor contractor--detail">
                <span className="contractor__avatar" aria-hidden="true">
                  {graf.contractorInitial}
                </span>
                <strong>{graf.contractor}</strong>
              </dd>
            </div>
          </dl>
          <p className="graf-detail__summary">{graf.summary}</p>
        </div>
        <GrafProductExplorer graf={graf} />
        <section
          className="related-grafs shell"
          aria-labelledby="related-grafs-title"
        >
          <div className="related-grafs__heading">
            <h2 id="related-grafs-title">다른 공간 둘러보기</h2>
          </div>
          <div className="related-grafs__grid">
            {relatedGrafs.map((item) => (
              <GrafCard key={item.slug} graf={item} />
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
