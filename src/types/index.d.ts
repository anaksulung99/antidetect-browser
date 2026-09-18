declare global {
  interface Window {
    electronAPI?: ElectronAPI;
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
      dashboard: {
        analytics(): Promise<unknown>;
      };
      browserJobs: {
        list(): Promise<unknown[]>;
        create(input: {
          profileId: string;
          url: string;
        }): Promise<{ id: string; backend: "cloudamqp" | "local" }>;
        cancel(input: { id: string }): Promise<{ success: boolean }>;
      };
      browserRuntime: {
        start(input: {
          profileId: string;
        }): Promise<{ profileId: string; status: "running" }>;
        stop(input: {
          profileId: string;
        }): Promise<{ profileId: string; status: "stopped" }>;
        restart(input: {
          profileId: string;
        }): Promise<{ profileId: string; status: "running" }>;
        statuses(): Promise<string[]>;
        diagnostics(input: { profileId: string }): Promise<unknown>;
      };
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
  interface ElectronAPI {
    checkConnection: () => boolean;
    getNetworkInfo: () => Promise<{
      online: boolean;
      interfaces: NodeJS.Dict<os.NetworkInterfaceInfo[]>;
    }>;
  }
  interface RetryOptions {
    maxRetries?: number;
    delayMs?: number;
    backoffMultiplier?: number;
  }
  interface NetworkInfo {
    online: boolean;
    type: "connected" | "disconnected" | "unknown";
    timestamp: string;
    networkInterfaces?: Array<{
      name: string;
      address: string;
      mac: string;
    }>;
  }

  interface AppNavMain {
    title: string;
    url: string;
    icon?: string;
    isActive?: boolean;
    roles?: AppRole[];
    children?: {
      title: string;
      url: string;
    }[];
  }
  interface PaginateMeta {
    total: number;
    page: number;
    limit: number;
    offset: number;
    totalPages: number;
    has_more: boolean;
  }
}

export {};
