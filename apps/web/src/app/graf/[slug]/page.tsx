import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { getGraf, grafs } from "@/features/catalog/sample-data";
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

  return (
    <>
      <SiteHeader />
      <main className="graf-detail" id="main-content">
        <div className="graf-detail__intro shell">
          <Link className="back-link" href="/#graf">
            <ArrowLeft size={16} /> GRAF
          </Link>
          <div className="graf-detail__title-row">
            <div>
              <p className="eyebrow">
                {graf.spaceType} · {graf.area}
              </p>
              <h1>{graf.title}</h1>
              <p className="graf-detail__summary">{graf.summary}</p>
            </div>
            <div className="contractor contractor--detail">
              <span className="contractor__avatar" aria-hidden="true">
                {graf.contractorInitial}
              </span>
              <span>
                <small>CONTRACTOR</small>
                <strong>{graf.contractor}</strong>
              </span>
            </div>
          </div>
        </div>
        <GrafProductExplorer graf={graf} />
        <section className="graf-story shell">
          <p className="eyebrow">DESIGN NOTE</p>
          <div>
            <h2>재료의 결을 숨기지 않는 공간</h2>
            <p>
              {graf.summary} 장식적인 요소를 덜어내고 빛이 재료 위에서 달라지는
              순간에 집중했습니다. 이미지의 +를 눌러 공간에 사용된 자재를 바로
              확인할 수 있습니다.
            </p>
          </div>
        </section>
      </main>
    </>
  );
}
