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

const currentTitle = computed(() => route.meta.title || "Antidetect Browser");
</script>
<template>
  <SidebarProvider :open="false">
    <AppSidebar />
    <SidebarInset
      :class="
        cn(
          'mx-auto! lg:max-w-full',
          'max-[113rem]:peer-data-[variant=inset]:mr-2! min-[101rem]:peer-data-[variant=inset]:peer-data-[state=collapsed]:mr-auto!'
        )
      "
    >
      <header
        class="bg-background sticky top-0 flex shrink-0 items-center gap-2 border-b p-4"
      >
        <SidebarTrigger class="-ml-1 block md:hidden" />
        <Separator
          orientation="vertical"
          class="mr-2 md:mr-0 data-[orientation=vertical]:h-4"
        />
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink href="#"> {{ currentTitle }} </BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>
        <div class="ml-auto">
          <ThemeToggle />
        </div>
      </header>
      <div class="flex flex-1 flex-col gap-4 p-4 pt-0">
        <div class="@container/main flex flex-1 flex-col gap-2">
          <div class="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
            <div
              class="scrollbar-thin flex min-h-[calc(100vh-160px)] scrollbar-thumb-foreground scrollbar-track-accent flex-col overflow-hidden overflow-y-auto scroll-smooth"
            >
              <router-view />
            </div>
          </div>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
</template>
