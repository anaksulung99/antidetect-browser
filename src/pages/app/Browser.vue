<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

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

const isEditing = computed(() => editingId.value !== null);
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

function setError(cause: unknown, fallback: string) {
  error.value = cause instanceof Error ? cause.message : fallback;
}

async function loadData() {
  loading.value = true;
  error.value = null;
  try {
    const [profileResult, optionResult] = await Promise.all([
      window.appRuntime.browserProfiles.list(),
      window.appRuntime.browserProfiles.options(),
    ]);
    profiles.value = profileResult as BrowserProfile[];
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
            <Input
              id="browser-language"
              v-model="form.language"
              placeholder="en-US"
              required
            />
          </div>
          <div class="space-y-2">
            <Label for="browser-timezone">Timezone</Label>
            <Input
              id="browser-timezone"
              v-model="form.timezone"
              placeholder="America/New_York"
            />
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
                <TableCell
                  ><Badge variant="secondary">{{
                    profile.status
                  }}</Badge></TableCell
                >
                <TableCell class="space-x-2 text-right">
                  <Button
                    size="sm"
                    variant="outline"
                    :disabled="profile.status === 'running'"
                    @click="editProfile(profile)"
                    >Edit</Button
                  >
                  <Button
                    size="sm"
                    variant="destructive"
                    :disabled="profile.status === 'running'"
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
