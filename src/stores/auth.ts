import { defineStore } from "pinia";

export type AuthRole = "admin" | "user";
export type AuthStatus = "active" | "inactive" | "invited" | "suspended";

export interface AuthUser {
  id: string;
  email: string;
  name: string;
  role: AuthRole;
  status: AuthStatus;
  lastLoginAt: Date | null;
}

interface AuthState {
  user: AuthUser | null;
  initialized: boolean;
  loading: boolean;
}

export const useAuthStore = defineStore("auth", {
  state: (): AuthState => ({
    user: null,
    initialized: false,
    loading: false,
  }),
  getters: {
    isAuthenticated: (state) => state.user?.status === "active",
    isAdmin: (state) => state.user?.role === "admin" && state.user.status === "active",
  },
  actions: {
    async initialize(): Promise<void> {
      if (this.initialized || this.loading) return;
      this.loading = true;
      try {
        this.user = await window.appRuntime.auth.getCurrentUser();
      } finally {
        this.initialized = true;
        this.loading = false;
      }
    },
    async login(email: string, password: string): Promise<void> {
      this.loading = true;
      try {
        const result = await window.appRuntime.auth.login({ email, password });
        this.user = result.user;
        this.initialized = true;
      } finally {
        this.loading = false;
      }
    },
    async logout(): Promise<void> {
      await window.appRuntime.auth.logout();
      this.user = null;
      this.initialized = true;
    },
  },
});
