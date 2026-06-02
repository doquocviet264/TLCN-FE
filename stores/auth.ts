// /stores/auth.ts
import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

interface UserInfo {
  id: string;
  fullName: string;
  username?: string;
  email: string;
  phone: string;
  avatar: string;
  points: number;
  memberStatus: string;
}

interface AuthStore {
  token: { accessToken: string | null; refreshToken: string | null };
  userId: string | null;
  user: UserInfo | null;
  setUserId: (id: string | null) => void;
  setToken: (t: { accessToken: string | null; refreshToken: string | null }) => void;
  setTokenPartial: (t: Partial<{ accessToken: string | null; refreshToken: string | null }>) => void;
  setUser: (user: UserInfo | null) => void;
  resetAuth: () => void;
}

export const useAuthStore = create(
  persist<AuthStore>(
    (set, get) => ({
      token: { accessToken: null, refreshToken: null },
      userId: null,
      user: null,

      setUserId: (id) => set({ userId: id }),

      setToken: (t) => set({ token: t }),

      setTokenPartial: (t) =>
        set({ token: { ...get().token, ...t } }),

      setUser: (user) => set({ user }),

      resetAuth: () =>
        set({ 
          token: { accessToken: null, refreshToken: null }, 
          userId: null,
          user: null 
        }),
    }),
    { name: "auth", storage: createJSONStorage(() => localStorage) }
  )
);
