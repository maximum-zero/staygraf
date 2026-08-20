"use client";

import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";

export const AUTH_STORAGE_KEY = "staygraf-auth";
export const DEMO_EMAIL = "demo@staygraf.kr";
export const DEMO_PASSWORD = "staygraf1234";

export type MockMember = {
  id: string;
  name: string;
  email: string;
  phone: string;
};

type AuthState = {
  member: MockMember | null;
  authenticatedAt: number | null;
  hydrated: boolean;
  setHydrated: (hydrated: boolean) => void;
  login: (email: string, password: string) => boolean;
  logout: () => void;
};

export function sanitizeReturnTo(value: string | null | undefined) {
  if (!value || !value.startsWith("/") || value.startsWith("//")) return "/";
  if (value.includes("\\") || /^[a-z][a-z\d+.-]*:/i.test(value)) return "/";
  return value;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      authenticatedAt: null,
      hydrated: false,
      setHydrated: (hydrated) => set({ hydrated }),
      login: (email, password) => {
        const normalizedEmail = email.trim().toLowerCase();
        if (normalizedEmail !== DEMO_EMAIL || password !== DEMO_PASSWORD) {
          return false;
        }
        set({
          member: {
            id: "demo-member",
            name: "김스테이",
            email: DEMO_EMAIL,
            phone: "01012345678",
          },
          authenticatedAt: Date.now(),
        });
        return true;
      },
      logout: () => set({ member: null, authenticatedAt: null }),
    }),
    {
      name: AUTH_STORAGE_KEY,
      version: 1,
      storage: createJSONStorage(() => sessionStorage),
      partialize: (state) => ({
        member: state.member,
        authenticatedAt: state.authenticatedAt,
      }),
      onRehydrateStorage: () => (state) => state?.setHydrated(true),
    },
  ),
);
