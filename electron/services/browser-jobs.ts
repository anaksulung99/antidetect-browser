import { Redis } from "@upstash/redis";
import { PlaywrightCrawler } from "crawlee";
import { and, asc, eq, isNull } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import {
  browserJobs,
  browserProfiles,
  fingerprints,
  proxies,
} from "../db/schema";
import type { RuntimeConfig } from "../runtime-config";
import { findBrowserExecutable } from "../runtime-config";
import { requireActiveUser, type SafeUser } from "./auth";
import { getDatabase } from "./database";
import { decryptProxyCredential } from "./proxy-secrets";

const MAX_CONCURRENCY = 2;
const localQueue: string[] = [];
const activeJobs = new Set<string>();
let pumping = false;
let redis: Redis | undefined;

function getRedis(): Redis | undefined {
  if (
    !process.env.UPSTASH_REDIS_REST_URL ||
    !process.env.UPSTASH_REDIS_REST_TOKEN
  ) {
    return undefined;
  }
  redis ??= Redis.fromEnv();
  return redis;
}

function isAllowedUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ownerScope(user: SafeUser) {
  return user.role === "admin" ? undefined : eq(browserJobs.ownerId, user.id);
}

export function getQueueBackend(): "local" {
  return "local";
}

export async function createBrowserJob(
  config: RuntimeConfig,
  profileId: string,
  url: string
) {
  const user = requireActiveUser();
  if (!isAllowedUrl(url))
    throw new Error("Only http and https URLs are allowed.");
  const db = getDatabase(config);
  const profile = await db
    .select({ id: browserProfiles.id })
    .from(browserProfiles)
    .where(
      and(
        eq(browserProfiles.id, profileId),
        isNull(browserProfiles.deletedAt),
        user.role === "admin" ? undefined : eq(browserProfiles.ownerId, user.id)
      )
    )
    .limit(1);
  if (!profile[0]) throw new Error("Browser profile is not available.");

  const inserted = await db
    .insert(browserJobs)
    .values({
      ownerId: user.id,
      browserProfileId: profileId,
      url,
      status: "queued",
      attempts: 0,
      maxAttempts: 3,
      queuedAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    })
    .returning({ id: browserJobs.id });
  const jobId = inserted[0]?.id;
  if (!jobId) throw new Error("Unable to create browser job.");
  localQueue.push(jobId);
  void pumpQueue(config);
  return { id: jobId, backend: getQueueBackend() };
}

export async function listBrowserJobs(config: RuntimeConfig) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  return db
    .select()
    .from(browserJobs)
    .where(ownerScope(user))
    .orderBy(asc(browserJobs.createdAt));
}

export async function cancelBrowserJob(config: RuntimeConfig, id: string) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  await db
    .update(browserJobs)
    .set({ status: "cancelled", finishedAt: new Date(), updatedAt: new Date() })
    .where(
      and(
        eq(browserJobs.id, id),
        ownerScope(user),
        eq(browserJobs.status, "queued")
      )
    );
}

async function pumpQueue(config: RuntimeConfig): Promise<void> {
  if (pumping) return;
  pumping = true;
  try {
    while (localQueue.length > 0 && activeJobs.size < MAX_CONCURRENCY) {
      const jobId = localQueue.shift();
      if (!jobId) continue;
      activeJobs.add(jobId);
      void processJob(config, jobId).finally(() => {
        activeJobs.delete(jobId);
        void pumpQueue(config);
      });
    }
  } finally {
    pumping = false;
  }
}

async function processJob(config: RuntimeConfig, jobId: string): Promise<void> {
  const db = getDatabase(config);
  const lock = getRedis();
  const lockKey = `antidetect:browser-job:${jobId}`;
  const lockValue = randomUUID();
  if (lock) {
    const acquired = await lock.set(lockKey, lockValue, { nx: true, ex: 300 });
    if (!acquired) return;
  }

  try {
    const rows = await db
      .select({
        job: browserJobs,
        profile: browserProfiles,
        fingerprint: fingerprints,
        proxy: proxies,
      })
      .from(browserJobs)
      .innerJoin(
        browserProfiles,
        eq(browserJobs.browserProfileId, browserProfiles.id)
      )
      .innerJoin(
        fingerprints,
        eq(browserProfiles.fingerprintId, fingerprints.id)
      )
      .leftJoin(proxies, eq(browserProfiles.proxyId, proxies.id))
      .where(eq(browserJobs.id, jobId))
      .limit(1);
    const row = rows[0];
    if (!row || row.job.status === "cancelled") return;

    const attempts = row.job.attempts + 1;
    const startedAt = new Date();
    await db
      .update(browserJobs)
      .set({ status: "running", attempts, startedAt, updatedAt: startedAt })
      .where(eq(browserJobs.id, jobId));

    try {
      const fingerprint = row.fingerprint as unknown as {
        userAgent: string;
        locale: string;
        timezone: string;
        viewport: { width: number; height: number };
      };
      const credential = decryptProxyCredential(
        row.proxy?.credentialRef ?? null
      );
      const proxy =
        row.profile.proxyEnabled && row.proxy
          ? {
              server: `${row.proxy.protocol}://${row.proxy.host}:${row.proxy.port}`,
              ...(credential
                ? {
                    username: credential.username,
                    password: credential.password,
                  }
                : {}),
            }
          : undefined;
      const executablePath = findBrowserExecutable(config, "chromium");
      let result: {
        title: string;
        finalUrl: string;
        statusCode: number | null;
      } = {
        title: "",
        finalUrl: row.job.url,
        statusCode: null,
      };
      const crawler = new PlaywrightCrawler({
        maxConcurrency: 1,
        maxRequestRetries: 0,
        launchContext: {
          launchOptions: {
            headless: true,
            ...(executablePath ? { executablePath } : {}),
            ...(proxy ? { proxy } : {}),
          },
        },
        preNavigationHooks: [
          async ({ page }) => {
            await page.setExtraHTTPHeaders({
              "accept-language": fingerprint.locale,
            });
            await page.setViewportSize(fingerprint.viewport);
          },
        ],
        requestHandler: async ({ page, request }) => {
          const response = await page.goto(request.url, {
            waitUntil: "domcontentloaded",
            timeout: 30_000,
          });
          result = {
            title: await page.title(),
            finalUrl: page.url(),
            statusCode: response?.status() ?? null,
          };
        },
      });
      await crawler.run([row.job.url]);
      await db
        .update(browserJobs)
        .set({
          status: "succeeded",
          result,
          finishedAt: new Date(),
          error: null,
          updatedAt: new Date(),
        })
        .where(eq(browserJobs.id, jobId));
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Browser job failed.";
      if (attempts < row.job.maxAttempts) {
        await db
          .update(browserJobs)
          .set({ status: "queued", error: message, updatedAt: new Date() })
          .where(eq(browserJobs.id, jobId));
        localQueue.push(jobId);
      } else {
        await db
          .update(browserJobs)
          .set({
            status: "failed",
            error: message,
            finishedAt: new Date(),
            updatedAt: new Date(),
          })
          .where(eq(browserJobs.id, jobId));
      }
    }
  } finally {
    if (lock) {
      await lock.del(lockKey);
    }
  }
}

export async function recoverQueuedJobs(config: RuntimeConfig): Promise<void> {
  const db = getDatabase(config);
  const stale = await db
    .select({ id: browserJobs.id })
    .from(browserJobs)
    .where(eq(browserJobs.status, "running"));
  if (stale.length) {
    await db
      .update(browserJobs)
      .set({
        status: "queued",
        error: "Recovered after application restart.",
        updatedAt: new Date(),
      })
      .where(eq(browserJobs.status, "running"));
  }
  const queued = await db
    .select({ id: browserJobs.id })
    .from(browserJobs)
    .where(eq(browserJobs.status, "queued"));
  localQueue.push(...queued.map((job) => job.id));
  void pumpQueue(config);
}
