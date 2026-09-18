import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import {
    bulkCheckProxies,
    checkProxy,
    createBulkProxies,
    createProxy,
    deleteProxy,
    listProxies,
    updateProxy,
} from "./proxies";

const credential = z
  .object({ username: z.string(), password: z.string() })
  .nullable()
  .optional();
const proxyInput = z.object({
  name: z.string().trim().min(1).max(120),
  protocol: z.enum(["http", "https", "socks4", "socks5"]),
  endpoint: z.string().trim().min(3),
  credential,
});
const bulkInput = z.object({
  protocol: z.enum(["http", "https", "socks4", "socks5"]),
  endpoints: z.string().trim().min(3),
  namePrefix: z.string().trim().max(80).optional(),
});
const idInput = z.object({ id: z.string().uuid() });
const bulkCheckInput = z.object({ ids: z.array(z.string().uuid()).min(1).max(100) });

export function registerProxiesIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig,
): void {
  ipcMain.handle("proxies:list", () => listProxies(config));
  ipcMain.handle("proxies:create", async (_event, input: unknown) => {
    await createProxy(config, proxyInput.parse(input));
    return { success: true };
  });
  ipcMain.handle("proxies:create-bulk", async (_event, input: unknown) =>
    createBulkProxies(config, bulkInput.parse(input)),
  );
  ipcMain.handle("proxies:update", async (_event, input: unknown) => {
    const values = z.object({ id: z.string().uuid(), data: proxyInput }).parse(input);
    await updateProxy(config, values.id, values.data);
    return { success: true };
  });
  ipcMain.handle("proxies:delete", async (_event, input: unknown) => {
    const values = idInput.parse(input);
    await deleteProxy(config, values.id);
    return { success: true };
  });
  ipcMain.handle("proxies:check", async (_event, input: unknown) => {
    const values = idInput.parse(input);
    return checkProxy(config, values.id);
  });
  ipcMain.handle("proxies:check-bulk", async (_event, input: unknown) => {
    const values = bulkCheckInput.parse(input);
    return bulkCheckProxies(config, values.ids);
  });
}
