import { z } from "zod";
import type { MockMember } from "../auth/auth-store";

export type QuotationFormValues = {
  title: string;
  recipientOrganization: string;
  contactName: string;
  contactPhone: string;
  contactEmail: string;
};

export const DEFAULT_QUOTATION_VALUES: QuotationFormValues = {
  title: "",
  recipientOrganization: "",
  contactName: "",
  contactPhone: "",
  contactEmail: "",
};

export const quotationSchema = z.object({
  title: z.string().trim().max(50, "견적명은 50자 이하로 입력해 주세요."),
  recipientOrganization: z
    .string()
    .trim()
    .min(1, "수신처를 입력해 주세요.")
    .max(50, "수신처는 50자 이하로 입력해 주세요."),
  contactName: z
    .string()
    .trim()
    .min(2, "담당자명을 2자 이상 입력해 주세요.")
    .max(30, "담당자명은 30자 이하로 입력해 주세요."),
  contactPhone: z
    .string()
    .transform((value) => value.replace(/\D/g, ""))
    .refine((value) => /^\d{9,11}$/.test(value), "연락처를 확인해 주세요."),
  contactEmail: z
    .string()
    .trim()
    .toLowerCase()
    .max(100, "이메일은 100자 이하로 입력해 주세요.")
    .refine(
      (value) => value.length === 0 || z.email().safeParse(value).success,
      "이메일 주소를 확인해 주세요.",
    ),
});

export function getQuotationDefaultValues(
  member: MockMember,
  previous?: QuotationFormValues,
): QuotationFormValues {
  return {
    title: previous?.title ?? "",
    recipientOrganization: previous?.recipientOrganization ?? "",
    contactName: previous?.contactName || member.name,
    contactPhone: formatPhoneNumber(previous?.contactPhone || member.phone),
    contactEmail: previous?.contactEmail || member.email,
  };
}

export function normalizeQuotationValues(
  values: QuotationFormValues,
): QuotationFormValues {
  const parsed = quotationSchema.parse(values);
  return {
    ...parsed,
    contactPhone: parsed.contactPhone.replace(/\D/g, ""),
  };
}

export function formatPhoneNumber(value: string) {
  const digits = value.replace(/\D/g, "").slice(0, 11);
  if (digits.length <= 3) return digits;
  if (digits.length <= 7) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
}
