import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import { enforceRateLimit } from "../security/rate-limit";
import {
  cancelBrowserJob,
  createBrowserJob,
  listBrowserJobs,
} from "./browser-jobs";

const createInput = z.object({
  profileId: z.string().uuid(),
  url: z.string().url(),
});
const idInput = z.object({ id: z.string().uuid() });

export function registerBrowserJobsIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig
): void {
  ipcMain.handle("browser-jobs:list", () => listBrowserJobs(config));
  ipcMain.handle("browser-jobs:create", (_event, input: unknown) => {
    const values = createInput.parse(input);
    enforceRateLimit(`browser-job:${_event.sender.id}`, 30, 60_000);
    return createBrowserJob(config, values.profileId, values.url);
  });
  ipcMain.handle("browser-jobs:cancel", async (_event, input: unknown) => {
    const values = idInput.parse(input);
    await cancelBrowserJob(config, values.id);
    return { success: true };
  });
}
