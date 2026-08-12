import { notFound } from "next/navigation";
import { SiteHeader } from "@/components/SiteHeader";
import { catalogProducts } from "@/features/catalog/catalog-data";
import { ProductDetail } from "@/features/catalog/ProductDetail";

export function generateStaticParams() {
  return catalogProducts.map((product) => ({ id: product.id }));
}

export default async function ProductDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ option?: string }>;
}) {
  const { id } = await params;
  const { option } = await searchParams;
  const product = catalogProducts.find((item) => item.id === id);
  if (!product) notFound();

  return (
    <>
      <SiteHeader />
      <ProductDetail product={product} initialOptionId={option} />
    </>
  );
}
