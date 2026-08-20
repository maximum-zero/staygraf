import { beforeEach, describe, expect, it } from "vitest";
import {
  ORDER_EXPIRY_MS,
  useOrderStore,
  type OrderSnapshot,
} from "./order-store";

const order = {
  id: "order-1",
  draftId: "draft-1",
  orderNumber: "SG-20260819-0000",
  status: "paid",
  paymentMethod: "card",
  orderer: {
    name: "김스테이",
    phone: "01012345678",
    email: "demo@staygraf.kr",
  },
  recipient: {
    name: "김스테이",
    phone: "01012345678",
    postalCode: "",
    address: "",
    addressDetail: "",
    deliveryRequest: "배송 전 연락 바랍니다.",
  },
  items: [],
  shippingGroups: [],
  productTotalIncludingVat: 29_000,
  prepaidShippingTotal: 0,
  totalPayment: 29_000,
  hasCollectShipping: false,
  depositorName: null,
  bankAccount: null,
  depositDeadline: null,
  createdAt: 1_000,
  expiresAt: 1_000 + ORDER_EXPIRY_MS,
} satisfies OrderSnapshot;

describe("order store", () => {
  beforeEach(() => useOrderStore.setState({ orders: [] }));

  it("같은 주문 ID를 중복 저장하지 않는다", () => {
    useOrderStore.getState().addOrder(order);
    useOrderStore.getState().addOrder(order);
    expect(useOrderStore.getState().orders).toHaveLength(1);
  });

  it("7일이 지난 주문을 제거한다", () => {
    useOrderStore.getState().addOrder(order);
    useOrderStore.getState().clearExpired(order.expiresAt + 1);
    expect(useOrderStore.getState().orders).toHaveLength(0);
  });
});
