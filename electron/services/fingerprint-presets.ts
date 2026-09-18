import { createHash } from "node:crypto";

export type FingerprintInput = {
  deviceType: "desktop" | "mobile";
  osName: "windows" | "macos" | "linux" | "android" | "ios";
  osVersion: string;
  browserName: string;
  browserVersion: string;
  locale: string;
  timezone: string;
};

export type FingerprintPreset = {
  userAgent: string;
  viewport: {
    width: number;
    height: number;
    deviceScaleFactor: number;
    isMobile: boolean;
  };
  screen: {
    width: number;
    height: number;
    colorDepth: number;
    pixelDepth: number;
  };
  clientHints: {
    platform: string;
    mobile: boolean;
    brands: Array<{ brand: string; version: string }>;
  };
  webgl: { vendor: string; renderer: string };
  fonts: string[];
  media: { prefersColorScheme: "light" | "dark"; reducedMotion: boolean };
  hardware: { concurrency: number; memory: number; maxTouchPoints: number };
  compatibilityWarnings: string[];
};

export const fingerprintCapabilities = {
  desktop: {
    windows: {
      versions: ["10", "11"],
      browsers: {
        Chrome: ["120", "121", "122", "123"],
        Edge: ["120", "121", "122", "123"],
        Firefox: ["121", "122", "123"],
      },
    },
    macos: {
      versions: ["12", "13", "14"],
      browsers: {
        Chrome: ["120", "121", "122", "123"],
        Safari: ["17", "17.1", "17.2"],
        Firefox: ["121", "122", "123"],
      },
    },
    linux: {
      versions: ["22.04", "24.04"],
      browsers: {
        Chrome: ["120", "121", "122", "123"],
        Firefox: ["121", "122", "123"],
      },
    },
  },
  mobile: {
    android: {
      versions: ["12", "13", "14"],
      browsers: { Chrome: ["120", "121", "122", "123"] },
    },
    ios: {
      versions: ["16", "17", "17.2"],
      browsers: { Safari: ["16", "17", "17.2"] },
    },
  },
} as const;

function seededNumber(seed: string, max: number): number {
  const digest = createHash("sha256").update(seed).digest();
  return digest.readUInt32BE(0) % max;
}

function platformLabel(input: FingerprintInput): string {
  if (input.osName === "windows") return "Windows";
  if (input.osName === "macos") return "macOS";
  if (input.osName === "linux") return "Linux";
  if (input.osName === "android") return "Android";
  return "iOS";
}

function chromiumVersion(version: string): string {
  const parts = version.split(".").filter(Boolean);
  return [
    parts[0] ?? "120",
    parts[1] ?? "0",
    parts[2] ?? "0",
    parts[3] ?? "0",
  ].join(".");
}

function safariVersion(version: string): string {
  const parts = version.split(".").filter(Boolean);
  return [parts[0] ?? "17", parts[1] ?? "0", parts[2] ?? "0"].join(".");
}

function firefoxVersion(version: string): string {
  return version.split(".").filter(Boolean).slice(0, 2).join(".") || "121";
}

export function applyCorePreset(
  input: FingerprintInput
): Pick<FingerprintPreset, "userAgent" | "compatibilityWarnings"> {
  const warnings: string[] = [];
  const platform = platformLabel(input);
  const mobile = input.deviceType === "mobile";

  if (mobile && !["android", "ios"].includes(input.osName)) {
    warnings.push("Mobile device should use Android or iOS.");
  }
  if (!mobile && ["android", "ios"].includes(input.osName)) {
    warnings.push("Desktop device should not use Android or iOS.");
  }
  if (input.osName === "ios" && input.browserName !== "Safari") {
    warnings.push(
      "iOS browser compatibility is limited to Safari-like profiles."
    );
  }

  const version = input.browserVersion.trim();
  const firefox = firefoxVersion(version);
  const chromium = chromiumVersion(version);
  const safari = safariVersion(version);
  const windowsToken = "Windows NT 10.0; Win64; x64";
  const osToken =
    input.osName === "windows"
      ? windowsToken
      : input.osName === "macos"
        ? `Macintosh; Intel Mac OS X ${input.osVersion.replace(/\./g, "_")}`
        : `X11; Linux x86_64`;

  let userAgent: string;
  if (input.browserName === "Firefox") {
    userAgent = mobile
      ? `Mozilla/5.0 (Android ${input.osVersion}; Mobile; rv:${firefox}) Gecko/${firefox} Firefox/${firefox}`
      : `Mozilla/5.0 (${osToken}; rv:${firefox}) Gecko/20100101 Firefox/${firefox}`;
  } else if (input.browserName === "Safari") {
    userAgent = mobile
      ? `Mozilla/5.0 (iPhone; CPU iPhone OS ${input.osVersion.replace(/\./g, "_")} like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safari} Mobile/15E148 Safari/604.1`
      : `Mozilla/5.0 (${osToken}) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/${safari} Safari/605.1.15`;
  } else {
    const browserToken =
      input.browserName === "Edge" ? `Edg/${chromium}` : `Chrome/${chromium}`;
    userAgent = mobile
      ? `Mozilla/5.0 (Linux; Android ${input.osVersion}; Pixel 7) AppleWebKit/537.36 (KHTML, like Gecko) ${browserToken} Mobile Safari/537.36`
      : `Mozilla/5.0 (${osToken}) AppleWebKit/537.36 (KHTML, like Gecko) ${browserToken} Safari/537.36`;
  }

  return { userAgent, compatibilityWarnings: warnings };
}

export function getViewportPreset(input: FingerprintInput, seed: string) {
  const desktop = [
    { width: 1366, height: 768, scale: 1 },
    { width: 1440, height: 900, scale: 1 },
    { width: 1536, height: 864, scale: 1 },
    { width: 1920, height: 1080, scale: 1 },
  ];
  const mobile = [
    { width: 390, height: 844, scale: 3 },
    { width: 393, height: 852, scale: 3 },
    { width: 412, height: 915, scale: 2.625 },
  ];
  const selected = (input.deviceType === "mobile" ? mobile : desktop)[
    seededNumber(
      seed + ":viewport",
      input.deviceType === "mobile" ? mobile.length : desktop.length
    )
  ];
  return {
    width: selected.width,
    height: selected.height,
    deviceScaleFactor: selected.scale,
    isMobile: input.deviceType === "mobile",
  };
}

export function applyClientHintsPreset(input: FingerprintInput) {
  return {
    platform: platformLabel(input),
    mobile: input.deviceType === "mobile",
    brands: [
      { brand: input.browserName, version: input.browserVersion },
      { brand: "Not.A/Brand", version: "99" },
    ],
  };
}

export function applyWebglPreset(input: FingerprintInput, seed: string) {
  const desktopRenderers = [
    "ANGLE (Intel, Intel(R) UHD Graphics)",
    "ANGLE (NVIDIA, NVIDIA GeForce GTX)",
  ];
  const mobileRenderers = ["Apple GPU", "Adreno (TM) 730", "Mali-G78"];
  return {
    vendor: input.osName === "ios" ? "Apple Inc." : "Google Inc. (Intel)",
    renderer: (input.deviceType === "mobile"
      ? mobileRenderers
      : desktopRenderers)[
      seededNumber(
        seed + ":webgl",
        input.deviceType === "mobile"
          ? mobileRenderers.length
          : desktopRenderers.length
      )
    ],
  };
}

export function applyFontsPreset(input: FingerprintInput) {
  if (input.osName === "windows")
    return ["Arial", "Calibri", "Segoe UI", "Tahoma", "Verdana"];
  if (input.osName === "macos" || input.osName === "ios")
    return ["Arial", "Helvetica", "Helvetica Neue", "Menlo", "-apple-system"];
  if (input.osName === "android") return ["Arial", "Roboto", "Noto Sans"];
  return ["Arial", "DejaVu Sans", "Liberation Sans", "Noto Sans"];
}

export function applyAllPresets(
  input: FingerprintInput,
  seed: string
): FingerprintPreset {
  const core = applyCorePreset(input);
  const viewport = getViewportPreset(input, seed);
  return {
    ...core,
    viewport,
    screen: {
      width: viewport.width,
      height: viewport.height,
      colorDepth: 24,
      pixelDepth: 24,
    },
    clientHints: applyClientHintsPreset(input),
    webgl: applyWebglPreset(input, seed),
    fonts: applyFontsPreset(input),
    media: {
      prefersColorScheme:
        seededNumber(seed + ":theme", 2) === 0 ? "light" : "dark",
      reducedMotion: false,
    },
    hardware: {
      concurrency: input.deviceType === "mobile" ? 8 : 8,
      memory: input.deviceType === "mobile" ? 8 : 16,
      maxTouchPoints: input.deviceType === "mobile" ? 5 : 0,
    },
  };
}

export function clearAdvancedPresets(): Partial<FingerprintPreset> {
  return {
    clientHints: undefined,
    webgl: undefined,
    fonts: undefined,
    media: undefined,
    hardware: undefined,
  };
}
