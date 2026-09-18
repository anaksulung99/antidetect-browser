<script setup lang="ts">
import { onMounted, ref } from "vue";

interface DashboardData {
  stats: {
    profiles: number;
    runningProfiles: number;
    fingerprints: number;
    proxies: number;
    proxiesChecked24h: number;
    jobsQueued: number;
    jobsRunning: number;
    jobsSucceeded: number;
    jobsFailed: number;
  };
  recentEvents: Array<{
    event: {
      action: string;
      result: string;
      createdAt: Date | string;
      errorMessage: string | null;
    };
    profileName: string;
  }>;
  recentJobs: Array<{
    id: string;
    url: string;
    status: string;
    createdAt: Date | string;
    result: { title?: string } | null;
    error: string | null;
  }>;
  proxyHealth: Array<{
    status: string;
    latencyMs: number | null;
    createdAt: Date | string;
    proxyName: string;
  }>;
}

const authStore = useAuthStore();
const databaseStatus = ref<Awaited<
  ReturnType<typeof window.appRuntime.getDatabaseStatus>
> | null>(null);
const analytics = ref<DashboardData | null>(null);
const loading = ref(true);
const error = ref<string | null>(null);

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function loadDashboard() {
  loading.value = true;
  error.value = null;
  try {
    const [database, dashboard] = await Promise.all([
      window.appRuntime.getDatabaseStatus(),
      window.appRuntime.dashboard.analytics(),
    ]);
    databaseStatus.value = database;
    analytics.value = dashboard as DashboardData;
  } catch (cause) {
    error.value =
      cause instanceof Error
        ? cause.message
        : "Unable to load dashboard analytics.";
  } finally {
    loading.value = false;
  }
}

onMounted(loadDashboard);
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
        <p class="text-muted-foreground">
          Selamat datang kembali, {{ authStore.user?.name }}.
        </p>
      </div>
      <Button variant="outline" :disabled="loading" @click="loadDashboard"
        >Refresh</Button
      >
    </div>
    <Alert v-if="error" variant="destructive"
      ><AlertDescription>{{ error }}</AlertDescription></Alert
    >

    <div v-if="analytics" class="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Card
        ><CardHeader
          ><CardDescription>Browser profiles</CardDescription
          ><CardTitle>{{ analytics.stats.profiles }}</CardTitle></CardHeader
        ><CardContent
          ><p class="text-muted-foreground text-xs">
            {{ analytics.stats.runningProfiles }} running
          </p></CardContent
        ></Card
      >
      <Card
        ><CardHeader
          ><CardDescription>Active fingerprints</CardDescription
          ><CardTitle>{{ analytics.stats.fingerprints }}</CardTitle></CardHeader
        ><CardContent
          ><p class="text-muted-foreground text-xs">
            Ready for profiles
          </p></CardContent
        ></Card
      >
      <Card
        ><CardHeader
          ><CardDescription>Active proxies</CardDescription
          ><CardTitle>{{ analytics.stats.proxies }}</CardTitle></CardHeader
        ><CardContent
          ><p class="text-muted-foreground text-xs">
            {{ analytics.stats.proxiesChecked24h }} checked in 24h
          </p></CardContent
        ></Card
      >
      <Card
        ><CardHeader
          ><CardDescription>Jobs in queue</CardDescription
          ><CardTitle>{{
            analytics.stats.jobsQueued + analytics.stats.jobsRunning
          }}</CardTitle></CardHeader
        ><CardContent
          ><p class="text-muted-foreground text-xs">
            {{ analytics.stats.jobsSucceeded }} succeeded ·
            {{ analytics.stats.jobsFailed }} failed
          </p></CardContent
        ></Card
      >
    </div>
    <div v-else-if="loading" class="text-muted-foreground">
      Loading analytics...
    </div>

    <div class="grid gap-6 lg:grid-cols-2">
      <Card
        ><CardHeader
          ><CardTitle>Recent browser activity</CardTitle
          ><CardDescription
            >Lifecycle event terbaru.</CardDescription
          ></CardHeader
        ><CardContent
          ><div v-if="analytics?.recentEvents.length" class="space-y-3">
            <div
              v-for="item in analytics.recentEvents"
              :key="`${item.event.createdAt}-${item.event.action}`"
              class="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
            >
              <div>
                <p class="text-sm font-medium">
                  {{ item.event.action }} · {{ item.profileName }}
                </p>
                <p class="text-muted-foreground text-xs">
                  {{ item.event.errorMessage || item.event.result }}
                </p>
              </div>
              <span class="text-muted-foreground whitespace-nowrap text-xs">{{
                formatDate(item.event.createdAt)
              }}</span>
            </div>
          </div>
          <p v-else class="text-muted-foreground text-sm">
            No browser events yet.
          </p></CardContent
        ></Card
      >
      <Card
        ><CardHeader
          ><CardTitle>Recent jobs</CardTitle
          ><CardDescription
            >Aktivitas Crawlee terakhir.</CardDescription
          ></CardHeader
        ><CardContent
          ><div v-if="analytics?.recentJobs.length" class="space-y-3">
            <div
              v-for="job in analytics.recentJobs"
              :key="job.id"
              class="flex items-start justify-between gap-3 border-b pb-3 last:border-0"
            >
              <div class="min-w-0">
                <p class="truncate text-sm font-medium">{{ job.url }}</p>
                <p class="text-muted-foreground text-xs">
                  {{ job.result?.title || job.error || job.status }}
                </p>
              </div>
              <Badge variant="secondary">{{ job.status }}</Badge>
            </div>
          </div>
          <p v-else class="text-muted-foreground text-sm">
            No jobs yet.
          </p></CardContent
        ></Card
      >
    </div>

    <Card
      ><CardHeader
        ><CardTitle>Proxy health</CardTitle
        ><CardDescription
          >Recent proxy check results.</CardDescription
        ></CardHeader
      ><CardContent
        ><div
          v-if="analytics?.proxyHealth.length"
          class="grid gap-3 md:grid-cols-2 lg:grid-cols-4"
        >
          <div
            v-for="check in analytics.proxyHealth"
            :key="`${check.proxyName}-${check.createdAt}`"
            class="rounded-lg border p-3"
          >
            <div class="flex items-center justify-between">
              <span class="text-sm font-medium">{{ check.proxyName }}</span
              ><Badge variant="secondary">{{ check.status }}</Badge>
            </div>
            <p class="text-muted-foreground mt-2 text-xs">
              {{ check.latencyMs ? `${check.latencyMs} ms` : "No latency" }} ·
              {{ formatDate(check.createdAt) }}
            </p>
          </div>
        </div>
        <p v-else class="text-muted-foreground text-sm">
          No proxy checks yet.
        </p></CardContent
      ></Card
    >

    <Card
      ><CardHeader
        ><CardDescription>Signed in as</CardDescription
        ><CardTitle class="text-lg">{{
          authStore.user?.email
        }}</CardTitle></CardHeader
      ><CardContent
        ><div class="flex items-center gap-3">
          <Badge variant="outline" class="capitalize">{{
            authStore.user?.role
          }}</Badge
          ><span class="text-muted-foreground text-sm"
            >Database:
            {{ databaseStatus?.reachable ? "Connected" : "Unavailable" }}</span
          >
        </div></CardContent
      ></Card
    >
  </div>
</template>
