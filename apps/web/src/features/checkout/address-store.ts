"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import type { NormalizedShippingAddressInput } from "./address-schema";

export const ADDRESS_STORAGE_KEY = "staygraf-addresses";
export const ADDRESS_EXPIRY_MS = 30 * 24 * 60 * 60 * 1000;

export type ShippingAddress = NormalizedShippingAddressInput & {
  id: string;
  memberId: string;
  createdAt: number;
  updatedAt: number;
};

type AddressState = {
  addresses: ShippingAddress[];
  expiresAt: number | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  addAddress: (
    memberId: string,
    values: NormalizedShippingAddressInput,
  ) => ShippingAddress;
  updateAddress: (
    memberId: string,
    id: string,
    values: NormalizedShippingAddressInput,
  ) => ShippingAddress | null;
  removeAddress: (memberId: string, id: string) => ShippingAddress | null;
  restoreAddress: (address: ShippingAddress) => void;
  setDefaultAddress: (memberId: string, id: string) => void;
  clearExpired: (now?: number) => void;
};

function createAddressId(now: number) {
  return `address-${now}-${Math.random().toString(36).slice(2, 8)}`;
}

function normalizeMemberDefaults(
  addresses: ShippingAddress[],
  memberId: string,
  preferredId?: string,
) {
  const memberAddresses = addresses.filter(
    (item) => item.memberId === memberId,
  );
  if (memberAddresses.length === 0) return addresses;
  const preferred =
    memberAddresses.find((item) => item.id === preferredId) ??
    memberAddresses.find((item) => item.isDefault) ??
    [...memberAddresses].sort((a, b) => b.updatedAt - a.updatedAt)[0];
  return addresses.map((item) =>
    item.memberId === memberId
      ? { ...item, isDefault: item.id === preferred?.id }
      : item,
  );
}

export function sortMemberAddresses(
  addresses: ShippingAddress[],
  memberId: string,
) {
  return addresses
    .filter((item) => item.memberId === memberId)
    .sort(
      (a, b) =>
        Number(b.isDefault) - Number(a.isDefault) || b.updatedAt - a.updatedAt,
    );
}

export const useAddressStore = create<AddressState>()(
  persist(
    (set, get) => ({
      addresses: [],
      expiresAt: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      addAddress: (memberId, values) => {
        const now = Date.now();
        const hasMemberAddress = get().addresses.some(
          (item) => item.memberId === memberId,
        );
        const address: ShippingAddress = {
          ...values,
          id: createAddressId(now),
          memberId,
          isDefault: values.isDefault || !hasMemberAddress,
          createdAt: now,
          updatedAt: now,
        };
        set((state) => {
          const next = address.isDefault
            ? state.addresses.map((item) =>
                item.memberId === memberId
                  ? { ...item, isDefault: false }
                  : item,
              )
            : state.addresses;
          return {
            addresses: [...next, address],
            expiresAt: now + ADDRESS_EXPIRY_MS,
          };
        });
        return address;
      },
      updateAddress: (memberId, id, values) => {
        const current = get().addresses.find(
          (item) => item.id === id && item.memberId === memberId,
        );
        if (!current) return null;
        const now = Date.now();
        const updated: ShippingAddress = {
          ...current,
          ...values,
          isDefault: values.isDefault || current.isDefault,
          updatedAt: now,
        };
        set((state) => {
          const replaced = state.addresses.map((item) => {
            if (item.memberId === memberId && values.isDefault) {
              return item.id === id ? updated : { ...item, isDefault: false };
            }
            return item.id === id ? updated : item;
          });
          return {
            addresses: normalizeMemberDefaults(replaced, memberId),
            expiresAt: now + ADDRESS_EXPIRY_MS,
          };
        });
        return updated;
      },
      removeAddress: (memberId, id) => {
        const removed = get().addresses.find(
          (item) => item.id === id && item.memberId === memberId,
        );
        if (!removed) return null;
        const now = Date.now();
        set((state) => ({
          addresses: normalizeMemberDefaults(
            state.addresses.filter((item) => item.id !== id),
            memberId,
          ),
          expiresAt: now + ADDRESS_EXPIRY_MS,
        }));
        return removed;
      },
      restoreAddress: (address) => {
        const now = Date.now();
        set((state) => {
          const withoutDuplicate = state.addresses.filter(
            (item) => item.id !== address.id,
          );
          const restored = [
            ...withoutDuplicate,
            { ...address, updatedAt: now },
          ];
          return {
            addresses: normalizeMemberDefaults(
              restored,
              address.memberId,
              address.isDefault ? address.id : undefined,
            ),
            expiresAt: now + ADDRESS_EXPIRY_MS,
          };
        });
      },
      setDefaultAddress: (memberId, id) => {
        if (
          !get().addresses.some(
            (item) => item.id === id && item.memberId === memberId,
          )
        ) {
          return;
        }
        const now = Date.now();
        set((state) => ({
          addresses: state.addresses.map((item) =>
            item.memberId === memberId
              ? {
                  ...item,
                  isDefault: item.id === id,
                  updatedAt: item.id === id ? now : item.updatedAt,
                }
              : item,
          ),
          expiresAt: now + ADDRESS_EXPIRY_MS,
        }));
      },
      clearExpired: (now = Date.now()) => {
        const expiresAt = get().expiresAt;
        if (expiresAt !== null && expiresAt <= now) {
          set({ addresses: [], expiresAt: null });
        }
      },
    }),
    {
      name: ADDRESS_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        addresses: state.addresses,
        expiresAt: state.expiresAt,
      }),
      onRehydrateStorage: () => (state) => {
        state?.clearExpired();
        state?.setHydrated(true);
      },
    },
  ),
);
