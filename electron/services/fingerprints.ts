import { and, asc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import { browserProfiles, fingerprints } from "../db/schema";
import type { RuntimeConfig } from "../runtime-config";
import { requireActiveUser } from "./auth";
import { getDatabase } from "./database";
import {
    applyAllPresets,
    fingerprintCapabilities,
    type FingerprintInput,
} from "./fingerprint-presets";

export type FingerprintFormInput = FingerprintInput & {
  name: string;
  status: "active" | "inactive";
  seed?: string;
};

function scope(userId: string, admin: boolean) {
  return admin
    ? isNull(fingerprints.deletedAt)
    : and(eq(fingerprints.ownerId, userId), isNull(fingerprints.deletedAt));
}

export async function listFingerprints(config: RuntimeConfig) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  return db
    .select({
      id: fingerprints.id,
      ownerId: fingerprints.ownerId,
      name: fingerprints.name,
      status: fingerprints.status,
      deviceType: fingerprints.deviceType,
      osName: fingerprints.osName,
      osVersion: fingerprints.osVersion,
      browserName: fingerprints.browserName,
      browserVersion: fingerprints.browserVersion,
      locale: fingerprints.locale,
      timezone: fingerprints.timezone,
      userAgent: fingerprints.userAgent,
      presetVersion: fingerprints.presetVersion,
      compatibilityWarnings: fingerprints.compatibilityWarnings,
      createdAt: fingerprints.createdAt,
      updatedAt: fingerprints.updatedAt,
    })
    .from(fingerprints)
    .where(scope(user.id, user.role === "admin"))
    .orderBy(asc(fingerprints.createdAt));
}

export async function getFingerprint(config: RuntimeConfig, id: string) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select()
    .from(fingerprints)
    .where(and(eq(fingerprints.id, id), scope(user.id, user.role === "admin")))
    .limit(1);
  if (!result[0]) throw new Error("Fingerprint was not found.");
  return result[0];
}

export async function getFingerprintCapabilities() {
  return fingerprintCapabilities;
}

export async function createFingerprint(
  config: RuntimeConfig,
  input: FingerprintFormInput,
): Promise<void> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const id = randomUUID();
  const seed = input.seed?.trim() || id;
  const preset = applyAllPresets(input, seed);
  const now = new Date();

  await db.insert(fingerprints).values({
    id,
    ownerId: user.id,
    name: input.name.trim(),
    status: input.status,
    deviceType: input.deviceType,
    osName: input.osName,
    osVersion: input.osVersion,
    browserName: input.browserName,
    browserVersion: input.browserVersion,
    userAgent: preset.userAgent,
    locale: input.locale.trim() || "en-US",
    timezone: input.locale.startsWith("en-GB")
      ? "Europe/London"
      : "America/New_York",
    viewport: preset.viewport,
    screen: preset.screen,
    clientHints: preset.clientHints,
    webgl: preset.webgl,
    fonts: preset.fonts,
    media: preset.media,
    hardware: preset.hardware,
    seed,
    presetVersion: "core-1",
    compatibilityWarnings: preset.compatibilityWarnings,
    createdAt: now,
    updatedAt: now,
  });
}

export async function updateFingerprintStatus(
  config: RuntimeConfig,
  id: string,
  status: "active" | "inactive",
): Promise<void> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select({ id: fingerprints.id })
    .from(fingerprints)
    .where(and(eq(fingerprints.id, id), scope(user.id, user.role === "admin")))
    .limit(1);
  if (!result[0]) throw new Error("Fingerprint was not found.");

  await db
    .update(fingerprints)
    .set({ status, updatedAt: new Date() })
    .where(eq(fingerprints.id, id));
}

export async function deleteFingerprint(
  config: RuntimeConfig,
  id: string,
): Promise<void> {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select({ id: fingerprints.id })
    .from(fingerprints)
    .where(and(eq(fingerprints.id, id), scope(user.id, user.role === "admin")))
    .limit(1);
  if (!result[0]) throw new Error("Fingerprint was not found.");

  const usedByProfile = await db
    .select({ id: browserProfiles.id })
    .from(browserProfiles)
    .where(
      and(
        eq(browserProfiles.fingerprintId, id),
        isNull(browserProfiles.deletedAt),
      ),
    )
    .limit(1);
  if (usedByProfile[0]) {
    throw new Error("Fingerprint is used by a browser profile.");
  }

  await db
    .update(fingerprints)
    .set({ deletedAt: new Date(), status: "inactive", updatedAt: new Date() })
    .where(eq(fingerprints.id, id));
}
