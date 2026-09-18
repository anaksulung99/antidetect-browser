/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly NODE_ENV: string;
  readonly APP_NAME: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}

interface Window {
  appRuntime: {
    getInfo(): Promise<{
      appMode: "desktop";
      databaseMode: "neon" | "embedded";
      browserBinariesPath: string;
      hasNeonDatabase: boolean;
      hasCloudAmqp: boolean;
      hasUpstashRedis: boolean;
    }>;
    getDatabaseStatus(): Promise<{
      mode: "neon" | "embedded";
      configured: boolean;
      reachable: boolean;
      message: string;
    }>;
    proxies: {
      list(): Promise<unknown[]>;
      create(input: unknown): Promise<{ success: boolean }>;
      createBulk(input: unknown): Promise<{ created: number }>;
      update(input: unknown): Promise<{ success: boolean }>;
      delete(input: { id: string }): Promise<{ success: boolean }>;
      check(input: { id: string }): Promise<unknown>;
      checkBulk(input: { ids: string[] }): Promise<unknown[]>;
    };
    fingerprints: {
      list(): Promise<unknown[]>;
      capabilities(): Promise<unknown>;
      get(input: { id: string }): Promise<unknown>;
      create(input: unknown): Promise<{ success: boolean }>;
      setStatus(input: {
        id: string;
        status: "active" | "inactive";
      }): Promise<{ success: boolean }>;
      delete(input: { id: string }): Promise<{ success: boolean }>;
    };
    browserProfiles: {
      list(): Promise<unknown[]>;
      options(): Promise<{
        fingerprints: unknown[];
        proxies: unknown[];
      }>;
      create(input: unknown): Promise<{ success: boolean }>;
      update(input: unknown): Promise<{ success: boolean }>;
      delete(input: { profileId: string }): Promise<{ success: boolean }>;
    };
    auth: {
      getCurrentUser(): Promise<{
        id: string;
        email: string;
        name: string;
        role: "admin" | "user";
        status: "active" | "inactive" | "invited" | "suspended";
        lastLoginAt: Date | null;
      } | null>;
      login(input: { email: string; password: string }): Promise<{
        user: {
          id: string;
          email: string;
          name: string;
          role: "admin" | "user";
          status: "active" | "inactive" | "invited" | "suspended";
          lastLoginAt: Date | null;
        };
      }>;
      logout(): Promise<void>;
      acceptInvitation(input: {
        token: string;
        name: string;
        password: string;
      }): Promise<{ success: boolean }>;
      inviteUser(input: { email: string; role: "admin" | "user" }): Promise<{
        email: string;
        role: "admin" | "user";
        token: string;
        expiresAt: Date;
      }>;
      listUsers(): Promise<unknown[]>;
      setUserStatus(input: {
        userId: string;
        status: "active" | "inactive" | "suspended";
      }): Promise<{ success: boolean }>;
    };
    onMainProcessMessage(callback: (message: string) => void): () => void;
  };
}
