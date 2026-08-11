"use client";

import Image from "next/image";
import { useState } from "react";
import {
  getRepresentativeMedia,
  type CatalogOption,
  type CatalogProduct,
} from "./catalog-data";

export function CatalogProductCard({
  product,
  priority = false,
}: {
  product: CatalogProduct;
  priority?: boolean;
}) {
  const [activeOptionId, setActiveOptionId] = useState(product.defaultOptionId);
  const [hasChanged, setHasChanged] = useState(false);
  const activeOption = product.options.find(
    (option) => option.id === activeOptionId,
  );
  const fallbackOption =
    product.options.find((option) => option.id === product.defaultOptionId) ??
    product.options[0];
  const representativeMedia = getRepresentativeMedia(
    activeOption ?? fallbackOption,
  );
  const displayedMedia =
    !hasChanged && product.coverMedia
      ? product.coverMedia
      : representativeMedia;
  const visibleOptions = product.options.slice(
    0,
    product.options.length > 5 ? 4 : 5,
  );
  const hiddenOptionCount = product.options.length - visibleOptions.length;
  const usesFiveSlotLayout = product.options.length >= 5;

  return (
    <article className="catalog-card">
      <div className="catalog-card__image">
        {product.badge && (
          <span
            className={`catalog-card__badge catalog-card__badge--${product.badge === "NEW" ? "new" : "md"}`}
          >
            {product.badge}
          </span>
        )}
        <Image
          key={displayedMedia.id}
          className={hasChanged ? "is-option-change" : undefined}
          src={displayedMedia.src}
          alt={displayedMedia.alt}
          fill
          priority={priority}
          sizes="(max-width: 539px) calc(100vw - 32px), (max-width: 767px) 50vw, (max-width: 1023px) 33vw, 25vw"
        />
      </div>
      <div className="catalog-card__body">
        <div
          className={[
            "catalog-card__options",
            usesFiveSlotLayout && "catalog-card__options--five-slots",
          ]
            .filter(Boolean)
            .join(" ")}
          role="group"
          aria-label={`${product.name} 옵션 이미지 총 ${product.options.length}개`}
        >
          {visibleOptions.map((option) => (
            <OptionThumbnail
              key={option.id}
              option={option}
              isActive={activeOptionId === option.id}
              onSelect={() => {
                setActiveOptionId(option.id);
                setHasChanged(true);
              }}
            />
          ))}
          {hiddenOptionCount > 0 && (
            <span className="catalog-card__overflow" aria-hidden="true">
              +{hiddenOptionCount}
            </span>
          )}
        </div>
        <p className="catalog-card__brand">
          {product.brand} · {product.collection}
        </p>
        <h2 title={product.name}>{product.name}</h2>
        <p className="catalog-card__price">{product.price}</p>
      </div>
    </article>
  );
}

function OptionThumbnail({
  option,
  isActive,
  onSelect,
}: {
  option: CatalogOption;
  isActive: boolean;
  onSelect: () => void;
}) {
  const representativeMedia = getRepresentativeMedia(option);
  return (
    <button
      type="button"
      aria-label={`${option.label} 이미지 보기`}
      aria-pressed={isActive}
      onClick={onSelect}
    >
      <Image src={representativeMedia.src} alt="" fill sizes="36px" />
    </button>
  );
}
