import { contextBridge, ipcRenderer } from "electron";

contextBridge.exposeInMainWorld("appRuntime", {
  getInfo: () => ipcRenderer.invoke("app-runtime:get-info"),
  getDatabaseStatus: () => ipcRenderer.invoke("database:get-status"),
  auth: {
    getCurrentUser: () => ipcRenderer.invoke("auth:get-current-user"),
    login: (input: { email: string; password: string }) =>
      ipcRenderer.invoke("auth:login", input),
    logout: () => ipcRenderer.invoke("auth:logout"),
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
