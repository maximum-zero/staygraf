import { z } from "zod";

export type PaymentMethod = "card" | "bank-transfer";
export type DeliveryRequest =
  "call-before-delivery" | "call-site-manager" | "custom";

export type CheckoutFormValues = {
  ordererName: string;
  ordererPhone: string;
  ordererEmail: string;
  sameAsOrderer: boolean;
  recipientName: string;
  recipientPhone: string;
  postalCode: string;
  address: string;
  addressDetail: string;
  deliveryRequest: DeliveryRequest | "";
  customDeliveryRequest: string;
  paymentMethod: PaymentMethod;
  depositorName: string;
  agreedToOrder: boolean;
};

export const DEFAULT_CHECKOUT_VALUES: CheckoutFormValues = {
  ordererName: "",
  ordererPhone: "",
  ordererEmail: "",
  sameAsOrderer: true,
  recipientName: "",
  recipientPhone: "",
  postalCode: "",
  address: "",
  addressDetail: "",
  deliveryRequest: "call-before-delivery",
  customDeliveryRequest: "",
  paymentMethod: "card",
  depositorName: "",
  agreedToOrder: false,
};

const nameSchema = z.string().trim().min(2, "2자 이상 입력해 주세요.").max(30);
const phoneSchema = z
  .string()
  .transform((value) => value.replace(/\D/g, ""))
  .refine(
    (value) => /^\d{10,11}$/.test(value),
    "휴대전화 번호를 확인해 주세요.",
  );

export function createCheckoutSchema(hasDeliveryItems: boolean) {
  return z
    .object({
      ordererName: nameSchema,
      ordererPhone: phoneSchema,
      ordererEmail: z
        .string()
        .trim()
        .toLowerCase()
        .email("이메일 주소를 확인해 주세요."),
      sameAsOrderer: z.boolean(),
      recipientName: nameSchema,
      recipientPhone: phoneSchema,
      postalCode: z.string(),
      address: z.string().trim().max(100),
      addressDetail: z.string().trim().max(100),
      deliveryRequest: z.enum([
        "call-before-delivery",
        "call-site-manager",
        "custom",
        "",
      ]),
      customDeliveryRequest: z.string().trim().max(100),
      paymentMethod: z.enum(["card", "bank-transfer"]),
      depositorName: z.string().trim().max(30),
      agreedToOrder: z.boolean(),
    })
    .superRefine((values, context) => {
      if (hasDeliveryItems) {
        if (!/^\d{5}$/.test(values.postalCode.replace(/\D/g, ""))) {
          context.addIssue({
            code: "custom",
            path: ["postalCode"],
            message: "우편번호 5자리를 입력해 주세요.",
          });
        }
        if (!values.address) {
          context.addIssue({
            code: "custom",
            path: ["address"],
            message: "주소를 입력해 주세요.",
          });
        }
        if (!values.addressDetail) {
          context.addIssue({
            code: "custom",
            path: ["addressDetail"],
            message: "상세주소를 입력해 주세요.",
          });
        }
      }
      if (
        values.deliveryRequest === "custom" &&
        !values.customDeliveryRequest
      ) {
        context.addIssue({
          code: "custom",
          path: ["customDeliveryRequest"],
          message: "배송 요청사항을 입력해 주세요.",
        });
      }
      if (
        values.paymentMethod === "bank-transfer" &&
        values.depositorName.trim().length < 2
      ) {
        context.addIssue({
          code: "custom",
          path: ["depositorName"],
          message: "입금자명을 2자 이상 입력해 주세요.",
        });
      }
      if (!values.agreedToOrder) {
        context.addIssue({
          code: "custom",
          path: ["agreedToOrder"],
          message: "주문 내용과 결제 조건에 동의해 주세요.",
        });
      }
    });
}

export function normalizeCheckoutValues(
  values: CheckoutFormValues,
): CheckoutFormValues {
  return {
    ...values,
    ordererName: values.ordererName.trim(),
    ordererPhone: values.ordererPhone.replace(/\D/g, ""),
    ordererEmail: values.ordererEmail.trim().toLowerCase(),
    recipientName: values.recipientName.trim(),
    recipientPhone: values.recipientPhone.replace(/\D/g, ""),
    postalCode: values.postalCode.replace(/\D/g, ""),
    address: values.address.trim(),
    addressDetail: values.addressDetail.trim(),
    customDeliveryRequest: values.customDeliveryRequest.trim(),
    depositorName: values.depositorName.trim(),
  };
}
