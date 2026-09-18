import type { IpcMain } from "electron";
import type { RuntimeConfig } from "../runtime-config";
import { getDashboardAnalytics } from "./dashboard";

export function registerDashboardIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig,
): void {
  ipcMain.handle("dashboard:analytics", () => getDashboardAnalytics(config));
}
