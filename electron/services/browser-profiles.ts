import { and, asc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  browserProfiles,
  fingerprints,
  proxies,
  type BrowserProfile,
} from "../db/schema";
import type { RuntimeConfig } from "../runtime-config";
import { requireActiveUser, type SafeUser } from "./auth";
import { getDatabase } from "./database";

export interface BrowserProfileView {
  id: string;
  ownerId: string;
  name: string;
  status: BrowserProfile["status"];
  engine: BrowserProfile["engine"];
  fingerprintId: string;
  fingerprintName: string | null;
  proxyId: string | null;
  proxyName: string | null;
  proxyEnabled: boolean;
  languageMode: BrowserProfile["languageMode"];
  language: string;
  timezone: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface BrowserProfileOptions {
  fingerprints: Array<{
    id: string;
    name: string;
    deviceType: string;
    browserName: string;
    browserVersion: string;
  }>;
  proxies: Array<{
    id: string;
    name: string;
    protocol: string;
    host: string;
    port: number;
  }>;
}

export interface BrowserProfileInput {
  name: string;
  engine: BrowserProfile["engine"];
  fingerprintId: string;
  proxyEnabled: boolean;
  proxyId: string | null;
  languageMode: BrowserProfile["languageMode"];
  language: string;
  timezone: string | null;
}

function scopeForUser(user: SafeUser) {
  return user.role === "admin"
    ? isNull(browserProfiles.deletedAt)
    : and(
        eq(browserProfiles.ownerId, user.id),
        isNull(browserProfiles.deletedAt)
      );
}

async function assertReferences(
  config: RuntimeConfig,
  user: SafeUser,
  input: BrowserProfileInput
): Promise<void> {
  if (!input.name.trim()) throw new Error("Browser profile name is required.");
  if (input.proxyEnabled && !input.proxyId) {
    throw new Error("A proxy is required when proxy is enabled.");
  }

  const db = getDatabase(config);
  const fingerprint = await db
    .select({ id: fingerprints.id })
    .from(fingerprints)
    .where(
      user.role === "admin"
        ? eq(fingerprints.id, input.fingerprintId)
        : and(
            eq(fingerprints.id, input.fingerprintId),
            eq(fingerprints.ownerId, user.id)
          )
    )
    .limit(1);
  if (!fingerprint[0]) throw new Error("Fingerprint is not available.");

  if (input.proxyEnabled && input.proxyId) {
    const proxy = await db
      .select({ id: proxies.id })
      .from(proxies)
      .where(
        user.role === "admin"
          ? eq(proxies.id, input.proxyId)
          : and(eq(proxies.id, input.proxyId), eq(proxies.ownerId, user.id))
      )
      .limit(1);
    if (!proxy[0]) throw new Error("Proxy is not available.");
  }
}

function mapProfile(
  profile: BrowserProfile,
  fingerprintName: string | null,
  proxyName: string | null
): BrowserProfileView {
  return {
    id: profile.id,
    ownerId: profile.ownerId,
    name: profile.name,
    status: profile.status,
    engine: profile.engine,
    fingerprintId: profile.fingerprintId,
    fingerprintName,
    proxyId: profile.proxyId,
    proxyName,
    proxyEnabled: profile.proxyEnabled,
    languageMode: profile.languageMode,
    language: profile.language,
    timezone: profile.timezone,
    createdAt: profile.createdAt,
    updatedAt: profile.updatedAt,
  };
}

export async function listBrowserProfiles(
  config: RuntimeConfig
): Promise<BrowserProfileView[]> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select({
      profile: browserProfiles,
      fingerprintName: fingerprints.name,
      proxyName: proxies.name,
    })
    .from(browserProfiles)
    .leftJoin(fingerprints, eq(browserProfiles.fingerprintId, fingerprints.id))
    .leftJoin(proxies, eq(browserProfiles.proxyId, proxies.id))
    .where(scopeForUser(user))
    .orderBy(asc(browserProfiles.createdAt));

  return result.map(({ profile, fingerprintName, proxyName }) =>
    mapProfile(profile, fingerprintName ?? null, proxyName ?? null)
  );
}

export async function getBrowserProfileOptions(
  config: RuntimeConfig
): Promise<BrowserProfileOptions> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const fingerprintOwnerFilter =
    user.role === "admin" ? undefined : eq(fingerprints.ownerId, user.id);
  const proxyOwnerFilter =
    user.role === "admin" ? undefined : eq(proxies.ownerId, user.id);

  const fingerprintRows = await db
    .select({
      id: fingerprints.id,
      name: fingerprints.name,
      deviceType: fingerprints.deviceType,
      browserName: fingerprints.browserName,
      browserVersion: fingerprints.browserVersion,
    })
    .from(fingerprints)
    .where(
      and(
        eq(fingerprints.status, "active"),
        isNull(fingerprints.deletedAt),
        fingerprintOwnerFilter
      )
    )
    .orderBy(asc(fingerprints.name));

  const proxyRows = await db
    .select({
      id: proxies.id,
      name: proxies.name,
      protocol: proxies.protocol,
      host: proxies.host,
      port: proxies.port,
    })
    .from(proxies)
    .where(
      and(
        eq(proxies.status, "active"),
        isNull(proxies.deletedAt),
        proxyOwnerFilter
      )
    )
    .orderBy(asc(proxies.name));

  return { fingerprints: fingerprintRows, proxies: proxyRows };
}

export async function createBrowserProfile(
  config: RuntimeConfig,
  input: BrowserProfileInput
): Promise<void> {
  const user = requireActiveUser();
  await assertReferences(config, user, input);
  const db = getDatabase(config);
  const id = randomUUID();
  const now = new Date();

  await db.insert(browserProfiles).values({
    id,
    ownerId: user.id,
    name: input.name.trim(),
    engine: input.engine,
    fingerprintId: input.fingerprintId,
    proxyId: input.proxyEnabled ? input.proxyId : null,
    proxyEnabled: input.proxyEnabled,
    languageMode: input.languageMode,
    language: input.language.trim() || "en-US",
    timezone: input.timezone?.trim() || null,
    userDataDirKey: `profile-${id}`,
    status: "inactive",
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateBrowserProfile(
  config: RuntimeConfig,
  profileId: string,
  input: BrowserProfileInput
): Promise<void> {
  const user = requireActiveUser();
  await assertReferences(config, user, input);
  const db = getDatabase(config);
  const existing = await db
    .select({ id: browserProfiles.id, status: browserProfiles.status })
    .from(browserProfiles)
    .where(and(eq(browserProfiles.id, profileId), scopeForUser(user)))
    .limit(1);
  if (!existing[0]) throw new Error("Browser profile was not found.");
  if (["running", "starting", "stopping"].includes(existing[0].status)) {
    throw new Error("Stop the browser before editing this profile.");
  }

  await db
    .update(browserProfiles)
    .set({
      name: input.name.trim(),
      engine: input.engine,
      fingerprintId: input.fingerprintId,
      proxyId: input.proxyEnabled ? input.proxyId : null,
      proxyEnabled: input.proxyEnabled,
      languageMode: input.languageMode,
      language: input.language.trim() || "en-US",
      timezone: input.timezone?.trim() || null,
      updatedAt: new Date(),
    })
    .where(eq(browserProfiles.id, profileId));
}

export async function deleteBrowserProfile(
  config: RuntimeConfig,
  profileId: string
): Promise<void> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const existing = await db
    .select({ id: browserProfiles.id, status: browserProfiles.status })
    .from(browserProfiles)
    .where(and(eq(browserProfiles.id, profileId), scopeForUser(user)))
    .limit(1);
  if (!existing[0]) throw new Error("Browser profile was not found.");
  if (!["inactive", "stopped", "error"].includes(existing[0].status)) {
    throw new Error("Stop the browser before deleting this profile.");
  }

  await db
    .update(browserProfiles)
    .set({ deletedAt: new Date(), status: "inactive", updatedAt: new Date() })
    .where(eq(browserProfiles.id, profileId));
}
