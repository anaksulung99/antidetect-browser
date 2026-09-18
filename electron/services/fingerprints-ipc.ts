import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import {
    createFingerprint,
    deleteFingerprint,
    getFingerprint,
    getFingerprintCapabilities,
    listFingerprints,
    updateFingerprintStatus,
} from "./fingerprints";

const fingerprintInput = z.object({
  name: z.string().trim().min(1).max(120),
  status: z.enum(["active", "inactive"]),
  deviceType: z.enum(["desktop", "mobile"]),
  osName: z.enum(["windows", "macos", "linux", "android", "ios"]),
  osVersion: z.string().trim().min(1).max(32),
  browserName: z.string().trim().min(1).max(64),
  browserVersion: z.string().trim().min(1).max(32),
  locale: z.string().trim().min(2).max(32),
  seed: z.string().trim().max(120).optional(),
});

const idInput = z.object({ id: z.string().uuid() });
const statusInput = idInput.extend({ status: z.enum(["active", "inactive"]) });

export function registerFingerprintsIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig,
): void {
  ipcMain.handle("fingerprints:list", () => listFingerprints(config));
  ipcMain.handle("fingerprints:capabilities", () =>
    getFingerprintCapabilities(),
  );
  ipcMain.handle("fingerprints:get", async (_event, input: unknown) => {
    const values = idInput.parse(input);
    return getFingerprint(config, values.id);
  });
  ipcMain.handle("fingerprints:create", async (_event, input: unknown) => {
    await createFingerprint(config, fingerprintInput.parse(input));
    return { success: true };
  });
  ipcMain.handle("fingerprints:set-status", async (_event, input: unknown) => {
    const values = statusInput.parse(input);
    await updateFingerprintStatus(config, values.id, values.status);
    return { success: true };
  });
  ipcMain.handle("fingerprints:delete", async (_event, input: unknown) => {
    const values = idInput.parse(input);
    await deleteFingerprint(config, values.id);
    return { success: true };
  });
}
