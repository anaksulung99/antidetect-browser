import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../../src/lib/db/schema";
import type { RuntimeConfig } from "../runtime-config";

export type AppDatabase = ReturnType<typeof createDatabase>;

export interface DatabaseStatus {
  mode: RuntimeConfig["databaseMode"];
  configured: boolean;
  reachable: boolean;
  message: string;
}

function createDatabase(connectionString: string) {
  const sql = neon(connectionString);
  return drizzle(sql, { schema });
}

let database: AppDatabase | undefined;

export function getDatabase(config: RuntimeConfig): AppDatabase {
  if (config.databaseMode === "embedded") {
    throw new Error(
      "Embedded database mode is not implemented yet. Use DATABASE_MODE=neon.",
    );
  }

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is missing. Configure Neon before starting.");
  }

  database ??= createDatabase(connectionString);
  return database;
}

export async function getDatabaseStatus(
  config: RuntimeConfig,
): Promise<DatabaseStatus> {
  if (config.databaseMode === "embedded") {
    return {
      mode: "embedded",
      configured: false,
      reachable: false,
      message: "Embedded database adapter is not implemented yet.",
    };
  }

  if (!process.env.DATABASE_URL) {
    return {
      mode: "neon",
      configured: false,
      reachable: false,
      message: "DATABASE_URL is not configured.",
    };
  }

  try {
    const db = getDatabase(config);
    await db.execute("select 1");

    return {
      mode: "neon",
      configured: true,
      reachable: true,
      message: "Neon database is reachable.",
    };
  } catch (error) {
    return {
      mode: "neon",
      configured: true,
      reachable: false,
      message:
        error instanceof Error ? error.message : "Database health check failed.",
    };
  }
}
