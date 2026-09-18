<script setup lang="ts">
import { computed, onMounted, ref } from "vue";
import { TimezoneList } from "@/utils/timezone";
import { LocaleList } from "@/utils/locales";

interface FingerprintOption {
  id: string;
  name: string;
  deviceType: string;
  browserName: string;
  browserVersion: string;
}

interface ProxyOption {
  id: string;
  name: string;
  protocol: string;
  host: string;
  port: number;
}

interface BrowserProfile {
  id: string;
  name: string;
  status: string;
  engine: "chromium" | "firefox" | "webkit";
  fingerprintId: string;
  fingerprintName: string | null;
  proxyId: string | null;
  proxyName: string | null;
  proxyEnabled: boolean;
  languageMode: "proxy" | "custom";
  language: string;
  timezone: string | null;
}

type ProfileForm = {
  name: string;
  engine: BrowserProfile["engine"];
  fingerprintId: string;
  proxyEnabled: boolean;
  proxyId: string | null;
  languageMode: BrowserProfile["languageMode"];
  language: string;
  timezone: string;
};

type BrowserDiagnostics = {
  profile: { name: string; engine: string };
  browser: {
    userAgent: string;
    platform: string;
    webdriver: boolean;
    userAgentData: {
      brands: unknown[];
      mobile: boolean;
      platform: string;
    } | null;
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
};

const emptyForm = (): ProfileForm => ({
  name: "",
  engine: "chromium",
  fingerprintId: "",
  proxyEnabled: false,
  proxyId: null,
  languageMode: "custom",
  language: "en-US",
  timezone: "",
});

const profiles = ref<BrowserProfile[]>([]);
const fingerprints = ref<FingerprintOption[]>([]);
const proxies = ref<ProxyOption[]>([]);
const form = ref<ProfileForm>(emptyForm());
const editingId = ref<string | null>(null);
const loading = ref(false);
const saving = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const search = ref("");
const runtimeIds = ref(new Set<string>());
const diagnostics = ref<BrowserDiagnostics | null>(null);
const diagnosticsProfileId = ref<string | null>(null);
const diagnosticsLoading = ref(false);

const isEditing = computed(() => editingId.value !== null);
const isRunning = (profile: BrowserProfile) =>
  runtimeIds.value.has(profile.id) || profile.status === "running";

const filteredProfiles = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return profiles.value;
  return profiles.value.filter((profile) =>
    [profile.name, profile.engine, profile.fingerprintName, profile.proxyName]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

function resetForm() {
  form.value = emptyForm();
  editingId.value = null;
}

function clearMessages() {
  error.value = null;
  success.value = null;
}

function setError(cause: unknown, fallback: string) {
  error.value = cause instanceof Error ? cause.message : fallback;
}

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const [profileResult, optionResult, runtimeResult] = await Promise.all([
      window.appRuntime.browserProfiles.list(),
      window.appRuntime.browserProfiles.options(),
      window.appRuntime.browserRuntime.statuses(),
    ]);
    profiles.value = profileResult as BrowserProfile[];
    runtimeIds.value = new Set(runtimeResult);
    const options = optionResult as {
      fingerprints: FingerprintOption[];
      proxies: ProxyOption[];
    };
    fingerprints.value = options.fingerprints;
    proxies.value = options.proxies;
  } catch (cause) {
    setError(cause, "Unable to load browser profiles.");
  } finally {
    loading.value = false;
  }
}

function editProfile(profile: BrowserProfile) {
  success.value = null;
  error.value = null;
  editingId.value = profile.id;
  form.value = {
    name: profile.name,
    engine: profile.engine,
    fingerprintId: profile.fingerprintId,
    proxyEnabled: profile.proxyEnabled,
    proxyId: profile.proxyId,
    languageMode: profile.languageMode,
    language: profile.language,
    timezone: profile.timezone ?? "",
  };
  window.scrollTo({ top: 0, behavior: "smooth" });
}

async function saveProfile() {
  error.value = null;
  success.value = null;
  saving.value = true;
  try {
    if (!form.value.fingerprintId) {
      throw new Error("Select a fingerprint before saving the profile.");
    }
    if (form.value.proxyEnabled && !form.value.proxyId) {
      throw new Error("Select a proxy when proxy is enabled.");
    }

    if (editingId.value) {
      await window.appRuntime.browserProfiles.update({
        profileId: editingId.value,
        data: {
          ...form.value,
          proxyId: form.value.proxyId || null,
          timezone: form.value.timezone || null,
        },
      });
      success.value = "Browser profile updated.";
    } else {
      await window.appRuntime.browserProfiles.create({
        ...form.value,
        proxyId: form.value.proxyId || null,
        timezone: form.value.timezone || null,
      });
      success.value = "Browser profile created.";
    }
    resetForm();
    await loadData();
  } catch (cause) {
    setError(cause, "Unable to save browser profile.");
  } finally {
    saving.value = false;
  }
}

async function startProfile(profile: BrowserProfile) {
  clearMessages();
  try {
    await window.appRuntime.browserRuntime.start({ profileId: profile.id });
    success.value = "Browser started.";
    await loadData();
  } catch (cause) {
    setError(cause, "Unable to start browser.");
  }
}

async function stopProfile(profile: BrowserProfile) {
  clearMessages();
  try {
    await window.appRuntime.browserRuntime.stop({ profileId: profile.id });
    success.value = "Browser stopped.";
    await loadData();
  } catch (cause) {
    setError(cause, "Unable to stop browser.");
  }
}

async function restartProfile(profile: BrowserProfile) {
  clearMessages();
  try {
    await window.appRuntime.browserRuntime.restart({ profileId: profile.id });
    success.value = "Browser restarted.";
    await loadData();
  } catch (cause) {
    setError(cause, "Unable to restart browser.");
  }
}

async function inspectProfile(profile: BrowserProfile) {
  clearMessages();
  diagnosticsLoading.value = true;
  diagnosticsProfileId.value = profile.id;
  try {
    diagnostics.value = (await window.appRuntime.browserRuntime.diagnostics({
      profileId: profile.id,
    })) as BrowserDiagnostics;
  } catch (cause) {
    setError(cause, "Unable to inspect browser profile.");
  } finally {
    diagnosticsLoading.value = false;
    diagnosticsProfileId.value = null;
  }
}

async function removeProfile(profile: BrowserProfile) {
  if (!window.confirm(`Delete browser profile ${profile.name}?`)) return;
  error.value = null;
  success.value = null;
  try {
    await window.appRuntime.browserProfiles.delete({ profileId: profile.id });
    success.value = "Browser profile deleted.";
    if (editingId.value === profile.id) resetForm();
    await loadData();
  } catch (cause) {
    setError(cause, "Unable to delete browser profile.");
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
        <h1 class="text-2xl font-semibold tracking-tight">Browser Profiles</h1>
        <p class="text-muted-foreground">
          Kelola profile browser yang terisolasi berdasarkan fingerprint dan
          proxy.
        </p>
      </div>
      <Badge variant="secondary">{{ profiles.length }} profiles</Badge>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
    <Alert v-if="success">
      <AlertDescription>{{ success }}</AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <div class="flex items-center justify-between gap-3">
          <div>
            <CardTitle>{{
              isEditing ? "Edit profile" : "Create profile"
            }}</CardTitle>
            <CardDescription>
              Browser engine dan fingerprint harus kompatibel.
            </CardDescription>
          </div>
          <Button
            v-if="isEditing"
            variant="ghost"
            type="button"
            @click="resetForm"
          >
            Cancel
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <form class="grid gap-4 md:grid-cols-2" @submit.prevent="saveProfile">
          <div class="space-y-2">
            <Label for="browser-name">Name</Label>
            <Input
              id="browser-name"
              v-model="form.name"
              placeholder="Work profile"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="browser-engine">Browser engine</Label>
            <Select id="browser-engine" v-model="form.engine">
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="form.engine ? form.engine : 'Select engine'"
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="chromium"> Chromium </SelectItem>
                  <SelectItem value="firefox"> Firefox </SelectItem>
                  <SelectItem value="webkit"> WebKit </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="browser-fingerprint">Fingerprint</Label>
            <Select
              id="browser-fingerprint"
              v-model="form.fingerprintId"
              required
            >
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    fingerprints.find((f) => f.id === form.fingerprintId)
                      ?.name ?? 'Select fingerprint'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem
                    v-for="fingerprint in fingerprints"
                    :key="fingerprint.id"
                    :value="fingerprint.id"
                  >
                    {{ fingerprint.name }} — {{ fingerprint.deviceType }} /
                    {{ fingerprint.browserName }}
                    {{ fingerprint.browserVersion }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p
              v-if="fingerprints.length === 0"
              class="text-muted-foreground text-xs"
            >
              Buat fingerprint terlebih dahulu sebelum membuat browser profile.
            </p>
          </div>
          <div class="space-y-2">
            <Label for="browser-language">Language</Label>
            <Select id="browser-language" v-model="form.language" required>
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    LocaleList.find((t) => t.value === form.language)?.label ??
                    'Select Language'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem
                    v-for="option in LocaleList"
                    :key="option.value"
                    :value="option.value"
                  >
                    {{ option.label }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="browser-timezone">Timezone</Label>
            <Select id="browser-timezone" v-model="form.timezone">
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    TimezoneList.find((t) => t.id === form.timezone)?.name ??
                    'Select timezone'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem
                    v-for="option in TimezoneList"
                    :key="option.id"
                    :value="option.id"
                  >
                    {{ option.name }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2">
            <Label for="browser-language-mode">Language source</Label>
            <Select id="browser-language-mode" v-model="form.languageMode">
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    form.languageMode
                      ? form.languageMode
                      : 'Select language source'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="custom"> Custom </SelectItem>
                  <SelectItem value="proxy"> Proxy metadata </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2 md:col-span-2">
            <label class="flex items-center gap-2 text-sm">
              <input v-model="form.proxyEnabled" type="checkbox" />
              Enable proxy
            </label>

            <Select v-if="form.proxyEnabled" v-model="form.proxyId" required>
              <SelectTrigger class="w-full">
                <SelectValue
                  :placeholder="
                    proxies.find((p) => p.id === form.proxyId)?.name ||
                    'Select proxy'
                  "
                />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem
                    v-for="proxy in proxies"
                    :key="proxy.id"
                    :value="proxy.id"
                  >
                    {{ proxy.name }} — {{ proxy.protocol }}://{{
                      proxy.host
                    }}:{{ proxy.port }}
                  </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
            <p
              v-if="form.proxyEnabled && proxies.length === 0"
              class="text-muted-foreground mt-2 text-xs"
            >
              Buat proxy terlebih dahulu sebelum mengaktifkan proxy.
            </p>
          </div>
          <div class="md:col-span-2">
            <Button
              type="submit"
              :disabled="saving || fingerprints.length === 0"
            >
              {{
                saving
                  ? "Saving..."
                  : isEditing
                    ? "Save changes"
                    : "Create browser profile"
              }}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>

    <Card v-if="diagnostics">
      <CardHeader>
        <div class="flex items-center justify-between gap-3">
          <div>
            <CardTitle>Browser diagnostics</CardTitle>
            <CardDescription>
              Pemeriksaan aktual dari tab sementara profile
              {{ diagnostics.profile.name }}.
            </CardDescription>
          </div>
          <Badge variant="secondary">{{ diagnostics.profile.engine }}</Badge>
        </div>
      </CardHeader>
      <CardContent class="space-y-5 text-sm">
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div class="text-muted-foreground">Effective User-Agent</div>
            <div class="break-all">{{ diagnostics.browser.userAgent }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Platform</div>
            <div>{{ diagnostics.browser.platform }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Webdriver</div>
            <div>{{ diagnostics.browser.webdriver }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Timezone / Locale</div>
            <div>
              {{ diagnostics.browser.timezone }} /
              {{ diagnostics.browser.locale }}
            </div>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div class="text-muted-foreground">Viewport / Screen</div>
            <div>
              {{ diagnostics.browser.viewport.width }}×{{
                diagnostics.browser.viewport.height
              }}
              / {{ diagnostics.browser.screen.width }}×{{
                diagnostics.browser.screen.height
              }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground">WebGL</div>
            <div class="wrap-break-word">
              {{ diagnostics.browser.webgl.vendor }} /
              {{ diagnostics.browser.webgl.renderer }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground">WebGL2</div>
            <div class="wrap-break-word">
              {{ diagnostics.browser.webgl2.vendor }} /
              {{ diagnostics.browser.webgl2.renderer }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground">WebRTC candidates</div>
            <div>{{ diagnostics.browser.webrtcCandidates.length }}</div>
          </div>
        </div>
        <div class="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          <div>
            <div class="text-muted-foreground">Detected IP</div>
            <div>{{ diagnostics.network.ip ?? "Unavailable" }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Country / City</div>
            <div>
              {{ diagnostics.network.country ?? "-" }} /
              {{ diagnostics.network.city ?? "-" }}
            </div>
          </div>
          <div>
            <div class="text-muted-foreground">ISP</div>
            <div>{{ diagnostics.network.isp ?? "-" }}</div>
          </div>
          <div>
            <div class="text-muted-foreground">Network timezone</div>
            <div>{{ diagnostics.network.timezone ?? "-" }}</div>
          </div>
        </div>
        <div>
          <div class="mb-2 font-medium">Client headers</div>
          <pre class="overflow-x-auto rounded-md bg-muted p-3 text-xs">{{
            JSON.stringify(diagnostics.headers, null, 2)
          }}</pre>
        </div>
        <div>
          <div class="mb-2 font-medium">Fingerprint comparison</div>
          <div class="grid gap-2 md:grid-cols-2">
            <div
              :class="
                diagnostics.comparison.userAgent.match
                  ? 'text-green-600'
                  : 'text-destructive'
              "
            >
              User-Agent:
              {{
                diagnostics.comparison.userAgent.match ? "match" : "mismatch"
              }}
            </div>
            <div
              :class="
                diagnostics.comparison.locale.match
                  ? 'text-green-600'
                  : 'text-destructive'
              "
            >
              Locale:
              {{ diagnostics.comparison.locale.match ? "match" : "mismatch" }}
            </div>
            <div
              :class="
                diagnostics.comparison.timezone.match
                  ? 'text-green-600'
                  : 'text-destructive'
              "
            >
              Timezone:
              {{ diagnostics.comparison.timezone.match ? "match" : "mismatch" }}
            </div>
            <div
              :class="
                diagnostics.comparison.proxyTimezone.match !== false
                  ? 'text-green-600'
                  : 'text-destructive'
              "
            >
              Proxy timezone:
              {{
                diagnostics.comparison.proxyTimezone.expected ?? "not available"
              }}
              /
              {{
                diagnostics.comparison.proxyTimezone.match === null
                  ? "not checked"
                  : diagnostics.comparison.proxyTimezone.match
                    ? "match"
                    : "mismatch"
              }}
            </div>
          </div>
          <ul
            v-if="diagnostics.comparison.warnings.length"
            class="mt-3 list-disc space-y-1 pl-5 text-destructive"
          >
            <li
              v-for="warning in diagnostics.comparison.warnings"
              :key="warning"
            >
              {{ warning }}
            </li>
          </ul>
        </div>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <div
          class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
        >
          <div>
            <CardTitle>Profile list</CardTitle>
            <CardDescription
              >Profile yang sedang berjalan tidak dapat dihapus atau
              diedit.</CardDescription
            >
          </div>
          <Input
            v-model="search"
            class="md:max-w-xs"
            placeholder="Search profiles..."
          />
        </div>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Engine</TableHead>
                <TableHead>Fingerprint</TableHead>
                <TableHead>Proxy</TableHead>
                <TableHead>Status</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell colspan="6" class="text-muted-foreground text-center"
                  >Loading...</TableCell
                >
              </TableRow>
              <TableRow v-else-if="filteredProfiles.length === 0">
                <TableCell colspan="6" class="text-muted-foreground text-center"
                  >No profiles found.</TableCell
                >
              </TableRow>
              <TableRow
                v-for="profile in filteredProfiles"
                v-else
                :key="profile.id"
              >
                <TableCell class="font-medium">{{ profile.name }}</TableCell>
                <TableCell class="capitalize">{{ profile.engine }}</TableCell>
                <TableCell>{{
                  profile.fingerprintName ?? "Unavailable"
                }}</TableCell>
                <TableCell>{{
                  profile.proxyEnabled
                    ? (profile.proxyName ?? "Unavailable")
                    : "Disabled"
                }}</TableCell>
                <TableCell>
                  <Badge
                    :variant="isRunning(profile) ? 'default' : 'secondary'"
                  >
                    {{ isRunning(profile) ? "running" : profile.status }}
                  </Badge>
                </TableCell>
                <TableCell class="space-x-2 text-right">
                  <Button
                    v-if="!isRunning(profile)"
                    size="sm"
                    @click="startProfile(profile)"
                    >Start</Button
                  >
                  <Button
                    v-else
                    size="sm"
                    variant="outline"
                    @click="stopProfile(profile)"
                    >Stop</Button
                  >
                  <Button
                    v-if="isRunning(profile)"
                    size="sm"
                    variant="outline"
                    @click="restartProfile(profile)"
                    >Restart</Button
                  >
                  <Button
                    v-if="isRunning(profile)"
                    size="sm"
                    variant="outline"
                    :disabled="diagnosticsLoading"
                    @click="inspectProfile(profile)"
                    >{{
                      diagnosticsProfileId === profile.id
                        ? "Checking..."
                        : "Diagnostics"
                    }}</Button
                  >
                  <Button
                    size="sm"
                    variant="outline"
                    :disabled="isRunning(profile)"
                    @click="editProfile(profile)"
                    >Edit</Button
                  >
                  <Button
                    size="sm"
                    variant="destructive"
                    :disabled="isRunning(profile)"
                    @click="removeProfile(profile)"
                    >Delete</Button
                  >
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
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
