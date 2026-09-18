<script setup lang="ts">
import { useColorMode } from "@vueuse/core";
import GlobalAlertDialog from "@/components/GlobalAlertDialog.vue";

const mode = useColorMode();
mode.value = "dark";
</script>

<template>
  <div class="min-h-screen bg-background antialiased">
    <router-view />
    <GlobalAlertDialog />
  </div>
</template>
