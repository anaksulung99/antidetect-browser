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
