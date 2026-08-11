import { Suspense } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { catalogProducts } from "@/features/catalog/catalog-data";
import { CatalogExplorer } from "@/features/catalog/CatalogExplorer";

export default function TileCatalogPage() {
  return (
    <>
      <SiteHeader />
      <Suspense
        fallback={<main className="catalog-loading shell" aria-hidden="true" />}
      >
        <CatalogExplorer products={catalogProducts} />
      </Suspense>
    </>
  );
}
