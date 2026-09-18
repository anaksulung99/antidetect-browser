import fs from "node:fs";
import path from "node:path";

export type DatabaseMode = "neon" | "embedded";

export interface RuntimeConfig {
  appMode: "desktop";
  databaseMode: DatabaseMode;
  browserBinariesPath: string;
  hasNeonDatabase: boolean;
  hasCloudAmqp: boolean;
  hasUpstashRedis: boolean;
}

function readDatabaseMode(value: string | undefined): DatabaseMode {
  return value?.toLowerCase() === "embedded" ? "embedded" : "neon";
}

function resolveBrowserBinariesPath(appRoot: string): string {
  const configuredPath = process.env.BROWSER_BINARIES_PATH?.trim();

  if (configuredPath) {
    return path.resolve(configuredPath);
  }

  const packagedPath = process.resourcesPath
    ? path.join(process.resourcesPath, "browsers")
    : "";
  const developmentPath = path.join(appRoot, "resources", "browsers");

  return fs.existsSync(packagedPath) ? packagedPath : developmentPath;
}

export function createRuntimeConfig(appRoot: string): RuntimeConfig {
  return {
    appMode: "desktop",
    databaseMode: readDatabaseMode(process.env.DATABASE_MODE),
    browserBinariesPath: resolveBrowserBinariesPath(appRoot),
    hasNeonDatabase: Boolean(process.env.DATABASE_URL),
    hasCloudAmqp: Boolean(process.env.CLOUDAMQP_URL),
    hasUpstashRedis: Boolean(
      process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ),
  };
}

export function getBrowserEnginePath(
  config: RuntimeConfig,
  engine: "chromium" | "firefox" | "webkit"
): string {
  const engineDirectory = {
    chromium: "chromium-1228",
    firefox: "firefox-1532",
    webkit: "webkit-2311",
  }[engine];

  return path.join(config.browserBinariesPath, engineDirectory);
}

export function findBrowserExecutable(
  config: RuntimeConfig,
  engine: "chromium" | "firefox" | "webkit"
): string | undefined {
  const root = getBrowserEnginePath(config, engine);
  const executableNames =
    engine === "chromium"
      ? ["chrome.exe", "chrome", "Chromium"]
      : engine === "firefox"
        ? ["firefox.exe", "firefox"]
        : ["Playwright.exe", "playwright", "MiniBrowser"];

  const queue = [root];
  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;
    let entries: fs.Dirent[];
    try {
      entries = fs.readdirSync(current, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const entry of entries) {
      const entryPath = path.join(current, entry.name);
      if (entry.isFile() && executableNames.includes(entry.name))
        return entryPath;
      if (entry.isDirectory() && !entry.name.startsWith("."))
        queue.push(entryPath);
    }
  }
  return undefined;
}
