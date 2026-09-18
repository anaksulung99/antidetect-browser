import { and, eq, isNull } from "drizzle-orm";
import { app } from "electron";
import { mkdir } from "node:fs/promises";
import path from "node:path";
import {
  chromium,
  firefox,
  webkit,
  type BrowserContext,
  type BrowserType,
} from "playwright";
import {
  browserEvents,
  browserProfiles,
  fingerprints,
  proxies,
} from "../db/schema";
import { findBrowserExecutable, type RuntimeConfig } from "../runtime-config";
import { requireActiveUser } from "./auth";
import { getDatabase } from "./database";
import { decryptProxyCredential } from "./proxy-secrets";

interface RuntimeEntry {
  profileId: string;
  context: BrowserContext;
  startedAt: Date;
}

interface FingerprintRuntimeData {
  userAgent: string;
  locale: string;
  timezone: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
  };
  clientHints?: {
    platform?: string;
    mobile?: boolean;
    brands?: Array<{ brand: string; version: string }>;
  };
  webgl?: { vendor?: string; renderer?: string };
  media?: { prefersColorScheme?: "light" | "dark"; reducedMotion?: boolean };
}

const runtimes = new Map<string, RuntimeEntry>();

function getProfileDataDirectory(userDataDirKey: string): string {
  return path.join(app.getPath("userData"), "browser-profiles", userDataDirKey);
}

function getBrowserType(
  engine: "chromium" | "firefox" | "webkit"
): BrowserType {
  return { chromium, firefox, webkit }[engine];
}

function buildProxyOptions(
  proxy: {
    protocol: string;
    host: string;
    port: number;
    credentialRef: string | null;
  } | null
) {
  if (!proxy) return undefined;
  const credential = decryptProxyCredential(proxy.credentialRef);
  return {
    server: `${proxy.protocol}://${proxy.host}:${proxy.port}`,
    ...(credential
      ? { username: credential.username, password: credential.password }
      : {}),
  };
}

type PersistentContextOptions = Parameters<
  BrowserType["launchPersistentContext"]
>[1];

function buildFingerprintOptions(
  fingerprint: FingerprintRuntimeData
): PersistentContextOptions {
  const viewport = fingerprint.viewport;
  const options: PersistentContextOptions = {
    userAgent: fingerprint.userAgent,
    locale: fingerprint.locale,
    timezoneId: fingerprint.timezone,
    viewport: {
      width: viewport.width,
      height: viewport.height,
    },
    deviceScaleFactor: viewport.deviceScaleFactor,
    isMobile: viewport.isMobile,
    colorScheme: fingerprint.media?.prefersColorScheme,
    reducedMotion: fingerprint.media?.reducedMotion
      ? "reduce"
      : "no-preference",
    extraHTTPHeaders: {
      "accept-language": fingerprint.locale,
    },
  };

  return options;
}

async function applyWebglPreset(
  context: BrowserContext,
  webgl: FingerprintRuntimeData["webgl"]
): Promise<void> {
  if (!webgl?.vendor && !webgl?.renderer) return;
  await context.addInitScript(
    ({ vendor, renderer }) => {
      const originalGetParameter = WebGLRenderingContext.prototype.getParameter;
      WebGLRenderingContext.prototype.getParameter = function (
        parameter: number
      ) {
        if (parameter === 37445 && vendor) return vendor;
        if (parameter === 37446 && renderer) return renderer;
        return originalGetParameter.call(this, parameter);
      };
    },
    { vendor: webgl.vendor, renderer: webgl.renderer }
  );
}

async function setProfileStatus(
  config: RuntimeConfig,
  profileId: string,
  status: "starting" | "running" | "stopping" | "stopped" | "error"
): Promise<void> {
  const db = getDatabase(config);
  await db
    .update(browserProfiles)
    .set({
      status,
      ...(status === "running" ? { lastStartedAt: new Date() } : {}),
      ...(status === "stopped" ? { lastStoppedAt: new Date() } : {}),
      updatedAt: new Date(),
    })
    .where(eq(browserProfiles.id, profileId));
}

async function recordEvent(
  config: RuntimeConfig,
  profileId: string,
  actorId: string,
  action: string,
  result: "success" | "failed",
  startedAt: Date,
  errorMessage?: string
): Promise<void> {
  const db = getDatabase(config);
  await db.insert(browserEvents).values({
    browserProfileId: profileId,
    actorId,
    action,
    result,
    durationMs: Date.now() - startedAt.getTime(),
    errorMessage,
    createdAt: new Date(),
    updatedAt: new Date(),
  });
}

async function loadProfile(config: RuntimeConfig, profileId: string) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const result = await db
    .select({
      profile: browserProfiles,
      fingerprint: fingerprints,
      proxy: proxies,
    })
    .from(browserProfiles)
    .innerJoin(fingerprints, eq(browserProfiles.fingerprintId, fingerprints.id))
    .leftJoin(proxies, eq(browserProfiles.proxyId, proxies.id))
    .where(
      and(
        eq(browserProfiles.id, profileId),
        isNull(browserProfiles.deletedAt),
        user.role === "admin" ? undefined : eq(browserProfiles.ownerId, user.id)
      )
    )
    .limit(1);
  if (!result[0]) throw new Error("Browser profile was not found.");
  return { ...result[0], user };
}

export async function startBrowser(
  config: RuntimeConfig,
  profileId: string
): Promise<{ profileId: string; status: "running" }> {
  const loaded = await loadProfile(config, profileId);
  const { profile, fingerprint, proxy, user } = loaded;
  if (runtimes.has(profileId)) return { profileId, status: "running" };
  if (["starting", "stopping"].includes(profile.status)) {
    throw new Error("Browser profile is transitioning state.");
  }

  const startedAt = new Date();
  await setProfileStatus(config, profileId, "starting");
  try {
    const fingerprintData = fingerprint as unknown as FingerprintRuntimeData;
    const profileDirectory = getProfileDataDirectory(profile.userDataDirKey);
    await mkdir(profileDirectory, { recursive: true });
    const browserType = getBrowserType(profile.engine);
    const executablePath = findBrowserExecutable(config, profile.engine);
    const context = await browserType.launchPersistentContext(
      profileDirectory,
      {
        ...buildFingerprintOptions(fingerprintData),
        ...(executablePath ? { executablePath } : {}),
        ...(profile.proxyEnabled && proxy
          ? { proxy: buildProxyOptions(proxy) }
          : {}),
        headless: false,
      }
    );
    await applyWebglPreset(context, fingerprintData.webgl);
    runtimes.set(profileId, { profileId, context, startedAt });
    context.on("close", () => {
      runtimes.delete(profileId);
      void setProfileStatus(config, profileId, "stopped");
    });
    await setProfileStatus(config, profileId, "running");
    await recordEvent(
      config,
      profileId,
      user.id,
      "start",
      "success",
      startedAt
    );
    return { profileId, status: "running" };
  } catch (error) {
    await setProfileStatus(config, profileId, "error");
    await recordEvent(
      config,
      profileId,
      user.id,
      "start",
      "failed",
      startedAt,
      error instanceof Error ? error.message : "Browser launch failed."
    );
    throw error;
  }
}

export async function stopBrowser(
  config: RuntimeConfig,
  profileId: string
): Promise<{ profileId: string; status: "stopped" }> {
  const loaded = await loadProfile(config, profileId);
  const runtime = runtimes.get(profileId);
  if (!runtime) {
    await setProfileStatus(config, profileId, "stopped");
    return { profileId, status: "stopped" };
  }

  const startedAt = new Date();
  await setProfileStatus(config, profileId, "stopping");
  try {
    await runtime.context.close();
    runtimes.delete(profileId);
    await setProfileStatus(config, profileId, "stopped");
    await recordEvent(
      config,
      profileId,
      loaded.user.id,
      "stop",
      "success",
      startedAt
    );
    return { profileId, status: "stopped" };
  } catch (error) {
    await setProfileStatus(config, profileId, "error");
    await recordEvent(
      config,
      profileId,
      loaded.user.id,
      "stop",
      "failed",
      startedAt,
      error instanceof Error ? error.message : "Browser stop failed."
    );
    throw error;
  }
}

export async function restartBrowser(config: RuntimeConfig, profileId: string) {
  await stopBrowser(config, profileId);
  return startBrowser(config, profileId);
}

export async function getRuntimeStatuses(config: RuntimeConfig) {
  const user = requireActiveUser();
  const statuses = Array.from(runtimes.keys());
  return statuses.filter((profileId) => {
    if (user.role === "admin") return true;
    return runtimes.get(profileId)?.profileId === profileId;
  });
}

export async function stopAllBrowsers(): Promise<void> {
  const entries = Array.from(runtimes.values());
  await Promise.allSettled(entries.map((entry) => entry.context.close()));
  runtimes.clear();
}
