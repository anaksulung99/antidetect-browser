import { useAuthStore } from "@/stores/auth";
import {
  createRouter,
  createWebHashHistory,
  type RouteRecordRaw,
} from "vue-router";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("../layouts/GuestLayout.vue"),
    children: [
      {
        path: "",
        name: "index",
        component: () => import("../pages/Index.vue"),
        meta: { middleware: "guest", title: "Login" },
      },
    ],
  },
  {
    path: "/app",
    component: () => import("../layouts/AppLayout.vue"),
    children: [
      {
        path: "",
        name: "Dashboard",
        component: () => import("../pages/app/Index.vue"),
        meta: { middleware: "auth", title: "Dashboard" },
      },
      {
        path: "browser",
        name: "BrowserProfiles",
        component: () => import("../pages/app/Browser.vue"),
        meta: { middleware: "auth", title: "Browser Profiles" },
      },
      {
        path: "fingerprint",
        name: "Fingerprints",
        component: () => import("../pages/app/Fingerprint.vue"),
        meta: { middleware: "auth", title: "Fingerprints" },
      },
      {
        path: "proxy",
        name: "Proxies",
        component: () => import("../pages/app/Proxy.vue"),
        meta: { middleware: "auth", title: "Proxies" },
      },
      {
        path: "jobs",
        name: "BrowserJobs",
        component: () => import("../pages/app/Jobs.vue"),
        meta: { middleware: "auth", title: "Job Queue" },
      },
      {
        path: "admin/users",
        name: "AdminUsers",
        component: () => import("../pages/app/admin/Users.vue"),
        meta: {
          middleware: "auth",
          requiresAdmin: true,
          title: "User Management",
        },
      },
    ],
  },
  {
    path: "/access-denied",
    name: "AccessDenied",
    component: () => import("../pages/AccessDenied.vue"),
    meta: { middleware: "auth", title: "Access Denied" },
  },
  {
    path: "/:pathMatch(.*)*",
    name: "NotFound",
    component: () => import("../pages/NotFound.vue"),
  },
];

const router = createRouter({
  history: createWebHashHistory(),
  routes,
});

declare module "vue-router" {
  interface RouteMeta {
    middleware?: "auth" | "guest";
    requiresAuth?: boolean;
    requiresGuest?: boolean;
    requiresAdmin?: boolean;
  }
}

router.beforeEach(async (to) => {
  const authStore = useAuthStore();
  await authStore.initialize();

  const requiresAuth = to.meta.middleware === "auth" || to.meta.requiresAuth;
  const isGuestRoute = to.meta.middleware === "guest" || to.meta.requiresGuest;

  if (requiresAuth && !authStore.isAuthenticated) {
    return {
      name: "index",
      query: { redirect: to.fullPath },
    };
  }

  if (isGuestRoute && authStore.isAuthenticated) {
    return { name: "Dashboard" };
  }

  if (to.meta.requiresAdmin && !authStore.isAdmin) {
    return {
      name: "AccessDenied",
      query: { from: to.fullPath, roles: "admin" },
    };
  }

  return true;
});

export default router;
