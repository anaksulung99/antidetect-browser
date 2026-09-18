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
    // roles?: AppRole[];
  }
}

router.beforeEach(async (to) => {
  // const authStore = useAuthStore();
  // // Tunggu inisialisasi selesai
  // if (authStore.loading) {
  //   await new Promise<void>((resolve) => {
  //     const unwatch = watch(
  //       () => authStore.loading,
  //       (loading: boolean) => {
  //         if (!loading) {
  //           unwatch();
  //           resolve();
  //         }
  //       }
  //     );
  //   });
  // }
  // const isAuthenticated = authStore.isAuthenticated;
  // // Middleware "auth" - requires authentication
  // if (to.meta.middleware === "auth" && !isAuthenticated) {
  //   return { name: "Login", query: { redirect: to.fullPath } };
  // }
  // // Middleware "guest" - requires unauthenticated
  // if (to.meta.middleware === "guest" && isAuthenticated) {
  //   return { name: "Dashboard" };
  // }
  // // Legacy support for requiresAuth
  // if (to.meta.requiresAuth && !isAuthenticated) {
  //   return { name: "Login", query: { redirect: to.fullPath } };
  // }
  // // Legacy support for requiresGuest
  // if (to.meta.requiresGuest && isAuthenticated) {
  //   return { name: "Dashboard" };
  // }
  // const allowedRoles = to.meta.roles;
  // if (allowedRoles?.length && !allowedRoles.includes(authStore.userRole)) {
  //   logSecurityEvent("Access denied by route role guard", {
  //     to: to.fullPath,
  //     routeName: String(to.name ?? ""),
  //     requiredRoles: allowedRoles,
  //     currentRole: authStore.userRole,
  //   });
  //   return {
  //     name: "AccessDenied",
  //     query: {
  //       from: to.fullPath,
  //       roles: allowedRoles.join(", "),
  //     },
  //   };
  // }
  // if (to.name === "ToolsView") {
  //   const toolId = typeof to.params.id === "string" ? to.params.id : "";
  //   const tool = CHECKER_TOOLS_CATALOG.find((entry) => entry.id === toolId);
  //   if (tool?.roles?.length && !tool.roles.includes(authStore.userRole)) {
  //     logSecurityEvent("Access denied by tool role guard", {
  //       to: to.fullPath,
  //       toolId,
  //       requiredRoles: tool.roles,
  //       currentRole: authStore.userRole,
  //     });
  //     return {
  //       name: "AccessDenied",
  //       query: {
  //         from: to.fullPath,
  //         roles: tool.roles.join(", "),
  //       },
  //     };
  //   }
  // }
  // if (to.meta.requiresAdmin && !authStore.isAdmin) {
  //   logSecurityEvent("Access denied by admin guard", {
  //     to: to.fullPath,
  //     routeName: String(to.name ?? ""),
  //     requiredRoles: ["admin"],
  //     currentRole: authStore.userRole,
  //   });
  //   return {
  //     name: "AccessDenied",
  //     query: {
  //       from: to.fullPath,
  //       roles: "admin",
  //     },
  //   };
  // }
});

export default router;
