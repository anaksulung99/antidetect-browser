<script setup lang="ts">
import { Icon } from "@iconify/vue";

function handleBackToHome() {
  window.history.back();
}
</script>
<template>
  <div
    class="min-h-screen bg-background flex flex-col items-center justify-center"
  >
    <div class="container mx-auto px-4 py-8 flex items-center justify-center">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Icon
              icon="streamline:interface-edit-skull-1-crash-death-delete-die-error-garbage-remove-skull-trash"
              class="size-16"
            />
          </EmptyMedia>
          <EmptyTitle>404</EmptyTitle>
          <EmptyDescription> Page not found </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button @click="handleBackToHome">Back To Home</Button>
        </EmptyContent>
      </Empty>
    </div>
  </div>
</template>
