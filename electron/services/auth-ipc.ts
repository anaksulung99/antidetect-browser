import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import {
    getActiveUser,
    inviteUser,
    listUsers,
    login,
    logout,
    setUserStatus,
} from "./auth";

const loginInput = z.object({
  email: z.string().trim().email(),
  password: z.string().min(1),
});

const inviteInput = z.object({
  email: z.string().trim().email(),
  role: z.enum(["admin", "user"]),
});

const userStatusInput = z.object({
  userId: z.string().uuid(),
  status: z.enum(["active", "inactive", "suspended"]),
});

export function registerAuthIpc(
  ipcMain: IpcMain,
  config: RuntimeConfig,
): void {
  ipcMain.handle("auth:get-current-user", () => getActiveUser());

  ipcMain.handle("auth:login", async (_event, input: unknown) => {
    const values = loginInput.parse(input);
    return login(config, values.email, values.password);
  });

  ipcMain.handle("auth:logout", () => logout(config));

  ipcMain.handle("auth:invite-user", async (_event, input: unknown) => {
    const values = inviteInput.parse(input);
    return inviteUser(config, values.email, values.role);
  });

  ipcMain.handle("auth:list-users", () => listUsers(config));

  ipcMain.handle("auth:set-user-status", async (_event, input: unknown) => {
    const values = userStatusInput.parse(input);
    await setUserStatus(config, values.userId, values.status);
    return { success: true };
  });
}
