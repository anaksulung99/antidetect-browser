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

export interface BrowserDiagnostics {
  profile: {
    id: string;
    name: string;
    engine: string;
  };
  browser: {
    userAgent: string;
    platform: string;
    webdriver: boolean;
    userAgentData: unknown;
    timezone: string;
    locale: string;
    viewport: { width: number; height: number };
    screen: {
      width: number;
      height: number;
      colorDepth: number;
      pixelDepth: number;
    };
    webgl: { vendor: string | null; renderer: string | null };
    webgl2: { vendor: string | null; renderer: string | null };
    webrtcCandidates: string[];
  };
  headers: {
    userAgent: string | null;
    acceptLanguage: string | null;
    secChUa: string | null;
    secChUaPlatform: string | null;
    secChUaMobile: string | null;
  };
  network: {
    ip: string | null;
    country: string | null;
    city: string | null;
    isp: string | null;
    timezone: string | null;
    latencyMs: number | null;
  };
  comparison: {
    timezone: { expected: string; actual: string; match: boolean };
    locale: { expected: string; actual: string; match: boolean };
    userAgent: { expected: string; actual: string; match: boolean };
    proxyTimezone: {
      expected: string | null;
      actual: string;
      match: boolean | null;
    };
    warnings: string[];
  };
  checkedAt: string;
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

function assertFingerprintEngineCompatibility(
  engine: "chromium" | "firefox" | "webkit",
  browserName: string
): void {
  const expectedEngine =
    browserName === "Firefox"
      ? "firefox"
      : browserName === "Safari"
        ? "webkit"
        : "chromium";

  if (engine !== expectedEngine) {
    throw new Error(
      `Fingerprint ${browserName} must run with the ${expectedEngine} browser engine, not ${engine}.`
    );
  }
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

export async function inspectBrowser(
  config: RuntimeConfig,
  profileId: string
): Promise<BrowserDiagnostics> {
  const loaded = await loadProfile(config, profileId);
  const runtime = runtimes.get(profileId);
  if (!runtime)
    throw new Error("Start the browser profile before running diagnostics.");

  const { profile, fingerprint, proxy } = loaded;
  const page = await runtime.context.newPage();
  const startedAt = Date.now();

  try {
    const browserData = await page.evaluate(async () => {
      function readWebgl(contextName: "webgl" | "webgl2") {
        const canvas = document.createElement("canvas");
        const context = canvas.getContext(
          contextName
        ) as WebGLRenderingContext | null;
        if (!context) return { vendor: null, renderer: null };
        const debugInfo = context.getExtension("WEBGL_debug_renderer_info");
        return {
          vendor: debugInfo
            ? String(context.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL))
            : null,
          renderer: debugInfo
            ? String(context.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL))
            : null,
        };
      }

      const candidates = new Set<string>();
      try {
        const peer = new RTCPeerConnection({ iceServers: [] });
        peer.onicecandidate = (event) => {
          if (event.candidate?.candidate)
            candidates.add(event.candidate.candidate);
        };
        await peer.setLocalDescription(await peer.createOffer());
        await new Promise((resolve) => setTimeout(resolve, 1200));
        peer.close();
      } catch {
        // WebRTC may be unavailable or restricted by the browser engine.
      }

      return {
        userAgent: navigator.userAgent,
        platform: navigator.platform,
        webdriver: navigator.webdriver,
        userAgentData:
          "userAgentData" in navigator
            ? (() => {
                const data = (
                  navigator as Navigator & {
                    userAgentData?: {
                      brands?: unknown[];
                      mobile?: boolean;
                      platform?: string;
                    };
                  }
                ).userAgentData;
                return {
                  brands: data?.brands ?? [],
                  mobile: data?.mobile ?? false,
                  platform: data?.platform ?? "",
                };
              })()
            : null,
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        locale: navigator.language,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        screen: {
          width: screen.width,
          height: screen.height,
          colorDepth: screen.colorDepth,
          pixelDepth: screen.pixelDepth,
        },
        webgl: readWebgl("webgl"),
        webgl2: readWebgl("webgl2"),
        webrtcCandidates: Array.from(candidates),
      };
    });

    const requestHeadersPromise = new Promise<Record<string, string>>(
      (resolve) => {
        page.once("request", async (request) =>
          resolve(await request.allHeaders())
        );
      }
    );
    const headerResponse = await page.goto("https://httpbin.org/headers", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    const requestHeaders = await Promise.race([
      requestHeadersPromise,
      new Promise<Record<string, string>>((resolve) =>
        setTimeout(() => resolve({}), 2_000)
      ),
    ]);
    const headerBody = headerResponse
      ? await headerResponse.json().catch(() => ({}))
      : {};
    const echoedHeaders =
      (headerBody as { headers?: Record<string, string> }).headers ?? {};

    const ipResponse = await page.goto("https://ipapi.co/json/", {
      waitUntil: "domcontentloaded",
      timeout: 15_000,
    });
    const metadata = ipResponse
      ? ((await ipResponse.json().catch(() => ({}))) as Record<string, unknown>)
      : {};
    const actualTimezone = String(browserData.timezone || "");
    const expectedTimezone = fingerprint.timezone;
    const proxyTimezone = proxy?.timezone ?? null;
    const warnings: string[] = [];

    if (browserData.userAgent !== fingerprint.userAgent) {
      warnings.push("Effective User-Agent berbeda dari fingerprint tersimpan.");
    }
    if (browserData.locale !== fingerprint.locale) {
      warnings.push("Locale browser berbeda dari fingerprint tersimpan.");
    }
    if (actualTimezone !== expectedTimezone) {
      warnings.push("Timezone browser berbeda dari fingerprint tersimpan.");
    }
    if (proxyTimezone && proxyTimezone !== actualTimezone) {
      warnings.push("Timezone proxy berbeda dari timezone browser.");
    }

    return {
      profile: { id: profile.id, name: profile.name, engine: profile.engine },
      browser: browserData,
      headers: {
        userAgent:
          echoedHeaders["User-Agent"] ?? requestHeaders["user-agent"] ?? null,
        acceptLanguage:
          echoedHeaders["Accept-Language"] ??
          requestHeaders["accept-language"] ??
          null,
        secChUa:
          echoedHeaders["Sec-Ch-Ua"] ?? requestHeaders["sec-ch-ua"] ?? null,
        secChUaPlatform:
          echoedHeaders["Sec-Ch-Ua-Platform"] ??
          requestHeaders["sec-ch-ua-platform"] ??
          null,
        secChUaMobile:
          echoedHeaders["Sec-Ch-Ua-Mobile"] ??
          requestHeaders["sec-ch-ua-mobile"] ??
          null,
      },
      network: {
        ip: typeof metadata.ip === "string" ? metadata.ip : null,
        country:
          typeof metadata.country_name === "string"
            ? metadata.country_name
            : null,
        city: typeof metadata.city === "string" ? metadata.city : null,
        isp: typeof metadata.org === "string" ? metadata.org : null,
        timezone:
          typeof metadata.timezone === "string" ? metadata.timezone : null,
        latencyMs: Date.now() - startedAt,
      },
      comparison: {
        timezone: {
          expected: expectedTimezone,
          actual: actualTimezone,
          match: expectedTimezone === actualTimezone,
        },
        locale: {
          expected: fingerprint.locale,
          actual: browserData.locale,
          match: fingerprint.locale === browserData.locale,
        },
        userAgent: {
          expected: fingerprint.userAgent,
          actual: browserData.userAgent,
          match: fingerprint.userAgent === browserData.userAgent,
        },
        proxyTimezone: {
          expected: proxyTimezone,
          actual: actualTimezone,
          match: proxyTimezone ? proxyTimezone === actualTimezone : null,
        },
        warnings,
      },
      checkedAt: new Date().toISOString(),
    };
  } finally {
    await page.close().catch(() => undefined);
  }
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
    assertFingerprintEngineCompatibility(
      profile.engine,
      fingerprint.browserName
    );
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

export async function reconcileBrowserStatuses(
  config: RuntimeConfig
): Promise<void> {
  const db = getDatabase(config);
  await db
    .update(browserProfiles)
    .set({ status: "stopped", updatedAt: new Date() })
    .where(
      // A runtime map is process-local, so these states are stale after restart.
      // The next explicit start will create a fresh persistent context.
      eq(browserProfiles.status, "running")
    );
  await db
    .update(browserProfiles)
    .set({ status: "stopped", updatedAt: new Date() })
    .where(eq(browserProfiles.status, "starting"));
  await db
    .update(browserProfiles)
    .set({ status: "stopped", updatedAt: new Date() })
    .where(eq(browserProfiles.status, "stopping"));
}

export async function stopAllBrowsers(): Promise<void> {
  const entries = Array.from(runtimes.values());
  await Promise.allSettled(entries.map((entry) => entry.context.close()));
  runtimes.clear();
}
