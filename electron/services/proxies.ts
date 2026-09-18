import { and, asc, eq, isNull } from "drizzle-orm";
import { chromium } from "playwright";
import { proxies, proxyChecks, type Proxy } from "../db/schema";
import { findBrowserExecutable, type RuntimeConfig } from "../runtime-config";
import { requireActiveUser, type SafeUser } from "./auth";
import { getDatabase } from "./database";
import {
  parseBulkProxies,
  parseProxyEndpoint,
  type ProxyProtocol,
} from "./proxy-parser";
import {
  decryptProxyCredential,
  encryptProxyCredential,
  type ProxyCredential,
} from "./proxy-secrets";

export interface ProxyInput {
  name: string;
  protocol: ProxyProtocol;
  endpoint: string;
  credential?: ProxyCredential | null;
}

export interface BulkProxyInput {
  protocol: ProxyProtocol;
  endpoints: string;
  namePrefix?: string;
}

function scope(user: SafeUser) {
  return user.role === "admin"
    ? isNull(proxies.deletedAt)
    : and(eq(proxies.ownerId, user.id), isNull(proxies.deletedAt));
}

function safeProxy(proxy: Proxy) {
  return {
    id: proxy.id,
    ownerId: proxy.ownerId,
    name: proxy.name,
    protocol: proxy.protocol,
    host: proxy.host,
    port: proxy.port,
    hasCredential: Boolean(proxy.credentialRef),
    status: proxy.status,
    country: proxy.country,
    city: proxy.city,
    isp: proxy.isp,
    timezone: proxy.timezone,
    detectedIp: proxy.detectedIp,
    latencyMs: proxy.latencyMs,
    lastCheckedAt: proxy.lastCheckedAt,
    checkError: proxy.checkError,
    createdAt: proxy.createdAt,
    updatedAt: proxy.updatedAt,
  };
}

async function getOwnedProxy(config: RuntimeConfig, id: string) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select()
    .from(proxies)
    .where(and(eq(proxies.id, id), scope(user)))
    .limit(1);
  if (!result[0]) throw new Error("Proxy was not found.");
  return { db, user, proxy: result[0] };
}

export async function listProxies(config: RuntimeConfig) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select()
    .from(proxies)
    .where(scope(user))
    .orderBy(asc(proxies.createdAt));
  return result.map(safeProxy);
}

export async function createProxy(
  config: RuntimeConfig,
  input: ProxyInput
): Promise<void> {
  const user = requireActiveUser();
  const parsed = parseProxyEndpoint(input.endpoint);
  const credential = input.credential ?? parsed.credential;
  const db = getDatabase(config);
  await db.insert(proxies).values({
    ownerId: user.id,
    name: input.name.trim(),
    protocol: input.protocol,
    host: parsed.host,
    port: parsed.port,
    credentialRef: encryptProxyCredential(credential),
    status: "active",
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

export async function createBulkProxies(
  config: RuntimeConfig,
  input: BulkProxyInput
): Promise<{ created: number }> {
  const user = requireActiveUser();
  const parsed = parseBulkProxies(input.endpoints, input.protocol);
  const db = getDatabase(config);
  const prefix = input.namePrefix?.trim() || "Proxy";
  await db.insert(proxies).values(
    parsed.map((item) => ({
      ownerId: user.id,
      name: `${prefix} ${item.host}:${item.port}`,
      protocol: item.protocol,
      host: item.host,
      port: item.port,
      credentialRef: encryptProxyCredential(item.credential),
      status: "active" as const,
      createdAt: new Date(),
      updatedAt: new Date(),
    }))
  );
  return { created: parsed.length };
}

export async function updateProxy(
  config: RuntimeConfig,
  id: string,
  input: ProxyInput
): Promise<void> {
  const { db, proxy } = await getOwnedProxy(config, id);
  const parsed = parseProxyEndpoint(input.endpoint);
  const credential = input.credential ?? parsed.credential;
  await db
    .update(proxies)
    .set({
      name: input.name.trim(),
      protocol: input.protocol,
      host: parsed.host,
      port: parsed.port,
      credentialRef: credential
        ? encryptProxyCredential(credential)
        : proxy.credentialRef,
      updatedAt: new Date(),
    })
    .where(eq(proxies.id, proxy.id));
}

export async function deleteProxy(
  config: RuntimeConfig,
  id: string
): Promise<void> {
  const { db, proxy } = await getOwnedProxy(config, id);
  await db
    .update(proxies)
    .set({ deletedAt: new Date(), status: "inactive", updatedAt: new Date() })
    .where(eq(proxies.id, proxy.id));
}

export async function checkProxy(config: RuntimeConfig, id: string) {
  const { db, user, proxy } = await getOwnedProxy(config, id);
  const credential = decryptProxyCredential(proxy.credentialRef);
  const startedAt = new Date();
  const started = Date.now();
  let browser: Awaited<ReturnType<typeof chromium.launch>> | undefined;

  await db.insert(proxyChecks).values({
    proxyId: proxy.id,
    requestedBy: user.id,
    status: "running",
    startedAt,
    createdAt: startedAt,
    updatedAt: startedAt,
  });

  try {
    const executablePath = findBrowserExecutable(config, "chromium");
    browser = await chromium.launch({
      headless: true,
      ...(executablePath ? { executablePath } : {}),
      proxy: {
        server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
        ...(credential
          ? { username: credential.username, password: credential.password }
          : {}),
      },
    });
    const page = await browser.newPage();
    const response = await page.goto("https://ipapi.co/json/", {
      waitUntil: "domcontentloaded",
      timeout: 30_000,
    });
    const metadata = (await response?.json()) as {
      ip?: string;
      country_code?: string;
      country_name?: string;
      city?: string;
      org?: string;
      timezone?: string;
    } | null;
    const latencyMs = Date.now() - started;
    const finishedAt = new Date();
    await db
      .update(proxies)
      .set({
        country: metadata?.country_code ?? metadata?.country_name ?? null,
        city: metadata?.city ?? null,
        isp: metadata?.org ?? null,
        timezone: metadata?.timezone ?? null,
        detectedIp: metadata?.ip ?? null,
        latencyMs,
        lastCheckedAt: finishedAt,
        checkError: null,
        updatedAt: finishedAt,
      })
      .where(eq(proxies.id, proxy.id));
    await db
      .update(proxyChecks)
      .set({
        status: "success",
        latencyMs,
        metadata: metadata ?? {},
        finishedAt,
        updatedAt: finishedAt,
      })
      .where(
        and(
          eq(proxyChecks.proxyId, proxy.id),
          eq(proxyChecks.status, "running")
        )
      );
    return { success: true, latencyMs, metadata: metadata ?? {} };
  } catch (error) {
    const finishedAt = new Date();
    const message =
      error instanceof Error ? error.message : "Proxy check failed.";
    await db
      .update(proxies)
      .set({
        latencyMs: null,
        lastCheckedAt: finishedAt,
        checkError: message,
        updatedAt: finishedAt,
      })
      .where(eq(proxies.id, proxy.id));
    await db
      .update(proxyChecks)
      .set({
        status: "failed",
        error: message,
        finishedAt,
        updatedAt: finishedAt,
      })
      .where(
        and(
          eq(proxyChecks.proxyId, proxy.id),
          eq(proxyChecks.status, "running")
        )
      );
    return { success: false, message };
  } finally {
    await browser?.close();
  }
}

export async function bulkCheckProxies(config: RuntimeConfig, ids: string[]) {
  const uniqueIds = Array.from(new Set(ids));
  const results: Array<{ id: string; success: boolean; message?: string }> = [];
  for (const id of uniqueIds) {
    const result = await checkProxy(config, id);
    results.push({
      id,
      success: result.success,
      ...(result.success ? {} : { message: result.message }),
    });
  }
  return results;
}
