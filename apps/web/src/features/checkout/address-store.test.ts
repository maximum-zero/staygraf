import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  ADDRESS_EXPIRY_MS,
  sortMemberAddresses,
  useAddressStore,
} from "./address-store";

const address = (label: string, isDefault = false) => ({
  label,
  recipientName: "김스테이",
  recipientPhone: "01012345678",
  postalCode: "06236",
  roadAddress: "서울특별시 강남구 테헤란로 1",
  addressDetail: `${label} 101호`,
  isDefault,
});

describe("address store", () => {
  beforeEach(() => {
    useAddressStore.setState({ addresses: [], expiresAt: null });
    vi.restoreAllMocks();
  });

  it("첫 배송지를 같은 회원의 기본 배송지로 저장한다", () => {
    const saved = useAddressStore
      .getState()
      .addAddress("member-a", address("집"));
    expect(saved.isDefault).toBe(true);
    expect(
      sortMemberAddresses(useAddressStore.getState().addresses, "member-a"),
    ).toHaveLength(1);
  });

  it("회원별 주소를 분리하고 기본 배송지는 하나만 유지한다", () => {
    const first = useAddressStore
      .getState()
      .addAddress("member-a", address("집"));
    const second = useAddressStore
      .getState()
      .addAddress("member-a", address("현장", true));
    useAddressStore.getState().addAddress("member-b", address("회사"));

    const memberA = sortMemberAddresses(
      useAddressStore.getState().addresses,
      "member-a",
    );
    expect(memberA.map((item) => item.id)).toEqual([second.id, first.id]);
    expect(memberA.filter((item) => item.isDefault)).toHaveLength(1);
    expect(
      sortMemberAddresses(useAddressStore.getState().addresses, "member-b"),
    ).toHaveLength(1);
  });

  it("기본 배송지 삭제 후 남은 주소를 기본으로 승계하고 복구한다", () => {
    const first = useAddressStore
      .getState()
      .addAddress("member-a", address("집"));
    const second = useAddressStore
      .getState()
      .addAddress("member-a", address("현장", true));
    const removed = useAddressStore
      .getState()
      .removeAddress("member-a", second.id);

    expect(
      sortMemberAddresses(useAddressStore.getState().addresses, "member-a")[0]
        ?.id,
    ).toBe(first.id);
    expect(
      sortMemberAddresses(useAddressStore.getState().addresses, "member-a")[0]
        ?.isDefault,
    ).toBe(true);

    expect(removed).not.toBeNull();
    if (removed) useAddressStore.getState().restoreAddress(removed);
    expect(
      sortMemberAddresses(useAddressStore.getState().addresses, "member-a")[0]
        ?.id,
    ).toBe(second.id);
  });

  it("30일이 지난 주소록을 비운다", () => {
    useAddressStore.getState().addAddress("member-a", address("집"));
    useAddressStore.setState({ expiresAt: 1_000 + ADDRESS_EXPIRY_MS });
    useAddressStore.getState().clearExpired(1_000 + ADDRESS_EXPIRY_MS + 1);
    expect(useAddressStore.getState().addresses).toEqual([]);
  });
});
