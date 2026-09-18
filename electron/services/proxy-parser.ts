import type { ProxyCredential } from "./proxy-secrets";

export type ProxyProtocol = "http" | "https" | "socks4" | "socks5";

export interface ParsedProxy {
  host: string;
  port: number;
  credential: ProxyCredential | null;
}

export function parseProxyEndpoint(value: string): ParsedProxy {
  const input = value.trim();
  if (!input) throw new Error("Proxy endpoint is empty.");

  const parts = input.split(":");
  let host: string;
  let portText: string;
  let credential: ProxyCredential | null = null;

  if (input.startsWith("[") && input.includes("]:")) {
    const separator = input.indexOf("]:");
    host = input.slice(1, separator);
    const rest = input.slice(separator + 2).split(":");
    portText = rest[0] ?? "";
    if (rest.length >= 3) {
      credential = {
        username: rest[1] ?? "",
        password: rest.slice(2).join(":"),
      };
    }
  } else {
    host = parts[0] ?? "";
    portText = parts[1] ?? "";
    if (parts.length >= 4) {
      credential = {
        username: parts[2] ?? "",
        password: parts.slice(3).join(":"),
      };
    }
  }

  const port = Number(portText);
  if (!host || !Number.isInteger(port) || port < 1 || port > 65535) {
    throw new Error(`Invalid proxy endpoint: ${value}`);
  }
  if (credential && (!credential.username || !credential.password)) {
    throw new Error(`Invalid proxy credential format: ${value}`);
  }

  return { host, port, credential };
}

export function parseBulkProxies(
  value: string,
  protocol: ProxyProtocol,
): Array<ParsedProxy & { protocol: ProxyProtocol; source: string }> {
  const rows = value
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);
  if (rows.length === 0) throw new Error("At least one proxy endpoint is required.");

  return rows.map((source) => ({
    ...parseProxyEndpoint(source),
    protocol,
    source,
  }));
}
