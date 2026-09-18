<script setup lang="ts">
import { onMounted, ref } from "vue";

const authStore = useAuthStore();
const databaseStatus = ref<Awaited<
  ReturnType<typeof window.appRuntime.getDatabaseStatus>
> | null>(null);

onMounted(async () => {
  databaseStatus.value = await window.appRuntime.getDatabaseStatus();
});
</script>

<template>
  <div class="space-y-6">
    <div>
      <h1 class="text-2xl font-semibold tracking-tight">Dashboard</h1>
      <p class="text-muted-foreground">
        Selamat datang kembali, {{ authStore.user?.name }}.
      </p>
    </div>

    <div class="grid gap-4 md:grid-cols-3">
      <Card>
        <CardHeader>
          <CardDescription>Signed in as</CardDescription>
          <CardTitle class="truncate text-lg">{{
            authStore.user?.email
          }}</CardTitle>
        </CardHeader>
        <CardContent>
          <Badge variant="outline" class="capitalize">{{
            authStore.user?.role
          }}</Badge>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Database</CardDescription>
          <CardTitle class="text-lg">
            {{ databaseStatus?.reachable ? "Connected" : "Unavailable" }}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground text-sm">
            {{ databaseStatus?.message ?? "Checking connection..." }}
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardDescription>Runtime</CardDescription>
          <CardTitle class="text-lg">Electron Desktop</CardTitle>
        </CardHeader>
        <CardContent>
          <p class="text-muted-foreground text-sm">Session protected</p>
        </CardContent>
      </Card>
    </div>

    <Card>
      <CardHeader>
        <CardTitle>Next workspace</CardTitle>
        <CardDescription>
          Browser profiles, fingerprints, dan proxies akan tersedia setelah
          modul management berikutnya diimplementasikan.
        </CardDescription>
      </CardHeader>
    </Card>
  </div>
</template>
