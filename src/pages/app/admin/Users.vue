<script setup lang="ts">
import { computed, onMounted, ref } from "vue";

type ManagedStatus = "active" | "inactive" | "suspended";

interface AdminUser {
  id: string;
  email: string;
  name: string;
  role: "admin" | "user";
  status: "active" | "inactive" | "invited" | "suspended";
  lastLoginAt: Date | null;
}

const authStore = useAuthStore();
const users = ref<AdminUser[]>([]);
const email = ref("");
const role = ref<"admin" | "user">("user");
const loading = ref(false);
const inviting = ref(false);
const error = ref<string | null>(null);
const success = ref<string | null>(null);
const invitationToken = ref<string | null>(null);

const activeUsers = computed(
  () => users.value.filter((user) => user.status === "active").length
);

function formatDate(value: Date | string | null): string {
  if (!value) return "Never";
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

function clearMessage() {
  error.value = null;
  success.value = null;
  invitationToken.value = null;
}

async function loadUsers() {
  loading.value = true;
  error.value = null;
  try {
    users.value = (await window.appRuntime.auth.listUsers()) as AdminUser[];
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to load users.";
  } finally {
    loading.value = false;
  }
}

async function invite() {
  clearMessage();
  inviting.value = true;
  try {
    const result = await window.appRuntime.auth.inviteUser({
      email: email.value,
      role: role.value,
    });
    success.value = `Invitation created for ${result.email}.`;
    invitationToken.value = result.token;
    email.value = "";
    role.value = "user";
    await loadUsers();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to invite user.";
  } finally {
    inviting.value = false;
  }
}

async function updateStatus(user: AdminUser, status: ManagedStatus) {
  clearMessage();
  try {
    await window.appRuntime.auth.setUserStatus({ userId: user.id, status });
    success.value = `${user.email} status updated.`;
    await loadUsers();
  } catch (cause) {
    error.value =
      cause instanceof Error ? cause.message : "Unable to update status.";
  }
}

onMounted(loadUsers);
</script>

<template>
  <div class="space-y-6">
    <div
      class="flex flex-col justify-between gap-3 md:flex-row md:items-center"
    >
      <div>
        <h1 class="text-2xl font-semibold tracking-tight">User Management</h1>
        <p class="text-muted-foreground">
          Kelola akses Admin dan User aplikasi.
        </p>
      </div>
      <Badge variant="secondary">{{ activeUsers }} active users</Badge>
    </div>

    <Alert v-if="error" variant="destructive">
      <AlertDescription>{{ error }}</AlertDescription>
    </Alert>
    <Alert v-if="success">
      <AlertDescription>
        {{ success }}
        <span
          v-if="invitationToken"
          class="mt-2 block break-all font-mono text-xs"
        >
          Invitation token: {{ invitationToken }}
        </span>
      </AlertDescription>
    </Alert>

    <Card>
      <CardHeader>
        <CardTitle>Invite user</CardTitle>
        <CardDescription>
          Invitation berlaku selama 48 jam dan harus diselesaikan oleh penerima.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form
          class="grid gap-4 md:grid-cols-[1fr_180px_auto]"
          @submit.prevent="invite"
        >
          <div class="space-y-2">
            <Label for="invite-email">Email</Label>
            <Input
              id="invite-email"
              v-model="email"
              type="email"
              placeholder="user@example.com"
              required
              :disabled="inviting"
            />
          </div>
          <div class="space-y-2">
            <Label for="invite-role">Role</Label>
            <Select id="invite-role" v-model="role" :disabled="inviting">
              <SelectTrigger class="w-full">
                <SelectValue :placeholder="role ? role : 'Select role'" />
              </SelectTrigger>
              <SelectContent class="w-full">
                <SelectGroup>
                  <SelectItem value="user"> User </SelectItem>
                  <SelectItem value="admin"> Admin </SelectItem>
                </SelectGroup>
              </SelectContent>
            </Select>
          </div>
          <Button class="self-end" type="submit" :disabled="inviting || !email">
            {{ inviting ? "Inviting..." : "Create invitation" }}
          </Button>
        </form>
      </CardContent>
    </Card>

    <Card>
      <CardHeader>
        <CardTitle>Users</CardTitle>
        <CardDescription>
          User hanya dapat dikelola oleh Admin aktif.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>User</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last login</TableHead>
                <TableHead class="text-right">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow v-if="loading">
                <TableCell
                  colspan="5"
                  class="text-muted-foreground text-center"
                >
                  Loading users...
                </TableCell>
              </TableRow>
              <TableRow v-else-if="users.length === 0">
                <TableCell
                  colspan="5"
                  class="text-muted-foreground text-center"
                >
                  No users found.
                </TableCell>
              </TableRow>
              <TableRow v-for="user in users" v-else :key="user.id">
                <TableCell>
                  <div class="font-medium">{{ user.name }}</div>
                  <div class="text-muted-foreground text-xs">
                    {{ user.email }}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" class="uppercase text-xs">{{
                    user.role
                  }}</Badge>
                </TableCell>
                <TableCell>
                  <Badge
                    :variant="
                      user.status === 'active' ? 'default' : 'secondary'
                    "
                    class="uppercase text-xs"
                  >
                    {{ user.status }}
                  </Badge>
                </TableCell>
                <TableCell>{{ formatDate(user.lastLoginAt) }}</TableCell>
                <TableCell class="text-right">
                  <select
                    :value="user.status"
                    class="border-input bg-background h-9 rounded-md border px-2 text-xs"
                    :disabled="user.id === authStore.user?.id"
                    @change="
                      updateStatus(
                        user,
                        ($event.target as HTMLSelectElement)
                          .value as ManagedStatus
                      )
                    "
                  >
                    <option value="active">Active</option>
                    <option value="inactive">Inactive</option>
                    <option value="suspended">Suspended</option>
                  </select>
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
