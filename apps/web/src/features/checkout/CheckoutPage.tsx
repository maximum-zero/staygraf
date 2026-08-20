"use client";

import { clsx } from "clsx";
import { AlertCircle, ChevronRight, LoaderCircle } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  useSyncExternalStore,
} from "react";
import {
  useForm,
  useWatch,
  type FieldErrors,
  type Path,
} from "react-hook-form";
import { useAuthStore } from "../auth/auth-store";
import {
  getCheckoutSummary,
  hasCheckoutChanged,
  formatPrice,
  createOrderSnapshot,
  requiresShippingAddress,
  resolveCheckoutBundles,
} from "./checkout-data";
import {
  createCheckoutSchema,
  normalizeCheckoutValues,
  type CheckoutFormValues,
} from "./checkout-schema";
import { useCheckoutStore } from "./checkout-store";
import { useOrderStore } from "../orders/order-store";
import { useCartStore } from "../cart/cart-store";
import {
  groupResolvedBundles,
  type ResolvedCartBundle,
} from "../cart/cart-data";
import {
  sortMemberAddresses,
  useAddressStore,
  type ShippingAddress,
} from "./address-store";
import { ShippingAddressSection } from "./ShippingAddressSection";

const subscribeToMount = () => () => undefined;

export function CheckoutPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const authHydrated = useAuthStore((state) => state.hydrated);
  const member = useAuthStore((state) => state.member);
  const cartHydrated = useCartStore((state) => state.hydrated);
  const bundles = useCartStore((state) => state.bundles);
  const removeBundles = useCartStore((state) => state.removeBundles);
  const draftHydrated = useCheckoutStore((state) => state.hydrated);
  const draft = useCheckoutStore((state) => state.draft);
  const updateValues = useCheckoutStore((state) => state.updateValues);
  const markCreated = useCheckoutStore((state) => state.markCreated);
  const orderHydrated = useOrderStore((state) => state.hydrated);
  const orders = useOrderStore((state) => state.orders);
  const addOrder = useOrderStore((state) => state.addOrder);
  const addressHydrated = useAddressStore((state) => state.hydrated);
  const allAddresses = useAddressStore((state) => state.addresses);
  const [submitError, setSubmitError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [addressManagerOpen, setAddressManagerOpen] = useState(false);
  const [addressFocusRequest, setAddressFocusRequest] = useState(0);
  const initialized = useRef(false);
  const defaultAddressApplied = useRef(false);
  const addressTriggerRef = useRef<HTMLButtonElement>(null);

  const ready =
    mounted &&
    authHydrated &&
    cartHydrated &&
    draftHydrated &&
    orderHydrated &&
    addressHydrated;
  const resolved = useMemo(
    () =>
      draft ? resolveCheckoutBundles(bundles, draft.selectedBundleIds) : [],
    [bundles, draft],
  );
  const hasDeliveryItems = requiresShippingAddress(resolved);
  const summary = getCheckoutSummary(resolved);
  const schema = useMemo(
    () => createCheckoutSchema(hasDeliveryItems),
    [hasDeliveryItems],
  );
  const {
    register,
    control,
    handleSubmit,
    reset,
    setError,
    clearErrors,
    setFocus,
    setValue,
    getValues,
    formState: { errors },
  } = useForm<CheckoutFormValues>({ mode: "onBlur" });
  const values = useWatch({ control });
  const sameAsOrderer = useWatch({ control, name: "sameAsOrderer" });
  const ordererName = useWatch({ control, name: "ordererName" });
  const ordererPhone = useWatch({ control, name: "ordererPhone" });
  const paymentMethod = useWatch({ control, name: "paymentMethod" });
  const deliveryRequest = useWatch({ control, name: "deliveryRequest" });
  const recipientName = useWatch({ control, name: "recipientName" });
  const recipientPhone = useWatch({ control, name: "recipientPhone" });
  const postalCode = useWatch({ control, name: "postalCode" });
  const roadAddress = useWatch({ control, name: "address" });
  const addressDetail = useWatch({ control, name: "addressDetail" });
  const memberAddresses = useMemo(
    () => (member ? sortMemberAddresses(allAddresses, member.id) : []),
    [allAddresses, member],
  );
  const matchingAddress = memberAddresses.find(
    (item) =>
      item.postalCode === postalCode &&
      item.roadAddress === roadAddress &&
      item.addressDetail === addressDetail,
  );

  useEffect(() => {
    if (!ready) return;
    if (!member) {
      router.replace("/login?returnTo=/checkout");
      return;
    }
    if (draft?.createdOrderId) {
      router.replace(`/orders/${draft.createdOrderId}/complete`);
    }
  }, [draft?.createdOrderId, member, ready, router]);

  useEffect(() => {
    if (!ready || !member || !draft || initialized.current) return;
    reset({
      ...draft.values,
      ordererName: draft.values.ordererName || member.name,
      ordererPhone: draft.values.ordererPhone || member.phone,
      ordererEmail: draft.values.ordererEmail || member.email,
      recipientName: draft.values.recipientName || member.name,
      recipientPhone: draft.values.recipientPhone || member.phone,
    });
    initialized.current = true;
  }, [draft, member, ready, reset]);

  useEffect(() => {
    if (!initialized.current || !draft) return;
    const timer = window.setTimeout(() => {
      updateValues(getValues());
    }, 300);
    return () => window.clearTimeout(timer);
  }, [draft, getValues, updateValues, values]);

  useEffect(() => {
    if (!initialized.current || Object.keys(errors).length === 0) return;
    const result = schema.safeParse(getValues());
    const invalidNames = new Set(
      result.success ? [] : result.error.issues.map((issue) => issue.path[0]),
    );
    (Object.keys(errors) as Path<CheckoutFormValues>[]).forEach((name) => {
      if (!invalidNames.has(name)) clearErrors(name);
    });
  }, [clearErrors, errors, getValues, schema, values]);

  useEffect(() => {
    if (addressFocusRequest === 0) return;
    const trigger = addressTriggerRef.current;
    if (!trigger) return;
    trigger.focus({ preventScroll: true });
    trigger.scrollIntoView({
      block: "center",
      behavior: window.matchMedia("(prefers-reduced-motion: reduce)").matches
        ? "auto"
        : "smooth",
    });
  }, [addressFocusRequest]);

  useEffect(() => {
    if (!initialized.current || !sameAsOrderer || hasDeliveryItems) return;
    setValue("recipientName", ordererName ?? "", { shouldValidate: false });
    setValue("recipientPhone", ordererPhone ?? "", { shouldValidate: false });
  }, [hasDeliveryItems, ordererName, ordererPhone, sameAsOrderer, setValue]);

  const applyAddress = useCallback(
    (selected: ShippingAddress, validate = true) => {
      setValue("sameAsOrderer", false, { shouldValidate: false });
      setValue("recipientName", selected.recipientName, {
        shouldValidate: validate,
      });
      setValue("recipientPhone", selected.recipientPhone, {
        shouldValidate: validate,
      });
      setValue("postalCode", selected.postalCode, {
        shouldValidate: validate,
      });
      setValue("address", selected.roadAddress, {
        shouldValidate: validate,
      });
      setValue("addressDetail", selected.addressDetail, {
        shouldValidate: validate,
      });
      clearErrors([
        "recipientName",
        "recipientPhone",
        "postalCode",
        "address",
        "addressDetail",
      ]);
    },
    [clearErrors, setValue],
  );

  useEffect(() => {
    if (
      !initialized.current ||
      !member ||
      !hasDeliveryItems ||
      defaultAddressApplied.current
    ) {
      return;
    }
    defaultAddressApplied.current = true;
    if (!getValues("postalCode") && !getValues("address")) {
      const defaultAddress = memberAddresses.find((item) => item.isDefault);
      if (defaultAddress) applyAddress(defaultAddress, false);
    }
  }, [applyAddress, getValues, hasDeliveryItems, member, memberAddresses]);

  const validateField = (name: Path<CheckoutFormValues>) => {
    const result = schema.safeParse(getValues());
    const issue = result.success
      ? undefined
      : result.error.issues.find((item) => item.path[0] === name);
    if (issue) setError(name, { type: "manual", message: issue.message });
    else clearErrors(name);
  };

  const onInvalid = (formErrors: FieldErrors<CheckoutFormValues>) => {
    const first = Object.keys(formErrors)[0] as
      Path<CheckoutFormValues> | undefined;
    if (
      first &&
      hasDeliveryItems &&
      [
        "recipientName",
        "recipientPhone",
        "postalCode",
        "address",
        "addressDetail",
      ].includes(first)
    ) {
      setAddressFocusRequest((current) => current + 1);
    } else if (first) setFocus(first);
    setSubmitError("");
  };

  const onSubmit = async (rawValues: CheckoutFormValues) => {
    setSubmitError("");
    if (!draft || submitting) return;
    const parsed = schema.safeParse(rawValues);
    if (!parsed.success) {
      parsed.error.issues.forEach((issue) => {
        const path = issue.path[0] as Path<CheckoutFormValues>;
        if (path) setError(path, { type: "manual", message: issue.message });
      });
      const first = parsed.error.issues[0]?.path[0] as Path<CheckoutFormValues>;
      if (
        first &&
        hasDeliveryItems &&
        [
          "recipientName",
          "recipientPhone",
          "postalCode",
          "address",
          "addressDetail",
        ].includes(first)
      ) {
        setAddressFocusRequest((current) => current + 1);
      } else if (first) {
        setFocus(first);
      }
      setSubmitError("");
      return;
    }

    const existing = orders.find((order) => order.draftId === draft.id);
    if (existing) {
      markCreated(existing.id);
      router.replace(`/orders/${existing.id}/complete`);
      return;
    }

    const latest = resolveCheckoutBundles(
      useCartStore.getState().bundles,
      draft.selectedBundleIds,
    );
    if (latest.length !== draft.selectedBundleIds.length) {
      setSubmitError(
        "주문서에 담긴 상품 일부가 장바구니에서 삭제되었습니다. 장바구니에서 다시 확인해 주세요.",
      );
      return;
    }
    if (hasCheckoutChanged(latest, draft.entryPrices)) {
      const changed = latest.find(
        (item) =>
          !item.available ||
          draft.entryPrices[item.bundle.id] !==
            item.productTotal + item.shippingFee,
      );
      const previous = changed ? draft.entryPrices[changed.bundle.id] : null;
      const current = changed
        ? changed.productTotal + changed.shippingFee
        : null;
      setSubmitError(
        changed?.available && typeof previous === "number" && current !== null
          ? `${changed.product?.name ?? "상품"} 묶음 합계가 ${formatPrice(previous)}에서 ${formatPrice(current)}으로 변경되었습니다. 장바구니에서 다시 확인해 주세요.`
          : `${changed?.product?.name ?? "상품"}의 판매 또는 배송 조건이 변경되었습니다. 장바구니에서 다시 확인해 주세요.`,
      );
      return;
    }

    setSubmitting(true);
    await new Promise((resolve) => window.setTimeout(resolve, 700));
    try {
      const normalized = normalizeCheckoutValues(parsed.data);
      if (!hasDeliveryItems) {
        normalized.postalCode = "";
        normalized.address = "";
        normalized.addressDetail = "";
      }
      const order = createOrderSnapshot({
        draftId: draft.id,
        values: normalized,
        bundles: latest,
      });
      addOrder(order);
      markCreated(order.id);
      removeBundles(draft.selectedBundleIds);
      router.replace(`/orders/${order.id}/complete`);
    } catch {
      setSubmitting(false);
      setSubmitError(
        "주문을 저장하지 못했습니다. 입력 내용은 유지되며 다시 시도할 수 있습니다.",
      );
    }
  };

  if (!ready || (ready && !member)) {
    return <CheckoutLoading />;
  }
  if (!draft || draft.selectedBundleIds.length === 0) {
    return <CheckoutEmpty title="주문할 상품이 없습니다." />;
  }
  if (resolved.length !== draft.selectedBundleIds.length) {
    return <CheckoutEmpty title="장바구니 구성이 변경되었습니다." />;
  }

  return (
    <main className="checkout-page" id="main-content">
      <div className="checkout-shell">
        <div className="checkout-title">
          <h1>주문·결제</h1>
          <p>상품과 배송 정보를 확인한 뒤 결제수단을 선택해 주세요.</p>
        </div>
        {submitError && (
          <div className="checkout-alert" role="alert">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>주문을 진행할 수 없습니다.</strong>
              <p>{submitError}</p>
            </div>
            {submitError.includes("변경") && (
              <Link href="/cart">장바구니에서 확인</Link>
            )}
          </div>
        )}
        <form
          id="checkout-form"
          className="checkout-layout"
          noValidate
          aria-busy={submitting}
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          <div className="checkout-content">
            <OrderItemsSection bundles={resolved} />
            <section
              className="checkout-section"
              aria-labelledby="orderer-title"
            >
              <h2 id="orderer-title">주문자 정보</h2>
              <div className="checkout-form-grid">
                <CheckoutField
                  label="이름"
                  name="ordererName"
                  error={errors.ordererName?.message}
                  required
                >
                  <input
                    {...register("ordererName")}
                    onBlur={() => validateField("ordererName")}
                    autoComplete="name"
                  />
                </CheckoutField>
                <CheckoutField
                  label="휴대전화"
                  name="ordererPhone"
                  error={errors.ordererPhone?.message}
                  required
                >
                  <input
                    {...register("ordererPhone")}
                    onBlur={() => validateField("ordererPhone")}
                    inputMode="tel"
                    autoComplete="tel"
                  />
                </CheckoutField>
                <CheckoutField
                  className="is-wide"
                  label="이메일"
                  name="ordererEmail"
                  error={errors.ordererEmail?.message}
                  required
                >
                  <input
                    {...register("ordererEmail")}
                    onBlur={() => validateField("ordererEmail")}
                    inputMode="email"
                    autoComplete="email"
                  />
                </CheckoutField>
              </div>
            </section>
            {hasDeliveryItems ? (
              <ShippingAddressSection
                memberId={member!.id}
                open={addressManagerOpen}
                triggerRef={addressTriggerRef}
                values={{
                  recipientName: recipientName ?? "",
                  recipientPhone: recipientPhone ?? "",
                  postalCode: postalCode ?? "",
                  roadAddress: roadAddress ?? "",
                  addressDetail: addressDetail ?? "",
                }}
                addressLabel={matchingAddress?.label}
                selectedAddressId={matchingAddress?.id}
                hasSavedAddresses={memberAddresses.length > 0}
                addressError={
                  errors.postalCode?.message ||
                  errors.address?.message ||
                  errors.addressDetail?.message ||
                  errors.recipientName?.message ||
                  errors.recipientPhone?.message
                }
                onOpenChange={setAddressManagerOpen}
                onSelect={applyAddress}
                hiddenFields={
                  <>
                    <input type="hidden" {...register("sameAsOrderer")} />
                    <input type="hidden" {...register("recipientName")} />
                    <input type="hidden" {...register("recipientPhone")} />
                    <input type="hidden" {...register("postalCode")} />
                    <input type="hidden" {...register("address")} />
                    <input type="hidden" {...register("addressDetail")} />
                  </>
                }
              >
                <CheckoutField
                  className="is-wide"
                  label="배송 요청사항"
                  name="deliveryRequest"
                  error={errors.deliveryRequest?.message}
                >
                  <select {...register("deliveryRequest")}>
                    <option value="call-before-delivery">
                      배송 전 연락 바랍니다.
                    </option>
                    <option value="call-site-manager">
                      현장 담당자에게 연락 바랍니다.
                    </option>
                    <option value="custom">직접 입력</option>
                  </select>
                </CheckoutField>
                {deliveryRequest === "custom" && (
                  <CheckoutField
                    className="is-wide checkout-conditional-field"
                    label="요청사항 직접 입력"
                    name="customDeliveryRequest"
                    error={errors.customDeliveryRequest?.message}
                    required
                  >
                    <input
                      {...register("customDeliveryRequest")}
                      onBlur={() => validateField("customDeliveryRequest")}
                      maxLength={100}
                    />
                  </CheckoutField>
                )}
              </ShippingAddressSection>
            ) : (
              <section
                className="checkout-section"
                aria-labelledby="shipping-title"
              >
                <h2 id="shipping-title">수령 정보</h2>
                <label className="checkout-same-checkbox">
                  <input type="checkbox" {...register("sameAsOrderer")} />
                  <span aria-hidden="true" /> 주문자 정보와 동일
                </label>
                <div className="checkout-form-grid">
                  <CheckoutField
                    label="수령인"
                    name="recipientName"
                    error={errors.recipientName?.message}
                    required
                  >
                    <input
                      {...register("recipientName")}
                      onBlur={() => validateField("recipientName")}
                      autoComplete="shipping name"
                    />
                  </CheckoutField>
                  <CheckoutField
                    label="연락처"
                    name="recipientPhone"
                    error={errors.recipientPhone?.message}
                    required
                  >
                    <input
                      {...register("recipientPhone")}
                      onBlur={() => validateField("recipientPhone")}
                      inputMode="tel"
                      autoComplete="shipping tel"
                    />
                  </CheckoutField>
                  <CheckoutField
                    className="is-wide"
                    label="배송 요청사항"
                    name="deliveryRequest"
                    error={errors.deliveryRequest?.message}
                  >
                    <select {...register("deliveryRequest")}>
                      <option value="call-before-delivery">
                        배송 전 연락 바랍니다.
                      </option>
                      <option value="call-site-manager">
                        현장 담당자에게 연락 바랍니다.
                      </option>
                      <option value="custom">직접 입력</option>
                    </select>
                  </CheckoutField>
                  {deliveryRequest === "custom" && (
                    <CheckoutField
                      className="is-wide checkout-conditional-field"
                      label="요청사항 직접 입력"
                      name="customDeliveryRequest"
                      error={errors.customDeliveryRequest?.message}
                      required
                    >
                      <input
                        {...register("customDeliveryRequest")}
                        onBlur={() => validateField("customDeliveryRequest")}
                        maxLength={100}
                      />
                    </CheckoutField>
                  )}
                </div>
              </section>
            )}
            <PaymentSection
              paymentMethod={paymentMethod}
              register={register}
              error={errors.depositorName?.message}
              validate={() => validateField("depositorName")}
            />
          </div>
          <CheckoutSummary
            summary={summary}
            paymentMethod={paymentMethod}
            submitting={submitting}
            register={register}
            agreementError={errors.agreedToOrder?.message}
          />
        </form>
      </div>
      <CheckoutMobileBar
        total={summary.total}
        paymentMethod={paymentMethod}
        submitting={submitting}
      />
    </main>
  );
}

function CheckoutLoading() {
  return (
    <main className="checkout-page" id="main-content" aria-busy="true">
      <div className="checkout-shell checkout-loading">
        <h1>주문·결제</h1>
        <p>주문 정보를 확인하고 있습니다.</p>
      </div>
    </main>
  );
}

function CheckoutEmpty({ title }: { title: string }) {
  return (
    <main className="checkout-page" id="main-content">
      <div className="checkout-empty">
        <AlertCircle size={28} />
        <h1>{title}</h1>
        <p>장바구니에서 주문할 상품을 다시 선택해 주세요.</p>
        <Link href="/cart">
          장바구니로 돌아가기 <ChevronRight size={17} />
        </Link>
      </div>
    </main>
  );
}

function CheckoutField({
  label,
  name,
  error,
  required,
  className = "",
  children,
}: {
  label: string;
  name: string;
  error?: string;
  required?: boolean;
  className?: string;
  children: React.ReactNode;
}) {
  const errorId = `${name}-error`;
  const control = children as React.ReactElement<
    React.InputHTMLAttributes<HTMLInputElement>
  >;
  return (
    <label className={clsx("checkout-field", className, error && "has-error")}>
      <span>
        {label}
        {required && <em>필수</em>}
      </span>
      {control && {
        ...control,
        props: {
          ...control.props,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? errorId : undefined,
        },
      }}
      {error && (
        <small id={errorId} className="checkout-field-error">
          {error}
        </small>
      )}
    </label>
  );
}

function OrderItemsSection({ bundles }: { bundles: ResolvedCartBundle[] }) {
  const groups = groupResolvedBundles(bundles);
  return (
    <section
      className="checkout-section checkout-items"
      aria-labelledby="items-title"
    >
      <header className="checkout-section-heading">
        <div>
          <h2 id="items-title">주문 상품</h2>
          <span>{bundles.length}개 묶음</span>
        </div>
        <Link href="/cart">장바구니에서 수정</Link>
      </header>
      <div className="checkout-order-groups">
        {groups.map((group) => (
          <div className="checkout-order-group" key={group.shippingMethod}>
            <div className="checkout-order-group__heading">
              <strong>{group.method.label}</strong>
              <span>{group.method.summary}</span>
            </div>
            {group.bundles.map((item) => (
              <article className="checkout-order-item" key={item.bundle.id}>
                <div className="checkout-order-item__main">
                  <div className="checkout-order-item__image">
                    <Image src={item.image} alt="" fill sizes="80px" />
                  </div>
                  <div>
                    <p>
                      {item.product?.brand} · {item.product?.collection}
                    </p>
                    <h3>{item.product?.name}</h3>
                    <span>
                      {item.optionLabel} · {item.variantLabel} ·{" "}
                      {item.bundle.quantity}
                      {item.orderUnitLabel}
                    </span>
                  </div>
                  <strong>
                    {formatPrice(
                      (item.currentUnitPrice ?? 0) * item.bundle.quantity,
                    )}
                  </strong>
                </div>
                {item.additionalItems.length > 0 && (
                  <div className="checkout-order-additional">
                    <span>추가 상품</span>
                    {item.additionalItems.map((additional) => (
                      <div key={additional.productId}>
                        <p>
                          {additional.name} · {additional.quantity}개
                        </p>
                        <strong>
                          {formatPrice(
                            additional.currentPrice * additional.quantity,
                          )}
                        </strong>
                      </div>
                    ))}
                  </div>
                )}
                <div className="checkout-order-item__footer">
                  <span>
                    {item.bundle.shippingMethod === "freight-delivery"
                      ? `선불 배송비 ${formatPrice(item.shippingFee)}`
                      : item.bundle.shippingMethod === "individual-freight"
                        ? "운송비 착불 별도"
                        : "배송비 0원"}
                  </span>
                  <strong>묶음 {formatPrice(item.productTotal)}</strong>
                </div>
              </article>
            ))}
          </div>
        ))}
      </div>
      <p className="checkout-order-note">
        배송 방법별로 구분해 표시하며 실제 합배송 여부와 일정은 상품별로 달라질
        수 있습니다.
      </p>
    </section>
  );
}

function PaymentSection({
  paymentMethod,
  register,
  error,
  validate,
}: {
  paymentMethod?: string;
  register: ReturnType<typeof useForm<CheckoutFormValues>>["register"];
  error?: string;
  validate: () => void;
}) {
  return (
    <section className="checkout-section" aria-labelledby="payment-title">
      <h2 id="payment-title">결제수단</h2>
      <fieldset className="checkout-payment-options">
        <legend className="sr-only">결제수단 선택</legend>
        <label className={paymentMethod === "card" ? "is-selected" : ""}>
          <input type="radio" value="card" {...register("paymentMethod")} />
          <span>
            <strong>신용·체크카드</strong>
            <small>실제 카드정보를 입력하지 않는 모의 결제입니다.</small>
          </span>
        </label>
        <label
          className={paymentMethod === "bank-transfer" ? "is-selected" : ""}
        >
          <input
            type="radio"
            value="bank-transfer"
            {...register("paymentMethod")}
          />
          <span>
            <strong>무통장입금</strong>
            <small>주문 후 입금 계좌와 기한을 안내합니다.</small>
          </span>
        </label>
      </fieldset>
      {paymentMethod === "bank-transfer" && (
        <CheckoutField
          className="checkout-depositor checkout-conditional-field"
          label="입금자명"
          name="depositorName"
          error={error}
          required
        >
          <input
            {...register("depositorName")}
            onBlur={validate}
            autoComplete="name"
          />
        </CheckoutField>
      )}
    </section>
  );
}

function CheckoutSummary({
  summary,
  paymentMethod,
  submitting,
  register,
  agreementError,
}: {
  summary: ReturnType<typeof getCheckoutSummary>;
  paymentMethod?: string;
  submitting: boolean;
  register: ReturnType<typeof useForm<CheckoutFormValues>>["register"];
  agreementError?: string;
}) {
  return (
    <aside
      className="checkout-summary"
      aria-labelledby="checkout-summary-title"
    >
      <h2 id="checkout-summary-title">결제 금액</h2>
      <dl>
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
      <div className="checkout-summary__total">
        <span>최종 결제 금액</span>
        <strong>{formatPrice(summary.total)}</strong>
      </div>
      <label
        className={clsx("checkout-agreement", agreementError && "has-error")}
      >
        <input
          type="checkbox"
          aria-invalid={Boolean(agreementError)}
          aria-describedby={agreementError ? "agreement-error" : undefined}
          {...register("agreedToOrder")}
        />
        <span aria-hidden="true" />
        <span>
          주문 상품, 가격과 결제 조건을 확인했으며 구매에 동의합니다.{" "}
          <em>필수</em>
        </span>
      </label>
      {agreementError && (
        <small id="agreement-error" className="checkout-field-error">
          {agreementError}
        </small>
      )}
      <button
        className="checkout-primary-button"
        type="submit"
        disabled={submitting}
      >
        {submitting ? (
          <>
            <LoaderCircle className="is-spinning" size={18} /> 주문을 처리하고
            있습니다
          </>
        ) : paymentMethod === "bank-transfer" ? (
          "주문하기"
        ) : (
          `${formatPrice(summary.total)} 결제하기`
        )}
      </button>
      <small>화면 검증용 주문이며 실제 결제는 발생하지 않습니다.</small>
    </aside>
  );
}

function CheckoutMobileBar({
  total,
  paymentMethod,
  submitting,
}: {
  total: number;
  paymentMethod?: string;
  submitting: boolean;
}) {
  return (
    <div className="checkout-mobile-bar" aria-label="모바일 결제 요약">
      <div>
        <small>결제 금액</small>
        <strong>{formatPrice(total)}</strong>
      </div>
      <button type="submit" form="checkout-form" disabled={submitting}>
        {submitting
          ? "처리 중"
          : paymentMethod === "bank-transfer"
            ? "주문하기"
            : "결제하기"}
      </button>
    </div>
  );
}
