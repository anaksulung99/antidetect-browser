<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type Protocol = "http" | "https" | "socks4" | "socks5";
interface ProxyRecord {
  id: string;
  name: string;
  protocol: Protocol;
  host: string;
  port: number;
  hasCredential: boolean;
  status: "active" | "inactive";
  country: string | null;
  city: string | null;
  isp: string | null;
  timezone: string | null;
  detectedIp: string | null;
  latencyMs: number | null;
  lastCheckedAt: Date | string | null;
  checkError: string | null;
}

const proxies = ref<ProxyRecord[]>([]);
const mode = ref<"single" | "bulk">("single");
const editingId = ref<string | null>(null);
const name = ref("");
const protocol = ref<Protocol>("http");
const endpoint = ref("");
const username = ref("");
const password = ref("");
const bulkEndpoints = ref("");
const bulkPrefix = ref("Proxy");
const bulkProtocol = ref<Protocol>("http");
const search = ref("");
const selectedIds = ref<string[]>([]);
const loading = ref(false);
const saving = ref(false);
const checking = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);

const filteredProxies = computed(() => {
  const query = search.value.trim().toLowerCase();
  if (!query) return proxies.value;
  return proxies.value.filter((proxy) =>
    [proxy.name, proxy.host, proxy.protocol, proxy.country, proxy.isp]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(query))
  );
});

function clearMessages() {
  error.value = null;
  success.value = null;
}

function formatDate(value: Date | string | null) {
  return value
    ? new Intl.DateTimeFormat(undefined, {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(new Date(value))
    : "Never";
}

function resetForm() {
  editingId.value = null;
  name.value = "";
  protocol.value = "http";
  endpoint.value = "";
  username.value = "";
  password.value = "";
}

async function loadProxies() {
  loading.value = true;
  try {
    proxies.value = (await window.appRuntime.proxies.list()) as ProxyRecord[];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to load proxies.";
  } finally {
    loading.value = false;
  }
}

function editProxy(proxy: ProxyRecord) {
  clearMessages();
  editingId.value = proxy.id;
  name.value = proxy.name;
  protocol.value = proxy.protocol;
  endpoint.value = `${proxy.host}:${proxy.port}`;
  username.value = "";
  password.value = "";
}

function credentialPayload() {
  return username.value || password.value
    ? { username: username.value, password: password.value }
    : null;
}

async function saveProxy() {
  clearMessages();
  saving.value = true;
  try {
    const data = {
      name: name.value,
      protocol: protocol.value,
      endpoint: endpoint.value,
      credential: credentialPayload(),
    };
    if (editingId.value) {
      await window.appRuntime.proxies.update({ id: editingId.value, data });
      success.value = "Proxy updated.";
    } else {
      await window.appRuntime.proxies.create(data);
      success.value = "Proxy created.";
    }
    resetForm();
    await loadProxies();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to save proxy.";
  } finally {
    saving.value = false;
  }
}

async function saveBulk() {
  clearMessages();
  saving.value = true;
  try {
    const result = await window.appRuntime.proxies.createBulk({
      protocol: bulkProtocol.value,
      endpoints: bulkEndpoints.value,
      namePrefix: bulkPrefix.value,
    });
    success.value = `${result.created} proxies imported.`;
    bulkEndpoints.value = "";
    await loadProxies();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to import proxies.";
  } finally {
    saving.value = false;
  }
}

async function removeProxy(proxy: ProxyRecord) {
  if (!window.confirm(`Delete proxy ${proxy.name}?`)) return;
  clearMessages();
  try {
    await window.appRuntime.proxies.delete({ id: proxy.id });
    success.value = "Proxy deleted.";
    await loadProxies();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to delete proxy.";
  }
}

function toggleSelected(id: string) {
  selectedIds.value = selectedIds.value.includes(id)
    ? selectedIds.value.filter((value) => value !== id)
    : [...selectedIds.value, id];
}

async function checkSingle(id: string) {
  clearMessages();
  checking.value = true;
  try {
    const result = (await window.appRuntime.proxies.check({ id })) as {
      success: boolean;
      message?: string;
    };
    success.value = result.success
      ? "Proxy check succeeded."
      : (result.message ?? "Proxy check failed.");
    await loadProxies();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to check proxy.";
  } finally {
    checking.value = false;
  }
}

async function checkBulk() {
  if (!selectedIds.value.length) return;
  clearMessages();
  checking.value = true;
  try {
    const results = await window.appRuntime.proxies.checkBulk({
      ids: selectedIds.value,
    });
    const successCount = results.filter(
      (result) => (result as { success: boolean }).success
    ).length;
    success.value = `${successCount}/${results.length} proxy checks succeeded.`;
    selectedIds.value = [];
    await loadProxies();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to check proxies.";
  } finally {
    checking.value = false;
  }
}

onMounted(loadProxies);
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">Proxies</h1>
        <p class="text-muted-foreground">
          Kelola endpoint proxy dan periksa konektivitasnya.
        </p>
      </div>
      <Badge variant="secondary">{{ proxies.length }} proxies</Badge>
    </div>
    <Alert v-if="error" variant="destructive"
      ><AlertDescription>{{ error }}</AlertDescription></Alert
    >
    <Alert v-if="success"
      ><AlertDescription>{{ success }}</AlertDescription></Alert
    >

    <Card
      ><CardHeader
        ><div class="flex gap-2">
          <Button
            :variant="mode === 'single' ? 'default' : 'outline'"
            type="button"
            @click="mode = 'single'"
            >Single proxy</Button
          ><Button
            :variant="mode === 'bulk' ? 'default' : 'outline'"
            type="button"
            @click="mode = 'bulk'"
            >Bulk import</Button
          >
        </div></CardHeader
      ><CardContent>
        <form
          v-if="mode === 'single'"
          class="grid gap-4 md:grid-cols-2"
          @submit.prevent="saveProxy"
        >
          <div class="space-y-2">
            <Label for="proxy-name">Name</Label
            ><Input
              id="proxy-name"
              v-model="name"
              required
              placeholder="US residential 01"
            />
          </div>
          <div class="space-y-2">
            <Label for="proxy-protocol">Protocol</Label>
            <Select id="proxy-protocol" v-model="protocol">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="protocol ?? 'Select role'" />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="http">HTTP</SelectItem>
                  <SelectItem value="https">HTTPS</SelectItem>
                  <SelectItem value="socks4">SOCKS4</SelectItem>
                  <SelectItem value="socks5">SOCKS5</SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <div class="space-y-2 md:col-span-2">
            <Label for="proxy-endpoint">Endpoint</Label>
            <Input
              id="proxy-endpoint"
              v-model="endpoint"
              required
              placeholder="host:port or host:port:username:password"
            />
          </div>
          <div class="space-y-2">
            <Label for="proxy-username">Username (optional)</Label>
            <Input id="proxy-username" v-model="username" autocomplete="off" />
          </div>
          <div class="space-y-2">
            <Label for="proxy-password">Password (optional)</Label>
            <Input
              id="proxy-password"
              v-model="password"
              type="password"
              autocomplete="new-password"
            />
          </div>
          <div class="flex gap-2 md:col-span-2">
            <Button type="submit" :disabled="saving">
              {{
                saving
                  ? "Saving..."
                  : editingId
                    ? "Save changes"
                    : "Create proxy"
              }}
            </Button>
            <Button
              v-if="editingId"
              variant="ghost"
              type="button"
              @click="resetForm"
              >Cancel</Button
            >
          </div>
        </form>
        <form v-else class="grid gap-4" @submit.prevent="saveBulk">
          <div class="grid gap-4 md:grid-cols-2">
            <div class="space-y-2">
              <Label for="bulk-protocol">Protocol</Label>
              <Select id="bulk-protocol" v-model="bulkProtocol">
                <SelectTrigger class="w-full">
                  <SelectValue :placeholder="protocol ?? 'Select role'" />
                </SelectTrigger>
                <SelectContent class="w-full">
                  <SelectGroup>
                    <SelectItem value="http">HTTP</SelectItem>
                    <SelectItem value="https">HTTPS</SelectItem>
                    <SelectItem value="socks4">SOCKS4</SelectItem>
                    <SelectItem value="socks5">SOCKS5</SelectItem>
                  </SelectGroup>
                </SelectContent>
              </Select>
            </div>
            <div class="space-y-2">
              <Label for="bulk-prefix">Name prefix</Label>
              <Input id="bulk-prefix" v-model="bulkPrefix" />
            </div>
          </div>
          <div class="space-y-2">
            <Label for="bulk-endpoints">Proxy endpoints</Label>
            <Textarea
              id="bulk-endpoints"
              v-model="bulkEndpoints"
              rows="6"
              placeholder="host:port&#10;host:port:username:password"
              required
            />
          </div>
          <Button type="submit" :disabled="saving">
            {{ saving ? "Importing..." : "Import proxies" }}
          </Button>
        </form>
      </CardContent></Card
    >

    <Card
      ><CardHeader
        ><div
          class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
        >
          <div>
            <CardTitle>Proxy list</CardTitle
            ><CardDescription
              >Credentials tidak pernah ditampilkan kembali.</CardDescription
            >
          </div>
          <div class="flex gap-2">
            <Input v-model="search" placeholder="Search proxies..." /><Button
              variant="outline"
              :disabled="checking || !selectedIds.length"
              @click="checkBulk"
              >Check selected</Button
            >
          </div>
        </div></CardHeader
      ><CardContent
        ><div class="overflow-x-auto">
          <Table
            ><TableHeader
              ><TableRow
                ><TableHead></TableHead><TableHead>Name</TableHead
                ><TableHead>Protocol</TableHead
                ><TableHead>Location / ISP</TableHead
                ><TableHead>Latency</TableHead><TableHead>Last check</TableHead
                ><TableHead class="text-right">Action</TableHead></TableRow
              ></TableHeader
            ><TableBody
              ><TableRow v-if="loading"
                ><TableCell
                  colspan="7"
                  class="text-muted-foreground text-center"
                  >Loading...</TableCell
                ></TableRow
              ><TableRow v-else-if="filteredProxies.length === 0"
                ><TableCell
                  colspan="7"
                  class="text-muted-foreground text-center"
                  >No proxies found.</TableCell
                ></TableRow
              ><TableRow v-for="proxy in filteredProxies" v-else :key="proxy.id"
                ><TableCell
                  ><input
                    type="checkbox"
                    :checked="selectedIds.includes(proxy.id)"
                    @change="toggleSelected(proxy.id)" /></TableCell
                ><TableCell
                  ><div class="font-medium">{{ proxy.name }}</div>
                  <div class="text-muted-foreground text-xs">
                    {{ proxy.host }}:{{ proxy.port }} ·
                    {{ proxy.hasCredential ? "credentialed" : "no credential" }}
                  </div></TableCell
                ><TableCell class="uppercase">{{ proxy.protocol }}</TableCell
                ><TableCell>{{
                  [proxy.country, proxy.city, proxy.isp]
                    .filter(Boolean)
                    .join(" · ") || "Not checked"
                }}</TableCell
                ><TableCell>{{
                  proxy.latencyMs ? `${proxy.latencyMs} ms` : "—"
                }}</TableCell
                ><TableCell>{{ formatDate(proxy.lastCheckedAt) }}</TableCell
                ><TableCell class="space-x-2 text-right"
                  ><Button
                    size="sm"
                    variant="outline"
                    :disabled="checking"
                    @click="checkSingle(proxy.id)"
                    >Check</Button
                  ><Button size="sm" variant="outline" @click="editProxy(proxy)"
                    >Edit</Button
                  ><Button
                    size="sm"
                    variant="destructive"
                    @click="removeProxy(proxy)"
                    >Delete</Button
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
.form-select,
.form-textarea {
  width: 100%;
  border: 1px solid var(--input);
  border-radius: 0.375rem;
  background: var(--background);
  padding: 0.5rem 0.75rem;
  font-size: 0.875rem;
}
.form-select {
  height: 2.5rem;
}
.form-select:focus-visible,
.form-textarea:focus-visible {
  outline: 2px solid var(--ring);
  outline-offset: 2px;
}
</style>
