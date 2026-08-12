"use client";

import {
  Calculator,
  Camera,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Heart,
  Info,
  LockKeyhole,
  Minus,
  Plus,
  Share2,
  Star,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { SelectMenu } from "../../components/SelectMenu";
import { useCartStore } from "../cart/cart-store";
import { grafs } from "./sample-data";
import {
  catalogProducts,
  getCatalogVariants,
  getRepresentativeMedia,
  getSupplyPrice,
  type CatalogProduct,
} from "./catalog-data";
import { CatalogProductCard } from "./CatalogProductCard";
import {
  ADDITIONAL_PRODUCTS,
  getProductShippingOptions,
  isShippingMethodId,
  type AdditionalProduct,
} from "./purchase-data";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;

export function ProductDetail({
  product,
  initialOptionId,
}: {
  product: CatalogProduct;
  initialOptionId?: string;
}) {
  const shippingOptions = getProductShippingOptions(product);
  const initialOption = product.options.some(
    (option) => option.id === initialOptionId,
  )
    ? initialOptionId!
    : product.defaultOptionId;
  const variants = useMemo(() => getCatalogVariants(product), [product]);
  const [optionId, setOptionId] = useState(initialOption);
  const availableVariants = variants.filter(
    (variant) => variant.colorOptionId === optionId,
  );
  const [variantId, setVariantId] = useState(
    availableVariants[0]?.id ?? variants[0].id,
  );
  const selectedVariant =
    availableVariants.find((variant) => variant.id === variantId) ??
    availableVariants[0] ??
    variants[0];
  const activeOption =
    product.options.find((option) => option.id === optionId) ??
    product.options[0];
  const [mediaId, setMediaId] = useState(activeOption.representativeMediaId);
  const activeMedia =
    activeOption.media.find((media) => media.id === mediaId) ??
    getRepresentativeMedia(activeOption);
  const [quantity, setQuantity] = useState(1);
  const [shipping, setShipping] = useState("");
  const [additionalQuantities, setAdditionalQuantities] = useState<
    Record<string, number>
  >({});
  const [liked, setLiked] = useState(false);
  const [calculatorOpen, setCalculatorOpen] = useState(false);
  const [optionSheetOpen, setOptionSheetOpen] = useState(false);
  const [compactPurchaseVisible, setCompactPurchaseVisible] = useState(false);
  const [feedback, setFeedback] = useState("");
  const addBundle = useCartStore((state) => state.addBundle);
  const buyboxRef = useRef<HTMLDivElement>(null);
  const feedbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const price = selectedVariant.priceIncludingVat;
  const selectedAdditionalProducts = ADDITIONAL_PRODUCTS.filter(
    (item) => additionalQuantities[item.id],
  );
  const additionalTotal = selectedAdditionalProducts.reduce(
    (sum, item) => sum + item.price * additionalQuantities[item.id],
    0,
  );
  const total = price === null ? null : price * quantity + additionalTotal;

  useEffect(() => {
    const buybox = buyboxRef.current;
    if (!buybox) return;
    let frame = 0;
    const updateCompactPurchase = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        setCompactPurchaseVisible(buybox.getBoundingClientRect().bottom < 88);
      });
    };
    updateCompactPurchase();
    window.addEventListener("scroll", updateCompactPurchase, { passive: true });
    window.addEventListener("resize", updateCompactPurchase);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateCompactPurchase);
      window.removeEventListener("resize", updateCompactPurchase);
    };
  }, []);

  useEffect(
    () => () => {
      if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    },
    [],
  );

  const showFeedback = (message: string) => {
    setFeedback(message);
    if (feedbackTimerRef.current) clearTimeout(feedbackTimerRef.current);
    feedbackTimerRef.current = setTimeout(() => setFeedback(""), 3000);
  };

  const addCurrentToCart = () => {
    if (price === null || !isShippingMethodId(shipping)) return;
    const result = addBundle({
      productId: product.id,
      optionId,
      variantId: selectedVariant.id,
      quantity,
      shippingMethod: shipping,
      unitPriceAtAdd: price,
      additionalItems: selectedAdditionalProducts.map((item) => ({
        productId: item.id,
        quantity: additionalQuantities[item.id],
        unitPriceAtAdd: item.price,
      })),
    });
    showFeedback(
      result.merged
        ? "같은 구성의 장바구니 수량을 합쳤습니다."
        : "장바구니에 상품을 담았습니다.",
    );
  };

  const shareProduct = async () => {
    const shareData = { title: product.name, url: window.location.href };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
        showFeedback("상품 링크를 공유했습니다.");
      } else {
        await navigator.clipboard.writeText(shareData.url);
        showFeedback("상품 링크를 복사했습니다.");
      }
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showFeedback("공유하지 못했습니다. 다시 시도해 주세요.");
    }
  };

  const selectOption = (nextOptionId: string) => {
    const nextOption = product.options.find(
      (option) => option.id === nextOptionId,
    );
    const nextVariant = variants.find(
      (variant) => variant.colorOptionId === nextOptionId,
    );
    if (!nextOption || !nextVariant) return;
    setOptionId(nextOptionId);
    setMediaId(nextOption.representativeMediaId);
    setVariantId(nextVariant.id);
    setQuantity(1);
  };

  const orderUnitLabel = selectedVariant.orderUnit === "BOX" ? "BOX" : "장";

  const addAdditionalProduct = (productId: string) => {
    if (!ADDITIONAL_PRODUCTS.some((item) => item.id === productId)) return;
    setAdditionalQuantities((current) => ({
      ...current,
      [productId]: (current[productId] ?? 0) + 1,
    }));
  };

  const changeAdditionalQuantity = (productId: string, nextQuantity: number) =>
    setAdditionalQuantities((current) => ({
      ...current,
      [productId]: Math.max(1, nextQuantity),
    }));

  const removeAdditionalProduct = (productId: string) =>
    setAdditionalQuantities((current) => {
      const next = { ...current };
      delete next[productId];
      return next;
    });

  return (
    <main className="product-detail" id="main-content">
      <div className="product-detail__shell shell">
        <nav className="product-detail__breadcrumb" aria-label="현재 위치">
          <Link
            href={`/shop/tile?type=${product.category}`}
            aria-label="상품 목록으로 돌아가기"
          >
            <ChevronLeft size={18} aria-hidden="true" />
          </Link>
          <Link href="/shop/tile?type=tile">타일</Link>
          <span aria-hidden="true">/</span>
          <Link href={`/shop/tile?type=${product.category}`}>
            {product.category === "big-slab" ? "빅슬랩" : "타일"}
          </Link>
        </nav>

        <section
          className="product-detail-layout"
          aria-labelledby="product-title"
        >
          <div className="product-detail-layout__content">
            <div className="product-gallery">
              <div className="product-gallery__stage">
                <Image
                  key={activeMedia.id}
                  src={activeMedia.src}
                  alt={activeMedia.alt}
                  fill
                  priority
                  sizes="(max-width: 767px) 100vw, 56vw"
                />
              </div>
              {activeOption.media.length > 1 && (
                <div
                  className="product-gallery__thumbs"
                  aria-label="상품 이미지"
                >
                  {activeOption.media.map((media) => (
                    <button
                      key={media.id}
                      type="button"
                      aria-label={media.alt}
                      aria-pressed={media.id === activeMedia.id}
                      onClick={() => setMediaId(media.id)}
                    >
                      <Image src={media.src} alt="" fill sizes="68px" />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <ProductInformation
              product={product}
              activeMedia={activeMedia}
              onFeedback={showFeedback}
            />
          </div>

          <aside className="product-purchase-column">
            <div className="product-buybox" ref={buyboxRef}>
              <div className="product-buybox__meta">
                <div>
                  {product.badge && (
                    <span className="product-buybox__badge">
                      {product.badge}
                    </span>
                  )}
                  <p className="product-buybox__brand">
                    {product.brand} · {product.collection}
                  </p>
                </div>
              </div>
              <div className="product-buybox__title">
                <h1 id="product-title">{product.name}</h1>
                <div className="product-buybox__utilities">
                  <LikeButton
                    liked={liked}
                    onClick={() => setLiked((value) => !value)}
                  />
                  <button
                    type="button"
                    aria-label="상품 공유"
                    onClick={shareProduct}
                  >
                    <Share2 size={20} />
                  </button>
                </div>
              </div>
              <a className="product-buybox__review-link" href="#reviews">
                <span aria-label="5점 만점에 4.8점">
                  <Star size={14} fill="currentColor" /> 4.8
                </span>
                <span>리뷰 12개</span>
              </a>
              <p className="product-buybox__summary">
                자연스러운 스톤 결을 담은 {product.surfaces.join(" · ")} 마감
                타일로, {product.uses.join("과 ")} 공간에 사용할 수 있습니다.
              </p>

              <section
                className="product-unit-prices"
                aria-labelledby="unit-price-title"
              >
                <h2 id="unit-price-title" className="sr-only">
                  단위 가격
                </h2>
                {price === null ? (
                  <p className="product-unit-prices__inquiry">가격 문의</p>
                ) : (
                  <dl className="product-order-price">
                    <dt>1{orderUnitLabel}</dt>
                    <dd>
                      <strong>{formatPrice(price)}</strong>
                      <small>공급가 {formatPrice(getSupplyPrice(price))}</small>
                    </dd>
                  </dl>
                )}
              </section>

              <fieldset className="product-colors">
                <legend>
                  색상 <strong>{activeOption.label}</strong>
                </legend>
                <div>
                  {product.options.map((option) => {
                    const media = getRepresentativeMedia(option);
                    return (
                      <button
                        key={option.id}
                        type="button"
                        aria-pressed={option.id === optionId}
                        onClick={() => selectOption(option.id)}
                      >
                        <span>
                          <Image src={media.src} alt="" fill sizes="64px" />
                        </span>
                        {option.label}
                      </button>
                    );
                  })}
                </div>
              </fieldset>

              <fieldset className="product-sizes">
                <legend>규격</legend>
                <div>
                  {availableVariants.map((variant) => (
                    <button
                      key={variant.id}
                      type="button"
                      aria-pressed={variant.id === selectedVariant.id}
                      onClick={() => {
                        setVariantId(variant.id);
                        setQuantity(1);
                      }}
                    >
                      {variant.size}mm
                      {variant.thickness ? ` · ${variant.thickness}` : ""}
                    </button>
                  ))}
                </div>
              </fieldset>

              <section className="product-order" aria-labelledby="order-title">
                <div className="product-order__heading">
                  <h2 id="order-title">
                    주문 수량 <small>(주문 단위: {orderUnitLabel})</small>
                  </h2>
                  <button type="button" onClick={() => setCalculatorOpen(true)}>
                    <Calculator size={15} /> 주문 수량 계산기
                  </button>
                </div>
                <div className="product-order__selection">
                  <div>
                    <strong>
                      {activeOption.label} · {selectedVariant.size}mm
                    </strong>
                  </div>
                  <QuantityInput quantity={quantity} onChange={setQuantity} />
                </div>
              </section>

              <section
                className="product-additional"
                aria-labelledby="additional-title"
              >
                <div className="product-additional__heading">
                  <h2 id="additional-title">
                    추가 상품 <small>(선택)</small>
                  </h2>
                  <HelpTip label="추가 상품 안내">
                    본품과 함께 하나의 묶음으로 담기며 수량과 금액은 별도로
                    계산됩니다.
                  </HelpTip>
                </div>
                <AdditionalProductPicker
                  products={ADDITIONAL_PRODUCTS}
                  selectedProducts={selectedAdditionalProducts}
                  quantities={additionalQuantities}
                  onAdd={addAdditionalProduct}
                  onQuantityChange={changeAdditionalQuantity}
                  onRemove={removeAdditionalProduct}
                />
              </section>

              <div className="product-shipping">
                <span className="product-shipping__label">
                  <span>배송 방법</span>
                  <HelpTip label="배송 안내">
                    화물 택배 배송, 개별 화물 운송, 직접 수령 중 선택할 수
                    있으며 지역과 주문 수량에 따라 배송비가 달라질 수 있습니다.
                  </HelpTip>
                </span>
                <SelectMenu
                  ariaLabel="배송 방법"
                  value={shipping}
                  placeholder="배송 방법을 선택해 주세요"
                  options={shippingOptions}
                  onChange={setShipping}
                />
              </div>

              <div className="product-total">
                <div>
                  <span>총 상품 금액</span>
                  <strong>
                    {total === null ? "가격 문의" : formatPrice(total)}
                  </strong>
                </div>
              </div>

              <div className="product-actions">
                {total === null ? (
                  <button
                    type="button"
                    onClick={() =>
                      showFeedback("가격 문의 화면은 다음 단계에서 연결됩니다.")
                    }
                  >
                    가격 문의하기
                  </button>
                ) : (
                  <>
                    <button
                      type="button"
                      disabled={!shipping}
                      onClick={addCurrentToCart}
                    >
                      장바구니 담기
                    </button>
                    <button
                      type="button"
                      disabled={!shipping}
                      onClick={() =>
                        showFeedback("주문서 화면은 다음 단계에서 연결됩니다.")
                      }
                    >
                      바로 구매
                    </button>
                  </>
                )}
              </div>
            </div>
            <CompactPurchasePanel
              visible={compactPurchaseVisible}
              product={product}
              optionId={optionId}
              activeOptionLabel={activeOption.label}
              availableVariants={availableVariants}
              selectedVariant={selectedVariant}
              quantity={quantity}
              shipping={shipping}
              additionalProducts={selectedAdditionalProducts}
              additionalQuantities={additionalQuantities}
              total={total}
              onOptionChange={selectOption}
              onVariantChange={(nextVariantId) => {
                setVariantId(nextVariantId);
                setQuantity(1);
              }}
              onQuantityChange={setQuantity}
              onShippingChange={setShipping}
              onAdditionalQuantityChange={changeAdditionalQuantity}
              onAdditionalRemove={removeAdditionalProduct}
              onCalculatorOpen={() => setCalculatorOpen(true)}
              onAddToCart={addCurrentToCart}
              onFeedback={showFeedback}
            />
          </aside>
        </section>

        <ProductRecommendations product={product} />
      </div>

      <AreaCalculator
        open={calculatorOpen}
        variant={selectedVariant}
        price={price}
        orderUnitLabel={orderUnitLabel}
        onClose={() => setCalculatorOpen(false)}
        onApply={(nextQuantity) => {
          setQuantity(nextQuantity);
          setCalculatorOpen(false);
        }}
      />
      <OptionSheet
        open={optionSheetOpen}
        product={product}
        optionId={optionId}
        activeOptionLabel={activeOption.label}
        availableVariants={availableVariants}
        selectedVariantId={selectedVariant.id}
        orderUnitLabel={orderUnitLabel}
        quantity={quantity}
        shipping={shipping}
        additionalProducts={ADDITIONAL_PRODUCTS}
        selectedAdditionalProducts={selectedAdditionalProducts}
        additionalQuantities={additionalQuantities}
        total={total}
        onClose={() => setOptionSheetOpen(false)}
        onOptionChange={selectOption}
        onVariantChange={(nextVariantId) => {
          setVariantId(nextVariantId);
          setQuantity(1);
        }}
        onQuantityChange={setQuantity}
        onShippingChange={setShipping}
        onAdditionalAdd={addAdditionalProduct}
        onAdditionalQuantityChange={changeAdditionalQuantity}
        onAdditionalRemove={removeAdditionalProduct}
        onAddToCart={addCurrentToCart}
        onFeedback={showFeedback}
      />
      <div className="product-mobile-purchase" aria-label="모바일 구매">
        <div>
          <small>
            {activeOption.label} · {selectedVariant.size}mm
          </small>
          <strong>{total === null ? "가격 문의" : formatPrice(total)}</strong>
        </div>
        <button type="button" onClick={() => setOptionSheetOpen(true)}>
          구매하기
        </button>
      </div>
      {feedback && (
        <div className="product-feedback" role="status" aria-live="polite">
          <span>{feedback}</span>
          {feedback.includes("장바구니") && (
            <Link href="/cart">장바구니 보기</Link>
          )}
        </div>
      )}
    </main>
  );
}

function LikeButton({
  liked,
  onClick,
}: {
  liked: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className="product-like"
      type="button"
      aria-label={liked ? "좋아요 취소" : "좋아요"}
      aria-pressed={liked}
      onClick={onClick}
    >
      <Heart size={21} fill={liked ? "currentColor" : "none"} />
    </button>
  );
}

function QuantityInput({
  quantity,
  onChange,
  allowZero = false,
  label = "",
}: {
  quantity: number;
  onChange: (quantity: number) => void;
  allowZero?: boolean;
  label?: string;
}) {
  const minimum = allowZero ? 0 : 1;
  return (
    <div
      className="product-quantity"
      role="group"
      aria-label={label || "주문 수량"}
    >
      <button
        type="button"
        aria-label={label ? `${label} 줄이기` : "수량 줄이기"}
        disabled={quantity === minimum}
        onClick={() => onChange(Math.max(minimum, quantity - 1))}
      >
        <Minus size={16} />
      </button>
      <input
        type="number"
        min={minimum}
        inputMode="numeric"
        aria-label={label ? `${label} 직접 입력` : "수량 직접 입력"}
        value={quantity}
        onChange={(event) =>
          onChange(
            Math.max(
              minimum,
              Number.parseInt(event.target.value, 10) || minimum,
            ),
          )
        }
      />
      <button
        type="button"
        aria-label={label ? `${label} 늘리기` : "수량 늘리기"}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={16} />
      </button>
    </div>
  );
}

function HelpTip({ label, children }: { label: string; children: string }) {
  return (
    <span className="product-help-tip">
      <button
        type="button"
        aria-label={label}
        aria-describedby={`${label.replaceAll(" ", "-")}-description`}
      >
        <Info size={15} />
      </button>
      <span id={`${label.replaceAll(" ", "-")}-description`} role="tooltip">
        {children}
      </span>
    </span>
  );
}

function AdditionalProductPicker({
  products,
  selectedProducts,
  quantities,
  onAdd,
  onQuantityChange,
  onRemove,
}: {
  products: AdditionalProduct[];
  selectedProducts: AdditionalProduct[];
  quantities: Record<string, number>;
  onAdd: (productId: string) => void;
  onQuantityChange: (productId: string, quantity: number) => void;
  onRemove: (productId: string) => void;
}) {
  return (
    <div className="product-additional-picker">
      <SelectMenu
        ariaLabel="추가 상품 선택"
        placeholder="추가 상품을 선택해 주세요"
        options={products.map((item) => ({
          value: item.id,
          label: item.name,
          meta: `+${formatPrice(item.price)}`,
        }))}
        onChange={onAdd}
      />
      {selectedProducts.length > 0 && (
        <div className="product-additional-picker__list">
          {selectedProducts.map((item) => (
            <div className="product-additional-picker__item" key={item.id}>
              <div>
                <strong>{item.name}</strong>
                <span>{formatPrice(item.price)}</span>
              </div>
              <div className="product-additional-picker__controls">
                <QuantityInput
                  label={`${item.name} 수량`}
                  quantity={quantities[item.id]}
                  onChange={(quantity) => onQuantityChange(item.id, quantity)}
                />
                <button
                  className="product-additional-picker__remove"
                  type="button"
                  aria-label={`${item.name} 삭제`}
                  onClick={() => onRemove(item.id)}
                >
                  <Trash2 size={17} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function CompactPurchasePanel({
  visible,
  product,
  optionId,
  activeOptionLabel,
  availableVariants,
  selectedVariant,
  quantity,
  shipping,
  additionalProducts,
  additionalQuantities,
  total,
  onOptionChange,
  onVariantChange,
  onQuantityChange,
  onShippingChange,
  onAdditionalQuantityChange,
  onAdditionalRemove,
  onCalculatorOpen,
  onAddToCart,
  onFeedback,
}: {
  visible: boolean;
  product: CatalogProduct;
  optionId: string;
  activeOptionLabel: string;
  availableVariants: ReturnType<typeof getCatalogVariants>;
  selectedVariant: ReturnType<typeof getCatalogVariants>[number];
  quantity: number;
  shipping: string;
  additionalProducts: AdditionalProduct[];
  additionalQuantities: Record<string, number>;
  total: number | null;
  onOptionChange: (optionId: string) => void;
  onVariantChange: (variantId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onShippingChange: (shipping: string) => void;
  onAdditionalQuantityChange: (productId: string, quantity: number) => void;
  onAdditionalRemove: (productId: string) => void;
  onCalculatorOpen: () => void;
  onAddToCart: () => void;
  onFeedback: (message: string) => void;
}) {
  if (!visible) return null;

  return (
    <section className="product-compact-purchase" aria-label="빠른 구매">
      <fieldset className="product-colors">
        <legend>
          색상 <strong>{activeOptionLabel}</strong>
        </legend>
        <div>
          {product.options.map((option) => {
            const media = getRepresentativeMedia(option);
            return (
              <button
                key={option.id}
                type="button"
                aria-pressed={option.id === optionId}
                onClick={() => onOptionChange(option.id)}
              >
                <span>
                  <Image src={media.src} alt="" fill sizes="48px" />
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="product-sizes">
        <legend>규격</legend>
        <div>
          {availableVariants.map((variant) => (
            <button
              key={variant.id}
              type="button"
              aria-pressed={variant.id === selectedVariant.id}
              onClick={() => onVariantChange(variant.id)}
            >
              {variant.size}mm
              {variant.thickness ? ` · ${variant.thickness}` : ""}
            </button>
          ))}
        </div>
      </fieldset>
      <section className="product-order" aria-label="선택 상품과 수량">
        <div className="product-order__heading">
          <h2>
            주문 수량{" "}
            <small>
              (주문 단위: {selectedVariant.orderUnit === "BOX" ? "BOX" : "장"})
            </small>
          </h2>
          <button type="button" onClick={onCalculatorOpen}>
            <Calculator size={15} /> 주문 수량 계산기
          </button>
        </div>
        <div className="product-order__selection">
          <div>
            <strong>
              {activeOptionLabel} · {selectedVariant.size}mm
            </strong>
          </div>
          <QuantityInput quantity={quantity} onChange={onQuantityChange} />
        </div>
      </section>
      {additionalProducts.map((item) => (
        <section
          className="product-compact-additional"
          aria-label="선택한 추가 상품"
          key={item.id}
        >
          <div>
            <strong>{item.name}</strong>
            <span>{formatPrice(item.price)}</span>
          </div>
          <div className="product-additional-picker__controls">
            <QuantityInput
              label={`${item.name} 수량`}
              quantity={additionalQuantities[item.id]}
              onChange={(quantity) =>
                onAdditionalQuantityChange(item.id, quantity)
              }
            />
            <button
              className="product-additional-picker__remove"
              type="button"
              aria-label={`${item.name} 삭제`}
              onClick={() => onAdditionalRemove(item.id)}
            >
              <Trash2 size={17} aria-hidden="true" />
            </button>
          </div>
        </section>
      ))}
      <div className="product-shipping">
        <span className="product-shipping__label">배송 방법</span>
        <SelectMenu
          ariaLabel="배송 방법"
          value={shipping}
          placeholder="배송 방법을 선택해 주세요"
          options={getProductShippingOptions(product)}
          onChange={onShippingChange}
        />
      </div>
      <div className="product-total">
        <p className="product-purchase-summary">
          본품 {quantity}
          {selectedVariant.orderUnit === "BOX" ? "BOX" : "장"} · 추가 상품{" "}
          {additionalProducts.length}종
        </p>
        <div>
          <span>총 상품 금액</span>
          <strong>{total === null ? "가격 문의" : formatPrice(total)}</strong>
        </div>
      </div>
      <div className="product-actions">
        <button type="button" disabled={!shipping} onClick={onAddToCart}>
          장바구니 담기
        </button>
        <button
          type="button"
          disabled={!shipping}
          onClick={() => onFeedback("주문서 화면은 다음 단계에서 연결됩니다.")}
        >
          바로 구매
        </button>
      </div>
    </section>
  );
}

function OptionSheet({
  open,
  product,
  optionId,
  activeOptionLabel,
  availableVariants,
  selectedVariantId,
  orderUnitLabel,
  quantity,
  shipping,
  additionalProducts,
  selectedAdditionalProducts,
  additionalQuantities,
  total,
  onClose,
  onOptionChange,
  onVariantChange,
  onQuantityChange,
  onShippingChange,
  onAdditionalAdd,
  onAdditionalQuantityChange,
  onAdditionalRemove,
  onAddToCart,
  onFeedback,
}: {
  open: boolean;
  product: CatalogProduct;
  optionId: string;
  activeOptionLabel: string;
  availableVariants: ReturnType<typeof getCatalogVariants>;
  selectedVariantId: string;
  orderUnitLabel: string;
  quantity: number;
  shipping: string;
  additionalProducts: AdditionalProduct[];
  selectedAdditionalProducts: AdditionalProduct[];
  additionalQuantities: Record<string, number>;
  total: number | null;
  onClose: () => void;
  onOptionChange: (optionId: string) => void;
  onVariantChange: (variantId: string) => void;
  onQuantityChange: (quantity: number) => void;
  onShippingChange: (shipping: string) => void;
  onAdditionalAdd: (productId: string) => void;
  onAdditionalQuantityChange: (productId: string, quantity: number) => void;
  onAdditionalRemove: (productId: string) => void;
  onAddToCart: () => void;
  onFeedback: (message: string) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  return (
    <dialog
      className="product-option-sheet"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="option-sheet-title"
    >
      <header>
        <h2 id="option-sheet-title">옵션 선택</h2>
        <button type="button" aria-label="옵션 선택 닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </header>
      <fieldset className="product-option-sheet__colors">
        <legend>
          색상 <strong>{activeOptionLabel}</strong>
        </legend>
        <div>
          {product.options.map((option) => {
            const media = getRepresentativeMedia(option);
            return (
              <button
                type="button"
                key={option.id}
                aria-pressed={option.id === optionId}
                onClick={() => onOptionChange(option.id)}
              >
                <span>
                  <Image src={media.src} alt="" fill sizes="48px" />
                </span>
                {option.label}
              </button>
            );
          })}
        </div>
      </fieldset>
      <fieldset className="product-option-sheet__sizes">
        <legend>규격</legend>
        <div>
          {availableVariants.map((variant) => (
            <button
              type="button"
              key={variant.id}
              aria-pressed={variant.id === selectedVariantId}
              onClick={() => onVariantChange(variant.id)}
            >
              {variant.size}mm
              {variant.thickness ? ` · ${variant.thickness}` : ""}
            </button>
          ))}
        </div>
      </fieldset>
      <div className="product-option-sheet__quantity">
        <span>
          주문 수량 <small>(주문 단위: {orderUnitLabel})</small>
        </span>
        <QuantityInput quantity={quantity} onChange={onQuantityChange} />
      </div>
      <section
        className="product-option-sheet__additional"
        aria-label="추가 상품"
      >
        <h3>
          추가 상품 <small>(선택)</small>
        </h3>
        <AdditionalProductPicker
          products={additionalProducts}
          selectedProducts={selectedAdditionalProducts}
          quantities={additionalQuantities}
          onAdd={onAdditionalAdd}
          onQuantityChange={onAdditionalQuantityChange}
          onRemove={onAdditionalRemove}
        />
      </section>
      <div className="product-option-sheet__shipping">
        <span>배송 방법</span>
        <SelectMenu
          ariaLabel="배송 방법"
          value={shipping}
          placeholder="배송 방법을 선택해 주세요"
          options={getProductShippingOptions(product)}
          onChange={onShippingChange}
        />
      </div>
      <div className="product-option-sheet__total">
        <div>
          <small>
            본품 {quantity}
            {orderUnitLabel} · 추가 상품 {selectedAdditionalProducts.length}종
          </small>
          <span>총 상품 금액</span>
        </div>
        <strong>{total === null ? "가격 문의" : formatPrice(total)}</strong>
      </div>
      <div className="product-option-sheet__actions">
        <button
          type="button"
          disabled={!shipping}
          onClick={() => {
            onClose();
            onAddToCart();
          }}
        >
          장바구니 담기
        </button>
        <button
          type="button"
          disabled={!shipping}
          onClick={() => {
            onClose();
            onFeedback("주문서 화면은 다음 단계에서 연결됩니다.");
          }}
        >
          바로 구매
        </button>
      </div>
    </dialog>
  );
}

function AreaCalculator({
  open,
  variant,
  price,
  orderUnitLabel,
  onClose,
  onApply,
}: {
  open: boolean;
  variant: ReturnType<typeof getCatalogVariants>[number];
  price: number | null;
  orderUnitLabel: string;
  onClose: () => void;
  onApply: (quantity: number) => void;
}) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const [area, setArea] = useState("");
  const parsedArea = Number(area);
  const isValidArea =
    area.trim() !== "" && Number.isFinite(parsedArea) && parsedArea > 0;

  useEffect(() => {
    const dialog = dialogRef.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);

  const calculatedQuantity = Math.max(
    1,
    Math.ceil((isValidArea ? parsedArea : 0) / variant.coveragePerOrder),
  );
  const calculatedPieces = calculatedQuantity * variant.piecesPerOrder;
  const calculatedCoverage = Number(
    (calculatedQuantity * variant.coveragePerOrder).toFixed(2),
  );

  return (
    <dialog
      className="area-calculator-dialog"
      ref={dialogRef}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="area-calculator-title"
    >
      <div className="area-calculator-dialog__heading">
        <div>
          <h2 id="area-calculator-title">주문 수량 계산기</h2>
          <p>필요한 면적을 입력하면 주문 수량을 계산해 드립니다.</p>
        </div>
        <button type="button" aria-label="계산기 닫기" onClick={onClose}>
          <X size={20} />
        </button>
      </div>
      <label>
        필요 면적
        <span>
          <input
            type="number"
            min="0.01"
            step="0.01"
            value={area}
            onChange={(event) => setArea(event.target.value)}
            inputMode="decimal"
            aria-invalid={area !== "" && !isValidArea}
            aria-describedby="area-calculator-help"
            autoFocus
          />
          ㎡
        </span>
      </label>
      <p id="area-calculator-help" className="area-calculator-dialog__notice">
        {area !== "" && !isValidArea
          ? "0보다 큰 면적을 입력해 주세요."
          : `1${orderUnitLabel} 기준 · ${variant.piecesPerOrder}장 · ${variant.coveragePerOrder}㎡ · ${variant.weightPerOrder}kg`}
      </p>
      <div className="area-calculator-dialog__result">
        <span>필요 주문 수량</span>
        <strong>
          {isValidArea ? `${calculatedQuantity}${orderUnitLabel}` : "-"}
        </strong>
        {isValidArea && (
          <small>
            총 {calculatedPieces}장 · 시공 가능 면적 {calculatedCoverage}㎡
            {price !== null
              ? ` · 예상 상품 금액 ${formatPrice(price * calculatedQuantity)}`
              : ""}
          </small>
        )}
      </div>
      <p className="area-calculator-dialog__notice">
        시공 여유분은 현장 조건에 따라 별도로 고려해 주세요.
      </p>
      <button
        className="area-calculator-dialog__apply"
        type="button"
        disabled={!isValidArea}
        onClick={() => onApply(calculatedQuantity)}
      >
        주문 수량에 적용
      </button>
    </dialog>
  );
}

function ProductInformation({
  product,
  activeMedia,
  onFeedback,
}: {
  product: CatalogProduct;
  activeMedia: { src: string; alt: string };
  onFeedback: (message: string) => void;
}) {
  const [reviewFilter, setReviewFilter] = useState<"all" | "media">("all");
  const [qnaFilter, setQnaFilter] = useState<"all" | "answered" | "pending">(
    "all",
  );
  const [activeSection, setActiveSection] = useState("product-info");

  useEffect(() => {
    const sectionIds = ["product-info", "shipping-info", "reviews", "qna"];
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (visible[0]) setActiveSection(visible[0].target.id);
      },
      { rootMargin: "-130px 0px -60% 0px", threshold: 0 },
    );
    sectionIds.forEach((id) => {
      const section = document.getElementById(id);
      if (section) observer.observe(section);
    });
    return () => observer.disconnect();
  }, []);
  const reviews = [
    {
      user: "stay****",
      date: "2026.08.11",
      text: "사진에서 본 색감과 비슷하고 무광 표면이 차분합니다. 포장 상태도 안정적이었습니다.",
      image: activeMedia.src,
    },
    {
      user: "home****",
      date: "2026.08.03",
      text: "거실 바닥에 시공했는데 결이 과하지 않아 넓게 깔아도 편안합니다. 수량 상담도 도움이 됐어요.",
      image: "/images/pilots/graf-01-living-detail.png",
    },
    {
      user: "tile****",
      date: "2026.07.29",
      text: "샘플 확인 후 주문했습니다. 규격과 BOX 수량 안내가 명확해서 발주하기 편했습니다.",
    },
  ];
  const qnaItems = [
    {
      status: "답변완료",
      title: "욕실 바닥 시공에도 사용할 수 있나요?",
      user: "stay****",
      date: "2026.08.09",
      question:
        "욕실 바닥에 시공하려고 합니다. 물기가 있는 공간에도 사용할 수 있는 제품인지 궁금합니다.",
      answer:
        "욕실 바닥은 미끄럼 저항 등급과 현장 배수 조건을 함께 확인해야 합니다. 시공 위치와 면적을 알려주시면 적합한 표면과 규격을 안내해 드리겠습니다.",
      answeredAt: "2026.08.10",
      isMine: true,
    },
    {
      status: "답변완료",
      title: "1BOX 추가 주문 시 같은 로트로 받을 수 있나요?",
      user: "tile****",
      date: "2026.08.06",
      question:
        "기존 주문분과 색 차이가 나지 않도록 같은 생산 로트로 1BOX를 추가할 수 있을까요?",
      answer:
        "같은 생산 로트는 재고 상황에 따라 달라집니다. 기존 주문번호를 남겨 주시면 출고 전에 동일 로트 가능 여부를 확인해 드립니다.",
      answeredAt: "2026.08.07",
      isMine: false,
    },
    {
      status: "답변대기",
      title: "영업소 수령 가능한 지역을 알고 싶습니다.",
      user: "home****",
      date: "2026.08.02",
      question:
        "경기 남부 지역에서 직접 받을 수 있는 화물 영업소가 있는지 확인 부탁드립니다.",
      isMine: true,
    },
    {
      status: "답변완료",
      title: "샘플과 실제 납품 제품의 색 차이가 있나요?",
      user: "space****",
      date: "2026.07.28",
      question:
        "샘플로 확인한 아이보리 색상과 실제 BOX 상품 사이에 색상 차이가 생길 수 있는지 궁금합니다.",
      answer:
        "타일은 생산 로트와 자연스러운 표면 패턴에 따라 미세한 색 차이가 있을 수 있습니다. 한 공간에 시공할 수량은 같은 로트로 한 번에 주문하는 것을 권장합니다.",
      answeredAt: "2026.07.29",
      isMine: false,
    },
  ];
  const visibleReviews =
    reviewFilter === "media"
      ? reviews.filter((review) => review.image)
      : reviews;
  const visibleQna = qnaItems.filter((item) => {
    if (qnaFilter === "answered") return item.status === "답변완료";
    if (qnaFilter === "pending") return item.status === "답변대기";
    return true;
  });

  return (
    <section className="product-information">
      <nav aria-label="상품 상세 항목">
        {[
          ["product-info", "상품정보"],
          ["shipping-info", "배송·교환"],
          ["reviews", "리뷰 12"],
          ["qna", "Q&A 4"],
        ].map(([id, label]) => (
          <a
            key={id}
            href={`#${id}`}
            aria-current={activeSection === id ? "location" : undefined}
            onClick={() => setActiveSection(id)}
          >
            {label}
          </a>
        ))}
      </nav>

      <article id="product-info" className="product-editor-content">
        <p className="product-information__eyebrow">{product.collection}</p>
        <h2>공간의 표정을 만드는 자연스러운 결</h2>
        <p>
          {product.name}은 자연스러운 결의 흐름과 절제된 색감을 중심으로 설계된
          마감재입니다. 주거와 상업 공간의 벽·바닥에 안정적으로 연결할 수
          있습니다.
        </p>
        <figure className="product-information__hero">
          <Image
            src={activeMedia.src}
            alt={`${product.name} 표면 디테일`}
            fill
            sizes="(max-width: 900px) 100vw, 720px"
          />
        </figure>
        <section className="product-editor-section">
          <p className="product-information__eyebrow">MATERIAL DETAIL</p>
          <h3>차분한 색감과 깊이 있는 스톤 패턴</h3>
          <p>
            반복감이 적은 결 표현으로 넓은 벽과 바닥에도 자연스럽게 이어집니다.
            무광 표면은 빛 반사를 줄여 주거 공간과 상업 공간 모두에 안정적인
            분위기를 만듭니다.
          </p>
          <div className="product-editor-gallery">
            {product.options.slice(0, 2).map((option) => {
              const media = getRepresentativeMedia(option);
              return (
                <figure key={option.id}>
                  <span>
                    <Image
                      src={media.src}
                      alt={`${option.label} 색상 표면`}
                      fill
                      sizes="(max-width: 767px) 50vw, 340px"
                    />
                  </span>
                  <figcaption>{option.label}</figcaption>
                </figure>
              );
            })}
          </div>
        </section>
        <section className="product-editor-section">
          <p className="product-information__eyebrow">APPLICATION</p>
          <h3>벽과 바닥을 하나의 흐름으로</h3>
          <p>
            같은 컬렉션 안에서 색상과 규격을 선택해 공간의 면을 연결할 수
            있습니다. 실제 발주 전에는 현장 치수와 시공 여유분을 함께 확인해
            주세요.
          </p>
        </section>
        <dl className="product-spec-table">
          <div>
            <dt>브랜드</dt>
            <dd>{product.brand}</dd>
          </div>
          <div>
            <dt>컬렉션</dt>
            <dd>{product.collection}</dd>
          </div>
          <div>
            <dt>사용 범위</dt>
            <dd>{product.uses.join(", ")}</dd>
          </div>
          <div>
            <dt>표면</dt>
            <dd>{product.surfaces.join(", ")}</dd>
          </div>
          <div>
            <dt>패턴</dt>
            <dd>{product.patterns.join(", ")}</dd>
          </div>
        </dl>
      </article>

      <article id="shipping-info" className="product-policy">
        <div className="product-section-heading">
          <h2>배송·교환</h2>
        </div>
        <details open>
          <summary>
            배송 안내 <ChevronDown size={18} />
          </summary>
          <p>
            상품별로 화물 택배 배송, 개별 화물 운송, 직접 수령 중 가능한 방법을
            선택할 수 있습니다. 배송비는 수량과 지역에 따라 달라질 수 있습니다.
          </p>
        </details>
        <details>
          <summary>
            파손 및 교환 <ChevronDown size={18} />
          </summary>
          <p>
            수령 즉시 상품 상태를 확인해 주세요. 파손 접수 기준과 교환 가능
            여부는 주문 전 안내된 정책을 따릅니다.
          </p>
        </details>
      </article>

      <article id="reviews">
        <div className="product-section-heading">
          <h2>
            리뷰 <span>12</span>
          </h2>
          <button
            type="button"
            onClick={() =>
              onFeedback("리뷰 작성은 로그인 후 이용할 수 있습니다.")
            }
          >
            리뷰 작성
          </button>
        </div>
        <div className="product-review-overview">
          <div className="product-review-score">
            <strong>4.8</strong>
            <span aria-label="5점 만점에 4.8점">
              {Array.from({ length: 5 }, (_, index) => (
                <Star key={index} size={17} fill="currentColor" />
              ))}
            </span>
            <p>구매자 리뷰 12개</p>
          </div>
          <div className="product-review-bars" aria-label="별점별 리뷰 분포">
            {[
              { score: 5, count: 10, percent: 83 },
              { score: 4, count: 2, percent: 17 },
              { score: 3, count: 0, percent: 0 },
              { score: 2, count: 0, percent: 0 },
              { score: 1, count: 0, percent: 0 },
            ].map((item) => (
              <div key={item.score}>
                <span>{item.score}점</span>
                <i>
                  <b style={{ width: `${item.percent}%` }} />
                </i>
                <small>{item.count}</small>
              </div>
            ))}
          </div>
        </div>
        <section
          className="product-photo-reviews"
          aria-labelledby="photo-review-title"
        >
          <div>
            <h3 id="photo-review-title">포토 리뷰</h3>
            <button
              type="button"
              onClick={() =>
                onFeedback("포토 리뷰 모아보기는 다음 단계에서 연결됩니다.")
              }
            >
              전체보기 8 <ChevronRight size={16} />
            </button>
          </div>
          <div>
            {[
              activeMedia.src,
              "/images/pilots/graf-01-living.png",
              "/images/pilots/graf-01-living-detail.png",
              "/images/pilots/graf-02-bathroom.png",
              "/images/pilots/graf-02-bathroom-detail.png",
            ].map((src, index) => (
              <button
                type="button"
                aria-label={`포토 리뷰 ${index + 1} 크게 보기`}
                onClick={() =>
                  onFeedback(
                    `포토 리뷰 ${index + 1} 이미지 뷰어는 다음 단계에서 연결됩니다.`,
                  )
                }
                key={`${src}-${index}`}
              >
                <Image src={src} alt="" fill sizes="112px" />
                {index === 4 && <span>+3</span>}
              </button>
            ))}
          </div>
        </section>
        <div className="product-review-toolbar">
          <div>
            <button
              className={reviewFilter === "all" ? "is-active" : ""}
              type="button"
              aria-pressed={reviewFilter === "all"}
              onClick={() => setReviewFilter("all")}
            >
              전체
            </button>
            <button
              className={reviewFilter === "media" ? "is-active" : ""}
              type="button"
              aria-pressed={reviewFilter === "media"}
              onClick={() => setReviewFilter("media")}
            >
              <Camera size={15} /> 포토 리뷰
            </button>
          </div>
        </div>
        <div className="product-review-list">
          {visibleReviews.map((review) => (
            <article className="product-review" key={review.user}>
              <div>
                <strong>{review.user}</strong>
                <span aria-label="5점 만점에 5점">
                  {Array.from({ length: 5 }, (_, index) => (
                    <Star key={index} size={12} fill="currentColor" />
                  ))}
                </span>
                <small>{review.date}</small>
              </div>
              <div className="product-review__content">
                <small>아이보리 · 600×600mm</small>
                <p>{review.text}</p>
                {review.image && (
                  <button
                    type="button"
                    aria-label="리뷰 이미지 크게 보기"
                    onClick={() =>
                      onFeedback("리뷰 이미지 뷰어는 다음 단계에서 연결됩니다.")
                    }
                  >
                    <Image
                      src={review.image}
                      alt="구매자가 올린 시공 리뷰"
                      fill
                      sizes="112px"
                    />
                  </button>
                )}
              </div>
            </article>
          ))}
        </div>
      </article>

      <article id="qna">
        <div className="product-section-heading">
          <h2>
            상품 Q&A <span>4</span>
          </h2>
          <button
            type="button"
            onClick={() =>
              onFeedback("상품 문의 작성 화면은 다음 단계에서 연결됩니다.")
            }
          >
            상품 문의하기
          </button>
        </div>
        <div className="product-qna-tabs" role="group" aria-label="문의 상태">
          <button
            className={qnaFilter === "all" ? "is-active" : ""}
            type="button"
            aria-pressed={qnaFilter === "all"}
            onClick={() => setQnaFilter("all")}
          >
            전체 4
          </button>
          <button
            className={qnaFilter === "answered" ? "is-active" : ""}
            type="button"
            aria-pressed={qnaFilter === "answered"}
            onClick={() => setQnaFilter("answered")}
          >
            답변완료 3
          </button>
          <button
            className={qnaFilter === "pending" ? "is-active" : ""}
            type="button"
            aria-pressed={qnaFilter === "pending"}
            onClick={() => setQnaFilter("pending")}
          >
            답변대기 1
          </button>
        </div>
        <div className="product-qna-list">
          {visibleQna.map((item) =>
            item.isMine ? (
              <details className="product-qna" key={item.title}>
                <summary>
                  <span>{item.status}</span>
                  <strong>{item.title}</strong>
                  <small>{item.user}</small>
                  <time>{item.date}</time>
                  <ChevronDown size={18} aria-hidden="true" />
                </summary>
                <div>
                  <div className="product-qna__question">
                    <span>Q</span>
                    <p>{item.question}</p>
                  </div>
                  {item.status === "답변완료" && item.answer && (
                    <div className="product-qna__answer">
                      <span>A</span>
                      <div>
                        <p className="product-qna__answer-meta">
                          <time>{item.answeredAt} 답변</time>
                        </p>
                        <p>{item.answer}</p>
                      </div>
                    </div>
                  )}
                </div>
              </details>
            ) : (
              <div
                className="product-qna product-qna--private"
                key={item.title}
              >
                <span>{item.status}</span>
                <strong>
                  <LockKeyhole size={15} aria-hidden="true" /> 비밀글입니다.
                </strong>
                <small>{item.user}</small>
                <time>{item.date}</time>
                <span aria-hidden="true" />
              </div>
            ),
          )}
        </div>
      </article>
    </section>
  );
}

function ProductRecommendations({ product }: { product: CatalogProduct }) {
  const usedGrafs = grafs
    .filter((graf) =>
      graf.products.some((item) =>
        product.options.some((option) =>
          option.media.some((media) => media.src === item.image),
        ),
      ),
    )
    .slice(0, 3);
  const relatedProducts = catalogProducts
    .filter(
      (item) =>
        item.id !== product.id &&
        (item.collection === product.collection ||
          item.category === product.category),
    )
    .slice(0, 4);

  return (
    <div className="product-recommendations">
      {usedGrafs.length > 0 && (
        <section
          className="product-related-section"
          aria-labelledby="used-graf-title"
        >
          <div className="product-section-heading">
            <div>
              <h2 id="used-graf-title">이 자재가 사용된 GRAF</h2>
              <p>완성된 공간에서 자재의 실제 인상을 확인해 보세요.</p>
            </div>
          </div>
          <div className="product-related-grafs">
            {usedGrafs.map((graf) => (
              <Link href={`/graf/${graf.slug}`} key={graf.slug}>
                <span>
                  <Image
                    src={graf.image}
                    alt=""
                    fill
                    sizes="(max-width: 767px) 84vw, 30vw"
                  />
                </span>
                <strong>{graf.title}</strong>
                <small>
                  {graf.spaceType} · {graf.area}
                </small>
              </Link>
            ))}
          </div>
        </section>
      )}

      {relatedProducts.length > 0 && (
        <section
          className="product-related-section"
          aria-labelledby="related-products-title"
        >
          <div className="product-section-heading">
            <div>
              <h2 id="related-products-title">
                {relatedProducts.some(
                  (item) => item.collection === product.collection,
                )
                  ? "같은 컬렉션의 상품"
                  : "같은 카테고리의 상품"}
              </h2>
            </div>
          </div>
          <div className="product-related-products">
            {relatedProducts.map((item) => (
              <CatalogProductCard product={item} key={item.id} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
