<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import { Globe, ShieldKeyhole, HatGlasses, Inbox } from "@lucide/vue";
import { h, ref } from "vue";
import NavUser from "@/components/app/NavUser.vue";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const props = withDefaults(defineProps<SidebarProps>(), {
  collapsible: "icon",
});

const navMain = [
  {
    title: "Dashboard",
    url: "/app",
    icon: Inbox,
    isActive: true,
  },
  {
    title: "Browser",
    url: "/app/browser",
    icon: Globe,
    isActive: false,
  },
  {
    title: "Fingerprint",
    url: "/app/fingerprint",
    icon: HatGlasses,
    isActive: false,
  },
  {
    title: "Proxy",
    url: "/app/proxy",
    icon: ShieldKeyhole,
    isActive: false,
  },
];
const activeItem = ref(navMain[0]!);
const { setOpen } = useSidebar();
</script>

<template>
  <Sidebar
    class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
    v-bind="props"
  >
    <!-- This is the first sidebar -->
    <!-- We disable collapsible and adjust width to icon. -->
    <!-- This will make the sidebar appear as icons. -->
    <Sidebar
      collapsible="none"
      class="w-[calc(var(--sidebar-width-icon)+1px)]! border-r"
    >
      <SidebarHeader>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton size="lg" as-child class="md:h-8 md:p-0">
              <a href="#">
                <div
                  class="bg-sidebar-primary text-sidebar-primary-foreground flex aspect-square size-8 items-center justify-center rounded-lg"
                >
                  <Command class="size-4" />
                </div>
                <div class="grid flex-1 text-left text-sm leading-tight">
                  <span class="truncate font-medium">Antidetect</span>
                  <span class="truncate text-xs">Browser</span>
                </div>
              </a>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent class="px-1.5 md:px-0">
            <SidebarMenu>
              <SidebarMenuItem v-for="item in navMain" :key="item.title">
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="activeItem.title === item.title"
                  class="px-2.5 md:px-2"
                  @click="
                    () => {
                      activeItem = item;
                      setOpen(true);
                    }
                  "
                >
                  <component :is="item.icon" />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <!-- <NavUser :user="user" /> -->
      </SidebarFooter>
    </Sidebar>
  </Sidebar>
</template>
