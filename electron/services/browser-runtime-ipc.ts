import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import {
  getRuntimeStatuses,
  inspectBrowser,
  restartBrowser,
  startBrowser,
  stopBrowser,
} from "./browser-runtime";

const profileInput = z.object({ profileId: z.string().uuid() });

export function registerBrowserRuntimeIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig
): void {
  ipcMain.handle("browser-runtime:start", async (_event, input: unknown) => {
    const values = profileInput.parse(input);
    return startBrowser(config, values.profileId);
  });
  ipcMain.handle("browser-runtime:stop", async (_event, input: unknown) => {
    const values = profileInput.parse(input);
    return stopBrowser(config, values.profileId);
  });
  ipcMain.handle("browser-runtime:restart", async (_event, input: unknown) => {
    const values = profileInput.parse(input);
    return restartBrowser(config, values.profileId);
  });
  ipcMain.handle("browser-runtime:statuses", () => getRuntimeStatuses(config));
  ipcMain.handle(
    "browser-runtime:diagnostics",
    async (_event, input: unknown) => {
      const values = profileInput.parse(input);
      return inspectBrowser(config, values.profileId);
    }
  );
}
