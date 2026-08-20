"use client";

import { clsx } from "clsx";
import {
  ArrowLeft,
  Check,
  LoaderCircle,
  MapPin,
  Pencil,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import {
  EMPTY_SHIPPING_ADDRESS_INPUT,
  formatPhoneNumber,
  shippingAddressInputSchema,
  type ShippingAddressInput,
} from "./address-schema";
import {
  sortMemberAddresses,
  useAddressStore,
  type ShippingAddress,
} from "./address-store";
import { openKakaoPostcode } from "./kakao-postcode";

type AddressManagerDialogProps = {
  memberId: string;
  open: boolean;
  openEditorOnOpen?: boolean;
  selectedAddressId?: string;
  selectedValues: {
    postalCode: string;
    roadAddress: string;
    addressDetail: string;
  };
  onOpenChange: (open: boolean) => void;
  onSelect: (address: ShippingAddress) => void;
  returnFocusRef: React.RefObject<HTMLButtonElement | null>;
};

type EditorMode = { kind: "new" } | { kind: "edit"; id: string };
type DiscardAction = "close" | "leave";
type AddressField = keyof ShippingAddressInput;
type AddressErrors = Partial<Record<AddressField, string>>;

const NEW_EDITOR_MODE: EditorMode = { kind: "new" };

const FOCUSABLE_SELECTOR = [
  "button:not([disabled])",
  "input:not([disabled])",
  "select:not([disabled])",
  "textarea:not([disabled])",
  "[href]",
  '[tabindex]:not([tabindex="-1"])',
].join(",");

function isSameAddress(
  address: ShippingAddress,
  selectedValues: AddressManagerDialogProps["selectedValues"],
  selectedAddressId?: string,
) {
  if (selectedAddressId) return address.id === selectedAddressId;
  return (
    address.postalCode === selectedValues.postalCode &&
    address.roadAddress === selectedValues.roadAddress &&
    address.addressDetail === selectedValues.addressDetail
  );
}

export function AddressManagerDialog({
  memberId,
  open,
  openEditorOnOpen = false,
  selectedAddressId,
  selectedValues,
  onOpenChange,
  onSelect,
  returnFocusRef,
}: AddressManagerDialogProps) {
  const allAddresses = useAddressStore((state) => state.addresses);
  const addAddress = useAddressStore((state) => state.addAddress);
  const updateAddress = useAddressStore((state) => state.updateAddress);
  const removeAddress = useAddressStore((state) => state.removeAddress);
  const restoreAddress = useAddressStore((state) => state.restoreAddress);
  const setDefaultAddress = useAddressStore((state) => state.setDefaultAddress);
  const addresses = useMemo(
    () => sortMemberAddresses(allAddresses, memberId),
    [allAddresses, memberId],
  );
  const [editorMode, setEditorMode] = useState<EditorMode | null>(null);
  const [values, setValues] = useState<ShippingAddressInput>(
    EMPTY_SHIPPING_ADDRESS_INPUT,
  );
  const [errors, setErrors] = useState<AddressErrors>({});
  const [manualAddress, setManualAddress] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchError, setSearchError] = useState("");
  const [removed, setRemoved] = useState<ShippingAddress | null>(null);
  const [notice, setNotice] = useState("");
  const [initialValues, setInitialValues] = useState<ShippingAddressInput>(
    EMPTY_SHIPPING_ADDRESS_INPUT,
  );
  const [discardAction, setDiscardAction] = useState<DiscardAction | null>(
    null,
  );
  const panelRef = useRef<HTMLDivElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const discardDialogRef = useRef<HTMLDivElement>(null);
  const discardReturnFocusRef = useRef<HTMLElement | null>(null);
  const detailRef = useRef<HTMLInputElement>(null);
  const undoTimerRef = useRef<number | null>(null);
  const directNewEditor = open && openEditorOnOpen && addresses.length === 0;
  const activeEditorMode: EditorMode | null =
    editorMode ?? (directNewEditor ? NEW_EDITOR_MODE : null);
  const editorDirty = Boolean(
    activeEditorMode &&
    (values.label !== initialValues.label ||
      values.recipientName !== initialValues.recipientName ||
      values.recipientPhone !== initialValues.recipientPhone ||
      values.postalCode !== initialValues.postalCode ||
      values.roadAddress !== initialValues.roadAddress ||
      values.addressDetail !== initialValues.addressDetail ||
      values.isDefault !== initialValues.isDefault),
  );

  const close = useCallback(() => {
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setRemoved(null);
    setNotice("");
    onOpenChange(false);
    setEditorMode(null);
    setValues({ ...EMPTY_SHIPPING_ADDRESS_INPUT });
    setInitialValues({ ...EMPTY_SHIPPING_ADDRESS_INPUT });
    setErrors({});
    setSearchError("");
    setDiscardAction(null);
    window.requestAnimationFrame(() => returnFocusRef.current?.focus());
  }, [onOpenChange, returnFocusRef]);

  const leaveEditor = useCallback(() => {
    if (directNewEditor) close();
    else {
      setEditorMode(null);
      setValues({ ...EMPTY_SHIPPING_ADDRESS_INPUT });
      setInitialValues({ ...EMPTY_SHIPPING_ADDRESS_INPUT });
      setErrors({});
      setSearchError("");
    }
  }, [close, directNewEditor]);

  const dismissDiscard = useCallback(() => {
    setDiscardAction(null);
    window.requestAnimationFrame(() => discardReturnFocusRef.current?.focus());
  }, []);

  const requestEditorExit = useCallback(
    (action: DiscardAction) => {
      if (!editorDirty) {
        if (action === "close") close();
        else leaveEditor();
        return;
      }
      discardReturnFocusRef.current =
        document.activeElement instanceof HTMLElement
          ? document.activeElement
          : null;
      setDiscardAction(action);
    },
    [close, editorDirty, leaveEditor],
  );

  const confirmDiscard = () => {
    const action = discardAction;
    setDiscardAction(null);
    if (action === "close") close();
    else if (action === "leave") leaveEditor();
  };

  useEffect(() => {
    if (!open) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = activeEditorMode
      ? null
      : window.requestAnimationFrame(() => {
          panelRef.current
            ?.querySelector<HTMLElement>(
              ".address-manager__add, .address-card__select, button",
            )
            ?.focus();
        });

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (discardAction) dismissDiscard();
        else if (activeEditorMode) requestEditorExit("leave");
        else close();
        return;
      }
      const focusRoot = discardAction
        ? discardDialogRef.current
        : panelRef.current;
      if (event.key !== "Tab" || !focusRoot) return;
      const focusable = Array.from(
        focusRoot.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR),
      ).filter((element) => element.offsetParent !== null);
      if (focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last?.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      if (focusTimer !== null) window.cancelAnimationFrame(focusTimer);
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = previousOverflow;
    };
  }, [
    activeEditorMode,
    close,
    discardAction,
    dismissDiscard,
    open,
    requestEditorExit,
  ]);

  useEffect(() => {
    if (!discardAction) return;
    const focusTimer = window.requestAnimationFrame(() => {
      discardDialogRef.current
        ?.querySelector<HTMLElement>(".address-discard__continue")
        ?.focus();
    });
    return () => window.cancelAnimationFrame(focusTimer);
  }, [discardAction]);

  useEffect(
    () => () => {
      if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    },
    [],
  );

  useEffect(() => {
    if (!notice) return;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  if (!open) return null;

  const openNewEditor = () => {
    const emptyValues = { ...EMPTY_SHIPPING_ADDRESS_INPUT };
    setValues(emptyValues);
    setInitialValues(emptyValues);
    setErrors({});
    setManualAddress(false);
    setSearchError("");
    setEditorMode({ kind: "new" });
  };

  const openEditEditor = (address: ShippingAddress) => {
    const addressValues = {
      label: address.label,
      recipientName: address.recipientName,
      recipientPhone: formatPhoneNumber(address.recipientPhone),
      postalCode: address.postalCode,
      roadAddress: address.roadAddress,
      addressDetail: address.addressDetail,
      isDefault: address.isDefault,
    };
    setValues(addressValues);
    setInitialValues(addressValues);
    setErrors({});
    setManualAddress(false);
    setSearchError("");
    setEditorMode({ kind: "edit", id: address.id });
  };

  const updateValue = <K extends AddressField>(
    field: K,
    value: ShippingAddressInput[K],
  ) => {
    setValues((current) => ({ ...current, [field]: value }));
    if (errors[field]) {
      setErrors((current) => ({ ...current, [field]: undefined }));
    }
  };

  const validateField = (field: AddressField) => {
    const result = shippingAddressInputSchema.safeParse(values);
    const issue = result.success
      ? undefined
      : result.error.issues.find((item) => item.path[0] === field);
    setErrors((current) => ({
      ...current,
      [field]: issue?.message,
    }));
  };

  const handleSearch = async () => {
    if (searching) return;
    setSearching(true);
    setSearchError("");
    try {
      await openKakaoPostcode((result) => {
        setValues((current) => ({
          ...current,
          postalCode: result.postalCode,
          roadAddress: result.roadAddress,
        }));
        setErrors((current) => ({
          ...current,
          postalCode: undefined,
          roadAddress: undefined,
        }));
        setManualAddress(false);
        window.requestAnimationFrame(() => detailRef.current?.focus());
      });
    } catch (error) {
      setSearchError(
        error instanceof Error
          ? error.message
          : "주소 검색을 시작하지 못했습니다.",
      );
    } finally {
      setSearching(false);
    }
  };

  const handleSave = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    event.stopPropagation();
    const result = shippingAddressInputSchema.safeParse(values);
    if (!result.success) {
      const nextErrors: AddressErrors = {};
      result.error.issues.forEach((issue) => {
        const field = issue.path[0] as AddressField;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      });
      setErrors(nextErrors);
      const firstField = result.error.issues[0]?.path[0];
      if (firstField) {
        formRef.current
          ?.querySelector<HTMLElement>(`[name="${String(firstField)}"]`)
          ?.focus();
      }
      return;
    }

    const saved =
      activeEditorMode?.kind === "edit"
        ? updateAddress(memberId, activeEditorMode.id, result.data)
        : addAddress(memberId, result.data);
    if (!saved) {
      setSearchError("배송지를 저장하지 못했습니다. 다시 시도해 주세요.");
      return;
    }
    onSelect(saved);
    setEditorMode(null);
    setNotice("배송지를 저장하고 주문서에 적용했습니다.");
  };

  const handleRemove = (address: ShippingAddress) => {
    const deleted = removeAddress(memberId, address.id);
    if (!deleted) return;
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    setRemoved(deleted);
    setNotice("");
    undoTimerRef.current = window.setTimeout(() => {
      setRemoved(null);
      undoTimerRef.current = null;
    }, 5000);
  };

  const handleUndo = () => {
    if (!removed) return;
    restoreAddress(removed);
    if (undoTimerRef.current) window.clearTimeout(undoTimerRef.current);
    undoTimerRef.current = null;
    setRemoved(null);
    setNotice("삭제한 배송지를 복구했습니다.");
  };

  return createPortal(
    <div
      className="address-manager-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !activeEditorMode) close();
      }}
    >
      <div
        className="address-manager"
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="address-manager-title"
      >
        <header
          className="address-manager__header"
          inert={Boolean(discardAction)}
        >
          {activeEditorMode && !directNewEditor ? (
            <button
              type="button"
              aria-label="배송지 목록으로 돌아가기"
              onClick={() => requestEditorExit("leave")}
            >
              <ArrowLeft size={21} aria-hidden="true" />
            </button>
          ) : (
            <span className="address-manager__header-spacer" />
          )}
          <h2 id="address-manager-title">
            {activeEditorMode
              ? activeEditorMode.kind === "new"
                ? "배송지 추가"
                : "배송지 수정"
              : "배송지 관리"}
          </h2>
          <button
            type="button"
            aria-label="배송지 관리 닫기"
            onClick={() => requestEditorExit("close")}
          >
            <X size={21} aria-hidden="true" />
          </button>
        </header>

        <div className="address-manager__body" inert={Boolean(discardAction)}>
          {activeEditorMode ? (
            <form
              className="address-editor"
              ref={formRef}
              noValidate
              onSubmit={handleSave}
            >
              <AddressEditorField
                label="배송지명"
                name="label"
                error={errors.label}
                required
              >
                <input
                  name="label"
                  value={values.label}
                  maxLength={20}
                  autoFocus
                  onChange={(event) => updateValue("label", event.target.value)}
                  onBlur={() => validateField("label")}
                  placeholder="예: 우리 집, 현장"
                />
              </AddressEditorField>
              <div className="address-editor__row">
                <AddressEditorField
                  label="수령인"
                  name="recipientName"
                  error={errors.recipientName}
                  required
                >
                  <input
                    name="recipientName"
                    value={values.recipientName}
                    maxLength={30}
                    autoComplete="shipping name"
                    onChange={(event) =>
                      updateValue("recipientName", event.target.value)
                    }
                    onBlur={() => validateField("recipientName")}
                  />
                </AddressEditorField>
                <AddressEditorField
                  label="연락처"
                  name="recipientPhone"
                  error={errors.recipientPhone}
                  required
                >
                  <input
                    name="recipientPhone"
                    value={values.recipientPhone}
                    maxLength={13}
                    inputMode="tel"
                    autoComplete="shipping tel"
                    onChange={(event) =>
                      updateValue(
                        "recipientPhone",
                        formatPhoneNumber(event.target.value),
                      )
                    }
                    onBlur={() => validateField("recipientPhone")}
                  />
                </AddressEditorField>
              </div>

              <fieldset className="address-editor__address">
                <legend>
                  주소 <em>필수</em>
                </legend>
                <div className="address-editor__search-row">
                  <input
                    name="postalCode"
                    value={values.postalCode}
                    readOnly={!manualAddress}
                    inputMode="numeric"
                    maxLength={5}
                    aria-label="우편번호"
                    aria-invalid={Boolean(errors.postalCode)}
                    aria-describedby={
                      errors.postalCode ? "postalCode-address-error" : undefined
                    }
                    autoComplete="shipping postal-code"
                    placeholder="우편번호"
                    onChange={(event) =>
                      updateValue("postalCode", event.target.value)
                    }
                    onBlur={() => validateField("postalCode")}
                  />
                  <button
                    type="button"
                    className="address-editor__search-button"
                    disabled={searching}
                    onClick={handleSearch}
                  >
                    {searching ? (
                      <LoaderCircle className="is-spinning" size={17} />
                    ) : (
                      <Search size={17} aria-hidden="true" />
                    )}
                    주소 검색
                  </button>
                </div>
                {errors.postalCode && (
                  <small
                    className="address-editor__error"
                    id="postalCode-address-error"
                    role="alert"
                  >
                    {errors.postalCode}
                  </small>
                )}
                <input
                  name="roadAddress"
                  value={values.roadAddress}
                  readOnly={!manualAddress}
                  aria-label="도로명 주소"
                  aria-invalid={Boolean(errors.roadAddress)}
                  aria-describedby={
                    errors.roadAddress ? "roadAddress-address-error" : undefined
                  }
                  autoComplete="shipping street-address"
                  placeholder="주소 검색 결과가 표시됩니다."
                  onChange={(event) =>
                    updateValue("roadAddress", event.target.value)
                  }
                  onBlur={() => validateField("roadAddress")}
                />
                {errors.roadAddress && (
                  <small
                    className="address-editor__error"
                    id="roadAddress-address-error"
                    role="alert"
                  >
                    {errors.roadAddress}
                  </small>
                )}
                <input
                  name="addressDetail"
                  ref={detailRef}
                  value={values.addressDetail}
                  maxLength={100}
                  aria-label="상세주소"
                  aria-invalid={Boolean(errors.addressDetail)}
                  aria-describedby={
                    errors.addressDetail
                      ? "addressDetail-address-error"
                      : undefined
                  }
                  autoComplete="shipping address-line2"
                  placeholder="상세주소를 입력해 주세요."
                  onChange={(event) =>
                    updateValue("addressDetail", event.target.value)
                  }
                  onBlur={() => validateField("addressDetail")}
                />
                {errors.addressDetail && (
                  <small
                    className="address-editor__error"
                    id="addressDetail-address-error"
                    role="alert"
                  >
                    {errors.addressDetail}
                  </small>
                )}
                <button
                  type="button"
                  className="address-editor__manual"
                  onClick={() => {
                    setManualAddress((current) => !current);
                    setSearchError("");
                  }}
                >
                  {manualAddress ? "주소 검색으로 입력" : "주소 직접 입력"}
                </button>
                {searchError && (
                  <div className="address-editor__search-error" role="alert">
                    <p>{searchError}</p>
                    <button type="button" onClick={handleSearch}>
                      <RotateCcw size={15} aria-hidden="true" /> 다시 시도
                    </button>
                  </div>
                )}
              </fieldset>

              <label className="address-editor__default">
                <input
                  type="checkbox"
                  name="isDefault"
                  checked={values.isDefault}
                  onChange={(event) =>
                    updateValue("isDefault", event.target.checked)
                  }
                />
                <span aria-hidden="true" /> 기본 배송지로 저장
              </label>
              <div className="address-editor__actions">
                <button
                  type="button"
                  onClick={() => requestEditorExit("leave")}
                >
                  취소
                </button>
                <button type="submit">배송지 저장</button>
              </div>
            </form>
          ) : (
            <>
              {addresses.length > 0 && (
                <button
                  type="button"
                  className="address-manager__add"
                  onClick={openNewEditor}
                >
                  <Plus size={18} aria-hidden="true" /> 새 배송지 추가
                </button>
              )}
              {addresses.length === 0 ? (
                <div className="address-manager__empty">
                  <MapPin size={28} aria-hidden="true" />
                  <strong>저장된 배송지가 없습니다.</strong>
                  <p>
                    자주 받는 주소를 저장하면 주문할 때 바로 선택할 수 있습니다.
                  </p>
                  <button type="button" onClick={openNewEditor}>
                    배송지 추가
                  </button>
                </div>
              ) : (
                <div className="address-manager__list">
                  {addresses.map((address) => {
                    const selected = isSameAddress(
                      address,
                      selectedValues,
                      selectedAddressId,
                    );
                    return (
                      <article
                        className={clsx(
                          "address-card",
                          selected && "is-selected",
                        )}
                        key={address.id}
                      >
                        <button
                          type="button"
                          className="address-card__select"
                          aria-pressed={selected}
                          onClick={() => {
                            onSelect(address);
                            close();
                          }}
                        >
                          <span
                            className="address-card__radio"
                            aria-hidden="true"
                          >
                            {selected && <Check size={13} />}
                          </span>
                          <span className="address-card__content">
                            <span className="address-card__title">
                              <strong>{address.label}</strong>
                              {address.isDefault && <em>기본 배송지</em>}
                            </span>
                            <span>
                              {address.recipientName} ·{" "}
                              {formatPhoneNumber(address.recipientPhone)}
                            </span>
                            <span className="address-card__address">
                              [{address.postalCode}] {address.roadAddress}{" "}
                              {address.addressDetail}
                            </span>
                          </span>
                        </button>
                        <div className="address-card__actions">
                          {!address.isDefault && (
                            <button
                              type="button"
                              className="address-card__default-action"
                              onClick={() =>
                                setDefaultAddress(memberId, address.id)
                              }
                            >
                              기본 배송지로
                            </button>
                          )}
                          <button
                            type="button"
                            aria-label={`${address.label} 수정`}
                            onClick={() => openEditEditor(address)}
                          >
                            <Pencil size={16} aria-hidden="true" /> 수정
                          </button>
                          <button
                            type="button"
                            aria-label={`${address.label} 삭제`}
                            onClick={() => handleRemove(address)}
                          >
                            <Trash2 size={16} aria-hidden="true" /> 삭제
                          </button>
                        </div>
                      </article>
                    );
                  })}
                </div>
              )}
            </>
          )}
        </div>

        {(removed || notice) && (
          <div className="address-manager__toast" aria-live="polite">
            <span>
              {removed ? `${removed.label} 배송지를 삭제했습니다.` : notice}
            </span>
            {removed && (
              <button type="button" onClick={handleUndo}>
                실행 취소
              </button>
            )}
          </div>
        )}
        {discardAction && (
          <div className="address-discard">
            <div
              className="address-discard__dialog"
              ref={discardDialogRef}
              role="alertdialog"
              aria-modal="true"
              aria-labelledby="address-discard-title"
              aria-describedby="address-discard-description"
            >
              <h3 id="address-discard-title">작성 중인 내용이 있습니다.</h3>
              <p id="address-discard-description">
                저장하지 않고 나가면 입력한 배송지 정보가 사라집니다.
              </p>
              <div className="address-discard__actions">
                <button type="button" onClick={confirmDiscard}>
                  나가기
                </button>
                <button
                  type="button"
                  className="address-discard__continue"
                  onClick={dismissDiscard}
                >
                  계속 작성
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>,
    document.body,
  );
}

function AddressEditorField({
  label,
  name,
  error,
  required,
  children,
}: {
  label: string;
  name: AddressField;
  error?: string;
  required?: boolean;
  children: React.ReactElement<React.InputHTMLAttributes<HTMLInputElement>>;
}) {
  const errorId = `${name}-address-error`;
  return (
    <label className={clsx("address-editor__field", error && "has-error")}>
      <span>
        {label} {required && <em>필수</em>}
      </span>
      {children && {
        ...children,
        props: {
          ...children.props,
          "aria-invalid": Boolean(error),
          "aria-describedby": error ? errorId : undefined,
        },
      }}
      {error && (
        <small className="address-editor__error" id={errorId} role="alert">
          {error}
        </small>
      )}
    </label>
  );
}
