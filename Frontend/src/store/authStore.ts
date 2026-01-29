import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthState, UserData } from '../types/auth';

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      isLoggedIn: false,
      setAuth: (user: UserData) => set({ user, isLoggedIn: true }),
      clearAuth: () => {
        set({ user: null, isLoggedIn: false });
        localStorage.removeItem('auth-storage');
        sessionStorage.removeItem('auth-storage');
      },
    }),
    {
      name: 'auth-storage',
      storage: {
        getItem: (name) => {
          const item = localStorage.getItem(name) || sessionStorage.getItem(name);
          return item ? JSON.parse(item) : null;
        },
        setItem: (name, value) => {
          const isRemembered = !sessionStorage.getItem(name);
          if (isRemembered) {
            localStorage.setItem(name, JSON.stringify(value));
          } else {
            sessionStorage.setItem(name, JSON.stringify(value));
          }
        },
        removeItem: (name) => {
          localStorage.removeItem(name);
          sessionStorage.removeItem(name);
        },
      },
    },
  ),
);
