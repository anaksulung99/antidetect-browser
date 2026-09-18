import { and, count, desc, eq, gte, isNull } from "drizzle-orm";
import {
  browserEvents,
  browserJobs,
  browserProfiles,
  fingerprints,
  proxies,
  proxyChecks,
} from "../db/schema";
import type { RuntimeConfig } from "../runtime-config";
import { requireActiveUser } from "./auth";
import { getDatabase } from "./database";

export async function getDashboardAnalytics(config: RuntimeConfig) {
  const user = requireActiveUser();
  const db = getDatabase(config);
  const admin = user.role === "admin";
  const profileOwner = admin ? undefined : eq(browserProfiles.ownerId, user.id);
  const fingerprintOwner = admin
    ? undefined
    : eq(fingerprints.ownerId, user.id);
  const proxyOwner = admin ? undefined : eq(proxies.ownerId, user.id);
  const jobOwner = admin ? undefined : eq(browserJobs.ownerId, user.id);

  const [
    profileTotal,
    profileRunning,
    fingerprintTotal,
    proxyTotal,
    proxyChecked,
    jobsQueued,
    jobsRunning,
    jobsSucceeded,
    jobsFailed,
    recentEvents,
    recentJobs,
    proxyHealth,
  ] = await Promise.all([
    db
      .select({ value: count() })
      .from(browserProfiles)
      .where(and(isNull(browserProfiles.deletedAt), profileOwner)),
    db
      .select({ value: count() })
      .from(browserProfiles)
      .where(
        and(
          eq(browserProfiles.status, "running"),
          isNull(browserProfiles.deletedAt),
          profileOwner
        )
      ),
    db
      .select({ value: count() })
      .from(fingerprints)
      .where(
        and(
          eq(fingerprints.status, "active"),
          isNull(fingerprints.deletedAt),
          fingerprintOwner
        )
      ),
    db
      .select({ value: count() })
      .from(proxies)
      .where(
        and(eq(proxies.status, "active"), isNull(proxies.deletedAt), proxyOwner)
      ),
    db
      .select({ value: count() })
      .from(proxies)
      .where(
        and(
          gte(
            proxies.lastCheckedAt,
            new Date(Date.now() - 24 * 60 * 60 * 1000)
          ),
          isNull(proxies.deletedAt),
          proxyOwner
        )
      ),
    db
      .select({ value: count() })
      .from(browserJobs)
      .where(and(eq(browserJobs.status, "queued"), jobOwner)),
    db
      .select({ value: count() })
      .from(browserJobs)
      .where(and(eq(browserJobs.status, "running"), jobOwner)),
    db
      .select({ value: count() })
      .from(browserJobs)
      .where(and(eq(browserJobs.status, "succeeded"), jobOwner)),
    db
      .select({ value: count() })
      .from(browserJobs)
      .where(and(eq(browserJobs.status, "failed"), jobOwner)),
    db
      .select({ event: browserEvents, profileName: browserProfiles.name })
      .from(browserEvents)
      .innerJoin(
        browserProfiles,
        eq(browserEvents.browserProfileId, browserProfiles.id)
      )
      .where(and(profileOwner, isNull(browserProfiles.deletedAt)))
      .orderBy(desc(browserEvents.createdAt))
      .limit(10),
    db
      .select()
      .from(browserJobs)
      .where(jobOwner)
      .orderBy(desc(browserJobs.createdAt))
      .limit(10),
    db
      .select({
        status: proxyChecks.status,
        latencyMs: proxyChecks.latencyMs,
        createdAt: proxyChecks.createdAt,
        proxyName: proxies.name,
      })
      .from(proxyChecks)
      .innerJoin(proxies, eq(proxyChecks.proxyId, proxies.id))
      .where(proxyOwner)
      .orderBy(desc(proxyChecks.createdAt))
      .limit(10),
  ]);

  return {
    stats: {
      profiles: Number(profileTotal[0]?.value ?? 0),
      runningProfiles: Number(profileRunning[0]?.value ?? 0),
      fingerprints: Number(fingerprintTotal[0]?.value ?? 0),
      proxies: Number(proxyTotal[0]?.value ?? 0),
      proxiesChecked24h: Number(proxyChecked[0]?.value ?? 0),
      jobsQueued: Number(jobsQueued[0]?.value ?? 0),
      jobsRunning: Number(jobsRunning[0]?.value ?? 0),
      jobsSucceeded: Number(jobsSucceeded[0]?.value ?? 0),
      jobsFailed: Number(jobsFailed[0]?.value ?? 0),
    },
    recentEvents,
    recentJobs,
    proxyHealth,
  };
}
