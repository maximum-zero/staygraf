import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { grafs } from "@/features/catalog/sample-data";
import { GrafIndexExplorer } from "@/features/graf/GrafIndexExplorer";

export default function GrafIndexPage() {
  return (
    <>
      <SiteHeader />
      <main className="graf-index" id="main-content">
        <Suspense fallback={<div className="graf-index__loading shell" aria-hidden="true" />}>
          <GrafIndexExplorer grafs={grafs} />
        </Suspense>
      </main>
    </>
  );
}
