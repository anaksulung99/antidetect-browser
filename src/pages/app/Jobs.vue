<script setup lang="ts">
import { onMounted, ref } from "vue";

interface ProfileOption {
  id: string;
  name: string;
  status: string;
  engine: string;
}
interface BrowserJob {
  id: string;
  browserProfileId: string;
  url: string;
  status: "queued" | "running" | "succeeded" | "failed" | "cancelled";
  attempts: number;
  maxAttempts: number;
  result: {
    title?: string;
    finalUrl?: string;
    statusCode?: number | null;
  } | null;
  error: string | null;
  createdAt: Date | string;
  startedAt: Date | string | null;
  finishedAt: Date | string | null;
}

const profiles = ref<ProfileOption[]>([]);
const jobs = ref<BrowserJob[]>([]);
const profileId = ref("");
const url = ref("");
const backend = ref<"cloudamqp" | "local">("local");
const loading = ref(false);
const submitting = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

function formatDate(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "—";
}

function profileName(id: string) {
  return profiles.value.find((profile) => profile.id === id)?.name ?? id;
}

async function loadData() {
  loading.value = true;
  try {
    const [profileResult, jobResult] = await Promise.all([
      window.appRuntime.browserProfiles.list(),
      window.appRuntime.browserJobs.list(),
    ]);
    profiles.value = profileResult as ProfileOption[];
    jobs.value = jobResult as BrowserJob[];
    if (!profileId.value) profileId.value = profiles.value[0]?.id ?? "";
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to load jobs.";
  } finally {
    loading.value = false;
  }
}

async function submitJob() {
  error.value = null;
  success.value = null;
  submitting.value = true;
  try {
    const result = await window.appRuntime.browserJobs.create({
      profileId: profileId.value,
      url: url.value,
    });
    backend.value = result.backend;
    success.value = `Job ${result.id} queued using ${result.backend} backend.`;
    url.value = "";
    await loadData();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to queue job.";
  } finally {
    submitting.value = false;
  }
}

async function cancelJob(job: BrowserJob) {
  try {
    await window.appRuntime.browserJobs.cancel({ id: job.id });
    success.value = "Job cancelled.";
    await loadData();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to cancel job.";
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Job Queue</h1>
        <p class="text-muted-foreground">
          Jalankan navigasi Crawlee menggunakan browser profile terisolasi.
        </p>
      </div>
      <Badge variant="secondary">{{ backend }} backend</Badge>
    </div>
    <Alert v-if="error" variant="destructive"
      ><AlertDescription>{{ error }}</AlertDescription></Alert
    >
    <Alert v-if="success"
      ><AlertDescription>{{ success }}</AlertDescription></Alert
    >

    <Card
      ><CardHeader
        ><CardTitle>Queue browser job</CardTitle
        ><CardDescription
          >URL hanya boleh menggunakan protocol HTTP atau
          HTTPS.</CardDescription
        ></CardHeader
      ><CardContent
        ><form
          class="grid gap-4 md:grid-cols-[260px_1fr_auto]"
          @submit.prevent="submitJob"
        >
          <div class="space-y-2">
            <Label for="job-profile">Browser profile</Label>
            <Select id="job-profile" v-model="profileId" required>
              <SelectTrigger class="w-full capitalize">
                <SelectValue
                  :placeholder="
                    profiles.find((p) => p.id === profileId)?.name ??
                    'Select profile'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem
                    v-for="profile in profiles"
                    :key="profile.id"
                    :value="profile.id"
                  >
                    {{ profile.name }} — {{ profile.engine }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="job-url">URL</Label
            ><Input
              id="job-url"
              v-model="url"
              type="url"
              placeholder="https://example.com"
              required
            />
          </div>
          <Button
            class="self-end"
            type="submit"
            :disabled="submitting || !profileId"
            >{{ submitting ? "Queuing..." : "Queue job" }}</Button
          >
        </form>
        <p
          v-if="profiles.length === 0"
          class="text-muted-foreground mt-3 text-xs"
        >
          Buat browser profile terlebih dahulu.
        </p></CardContent
      ></Card
    >

    <Card
      ><CardHeader
        ><div class="flex items-center justify-between">
          <div>
            <CardTitle>Recent jobs</CardTitle
            ><CardDescription
              >Retry otomatis maksimal tiga attempt.</CardDescription
            >
          </div>
          <Button variant="outline" @click="loadData">Refresh</Button>
        </div></CardHeader
      ><CardContent
        ><div class="overflow-x-auto">
          <Table
            ><TableHeader
              ><TableRow
                ><TableHead>URL</TableHead><TableHead>Profile</TableHead
                ><TableHead>Status</TableHead><TableHead>Attempts</TableHead
                ><TableHead>Created</TableHead><TableHead>Result</TableHead
                ><TableHead class="text-right">Action</TableHead></TableRow
              ></TableHeader
            ><TableBody
              ><TableRow v-if="loading"
                ><TableCell
                  colspan="7"
                  class="text-muted-foreground text-center"
                  >Loading...</TableCell
                ></TableRow
              ><TableRow v-else-if="jobs.length === 0"
                ><TableCell
                  colspan="7"
                  class="text-muted-foreground text-center"
                  >No jobs yet.</TableCell
                ></TableRow
              ><TableRow v-for="job in jobs" v-else :key="job.id"
                ><TableCell class="max-w-xs truncate" :title="job.url">{{
                  job.url
                }}</TableCell
                ><TableCell>{{ profileName(job.browserProfileId) }}</TableCell
                ><TableCell
                  ><Badge
                    :variant="
                      job.status === 'succeeded'
                        ? 'default'
                        : job.status === 'failed'
                          ? 'destructive'
                          : 'secondary'
                    "
                    >{{ job.status }}</Badge
                  ></TableCell
                ><TableCell>{{ job.attempts }}/{{ job.maxAttempts }}</TableCell
                ><TableCell>{{ formatDate(job.createdAt) }}</TableCell
                ><TableCell
                  ><span v-if="job.result"
                    >{{ job.result.statusCode ?? "—" }}
                    {{ job.result.title ?? "" }}</span
                  ><span v-else-if="job.error" class="text-destructive">{{
                    job.error
                  }}</span
                  ><span v-else>—</span></TableCell
                ><TableCell class="text-right"
                  ><Button
                    v-if="job.status === 'queued'"
                    size="sm"
                    variant="outline"
                    @click="cancelJob(job)"
                    >Cancel</Button
                  ></TableCell
                ></TableRow
              ></TableBody
            ></Table
          >
        </div></CardContent
      ></Card
    >
  </div>
</template>

<style scoped>
.form-select {
  width: 100%;
  height: 2.5rem;
  border: 1px solid var(--input);
  border-radius: 0.375rem;
  background: var(--background);
  padding: 0 0.75rem;
  font-size: 0.875rem;
}
.form-select:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
</style>
