"use client";

import {
  ChevronRight,
  Minus,
  Plus,
  RotateCcw,
  ShoppingBag,
  Trash2,
  X,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
  type ChangeEvent,
} from "react";
import { SelectMenu } from "@/components/SelectMenu";
import {
  getCartSummary,
  groupResolvedBundles,
  resolveCartBundle,
  type ResolvedCartBundle,
} from "./cart-data";
import { useCartStore, type CartBundle } from "./cart-store";
import {
  getProductShippingOptions,
  getProductShippingSummary,
  getShippingMethod,
  type ShippingMethodId,
} from "../catalog/purchase-data";

const formatPrice = (price: number) => `${price.toLocaleString("ko-KR")}원`;
const subscribeToMount = () => () => undefined;
const getClientMountSnapshot = () => true;
const getServerMountSnapshot = () => false;

type UndoState =
  | { kind: "bundle"; bundle: CartBundle; message: string }
  | {
      kind: "additional";
      bundleId: string;
      item: CartBundle["additionalItems"][number];
      message: string;
    };

export function CartPage() {
  const bundles = useCartStore((state) => state.bundles);
  const hydrated = useCartStore((state) => state.hydrated);
  const setBundleSelected = useCartStore((state) => state.setBundleSelected);
  const setGroupSelected = useCartStore((state) => state.setGroupSelected);
  const setAllSelected = useCartStore((state) => state.setAllSelected);
  const setBundleQuantity = useCartStore((state) => state.setBundleQuantity);
  const setAdditionalQuantity = useCartStore(
    (state) => state.setAdditionalQuantity,
  );
  const removeAdditional = useCartStore((state) => state.removeAdditional);
  const restoreAdditional = useCartStore((state) => state.restoreAdditional);
  const setShippingMethod = useCartStore((state) => state.setShippingMethod);
  const removeBundle = useCartStore((state) => state.removeBundle);
  const removeBundles = useCartStore((state) => state.removeBundles);
  const restoreBundle = useCartStore((state) => state.restoreBundle);
  const [undo, setUndo] = useState<UndoState | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [feedback, setFeedback] = useState("");
  const mounted = useSyncExternalStore(
    subscribeToMount,
    getClientMountSnapshot,
    getServerMountSnapshot,
  );
  const undoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const resolved = useMemo(() => bundles.map(resolveCartBundle), [bundles]);
  const groups = useMemo(() => groupResolvedBundles(resolved), [resolved]);
  const summary = useMemo(() => getCartSummary(resolved), [resolved]);
  const selectedIds = resolved
    .filter((item) => item.bundle.selected)
    .map((item) => item.bundle.id);
  const allSelected =
    resolved.length > 0 && resolved.every((item) => item.bundle.selected);
  const partiallySelected =
    selectedIds.length > 0 && selectedIds.length < resolved.length;

  useEffect(
    () => () => {
      if (undoTimer.current) clearTimeout(undoTimer.current);
    },
    [],
  );

  useEffect(() => {
    resolved.forEach((item) => {
      if (!item.available && item.bundle.selected) {
        setBundleSelected(item.bundle.id, false);
      }
    });
  }, [resolved, setBundleSelected]);

  const showUndo = (next: UndoState) => {
    setUndo(next);
    if (undoTimer.current) clearTimeout(undoTimer.current);
    undoTimer.current = setTimeout(() => setUndo(null), 5_000);
  };

  const deleteBundle = (item: ResolvedCartBundle) => {
    const removed = removeBundle(item.bundle.id);
    if (!removed) return;
    showUndo({
      kind: "bundle",
      bundle: removed,
      message: `${item.product?.name ?? "상품"}을 장바구니에서 삭제했습니다.`,
    });
  };

  const deleteAdditional = (
    item: ResolvedCartBundle,
    additionalId: string,
    name: string,
  ) => {
    const removed = removeAdditional(item.bundle.id, additionalId);
    if (!removed) return;
    showUndo({
      kind: "additional",
      bundleId: item.bundle.id,
      item: removed,
      message: `${name}을 삭제했습니다.`,
    });
  };

  const validateNextStep = (action: "order" | "quote") => {
    const currentResolved = useCartStore
      .getState()
      .bundles.map(resolveCartBundle)
      .filter((item) => item.bundle.selected);
    if (currentResolved.length === 0) {
      setFeedback("진행할 상품을 선택해 주세요.");
      return;
    }
    if (currentResolved.some((item) => !item.available)) {
      setFeedback("구매 조건이 변경된 상품을 먼저 확인해 주세요.");
      return;
    }
    setFeedback(
      action === "quote"
        ? "견적 정보 입력 화면은 다음 단계에서 연결됩니다."
        : "선택 상품 주문은 로그인 후 이용할 수 있습니다.",
    );
  };

  if (!mounted || !hydrated) {
    return (
      <main className="cart-page" id="main-content">
        <div className="cart-shell shell" aria-busy="true">
          <h1>장바구니</h1>
          <p className="cart-loading">장바구니를 확인하고 있습니다.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="cart-page" id="main-content">
      <div className="cart-shell shell">
        <header className="cart-heading">
          <div>
            <h1>장바구니</h1>
            <span>{bundles.length}개의 상품 묶음</span>
          </div>
          {bundles.length > 0 && (
            <p>상품별 배송 방법에 따라 나누어 보여드립니다.</p>
          )}
        </header>

        {bundles.length === 0 ? (
          <CartEmpty />
        ) : (
          <>
            <div className="cart-toolbar">
              <CartCheckbox
                checked={allSelected}
                indeterminate={partiallySelected}
                label="전체 상품 선택"
                onChange={setAllSelected}
              >
                전체 선택{" "}
                <span>
                  {selectedIds.length}/{bundles.length}
                </span>
              </CartCheckbox>
              <button
                type="button"
                disabled={selectedIds.length === 0}
                onClick={() => setConfirmOpen(true)}
              >
                선택 삭제
              </button>
            </div>

            <div className="cart-layout">
              <div className="cart-groups">
                {groups.map((group) => {
                  const selectedCount = group.bundles.filter(
                    (item) => item.bundle.selected,
                  ).length;
                  return (
                    <section
                      className="cart-group"
                      key={group.shippingMethod}
                      aria-labelledby={`cart-group-${group.shippingMethod}`}
                    >
                      <header className="cart-group__header">
                        <CartCheckbox
                          checked={selectedCount === group.bundles.length}
                          indeterminate={
                            selectedCount > 0 &&
                            selectedCount < group.bundles.length
                          }
                          label={`${group.method.label} 상품 전체 선택`}
                          onChange={(checked) =>
                            setGroupSelected(group.shippingMethod, checked)
                          }
                        >
                          <strong id={`cart-group-${group.shippingMethod}`}>
                            {group.method.label}
                          </strong>
                          <span>{group.bundles.length}</span>
                        </CartCheckbox>
                        <p>{group.method.summary}</p>
                      </header>
                      <div className="cart-group__items">
                        {group.bundles.map((item) => (
                          <CartBundleCard
                            key={item.bundle.id}
                            item={item}
                            onSelect={(checked) =>
                              setBundleSelected(item.bundle.id, checked)
                            }
                            onQuantity={(quantity) =>
                              setBundleQuantity(item.bundle.id, quantity)
                            }
                            onAdditionalQuantity={(productId, quantity) =>
                              setAdditionalQuantity(
                                item.bundle.id,
                                productId,
                                quantity,
                              )
                            }
                            onAdditionalDelete={(productId, name) =>
                              deleteAdditional(item, productId, name)
                            }
                            onShipping={(shipping) =>
                              setShippingMethod(item.bundle.id, shipping)
                            }
                            onDelete={() => deleteBundle(item)}
                          />
                        ))}
                      </div>
                    </section>
                  );
                })}
                <p className="cart-delivery-note">
                  같은 배송 방법으로 표시되어도 실제 합배송 여부와 배송 일정은
                  상품별로 달라질 수 있습니다.
                </p>
              </div>

              <CartOrderSummary
                summary={summary}
                onQuote={() => validateNextStep("quote")}
                onOrder={() => validateNextStep("order")}
              />
            </div>

            <CartMobileBar
              count={summary.selectedCount}
              total={summary.total}
              onOrder={() => validateNextStep("order")}
            />
          </>
        )}
      </div>

      {feedback && (
        <div className="cart-feedback" role="status" aria-live="polite">
          {feedback}
          <button
            type="button"
            aria-label="알림 닫기"
            onClick={() => setFeedback("")}
          >
            <X size={17} />
          </button>
        </div>
      )}
      {undo && (
        <div className="cart-undo" role="status" aria-live="polite">
          <span>{undo.message}</span>
          <button
            type="button"
            onClick={() => {
              if (undo.kind === "bundle") restoreBundle(undo.bundle);
              else restoreAdditional(undo.bundleId, undo.item);
              setUndo(null);
              if (undoTimer.current) clearTimeout(undoTimer.current);
            }}
          >
            <RotateCcw size={16} /> 실행 취소
          </button>
        </div>
      )}
      <DeleteConfirmDialog
        open={confirmOpen}
        count={selectedIds.length}
        onClose={() => setConfirmOpen(false)}
        onConfirm={() => {
          removeBundles(selectedIds);
          setConfirmOpen(false);
          setFeedback(`${selectedIds.length}개의 상품 묶음을 삭제했습니다.`);
        }}
      />
    </main>
  );
}

function CartEmpty() {
  return (
    <section className="cart-empty">
      <ShoppingBag size={32} strokeWidth={1.5} aria-hidden="true" />
      <h2>장바구니가 비어 있습니다.</h2>
      <p>공간에 어울리는 자재를 살펴보고 필요한 상품을 담아보세요.</p>
      <Link href="/shop/tile?type=tile">
        상품 둘러보기 <ChevronRight size={17} />
      </Link>
    </section>
  );
}

function CartCheckbox({
  checked,
  indeterminate = false,
  label,
  onChange,
  children,
}: {
  checked: boolean;
  indeterminate?: boolean;
  label: string;
  onChange: (checked: boolean) => void;
  children: React.ReactNode;
}) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = indeterminate;
  }, [indeterminate]);
  return (
    <label className="cart-checkbox">
      <input
        ref={ref}
        type="checkbox"
        checked={checked}
        aria-label={label}
        onChange={(event) => onChange(event.target.checked)}
      />
      <span aria-hidden="true" />
      <span>{children}</span>
    </label>
  );
}

function CartBundleCard({
  item,
  onSelect,
  onQuantity,
  onAdditionalQuantity,
  onAdditionalDelete,
  onShipping,
  onDelete,
}: {
  item: ResolvedCartBundle;
  onSelect: (selected: boolean) => void;
  onQuantity: (quantity: number) => void;
  onAdditionalQuantity: (productId: string, quantity: number) => void;
  onAdditionalDelete: (productId: string, name: string) => void;
  onShipping: (shipping: ShippingMethodId) => void;
  onDelete: () => void;
}) {
  const method = getShippingMethod(item.bundle.shippingMethod);
  const shippingSummary = item.product
    ? getProductShippingSummary(item.product, item.bundle.shippingMethod)
    : method.summary;
  return (
    <article
      className={`cart-bundle${!item.available ? "is-unavailable" : ""}`}
    >
      <div className="cart-bundle__main">
        <CartCheckbox
          checked={item.bundle.selected}
          label={`${item.product?.name ?? "상품"} 선택`}
          onChange={onSelect}
        >
          <span className="sr-only">상품 선택</span>
        </CartCheckbox>
        <Link
          className="cart-bundle__image"
          href={
            item.product
              ? `/products/${item.product.id}?option=${item.bundle.optionId}`
              : "#"
          }
          aria-label={`${item.product?.name ?? "상품"} 상세 보기`}
        >
          <Image src={item.image} alt="" fill sizes="112px" />
        </Link>
        <div className="cart-bundle__info">
          <p>
            {item.product
              ? `${item.product.brand} · ${item.product.collection}`
              : "판매 종료"}
          </p>
          <h2>{item.product?.name ?? "판매 종료된 상품"}</h2>
          <span>
            {item.optionLabel} · {item.variantLabel}
          </span>
          <strong>
            {item.currentUnitPrice === null
              ? "구매 불가"
              : `1${item.orderUnitLabel} ${formatPrice(item.currentUnitPrice)}`}
          </strong>
          {item.priceChanged && (
            <small className="cart-bundle__change">
              담을 당시 {formatPrice(item.bundle.unitPriceAtAdd)} → 현재
              가격으로 변경
            </small>
          )}
          {!item.available && (
            <small className="cart-bundle__unavailable">
              {item.shippingAvailable
                ? "구매 조건이 변경되었습니다. 상품을 다시 선택해 주세요."
                : "현재 선택한 배송 방법이 종료되었습니다. 배송 방법을 다시 선택해 주세요."}
            </small>
          )}
        </div>
        <div className="cart-bundle__controls">
          <CartQuantity
            label={`${item.product?.name ?? "상품"} 수량`}
            quantity={item.bundle.quantity}
            onChange={onQuantity}
          />
          <button
            className="cart-bundle__delete"
            type="button"
            aria-label={`${item.product?.name ?? "상품"} 묶음 삭제`}
            onClick={onDelete}
          >
            <Trash2 size={18} />
          </button>
        </div>
      </div>

      {item.additionalItems.length > 0 && (
        <div className="cart-additional">
          <p>추가 상품</p>
          {item.additionalItems.map((additional) => (
            <div className="cart-additional__row" key={additional.productId}>
              <div>
                <strong>{additional.name}</strong>
                <span>{formatPrice(additional.currentPrice)}</span>
                {additional.priceChanged && (
                  <small className="cart-additional__change">
                    담을 당시 {formatPrice(additional.unitPriceAtAdd)} → 현재
                    가격으로 변경
                  </small>
                )}
              </div>
              <div>
                <CartQuantity
                  label={`${additional.name} 수량`}
                  quantity={additional.quantity}
                  onChange={(quantity) =>
                    onAdditionalQuantity(additional.productId, quantity)
                  }
                />
                <button
                  type="button"
                  aria-label={`${additional.name} 삭제`}
                  onClick={() =>
                    onAdditionalDelete(additional.productId, additional.name)
                  }
                >
                  <Trash2 size={17} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="cart-bundle__footer">
        <div>
          <span>배송 방법</span>
          <SelectMenu
            ariaLabel={`${item.product?.name ?? "상품"} 배송 방법 변경`}
            value={item.bundle.shippingMethod}
            placeholder="배송 방법 선택"
            options={
              item.product ? getProductShippingOptions(item.product) : []
            }
            onChange={(value) => onShipping(value as ShippingMethodId)}
          />
          <small>{shippingSummary}</small>
        </div>
        <p>
          <span>상품 묶음 금액</span>
          <strong>{formatPrice(item.productTotal)}</strong>
        </p>
      </div>
    </article>
  );
}

function CartQuantity({
  label,
  quantity,
  onChange,
}: {
  label: string;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  const handleInput = (event: ChangeEvent<HTMLInputElement>) => {
    onChange(Math.max(1, Number.parseInt(event.target.value, 10) || 1));
  };
  return (
    <div className="cart-quantity" role="group" aria-label={label}>
      <button
        type="button"
        aria-label={`${label} 줄이기`}
        disabled={quantity <= 1}
        onClick={() => onChange(Math.max(1, quantity - 1))}
      >
        <Minus size={15} />
      </button>
      <input
        type="number"
        min="1"
        inputMode="numeric"
        aria-label={`${label} 직접 입력`}
        value={quantity}
        onChange={handleInput}
      />
      <button
        type="button"
        aria-label={`${label} 늘리기`}
        onClick={() => onChange(quantity + 1)}
      >
        <Plus size={15} />
      </button>
    </div>
  );
}

function CartOrderSummary({
  summary,
  onQuote,
  onOrder,
}: {
  summary: ReturnType<typeof getCartSummary>;
  onQuote: () => void;
  onOrder: () => void;
}) {
  return (
    <aside className="cart-summary" aria-labelledby="cart-summary-title">
      <h2 id="cart-summary-title">주문 요약</h2>
      <dl>
        <div>
          <dt>선택 상품</dt>
          <dd>{summary.selectedCount}묶음</dd>
        </div>
        <div>
          <dt>상품 금액</dt>
          <dd>{formatPrice(summary.productTotal)}</dd>
        </div>
        <div>
          <dt>선불 배송비</dt>
          <dd>{formatPrice(summary.shippingTotal)}</dd>
        </div>
      </dl>
      {summary.hasCollect && <p>개별 화물 운송비는 착불로 별도 결제됩니다.</p>}
      <div className="cart-summary__total">
        <span>총 주문 금액</span>
        <strong>{formatPrice(summary.total)}</strong>
      </div>
      <button
        className="cart-summary__quote"
        type="button"
        disabled={summary.selectedCount === 0}
        onClick={onQuote}
      >
        견적서 만들기
      </button>
      <button
        className="cart-summary__order"
        type="button"
        disabled={summary.selectedCount === 0}
        onClick={onOrder}
      >
        선택 상품 주문
      </button>
      <small>주문과 견적서 생성 시 로그인이 필요합니다.</small>
    </aside>
  );
}

function CartMobileBar({
  count,
  total,
  onOrder,
}: {
  count: number;
  total: number;
  onOrder: () => void;
}) {
  return (
    <div className="cart-mobile-bar" aria-label="모바일 주문 요약">
      <div>
        <small>선택 {count}묶음</small>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button type="button" disabled={count === 0} onClick={onOrder}>
        주문하기
      </button>
    </div>
  );
}

function DeleteConfirmDialog({
  open,
  count,
  onClose,
  onConfirm,
}: {
  open: boolean;
  count: number;
  onClose: () => void;
  onConfirm: () => void;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const dialog = ref.current;
    if (!dialog) return;
    if (open && !dialog.open) dialog.showModal();
    if (!open && dialog.open) dialog.close();
  }, [open]);
  return (
    <dialog
      className="cart-confirm"
      ref={ref}
      onCancel={(event) => {
        event.preventDefault();
        onClose();
      }}
      onClose={onClose}
      aria-labelledby="cart-confirm-title"
    >
      <h2 id="cart-confirm-title">선택 상품을 삭제할까요?</h2>
      <p>선택한 {count}개 묶음과 각 묶음의 추가 상품이 함께 삭제됩니다.</p>
      <div>
        <button type="button" autoFocus onClick={onClose}>
          취소
        </button>
        <button type="button" onClick={onConfirm}>
          삭제
        </button>
      </div>
    </dialog>
  );
}
