import tailwindcss from "@tailwindcss/vite";
import vue from "@vitejs/plugin-vue";
import path from "node:path";
import type { RollupLog, WarningHandlerWithDefault } from "rollup";
import AutoImport from "unplugin-auto-import/vite";
import Components from "unplugin-vue-components/vite";
import { defineConfig, loadEnv } from "vite";
import electron from "vite-plugin-electron/simple";

function toPosixPath(value: string) {
  return value.replace(/\\/g, "/");
}

function getRendererManualChunk(id: string) {
  const normalizedId = toPosixPath(id);

  if (!normalizedId.includes("/node_modules/")) {
    return undefined;
  }

  if (
    normalizedId.includes("/node_modules/reka-ui/") ||
    normalizedId.includes("/node_modules/@internationalized/") ||
    normalizedId.includes("/node_modules/embla-carousel-vue/") ||
    normalizedId.includes("/node_modules/vaul-vue/") ||
    normalizedId.includes("/node_modules/vue-input-otp/")
  ) {
    return "vendor-ui";
  }

  if (
    normalizedId.includes("/node_modules/@iconify/") ||
    normalizedId.includes("/node_modules/@lucide/") ||
    normalizedId.includes("/node_modules/vue3-flag-icons/")
  ) {
    return "vendor-icons";
  }

  if (
    normalizedId.includes("/node_modules/date-fns/") ||
    normalizedId.includes("/node_modules/howler/")
  ) {
    return "vendor-utils";
  }

  if (
    normalizedId.includes("/node_modules/@tanstack/") ||
    normalizedId.includes("/node_modules/@unovis/")
  ) {
    return "vendor-data";
  }

  return undefined;
}

function handleRollupWarning(
  warning: RollupLog,
  warn: WarningHandlerWithDefault
) {
  const message = warning.message ?? "";
  const warningId =
    typeof warning.id === "string"
      ? toPosixPath(warning.id)
      : Array.isArray(warning.ids)
        ? warning.ids.map((id) => toPosixPath(String(id))).join("|")
        : "";

  const isVueUsePureAnnotationNoise =
    message.includes("contains an annotation that Rollup cannot interpret") &&
    warningId.includes("/@vueuse/core/dist/index.js");

  if (isVueUsePureAnnotationNoise) {
    return;
  }

  warn(warning, (warning) => {
    console.warn(warning);
  });
}

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, __dirname, "");
  const isDev = command === "serve";
  const cspContent = [
    "default-src 'self'",
    "script-src 'self'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "style-src-elem 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "img-src 'self' data: blob:",
    "font-src 'self' data: https://fonts.gstatic.com",
    `connect-src 'self' ${[
      "https://api.iconify.design",
      "https://api.simplesvg.com",
      "https://api.unisvg.com",
    ]
      .filter(Boolean)
      .join(" ")}`,
    "worker-src 'self' blob:",
    "object-src 'none'",
    "base-uri 'self'",
    "frame-ancestors 'none'",
    "form-action 'self'",
  ].join("; ");

  return {
    server: {
      watch: {
        ignored: ["**/.dbg/**", "**/.electron/**"],
      },
    },
    plugins: [
      vue(),
      tailwindcss(),
      {
        name: "app-csp",
        transformIndexHtml(html) {
          if (isDev) {
            return html;
          }

          return html.replace(
            '<meta charset="UTF-8" />',
            `<meta charset="UTF-8" />\n    <meta http-equiv="Content-Security-Policy" content="${cspContent}" />`
          );
        },
      },
      electron({
        main: {
          // Shortcut of `build.lib.entry`.
          entry: "electron/main.ts",
          vite: {
            build: {
              rollupOptions: {
                external: [
                  "playwright",
                  "playwright-core",
                  "playwright-extra",
                  "crawlee",
                  "@upstash/redis",
                  "@cloudamqp/amqp-client",
                  "puppeteer-extra-plugin-stealth",
                  "fingerprint-generator",
                  "fingerprint-injector",
                  "header-generator",
                  "adm-zip",
                  "generative-bayesian-network",
                  "chromium-bidi",
                  "bufferutil",
                  "utf-8-validate",
                  /^adm-zip\//,
                  /^bufferutil\//,
                  /^chromium-bidi\//,
                  /^fingerprint-generator\//,
                  /^fingerprint-injector\//,
                  /^generative-bayesian-network\//,
                  /^header-generator\//,
                  /^playwright\//,
                  /^utf-8-validate\//,
                ],
              },
            },
          },
        },
        preload: {
          // Shortcut of `build.rollupOptions.input`.
          // Preload scripts may contain Web assets, so use the `build.rollupOptions.input` instead `build.lib.entry`.
          input: path.join(__dirname, "electron/preload.ts"),
          vite: {
            build: {
              rollupOptions: {
                output: {
                  entryFileNames: "preload.cjs",
                  format: "cjs",
                },
                // Exclude Node.js modules from preload bundle so esbuild
                // doesn't try to resolve chromium-bidi from coreBundle.js
                external: [
                  "electron",
                  "playwright",
                  "playwright-core",
                  "playwright-extra",
                  "chromium-bidi",
                  /^chromium-bidi\//,
                  /^playwright\//,
                ],
              },
            },
          },
        },
        renderer: process.env.NODE_ENV === "test" ? undefined : ({} as any),
      }),
      AutoImport({
        include: [/\.[tj]sx?$/, /\.vue$/, /\.vue\?vue/, /\.ts$/],
        imports: ["vue", "vue-router", "pinia", "@vueuse/core", "vee-validate"],
        dts: "src/auto-imports.d.ts",
        dirs: [
          "src/composables",
          "src/types",
          "src/stores",
          "src/utils",
          "src/lib",
          "src/stubs",
        ],
        vueTemplate: true,
        eslintrc: {
          enabled: true,
          filepath: "./.eslintrc-auto-import.json",
        },
      }),
      Components({
        dirs: ["src/components"],
        dts: "src/components.d.ts",
      }),
    ],
    resolve: {
      alias: [
        { find: "@", replacement: path.resolve(__dirname, "./src") },
        // playwright-core's coreBundle.js contains static require() calls to
        // "chromium-bidi/..." that are only resolvable in Node.js. Since
        // proxy-checker.ts lives in src/ (renderer/Vite context) and Vite
        // bundles it with esbuild, we alias chromium-bidi to a local stub so
        // esbuild doesn't fail at build time. At runtime, the real module is
        // never loaded because playwright.launch() only runs in the Node
        // environment where proxy-checker is actually invoked.
        {
          find: /^chromium-bidi(\/.*)?$/,
          replacement: path.resolve(__dirname, "src/stubs/chromium-bidi.ts"),
        },
      ],
    },
    publicDir: "public",
    build: {
      assetsInlineLimit: 0,
      rollupOptions: {
        onwarn: handleRollupWarning,
        external: [
          "electron",
          // chromium-bidi is a transitive optional dep of playwright-core.
          // coreBundle.js contains require() calls to it that esbuild can't
          // resolve at build time. Mark it external so rollup leaves the calls
          // intact — they only resolve at runtime in the Electron main process.
          "chromium-bidi",
          /^chromium-bidi\//,
          "linkedom",
          "css-select",
        ],
        output: {
          manualChunks: (id) => getRendererManualChunk(id),
          assetFileNames: (assetInfo) => {
            if (assetInfo.name?.endsWith(".mp3")) {
              return "assets/music/[name]-[hash][extname]";
            }
            return "assets/[name]-[hash][extname]";
          },
        },
      },
    },
  };
});
