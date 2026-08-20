import { z } from "zod";

export const shippingAddressInputSchema = z.object({
  label: z
    .string()
    .trim()
    .min(1, "배송지명을 입력해 주세요.")
    .max(20, "배송지명은 20자까지 입력할 수 있습니다."),
  recipientName: z
    .string()
    .trim()
    .min(2, "수령인은 2자 이상 입력해 주세요.")
    .max(30, "수령인은 30자까지 입력할 수 있습니다."),
  recipientPhone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine(
      (value) => /^\d{10,11}$/.test(value),
      "휴대전화 번호를 확인해 주세요.",
    ),
  postalCode: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine(
      (value) => /^\d{5}$/.test(value),
      "우편번호 5자리를 입력해 주세요.",
    ),
  roadAddress: z
    .string()
    .trim()
    .min(1, "주소를 검색하거나 직접 입력해 주세요.")
    .max(100, "주소는 100자까지 입력할 수 있습니다."),
  addressDetail: z
    .string()
    .trim()
    .min(1, "상세주소를 입력해 주세요.")
    .max(100, "상세주소는 100자까지 입력할 수 있습니다."),
  isDefault: z.boolean(),
});

export type ShippingAddressInput = z.input<typeof shippingAddressInputSchema>;
export type NormalizedShippingAddressInput = z.output<
  typeof shippingAddressInputSchema
>;

export const EMPTY_SHIPPING_ADDRESS_INPUT: ShippingAddressInput = {
  label: "",
  recipientName: "",
  recipientPhone: "",
  postalCode: "",
  roadAddress: "",
  addressDetail: "",
  isDefault: false,
};

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
