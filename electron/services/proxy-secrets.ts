import { safeStorage } from "electron";

export interface ProxyCredential {
  username: string;
  password: string;
}

const PREFIX = "safe-storage:";

export function encryptProxyCredential(
  credential: ProxyCredential | null | undefined,
): string | null {
  if (!credential?.username && !credential?.password) return null;
  if (!safeStorage.isEncryptionAvailable()) {
    throw new Error("OS secure storage is not available for proxy credentials.");
  }

  const payload = JSON.stringify({
    username: credential.username,
    password: credential.password,
  });
  return PREFIX + safeStorage.encryptString(payload).toString("base64");
}

export function decryptProxyCredential(
  value: string | null,
): ProxyCredential | null {
  if (!value) return null;
  if (!value.startsWith(PREFIX) || !safeStorage.isEncryptionAvailable()) {
    throw new Error("Proxy credential cannot be decrypted securely.");
  }

  const encrypted = Buffer.from(value.slice(PREFIX.length), "base64");
  return JSON.parse(safeStorage.decryptString(encrypted)) as ProxyCredential;
}
