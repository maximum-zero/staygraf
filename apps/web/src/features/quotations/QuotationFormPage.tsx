"use client";

import { AlertCircle, ChevronRight, FileText } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
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
import { useCartStore } from "../cart/cart-store";
import {
  calculateQuotation,
  compareQuotationEntry,
  formatPrice,
  resolveQuotationBundles,
} from "./quotation-data";
import { useQuotationDraftStore } from "./quotation-draft-store";
import {
  formatPhoneNumber,
  getQuotationDefaultValues,
  normalizeQuotationValues,
  quotationSchema,
  type QuotationFormValues,
} from "./quotation-schema";
import { useQuotationStore } from "./quotation-store";

const subscribeToMount = () => () => undefined;

export function QuotationFormPage() {
  const router = useRouter();
  const mounted = useSyncExternalStore(
    subscribeToMount,
    () => true,
    () => false,
  );
  const member = useAuthStore((state) => state.member);
  const authHydrated = useAuthStore((state) => state.hydrated);
  const cartHydrated = useCartStore((state) => state.hydrated);
  const bundles = useCartStore((state) => state.bundles);
  const draft = useQuotationDraftStore((state) => state.draft);
  const draftHydrated = useQuotationDraftStore((state) => state.hydrated);
  const claimForMember = useQuotationDraftStore(
    (state) => state.claimForMember,
  );
  const updateValues = useQuotationDraftStore((state) => state.updateValues);
  const setPreviewFingerprint = useQuotationDraftStore(
    (state) => state.setPreviewFingerprint,
  );
  const quotationHydrated = useQuotationStore((state) => state.hydrated);
  const [pageError, setPageError] = useState("");
  const initialized = useRef(false);
  const ready =
    mounted &&
    authHydrated &&
    cartHydrated &&
    draftHydrated &&
    quotationHydrated;
  const resolved = useMemo(
    () =>
      draft ? resolveQuotationBundles(bundles, draft.selectedBundleIds) : [],
    [bundles, draft],
  );
  const calculation = useMemo(() => {
    try {
      return calculateQuotation(resolved);
    } catch {
      return null;
    }
  }, [resolved]);
  const entryChanges = useMemo(
    () => (draft ? compareQuotationEntry(draft.entry, resolved) : []),
    [draft, resolved],
  );
  const {
    register,
    control,
    reset,
    setError,
    clearErrors,
    setFocus,
    getValues,
    handleSubmit,
    formState: { errors },
  } = useForm<QuotationFormValues>({ mode: "onBlur" });
  const values = useWatch({ control });

  useEffect(() => {
    if (!ready) return;
    if (!member) {
      router.replace("/login?returnTo=/quotes/new");
      return;
    }
    if (!draft) return;
    if (!claimForMember(member.id)) {
      router.replace("/cart");
      return;
    }
    if (draft.issuedQuotationId) {
      router.replace(`/mypage/quotes/${draft.issuedQuotationId}`);
    }
  }, [claimForMember, draft, member, ready, router]);

  useEffect(() => {
    if (!ready || !member || !draft || initialized.current) return;
    reset(getQuotationDefaultValues(member, draft.values));
    initialized.current = true;
  }, [draft, member, ready, reset]);

  useEffect(() => {
    if (!initialized.current || !draft) return;
    const timer = window.setTimeout(() => {
      updateValues(getValues());
    }, 250);
    return () => window.clearTimeout(timer);
  }, [draft, getValues, updateValues, values]);

  useEffect(() => {
    if (!initialized.current || Object.keys(errors).length === 0) return;
    const result = quotationSchema.safeParse(getValues());
    const invalid = new Set(
      result.success ? [] : result.error.issues.map((issue) => issue.path[0]),
    );
    (Object.keys(errors) as Path<QuotationFormValues>[]).forEach((name) => {
      if (!invalid.has(name)) clearErrors(name);
    });
  }, [clearErrors, errors, getValues, values]);

  const validateField = (name: Path<QuotationFormValues>) => {
    const result = quotationSchema.safeParse(getValues());
    const issue = result.success
      ? undefined
      : result.error.issues.find((item) => item.path[0] === name);
    if (issue) setError(name, { type: "manual", message: issue.message });
    else clearErrors(name);
  };

  const onInvalid = (formErrors: FieldErrors<QuotationFormValues>) => {
    const first = Object.keys(formErrors)[0] as
      Path<QuotationFormValues> | undefined;
    if (first) setFocus(first);
    setPageError("");
  };

  const onSubmit = (rawValues: QuotationFormValues) => {
    setPageError("");
    if (!draft) return;
    const parsed = quotationSchema.safeParse(rawValues);
    if (!parsed.success) return;
    const latest = resolveQuotationBundles(
      useCartStore.getState().bundles,
      draft.selectedBundleIds,
    );
    if (
      latest.length !== draft.selectedBundleIds.length ||
      latest.some((item) => !item.available)
    ) {
      setPageError(
        "판매 또는 배송 조건이 변경된 상품이 있습니다. 장바구니에서 먼저 확인해 주세요.",
      );
      return;
    }
    const latestCalculation = calculateQuotation(latest);
    updateValues(normalizeQuotationValues(parsed.data));
    setPreviewFingerprint(latestCalculation.fingerprint);
    router.push("/quotes/preview");
  };

  if (!ready || (ready && !member)) return <QuotationLoading />;
  if (!draft) {
    return (
      <QuotationEmpty
        title="견적을 만들 상품이 없습니다."
        description="장바구니에서 견적을 만들 상품을 선택해 주세요."
      />
    );
  }

  return (
    <main className="quotation-form-page" id="main-content">
      <div className="quotation-flow-shell">
        <header className="quotation-flow-heading">
          <Link href="/cart">장바구니</Link>
          <h1>견적서 만들기</h1>
          <p>수신 정보를 입력하고 발행 전 문서를 확인하세요.</p>
          <QuotationSteps current={1} />
        </header>

        {entryChanges.length > 0 && (
          <div className="quotation-alert" role="status">
            <AlertCircle size={19} aria-hidden="true" />
            <div>
              <strong>장바구니 진입 후 상품 조건이 변경되었습니다.</strong>
              <p>
                현재 금액으로 미리보기를 만들며 발행 직전에 한 번 더 확인합니다.
              </p>
            </div>
          </div>
        )}

        <form
          className="quotation-form-layout"
          noValidate
          onSubmit={handleSubmit(onSubmit, onInvalid)}
        >
          <section
            className="quotation-form-card"
            aria-labelledby="recipient-title"
          >
            <div className="quotation-section-heading">
              <span>01</span>
              <div>
                <h2 id="recipient-title">수신 정보</h2>
                <p>견적서를 전달받을 업체 또는 담당자 정보를 입력해 주세요.</p>
              </div>
            </div>
            <div className="quotation-form-fields">
              <label className="quotation-field quotation-field--wide">
                <span>
                  견적명 또는 현장명 <small>선택</small>
                </span>
                <input
                  type="text"
                  maxLength={50}
                  placeholder="예: 성수동 카페 자재 견적"
                  {...register("title")}
                  onBlur={() => validateField("title")}
                  aria-invalid={Boolean(errors.title)}
                  aria-describedby={
                    errors.title ? "quotation-title-error" : undefined
                  }
                />
                {errors.title && (
                  <small
                    id="quotation-title-error"
                    className="quotation-field-error"
                    role="alert"
                  >
                    {errors.title.message}
                  </small>
                )}
              </label>
              <QuotationField
                label="수신처"
                errorId="quotation-recipient-error"
                error={errors.recipientOrganization?.message}
                input={
                  <input
                    type="text"
                    maxLength={50}
                    placeholder="업체명 또는 수신처명"
                    {...register("recipientOrganization")}
                    onBlur={() => validateField("recipientOrganization")}
                    aria-invalid={Boolean(errors.recipientOrganization)}
                    aria-describedby={
                      errors.recipientOrganization
                        ? "quotation-recipient-error"
                        : undefined
                    }
                  />
                }
              />
              <QuotationField
                label="담당자명"
                errorId="quotation-contact-name-error"
                error={errors.contactName?.message}
                input={
                  <input
                    type="text"
                    maxLength={30}
                    autoComplete="name"
                    {...register("contactName")}
                    onBlur={() => validateField("contactName")}
                    aria-invalid={Boolean(errors.contactName)}
                    aria-describedby={
                      errors.contactName
                        ? "quotation-contact-name-error"
                        : undefined
                    }
                  />
                }
              />
              <QuotationField
                label="연락처"
                errorId="quotation-contact-phone-error"
                error={errors.contactPhone?.message}
                input={
                  <input
                    type="tel"
                    inputMode="tel"
                    autoComplete="tel"
                    placeholder="010-0000-0000"
                    {...register("contactPhone", {
                      onChange: (event) => {
                        event.target.value = formatPhoneNumber(
                          event.target.value,
                        );
                      },
                    })}
                    onBlur={() => validateField("contactPhone")}
                    aria-invalid={Boolean(errors.contactPhone)}
                    aria-describedby={
                      errors.contactPhone
                        ? "quotation-contact-phone-error"
                        : undefined
                    }
                  />
                }
              />
              <QuotationField
                label="이메일"
                optional
                errorId="quotation-contact-email-error"
                error={errors.contactEmail?.message}
                input={
                  <input
                    type="email"
                    inputMode="email"
                    autoComplete="email"
                    placeholder="buyer@example.com"
                    {...register("contactEmail")}
                    onBlur={() => validateField("contactEmail")}
                    aria-invalid={Boolean(errors.contactEmail)}
                    aria-describedby={
                      errors.contactEmail
                        ? "quotation-contact-email-error"
                        : undefined
                    }
                  />
                }
              />
            </div>
          </section>

          <aside
            className="quotation-entry-summary"
            aria-labelledby="quotation-summary-title"
          >
            <h2 id="quotation-summary-title">견적 요약</h2>
            <ul>
              {resolved.map((item) => (
                <li key={item.bundle.id}>
                  <div>
                    <strong>{item.product?.name ?? "판매 종료된 상품"}</strong>
                    <span>
                      {item.optionLabel} · {item.variantLabel} ·{" "}
                      {item.bundle.quantity}
                      {item.orderUnitLabel}
                      {item.additionalItems.length > 0 &&
                        ` · 추가 상품 ${item.additionalItems.length}종`}
                    </span>
                  </div>
                  <b>{formatPrice(item.productTotal)}</b>
                </li>
              ))}
            </ul>
            <dl>
              <div>
                <dt>선택 상품</dt>
                <dd>{resolved.length}묶음</dd>
              </div>
              <div>
                <dt>상품 금액</dt>
                <dd>
                  {formatPrice(calculation?.productTotalIncludingVat ?? 0)}
                </dd>
              </div>
              <div>
                <dt>선불 배송비</dt>
                <dd>
                  {formatPrice(
                    calculation?.prepaidShippingTotalIncludingVat ?? 0,
                  )}
                </dd>
              </div>
            </dl>
            {calculation?.hasCollectShipping && (
              <p>개별 화물 운송비는 착불로 견적 합계에서 제외됩니다.</p>
            )}
            <div className="quotation-entry-summary__total">
              <span>견적 합계</span>
              <strong>
                {formatPrice(calculation?.total.includingVat ?? 0)}
              </strong>
            </div>
            {pageError && (
              <p className="quotation-submit-error" role="alert">
                {pageError}
              </p>
            )}
            <button type="submit" disabled={!calculation}>
              미리보기
              <ChevronRight size={18} aria-hidden="true" />
            </button>
            <small>아직 견적서가 발행되지 않습니다.</small>
          </aside>
        </form>
      </div>
    </main>
  );
}

function QuotationField({
  label,
  optional = false,
  errorId,
  input,
  error,
}: {
  label: string;
  optional?: boolean;
  errorId: string;
  input: React.ReactNode;
  error?: string;
}) {
  return (
    <label className="quotation-field">
      <span>
        {label} {optional && <small>선택</small>}
      </span>
      {input}
      <small
        id={errorId}
        className="quotation-field-error"
        role={error ? "alert" : undefined}
      >
        {error ?? "\u00a0"}
      </small>
    </label>
  );
}

export function QuotationSteps({ current }: { current: 1 | 2 }) {
  return (
    <ol className="quotation-steps" aria-label="견적서 만들기 단계">
      <li
        className={current >= 1 ? "is-current" : ""}
        aria-current={current === 1 ? "step" : undefined}
      >
        <span>1</span> 정보 입력
      </li>
      <li
        className={current >= 2 ? "is-current" : ""}
        aria-current={current === 2 ? "step" : undefined}
      >
        <span>2</span> 검토 및 발행
      </li>
    </ol>
  );
}

export function QuotationLoading() {
  return (
    <main className="quotation-state-page" id="main-content" aria-busy="true">
      <FileText size={26} aria-hidden="true" />
      <p>견적 정보를 확인하고 있습니다.</p>
    </main>
  );
}

export function QuotationEmpty({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <main className="quotation-state-page" id="main-content">
      <FileText size={30} aria-hidden="true" />
      <h1>{title}</h1>
      <p>{description}</p>
      <Link href="/cart">장바구니 보기</Link>
    </main>
  );
}
