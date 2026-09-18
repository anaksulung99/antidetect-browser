import {
  boolean,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";

const timestamps = {
  createdAt: timestamp("created_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .defaultNow()
    .notNull(),
};

export const userRoleEnum = pgEnum("user_role", ["admin", "user"]);
export const userStatusEnum = pgEnum("user_status", [
  "active",
  "inactive",
  "invited",
  "suspended",
]);
export const resourceStatusEnum = pgEnum("resource_status", [
  "active",
  "inactive",
]);
export const browserEngineEnum = pgEnum("browser_engine", [
  "chromium",
  "firefox",
  "webkit",
]);
export const deviceTypeEnum = pgEnum("device_type", ["desktop", "mobile"]);
export const osNameEnum = pgEnum("os_name", [
  "windows",
  "macos",
  "linux",
  "android",
  "ios",
]);
export const proxyProtocolEnum = pgEnum("proxy_protocol", [
  "http",
  "https",
  "socks4",
  "socks5",
]);
export const proxyCheckStatusEnum = pgEnum("proxy_check_status", [
  "queued",
  "running",
  "success",
  "failed",
]);
export const browserProfileStatusEnum = pgEnum("browser_profile_status", [
  "active",
  "inactive",
  "starting",
  "running",
  "stopping",
  "stopped",
  "error",
]);
export const languageModeEnum = pgEnum("language_mode", ["proxy", "custom"]);

export const users = pgTable(
  "users",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    status: userStatusEnum("status").default("invited").notNull(),
    passwordHash: text("password_hash"),
    lastLoginAt: timestamp("last_login_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("users_email_unique").on(table.email),
    index("users_status_idx").on(table.status),
  ]
);

export const invitations = pgTable(
  "invitations",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    email: text("email").notNull(),
    role: userRoleEnum("role").default("user").notNull(),
    tokenHash: text("token_hash").notNull(),
    invitedBy: uuid("invited_by")
      .notNull()
      .references(() => users.id),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    acceptedAt: timestamp("accepted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("invitations_token_hash_unique").on(table.tokenHash),
    index("invitations_email_idx").on(table.email),
    index("invitations_expires_at_idx").on(table.expiresAt),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: uuid("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    sessionHash: text("session_hash").notNull(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    lastSeenAt: timestamp("last_seen_at", { withTimezone: true }),
    revokedAt: timestamp("revoked_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("sessions_session_hash_unique").on(table.sessionHash),
    index("sessions_user_idx").on(table.userId),
    index("sessions_expires_at_idx").on(table.expiresAt),
  ]
);

export const fingerprints = pgTable(
  "fingerprints",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    status: resourceStatusEnum("status").default("active").notNull(),
    deviceType: deviceTypeEnum("device_type").notNull(),
    osName: osNameEnum("os_name").notNull(),
    osVersion: text("os_version").notNull(),
    browserName: text("browser_name").notNull(),
    browserVersion: text("browser_version").notNull(),
    userAgent: text("user_agent").notNull(),
    locale: text("locale").default("en-US").notNull(),
    timezone: text("timezone").default("America/New_York").notNull(),
    viewport: jsonb("viewport").notNull(),
    screen: jsonb("screen").notNull(),
    clientHints: jsonb("client_hints"),
    webgl: jsonb("webgl"),
    fonts: jsonb("fonts"),
    media: jsonb("media"),
    hardware: jsonb("hardware"),
    seed: text("seed"),
    presetVersion: text("preset_version").notNull(),
    compatibilityWarnings: jsonb("compatibility_warnings"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("fingerprints_owner_name_unique").on(table.ownerId, table.name),
    index("fingerprints_owner_status_idx").on(table.ownerId, table.status),
  ]
);

export const proxies = pgTable(
  "proxies",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    protocol: proxyProtocolEnum("protocol").notNull(),
    host: text("host").notNull(),
    port: integer("port").notNull(),
    credentialRef: text("credential_ref"),
    status: resourceStatusEnum("status").default("active").notNull(),
    country: text("country"),
    city: text("city"),
    isp: text("isp"),
    timezone: text("timezone"),
    detectedIp: text("detected_ip"),
    latencyMs: integer("latency_ms"),
    lastCheckedAt: timestamp("last_checked_at", { withTimezone: true }),
    checkError: text("check_error"),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("proxies_owner_name_unique").on(table.ownerId, table.name),
    index("proxies_owner_status_idx").on(table.ownerId, table.status),
    index("proxies_last_checked_idx").on(table.lastCheckedAt),
  ]
);

export const proxyChecks = pgTable(
  "proxy_checks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    proxyId: uuid("proxy_id")
      .notNull()
      .references(() => proxies.id, { onDelete: "cascade" }),
    requestedBy: uuid("requested_by")
      .notNull()
      .references(() => users.id),
    status: proxyCheckStatusEnum("status").default("queued").notNull(),
    latencyMs: integer("latency_ms"),
    metadata: jsonb("metadata"),
    error: text("error"),
    startedAt: timestamp("started_at", { withTimezone: true }),
    finishedAt: timestamp("finished_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    index("proxy_checks_proxy_idx").on(table.proxyId, table.createdAt),
    index("proxy_checks_status_idx").on(table.status),
  ]
);

export const browserProfiles = pgTable(
  "browser_profiles",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    ownerId: uuid("owner_id")
      .notNull()
      .references(() => users.id),
    name: text("name").notNull(),
    status: browserProfileStatusEnum("status").default("inactive").notNull(),
    engine: browserEngineEnum("engine").notNull(),
    fingerprintId: uuid("fingerprint_id")
      .notNull()
      .references(() => fingerprints.id),
    proxyId: uuid("proxy_id").references(() => proxies.id),
    proxyEnabled: boolean("proxy_enabled").default(false).notNull(),
    languageMode: languageModeEnum("language_mode").default("custom").notNull(),
    language: text("language").default("en-US").notNull(),
    timezone: text("timezone"),
    userDataDirKey: text("user_data_dir_key").notNull(),
    lastStartedAt: timestamp("last_started_at", { withTimezone: true }),
    lastStoppedAt: timestamp("last_stopped_at", { withTimezone: true }),
    deletedAt: timestamp("deleted_at", { withTimezone: true }),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("browser_profiles_owner_name_unique").on(
      table.ownerId,
      table.name
    ),
    uniqueIndex("browser_profiles_data_dir_unique").on(table.userDataDirKey),
    index("browser_profiles_owner_status_idx").on(table.ownerId, table.status),
  ]
);

export const browserEvents = pgTable(
  "browser_events",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    browserProfileId: uuid("browser_profile_id")
      .notNull()
      .references(() => browserProfiles.id, { onDelete: "cascade" }),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    result: text("result").notNull(),
    errorCode: text("error_code"),
    errorMessage: text("error_message"),
    durationMs: integer("duration_ms"),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("browser_events_profile_idx").on(
      table.browserProfileId,
      table.createdAt
    ),
    index("browser_events_actor_idx").on(table.actorId),
  ]
);

export const appSettings = pgTable(
  "app_settings",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    key: text("key").notNull(),
    value: jsonb("value").notNull(),
    scope: text("scope").default("global").notNull(),
    updatedBy: uuid("updated_by").references(() => users.id),
    ...timestamps,
  },
  (table) => [
    uniqueIndex("app_settings_key_scope_unique").on(table.key, table.scope),
  ]
);

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    actorId: uuid("actor_id").references(() => users.id),
    action: text("action").notNull(),
    entity: text("entity").notNull(),
    entityId: uuid("entity_id"),
    result: text("result").notNull(),
    metadata: jsonb("metadata"),
    ...timestamps,
  },
  (table) => [
    index("audit_logs_actor_idx").on(table.actorId, table.createdAt),
    index("audit_logs_entity_idx").on(table.entity, table.entityId),
  ]
);

export type User = typeof users.$inferSelect;
export type NewUser = typeof users.$inferInsert;
export type BrowserProfile = typeof browserProfiles.$inferSelect;
export type NewBrowserProfile = typeof browserProfiles.$inferInsert;
export type Fingerprint = typeof fingerprints.$inferSelect;
export type NewFingerprint = typeof fingerprints.$inferInsert;
export type Proxy = typeof proxies.$inferSelect;
export type NewProxy = typeof proxies.$inferInsert;
