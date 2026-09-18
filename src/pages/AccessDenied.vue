<script setup lang="ts">
const route = useRoute();
const router = useRouter();

const requiredRoles = computed(() => {
  const raw = route.query.roles;

  if (Array.isArray(raw)) {
    return raw.filter(Boolean).join(", ");
  }

  return typeof raw === "string" ? raw : "admin";
});

function goBack() {
  if (window.history.length > 1) {
    router.back();
    return;
  }

  void router.replace({ name: "Dashboard" });
}
</script>

<template>
  <div class="min-h-screen flex items-center justify-center p-6">
    <Card class="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Akses Ditolak</CardTitle>
        <CardDescription>
          Akun Anda belum memiliki role yang dibutuhkan untuk membuka halaman
          ini.
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-4">
        <Alert variant="destructive">
          <AlertDescription>
            Halaman ini memerlukan role: <strong>{{ requiredRoles }}</strong>
          </AlertDescription>
        </Alert>

        <p class="text-sm text-muted-foreground">
          Silakan hubungi administrator atau gunakan akun dengan role yang
          sesuai.
        </p>

        <div class="flex gap-3">
          <Button variant="outline" @click="goBack">Kembali</Button>
          <Button @click="router.replace({ name: 'Dashboard' })">
            Ke Dashboard
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
