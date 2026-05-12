import { create } from "zustand";
import type { AuthUser } from "@/lib/auth-api";

type AuthState = {
  user: AuthUser | null;
  hydrated: boolean;
  setHydrated: (v: boolean) => void;
  setUser: (user: AuthUser | null) => void;
  clearUser: () => void;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  hydrated: false,
  setHydrated: (hydrated) => set({ hydrated }),
  setUser: (user) => set({ user }),
  clearUser: () => set({ user: null }),
}));
