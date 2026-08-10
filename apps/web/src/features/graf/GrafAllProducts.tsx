"use client";

import { X } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { ProductCard } from "@/features/catalog/ProductCard";
import type { Product } from "@/features/catalog/sample-data";

export function GrafAllProducts({ products }: { products: Product[] }) {
  const [isOpen, setIsOpen] = useState(false);
  const [showPersistentTrigger, setShowPersistentTrigger] = useState(false);
  const trigger = useRef<HTMLSpanElement>(null);
  const persistentTrigger = useRef<HTMLButtonElement>(null);
  const drawer = useRef<HTMLElement>(null);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const element = trigger.current;
    if (!element) return;
    const observer = new IntersectionObserver(
      ([entry]) => setShowPersistentTrigger(!entry.isIntersecting),
      { rootMargin: "-72px 0px 0px" },
    );
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const root = document.documentElement;
    const persistentTriggerElement = persistentTrigger.current;
    const previousOverflow = root.style.overflow;
    root.style.overflow = "hidden";
    closeButton.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setIsOpen(false);
      if (event.key !== "Tab") return;
      const focusable = Array.from(
        drawer.current?.querySelectorAll<HTMLElement>(
          'button, a[href], [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first || !last) return;
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      root.style.overflow = previousOverflow;
      persistentTriggerElement?.focus();
    };
  }, [isOpen]);

  return (
    <>
      <span
        ref={trigger}
        className="graf-all-products-sentinel"
        aria-hidden="true"
      />
      <button
        ref={persistentTrigger}
        className={`graf-all-products-trigger graf-all-products-trigger--persistent${showPersistentTrigger ? " is-visible" : ""}`}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={isOpen}
        tabIndex={showPersistentTrigger ? 0 : -1}
        onClick={() => setIsOpen(true)}
      >
        사용 상품 <strong>{products.length}</strong>
      </button>
      {isOpen && (
        <div
          className="graf-products-layer"
          role="presentation"
          onMouseDown={() => setIsOpen(false)}
        >
          <section
            ref={drawer}
            className="graf-products-drawer"
            role="dialog"
            aria-modal="true"
            aria-labelledby="graf-products-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <header>
              <div>
                <p>GRAF 전체 상품</p>
                <h2 id="graf-products-title">사용 상품 {products.length}</h2>
              </div>
              <button
                ref={closeButton}
                type="button"
                aria-label="전체 사용 상품 닫기"
                onClick={() => setIsOpen(false)}
              >
                <X />
              </button>
            </header>
            <div className="graf-products-drawer__list">
              {products.map((product) => (
                <ProductCard key={product.id} product={product} compact />
              ))}
            </div>
          </section>
        </div>
      )}
    </>
  );
}
