<script lang="ts" setup>
import AppSidebar from "@/components/app/AppSidebar.vue";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
} from "@/components/ui/breadcrumb";
import { Separator } from "@/components/ui/separator";
import {
  SidebarInset,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const route = useRoute();

const currentTitle = computed(() => route.meta.title || "Antidetect Crawlee");
</script>
<template>
  <SidebarProvider
    :style="{
      '--sidebar-width': '350px',
    }"
  >
    <AppSidebar />
    <SidebarInset>
      <header
        class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4"
      >
        <SidebarTrigger class="-ml-1" />
        <Separator
          orientation="vertical"
          class="mr-2 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem class="hidden md:block">
              <BreadcrumbLink href="#"> {{ currentTitle }} </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4">
        <div class="flex h-screen w-full flex-col">
          <div class="mx-auto h-full w-full flex-1 overflow-y-auto">
            <router-view />
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
