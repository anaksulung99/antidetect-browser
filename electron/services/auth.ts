import { and, asc, eq, isNull } from "drizzle-orm";
import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
import {
  invitations,
  sessions,
  users,
  type User,
} from "../../src/lib/db/schema";
import type { RuntimeConfig } from "../runtime-config";
import { getDatabase } from "./database";

const scrypt = promisify(scryptCallback);
const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 30;
const INVITATION_TTL_MS = 1000 * 60 * 60 * 48;

export type SafeUser = Pick<
  User,
  "id" | "email" | "name" | "role" | "status" | "lastLoginAt"
>;

export interface AuthResult {
  user: SafeUser;
}

export interface InvitationResult {
  email: string;
  role: "admin" | "user";
  token: string;
  expiresAt: Date;
}

let activeSession: { tokenHash: string; user: SafeUser } | undefined;

function toSafeUser(user: User): SafeUser {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    status: user.status,
    lastLoginAt: user.lastLoginAt,
  };
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `scrypt$${salt.toString("hex")}$${derivedKey.toString("hex")}`;
}

async function verifyPassword(
  password: string,
  encodedHash: string
): Promise<boolean> {
  const [, saltHex, hashHex] = encodedHash.split("$");
  if (!saltHex || !hashHex) return false;

  const expected = Buffer.from(hashHex, "hex");
  const actual = (await scrypt(
    password,
    Buffer.from(saltHex, "hex"),
    64
  )) as Buffer;
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

function hashToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}

function assertPassword(password: string): void {
  if (password.length < 8) {
    throw new Error("Password must contain at least 8 characters.");
  }
}

function assertAdmin(user: SafeUser | undefined): asserts user is SafeUser {
  if (!user || user.role !== "admin" || user.status !== "active") {
    throw new Error("Admin permission is required.");
  }
}

export function getActiveUser(): SafeUser | null {
  return activeSession?.user ?? null;
}

export function requireActiveUser(): SafeUser {
  if (!activeSession || activeSession.user.status !== "active") {
    throw new Error("Authentication is required.");
  }

  return activeSession.user;
}

export async function ensureBootstrapAdmin(
  config: RuntimeConfig
): Promise<void> {
  if (!process.env.DATABASE_URL || config.databaseMode !== "neon") return;

  const bootstrapEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();
  const bootstrapPassword = process.env.ADMIN_PASSWORD;
  if (!bootstrapEmail || !bootstrapPassword) return;

  assertPassword(bootstrapPassword);
  const db = getDatabase(config);
  const existing = await db
    .select({ id: users.id })
    .from(users)
    .where(eq(users.email, bootstrapEmail))
    .limit(1);

  if (existing.length > 0) return;

  await db.insert(users).values({
    email: bootstrapEmail,
    name: process.env.ADMIN_NAME?.trim() || "Administrator",
    role: "admin",
    status: "active",
    passwordHash: await hashPassword(bootstrapPassword),
  });
}

export async function login(
  config: RuntimeConfig,
  email: string,
  password: string
): Promise<AuthResult> {
  const db = getDatabase(config);
  const normalizedEmail = normalizeEmail(email);
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  const user = result[0];

  if (
    !user ||
    !user.passwordHash ||
    !(await verifyPassword(password, user.passwordHash))
  ) {
    throw new Error("Invalid email or password.");
  }
  if (user.status !== "active") {
    throw new Error(`This account is ${user.status}.`);
  }

  const now = new Date();
  const token = randomBytes(32).toString("base64url");
  const tokenHash = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS);

  await db
    .update(users)
    .set({ lastLoginAt: now, updatedAt: now })
    .where(eq(users.id, user.id));
  await db.insert(sessions).values({
    userId: user.id,
    sessionHash: tokenHash,
    expiresAt,
    lastSeenAt: now,
  });

  const safeUser = toSafeUser({ ...user, lastLoginAt: now });
  activeSession = { tokenHash, user: safeUser };
  return { user: safeUser };
}

export async function logout(config: RuntimeConfig): Promise<void> {
  if (activeSession) {
    const db = getDatabase(config);
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(eq(sessions.sessionHash, activeSession.tokenHash));
  }

  activeSession = undefined;
}

export async function inviteUser(
  config: RuntimeConfig,
  email: string,
  role: "admin" | "user"
): Promise<InvitationResult> {
  const actor = requireActiveUser();
  assertAdmin(actor);

  const normalizedEmail = normalizeEmail(email);
  const db = getDatabase(config);
  const existing = await db
    .select({ id: users.id, status: users.status })
    .from(users)
    .where(eq(users.email, normalizedEmail))
    .limit(1);
  if (existing.length > 0) {
    throw new Error("A user with this email already exists.");
  }

  const token = randomBytes(32).toString("base64url");
  const expiresAt = new Date(Date.now() + INVITATION_TTL_MS);
  await db.insert(invitations).values({
    email: normalizedEmail,
    role,
    tokenHash: hashToken(token),
    invitedBy: actor.id,
    expiresAt,
  });
  await db.insert(users).values({
    email: normalizedEmail,
    name: normalizedEmail.split("@")[0] || normalizedEmail,
    role,
    status: "invited",
  });

  return { email: normalizedEmail, role, token, expiresAt };
}

export async function listUsers(config: RuntimeConfig): Promise<SafeUser[]> {
  const actor = requireActiveUser();
  assertAdmin(actor);
  const db = getDatabase(config);
  const result = await db.select().from(users).orderBy(asc(users.createdAt));
  return result.map(toSafeUser);
}

export async function setUserStatus(
  config: RuntimeConfig,
  userId: string,
  status: "active" | "inactive" | "suspended"
): Promise<void> {
  const actor = requireActiveUser();
  assertAdmin(actor);
  if (actor.id === userId && status !== "active") {
    throw new Error("The current admin cannot deactivate their own account.");
  }

  const db = getDatabase(config);
  await db
    .update(users)
    .set({ status, updatedAt: new Date() })
    .where(eq(users.id, userId));
  if (status !== "active") {
    await db
      .update(sessions)
      .set({ revokedAt: new Date(), updatedAt: new Date() })
      .where(and(eq(sessions.userId, userId), isNull(sessions.revokedAt)));
  }
}
