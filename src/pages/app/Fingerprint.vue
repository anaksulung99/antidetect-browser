<script setup lang="ts">
import { computed, onMounted, ref, watch } from "vue";

interface CapabilityGroup {
  versions: readonly string[];
  browsers: Record<string, readonly string[]>;
}

type DeviceType = "desktop" | "mobile";
type OsName = "windows" | "macos" | "linux" | "android" | "ios";

interface FingerprintRecord {
  id: string;
  name: string;
  status: "active" | "inactive";
  deviceType: DeviceType;
  osName: OsName;
  osVersion: string;
  browserName: string;
  browserVersion: string;
  locale: string;
  timezone: string;
  userAgent: string;
  presetVersion: string;
  compatibilityWarnings: string[] | null;
  createdAt: Date | string;
}

const fingerprints = ref<FingerprintRecord[]>([]);
const capabilities = ref<Record<DeviceType, Record<OsName, CapabilityGroup>>>({
  desktop: {} as Record<OsName, CapabilityGroup>,
  mobile: {} as Record<OsName, CapabilityGroup>,
});
const selected = ref<FingerprintRecord | null>(null);
const deviceType = ref<DeviceType>("desktop");
const osName = ref<OsName>("windows");
const osVersion = ref("11");
const browserName = ref("Chrome");
const browserVersion = ref("123");
const name = ref("");
const locale = ref("en-US");
const seed = ref("");
const status = ref<"active" | "inactive">("active");
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const search = ref("");

const osOptions = computed(() => Object.keys(capabilities.value[deviceType.value] ?? {}) as OsName[]);
const currentCapability = computed(
  () => capabilities.value[deviceType.value]?.[osName.value],
);
const osVersions = computed(() => currentCapability.value?.versions ?? []);
const browserOptions = computed(() => Object.keys(currentCapability.value?.browsers ?? {}));
const browserVersions = computed(
  () => currentCapability.value?.browsers[browserName.value] ?? [],
);
const filteredFingerprints = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return fingerprints.value;
  return fingerprints.value.filter((item) =>
    [item.name, item.osName, item.browserName, item.deviceType]
      .some((value) => value.toLowerCase().includes(query)),
  );
});

function syncDeviceDefaults() {
  const availableOs = osOptions.value;
  if (!availableOs.includes(osName.value)) osName.value = availableOs[0] ?? "windows";
  syncOsDefaults();
}

function syncOsDefaults() {
  const capability = currentCapability.value;
  const versions = capability?.versions ?? [];
  if (!versions.includes(osVersion.value)) osVersion.value = versions[0] ?? "";
  const browsers = Object.keys(capability?.browsers ?? {});
  if (!browsers.includes(browserName.value)) browserName.value = browsers[0] ?? "";
  const versionsForBrowser = capability?.browsers[browserName.value] ?? [];
  if (!versionsForBrowser.includes(browserVersion.value)) {
    browserVersion.value = versionsForBrowser[0] ?? "";
  }
}

watch(deviceType, syncDeviceDefaults);
watch(osName, syncOsDefaults);
watch(browserName, () => {
  browserVersion.value = browserVersions.value[0] ?? "";
});

function clearMessages() {
  error.value = null;
  success.value = null;
}

function formatDate(value: Date | string) {
  return new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(new Date(value));
}

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const [listResult, capabilityResult] = await Promise.all([
      window.appRuntime.fingerprints.list(),
      window.appRuntime.fingerprints.capabilities(),
    ]);
    fingerprints.value = listResult as FingerprintRecord[];
    capabilities.value = capabilityResult as typeof capabilities.value;
    syncDeviceDefaults();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to load fingerprints.";
  } finally {
    loading.value = false;
  }
}

async function generateFingerprint() {
  clearMessages();
  saving.value = true;
  try {
    await window.appRuntime.fingerprints.create({
      name: name.value,
      status: status.value,
      deviceType: deviceType.value,
      osName: osName.value,
      osVersion: osVersion.value,
      browserName: browserName.value,
      browserVersion: browserVersion.value,
      locale: locale.value,
      seed: seed.value || undefined,
    });
    success.value = "Fingerprint generated.";
    name.value = "";
    seed.value = "";
    await loadData();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to generate fingerprint.";
  } finally {
    saving.value = false;
  }
}

async function showDetail(id: string) {
  clearMessages();
  try {
    selected.value = (await window.appRuntime.fingerprints.get({ id })) as FingerprintRecord;
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to load fingerprint detail.";
  }
}

async function toggleStatus(item: FingerprintRecord) {
  clearMessages();
  try {
    const nextStatus = item.status === "active" ? "inactive" : "active";
    await window.appRuntime.fingerprints.setStatus({ id: item.id, status: nextStatus });
    success.value = "Fingerprint status updated.";
    await loadData();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to update status.";
  }
}

async function removeFingerprint(item: FingerprintRecord) {
  if (!window.confirm(`Delete fingerprint ${item.name}?`)) return;
  clearMessages();
  try {
    await window.appRuntime.fingerprints.delete({ id: item.id });
    success.value = "Fingerprint deleted.";
    if (selected.value?.id === item.id) selected.value = null;
    await loadData();
  } catch (cause) {
    error.value = cause instanceof Error ? cause.message : "Unable to delete fingerprint.";
  }
}

onMounted(loadData);
</script>

<template>
  <div class="space-y-6">
    <div class="flex flex-col justify-between gap-3 md:flex-row md:items-center">
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Fingerprints</h1>
        <p class="text-muted-foreground">Generate and review consistent device fingerprints.</p>
      </div>
      <Badge variant="secondary">{{ fingerprints.length }} fingerprints</Badge>
    </div>

    <Alert v-if="error" variant="destructive"><AlertDescription>{{ error }}</AlertDescription></Alert>
    <Alert v-if="success"><AlertDescription>{{ success }}</AlertDescription></Alert>

    <Card>
      <CardHeader>
        <CardTitle>Generate fingerprint</CardTitle>
        <CardDescription>Device selection automatically narrows compatible OS and browser options.</CardDescription>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="generateFingerprint">
          <div class="space-y-2"><Label for="fp-name">Name</Label><Input id="fp-name" v-model="name" placeholder="Chrome Windows 11" required /></div>
          <div class="space-y-2"><Label for="fp-status">Status</Label><select id="fp-status" v-model="status" class="form-select"><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
          <div class="space-y-2"><Label for="fp-device">Device type</Label><select id="fp-device" v-model="deviceType" class="form-select"><option value="desktop">Desktop</option><option value="mobile">Mobile</option></select></div>
          <div class="space-y-2"><Label for="fp-os">OS</Label><select id="fp-os" v-model="osName" class="form-select"><option v-for="option in osOptions" :key="option" :value="option">{{ option }}</option></select></div>
          <div class="space-y-2"><Label for="fp-os-version">OS version</Label><select id="fp-os-version" v-model="osVersion" class="form-select"><option v-for="option in osVersions" :key="option" :value="option">{{ option }}</option></select></div>
          <div class="space-y-2"><Label for="fp-browser">Browser</Label><select id="fp-browser" v-model="browserName" class="form-select"><option v-for="option in browserOptions" :key="option" :value="option">{{ option }}</option></select></div>
          <div class="space-y-2"><Label for="fp-browser-version">Browser version</Label><select id="fp-browser-version" v-model="browserVersion" class="form-select"><option v-for="option in browserVersions" :key="option" :value="option">{{ option }}</option></select></div>
          <div class="space-y-2"><Label for="fp-locale">Locale</Label><Input id="fp-locale" v-model="locale" placeholder="en-US" required /></div>
          <div class="space-y-2 md:col-span-2"><Label for="fp-seed">Seed (optional)</Label><Input id="fp-seed" v-model="seed" placeholder="Leave empty to generate a unique seed" /></div>
          <div class="md:col-span-2"><Button type="submit" :disabled="saving || !currentCapability">{{ saving ? "Generating..." : "Generate fingerprint" }}</Button></div>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader><div class="flex flex-col justify-between gap-3 md:flex-row md:items-center"><div><CardTitle>Fingerprint list</CardTitle><CardDescription>Preset version dan compatibility warning disimpan bersama profile.</CardDescription></div><Input v-model="search" class="md:max-w-xs" placeholder="Search fingerprints..." /></div></CardHeader>
      <CardContent>
        <div class="overflow-x-auto"><Table><TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Device / OS</TableHead><TableHead>Browser</TableHead><TableHead>Locale</TableHead><TableHead>Status</TableHead><TableHead class="text-right">Action</TableHead></TableRow></TableHeader><TableBody>
          <TableRow v-if="loading"><TableCell colspan="6" class="text-muted-foreground text-center">Loading...</TableCell></TableRow>
          <TableRow v-else-if="filteredFingerprints.length === 0"><TableCell colspan="6" class="text-muted-foreground text-center">No fingerprints found.</TableCell></TableRow>
          <TableRow v-for="item in filteredFingerprints" v-else :key="item.id"><TableCell><div class="font-medium">{{ item.name }}</div><div class="text-muted-foreground text-xs">{{ formatDate(item.createdAt) }}</div></TableCell><TableCell class="capitalize">{{ item.deviceType }} / {{ item.osName }} {{ item.osVersion }}</TableCell><TableCell>{{ item.browserName }} {{ item.browserVersion }}</TableCell><TableCell>{{ item.locale }}</TableCell><TableCell><Badge variant="secondary">{{ item.status }}</Badge></TableCell><TableCell class="space-x-2 text-right"><Button size="sm" variant="outline" @click="showDetail(item.id)">Detail</Button><Button size="sm" variant="outline" @click="toggleStatus(item)">{{ item.status === 'active' ? 'Disable' : 'Enable' }}</Button><Button size="sm" variant="destructive" @click="removeFingerprint(item)">Delete</Button></TableCell></TableRow>
        </TableBody></Table></div>
      </CardContent>
    </Card>

    <Card v-if="selected"><CardHeader><CardTitle>Fingerprint detail</CardTitle><CardDescription>{{ selected.name }} · {{ selected.presetVersion }}</CardDescription></CardHeader><CardContent class="space-y-3"><div v-if="selected.compatibilityWarnings?.length" class="space-y-2"><Badge variant="destructive">Compatibility warning</Badge><ul class="text-muted-foreground list-disc pl-5 text-sm"><li v-for="warning in selected.compatibilityWarnings" :key="warning">{{ warning }}</li></ul></div><div class="grid gap-3 md:grid-cols-2"><div><p class="text-muted-foreground text-xs">User agent</p><p class="break-all text-sm">{{ selected.userAgent }}</p></div><div><p class="text-muted-foreground text-xs">Timezone</p><p class="text-sm">{{ selected.timezone }}</p></div></div><Button variant="ghost" @click="selected = null">Close detail</Button></CardContent></Card>
  </div>
</template>

<style scoped>
.form-select { width: 100%; height: 2.5rem; border: 1px solid var(--input); border-radius: .375rem; background: var(--background); padding: 0 .75rem; font-size: .875rem; }
.form-select:focus-visible { outline: 2px solid var(--ring); outline-offset: 2px; }
</style>
