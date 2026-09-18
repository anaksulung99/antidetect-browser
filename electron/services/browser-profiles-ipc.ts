import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import {
    createBrowserProfile,
    deleteBrowserProfile,
    getBrowserProfileOptions,
    listBrowserProfiles,
    updateBrowserProfile,
} from "./browser-profiles";

const profileInput = z.object({
  name: z.string().trim().min(1).max(120),
  engine: z.enum(["chromium", "firefox", "webkit"]),
  fingerprintId: z.string().uuid(),
  proxyEnabled: z.boolean(),
  proxyId: z.string().uuid().nullable(),
  languageMode: z.enum(["proxy", "custom"]),
  language: z.string().trim().min(2).max(32),
  timezone: z.string().trim().max(80).nullable(),
});

const profileIdInput = z.object({
  profileId: z.string().uuid(),
});

export function registerBrowserProfilesIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig,
): void {
  ipcMain.handle("browser-profiles:list", () => listBrowserProfiles(config));
  ipcMain.handle("browser-profiles:options", () =>
    getBrowserProfileOptions(config),
  );
  ipcMain.handle("browser-profiles:create", async (_event, input: unknown) => {
    await createBrowserProfile(config, profileInput.parse(input));
    return { success: true };
  });
  ipcMain.handle("browser-profiles:update", async (_event, input: unknown) => {
    const values = z
      .object({ profileId: z.string().uuid(), data: profileInput })
      .parse(input);
    await updateBrowserProfile(config, values.profileId, values.data);
    return { success: true };
  });
  ipcMain.handle("browser-profiles:delete", async (_event, input: unknown) => {
    const values = profileIdInput.parse(input);
    await deleteBrowserProfile(config, values.profileId);
    return { success: true };
  });
}
