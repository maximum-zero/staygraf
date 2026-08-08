"use client";

import { Plus, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";
import { ProductCard } from "@/features/catalog/ProductCard";
import type { Graf } from "@/features/catalog/sample-data";

const positions = [
  { left: "28%", top: "66%" },
  { left: "54%", top: "18%" },
  { left: "76%", top: "43%" },
];

export function GrafProductExplorer({ graf }: { graf: Graf }) {
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    if (!isOpen) return;
    const onKeyDown = (event: KeyboardEvent) =>
      event.key === "Escape" && setIsOpen(false);
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen]);

  return (
    <>
      <section className="graf-explorer" aria-label="공간 이미지와 사용 상품">
        <Image src={graf.image} alt={graf.alt} fill priority sizes="100vw" />
        {graf.products.map((product, index) => (
          <button
            key={product.id}
            className={
              activeIndex === index
                ? "product-marker is-active"
                : "product-marker"
            }
            style={positions[index]}
            type="button"
            aria-label={`${product.name} 보기`}
            aria-expanded={activeIndex === index}
            onClick={() => setActiveIndex(activeIndex === index ? null : index)}
          >
            <Plus size={18} />
          </button>
        ))}
        {activeIndex !== null && graf.products[activeIndex] && (
          <div className="marker-preview">
            <button
              type="button"
              aria-label="상품 미리보기 닫기"
              onClick={() => setActiveIndex(null)}
            >
              <X size={17} />
            </button>
            <ProductCard product={graf.products[activeIndex]} compact />
          </div>
        )}
      </section>

      <button
        className="used-products-button"
        type="button"
        onClick={() => setIsOpen(true)}
        aria-haspopup="dialog"
      >
        사용 상품 <strong>{graf.products.length}</strong>
      </button>

      {isOpen && (
        <div
          className="product-drawer-layer"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            className="product-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="used-products-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <div className="product-drawer__header">
              <div>
                <p className="eyebrow">PRODUCTS IN THIS GRAF</p>
                <h2 id="used-products-title">
                  사용 상품 {graf.products.length}
                </h2>
              </div>
              <button
                type="button"
                aria-label="사용 상품 닫기"
                onClick={() => setIsOpen(false)}
              >
                <X />
              </button>
            </div>
            <div className="product-drawer__list">
              {graf.products.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
