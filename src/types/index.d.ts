declare global {
  interface Window {
    electronAPI?: ElectronAPI;
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
