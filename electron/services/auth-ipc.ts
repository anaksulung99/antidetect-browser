import type { IpcMain } from "electron";
import { z } from "zod";
import type { RuntimeConfig } from "../runtime-config";
import { enforceRateLimit } from "../security/rate-limit";
import {
  acceptInvitation,
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

const acceptInvitationInput = z.object({
  token: z.string().min(16),
  name: z.string().trim().min(1).max(120),
  password: z.string().min(8),
});

export function registerAuthIpc(ipcMain: IpcMain, config: RuntimeConfig): void {
  ipcMain.handle("auth:get-current-user", () => getActiveUser());

  ipcMain.handle("auth:login", async (_event, input: unknown) => {
    const values = loginInput.parse(input);
    enforceRateLimit(
      `login:${_event.sender.id}:${values.email.toLowerCase()}`,
      5,
      60_000
    );
    return login(config, values.email, values.password);
  });

  ipcMain.handle("auth:logout", () => logout(config));

  ipcMain.handle("auth:accept-invitation", async (_event, input: unknown) => {
    const values = acceptInvitationInput.parse(input);
    enforceRateLimit(`accept-invitation:${_event.sender.id}`, 10, 60_000);
    await acceptInvitation(config, values.token, values.name, values.password);
    return { success: true };
  });

  ipcMain.handle("auth:invite-user", async (_event, input: unknown) => {
    const values = inviteInput.parse(input);
    enforceRateLimit(`invite:${_event.sender.id}`, 20, 60 * 60_000);
    return inviteUser(config, values.email, values.role);
  });

  ipcMain.handle("auth:list-users", () => listUsers(config));

  ipcMain.handle("auth:set-user-status", async (_event, input: unknown) => {
    const values = userStatusInput.parse(input);
    await setUserStatus(config, values.userId, values.status);
    return { success: true };
  });
}
