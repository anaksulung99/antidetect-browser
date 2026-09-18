<script setup lang="ts">
import type { SidebarProps } from "@/components/ui/sidebar";
import {
  Globe,
  ShieldKeyhole,
  HatGlasses,
  LayoutDashboard,
  UserCog,
} from "@lucide/vue";
import { h, ref } from "vue";
import NavUser from "@/components/app/NavUser.vue";
import { useAuthStore } from "@/stores/auth";
import { useRoute, useRouter } from "vue-router";
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
    icon: LayoutDashboard,
    isActive: true,
    adminOnly: false,
  },
  {
    title: "Browser",
    url: "/app/browser",
    icon: Globe,
    isActive: false,
    adminOnly: false,
  },
  {
    title: "Fingerprint",
    url: "/app/fingerprint",
    icon: HatGlasses,
    isActive: false,
    adminOnly: false,
  },
  {
    title: "Proxy",
    url: "/app/proxy",
    icon: ShieldKeyhole,
    isActive: false,
    adminOnly: false,
  },
  {
    title: "Users",
    url: "/app/admin/users",
    icon: UserCog,
    isActive: false,
    adminOnly: true,
  },
];
const activeItem = ref(navMain[0]!);
const authStore = useAuthStore();
const route = useRoute();
const router = useRouter();
const { setOpen } = useSidebar();
</script>

<template>
  <Sidebar
    v-bind="props"
    collapsible="icon"
    class="overflow-hidden *:data-[sidebar=sidebar]:flex-row"
  >
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
                  <HatGlasses class="size-4" />
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
              <SidebarMenuItem
                v-for="item in navMain"
                v-show="!item.adminOnly || authStore.isAdmin"
                :key="item.title"
              >
                <SidebarMenuButton
                  :tooltip="h('div', { hidden: false }, item.title)"
                  :is-active="
                    route.path === item.url || activeItem.title === item.title
                  "
                  :class="
                    cn(
                      'px-2.5 md:px-2',
                      route.path === item.url ? 'text-primary-foreground' : ''
                    )
                  "
                  @click="
                    () => {
                      activeItem = item;
                      setOpen(true);
                      void router.push(item.url);
                    }
                  "
                >
                  <component
                    :is="item.icon"
                    :class="cn(route.path === item.url ? 'text-primary' : '')"
                  />
                  <span>{{ item.title }}</span>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      <SidebarFooter>
        <NavUser
          v-if="authStore.user"
          :user="{
            name: authStore.user.name,
            email: authStore.user.email,
            avatar: '',
          }"
        />
      </SidebarFooter>
    </Sidebar>
  </Sidebar>
</template>
