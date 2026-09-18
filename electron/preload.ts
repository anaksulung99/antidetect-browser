import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("appRuntime", {
  getInfo: () => ipcRenderer.invoke("app-runtime:get-info"),
  getDatabaseStatus: () => ipcRenderer.invoke("database:get-status"),
  proxies: {
    list: () => ipcRenderer.invoke("proxies:list"),
    create: (input: unknown) => ipcRenderer.invoke("proxies:create", input),
    createBulk: (input: unknown) =>
      ipcRenderer.invoke("proxies:create-bulk", input),
    update: (input: unknown) => ipcRenderer.invoke("proxies:update", input),
    delete: (input: { id: string }) =>
      ipcRenderer.invoke("proxies:delete", input),
    check: (input: { id: string }) =>
      ipcRenderer.invoke("proxies:check", input),
    checkBulk: (input: { ids: string[] }) =>
      ipcRenderer.invoke("proxies:check-bulk", input),
  },
  fingerprints: {
    list: () => ipcRenderer.invoke("fingerprints:list"),
    capabilities: () => ipcRenderer.invoke("fingerprints:capabilities"),
    get: (input: { id: string }) =>
      ipcRenderer.invoke("fingerprints:get", input),
    create: (input: unknown) =>
      ipcRenderer.invoke("fingerprints:create", input),
    setStatus: (input: { id: string; status: "active" | "inactive" }) =>
      ipcRenderer.invoke("fingerprints:set-status", input),
    delete: (input: { id: string }) =>
      ipcRenderer.invoke("fingerprints:delete", input),
  },
  browserProfiles: {
    list: () => ipcRenderer.invoke("browser-profiles:list"),
    options: () => ipcRenderer.invoke("browser-profiles:options"),
    create: (input: unknown) =>
      ipcRenderer.invoke("browser-profiles:create", input),
    update: (input: unknown) =>
      ipcRenderer.invoke("browser-profiles:update", input),
    delete: (input: { profileId: string }) =>
      ipcRenderer.invoke("browser-profiles:delete", input),
  },
  auth: {
    getCurrentUser: () => ipcRenderer.invoke("auth:get-current-user"),
    login: (input: { email: string; password: string }) =>
      ipcRenderer.invoke("auth:login", input),
    logout: () => ipcRenderer.invoke("auth:logout"),
    acceptInvitation: (input: {
      token: string;
      name: string;
      password: string;
    }) => ipcRenderer.invoke("auth:accept-invitation", input),
    inviteUser: (input: { email: string; role: "admin" | "user" }) =>
      ipcRenderer.invoke("auth:invite-user", input),
    listUsers: () => ipcRenderer.invoke("auth:list-users"),
    setUserStatus: (input: {
      userId: string;
      status: "active" | "inactive" | "suspended";
    }) => ipcRenderer.invoke("auth:set-user-status", input),
  },
  onMainProcessMessage: (callback: (message: string) => void) => {
    const listener = (_event: Electron.IpcRendererEvent, message: string) => {
      callback(message);
    };

    ipcRenderer.on("main-process-message", listener);
    return () => ipcRenderer.removeListener("main-process-message", listener);
  },
});
