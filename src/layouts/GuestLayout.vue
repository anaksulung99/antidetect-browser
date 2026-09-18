<script lang="ts" setup>
// Import components/composables here
</script>

<template>
  <main
    class="relative flex min-h-screen w-full flex-col items-center justify-center overflow-auto overflow-x-hidden hero-section"
  >
    <!-- <div class="absolute top-4 right-4">
      <ThemeToggle />
    </div> -->
    <div class="mx-auto w-full max-w-md space-y-4">
      <div class="flex flex-col items-center justify-center">
        <img src="/logo.png" alt="Steelheart She's Gone" class="size-10" />
        <span class="text-2xl font-bold text-white"> Antidetect Crawlee </span>
      </div>
      <router-view />
    </div>
  </main>
</template>
<style scoped>
.hero-section {
  background-image:
    linear-gradient(rgba(0, 0, 0, 0.5), rgba(0, 0, 0, 0.8)),
    url("/images/background.png");
  background-size: cover;
  background-position: center;
}
</style>
