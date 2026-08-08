"use client";

import Image from "next/image";
import { useState } from "react";
import type { Product } from "./sample-data";

export function ProductCard({
  product,
  compact = false,
}: {
  product: Product;
  compact?: boolean;
}) {
  const [activeOptionId, setActiveOptionId] = useState(
    product.options?.[0]?.id,
  );
  const [hasSelectedOption, setHasSelectedOption] = useState(false);
  const activeOption = product.options?.find(
    (option) => option.id === activeOptionId,
  );
  const image = activeOption?.image ?? product.image;
  const alt = activeOption?.alt ?? product.alt;

  return (
    <article
      className={
        compact ? "product-card product-card--compact" : "product-card"
      }
    >
      <div className="product-card__image">
        {product.badge && !compact && (
          <span
            className={`product-badge product-badge--${product.badge === "NEW" ? "new" : "pick"}`}
          >
            {product.badge}
          </span>
        )}
        <Image
          key={image}
          className={hasSelectedOption ? "is-option-change" : undefined}
          src={image}
          alt={alt}
          fill
          sizes={compact ? "112px" : "(max-width: 760px) 50vw, 25vw"}
        />
      </div>
      <div className="product-card__content">
        {!compact && product.options && product.options.length > 1 && (
          <div
            className="product-options"
            role="group"
            aria-label={`${product.name} 옵션 이미지`}
          >
            {product.options.slice(0, 4).map((option) => (
              <button
                key={option.id}
                type="button"
                aria-label={`${option.label} 이미지 보기`}
                aria-pressed={activeOptionId === option.id}
                onClick={() => {
                  setActiveOptionId(option.id);
                  setHasSelectedOption(true);
                }}
              >
                <Image src={option.image} alt="" fill sizes="36px" />
              </button>
            ))}
            {product.options.length > 4 && (
              <span>+{product.options.length - 4}</span>
            )}
          </div>
        )}
        <p className="eyebrow">
          {product.brand} · {product.collection}
        </p>
        <h3>{product.name}</h3>
        <p className="price">{product.price}</p>
      </div>
    </article>
  );
}
