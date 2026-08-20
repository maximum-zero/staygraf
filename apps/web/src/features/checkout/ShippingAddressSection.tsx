"use client";

import { Plus } from "lucide-react";
import { formatPhoneNumber } from "./address-schema";
import type { ShippingAddress } from "./address-store";
import { AddressManagerDialog } from "./AddressManagerDialog";

type ShippingAddressSectionProps = {
  memberId: string;
  open: boolean;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
  values: {
    recipientName: string;
    recipientPhone: string;
    postalCode: string;
    roadAddress: string;
    addressDetail: string;
  };
  addressLabel?: string;
  selectedAddressId?: string;
  hasSavedAddresses: boolean;
  addressError?: string;
  onOpenChange: (open: boolean) => void;
  onSelect: (address: ShippingAddress) => void;
  hiddenFields: React.ReactNode;
  children: React.ReactNode;
};

export function ShippingAddressSection({
  memberId,
  open,
  triggerRef,
  values,
  addressLabel,
  selectedAddressId,
  hasSavedAddresses,
  addressError,
  onOpenChange,
  onSelect,
  hiddenFields,
  children,
}: ShippingAddressSectionProps) {
  const hasAddress = Boolean(values.postalCode && values.roadAddress);

  return (
    <section
      className="checkout-section checkout-shipping-address"
      aria-labelledby="shipping-title"
    >
      <header className="checkout-section-heading checkout-address-heading">
        <div>
          <h2 id="shipping-title">배송지 정보</h2>
        </div>
        {hasAddress && (
          <button
            type="button"
            ref={triggerRef}
            onClick={() => onOpenChange(true)}
          >
            변경
          </button>
        )}
      </header>
      {hiddenFields}
      {hasAddress ? (
        <div
          className={`checkout-address-summary${
            addressError ? "has-error" : ""
          }`}
        >
          <div>
            <span className="checkout-address-summary__title">
              <strong>{addressLabel || "선택한 배송지"}</strong>
            </span>
            <p>
              {values.recipientName} ·{" "}
              {formatPhoneNumber(values.recipientPhone)}
            </p>
            <address>
              [{values.postalCode}] {values.roadAddress} {values.addressDetail}
            </address>
          </div>
        </div>
      ) : (
        <div
          className={`checkout-address-empty${addressError ? "has-error" : ""}`}
        >
          <button
            type="button"
            ref={triggerRef}
            aria-describedby="shipping-address-empty-help"
            onClick={() => onOpenChange(true)}
          >
            <Plus size={18} aria-hidden="true" />
            {hasSavedAddresses ? "배송지 선택" : "배송지 입력"}
          </button>
          <p
            id="shipping-address-empty-help"
            role={addressError ? "alert" : undefined}
          >
            {addressError
              ? "배송지를 입력해 주세요."
              : hasSavedAddresses
                ? "저장된 배송지에서 이번 주문의 배송지를 선택해 주세요."
                : "배송지를 입력해야 주문을 진행할 수 있습니다."}
          </p>
        </div>
      )}
      {hasAddress && addressError && (
        <small
          className="checkout-field-error checkout-address-summary__error"
          role="alert"
        >
          {addressError}
        </small>
      )}
      {hasAddress && <div className="checkout-address-request">{children}</div>}
      <AddressManagerDialog
        memberId={memberId}
        open={open}
        openEditorOnOpen={!hasAddress && !hasSavedAddresses}
        selectedAddressId={selectedAddressId}
        selectedValues={{
          postalCode: values.postalCode,
          roadAddress: values.roadAddress,
          addressDetail: values.addressDetail,
        }}
        onOpenChange={onOpenChange}
        onSelect={onSelect}
        returnFocusRef={triggerRef}
      />
    </section>
  );
}
