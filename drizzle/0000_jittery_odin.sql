CREATE TYPE "public"."browser_engine" AS ENUM('chromium', 'firefox', 'webkit');--> statement-breakpoint
CREATE TYPE "public"."browser_profile_status" AS ENUM('active', 'inactive', 'starting', 'running', 'stopping', 'stopped', 'error');--> statement-breakpoint
CREATE TYPE "public"."device_type" AS ENUM('desktop', 'mobile');--> statement-breakpoint
CREATE TYPE "public"."language_mode" AS ENUM('proxy', 'custom');--> statement-breakpoint
CREATE TYPE "public"."os_name" AS ENUM('windows', 'macos', 'linux', 'android', 'ios');--> statement-breakpoint
CREATE TYPE "public"."proxy_check_status" AS ENUM('queued', 'running', 'success', 'failed');--> statement-breakpoint
CREATE TYPE "public"."proxy_protocol" AS ENUM('http', 'https', 'socks4', 'socks5');--> statement-breakpoint
CREATE TYPE "public"."resource_status" AS ENUM('active', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('admin', 'user');--> statement-breakpoint
CREATE TYPE "public"."user_status" AS ENUM('active', 'inactive', 'invited', 'suspended');--> statement-breakpoint
CREATE TABLE "app_settings" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"key" text NOT NULL,
	"value" jsonb NOT NULL,
	"scope" text DEFAULT 'global' NOT NULL,
	"updated_by" uuid,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"entity" text NOT NULL,
	"entity_id" uuid,
	"result" text NOT NULL,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "browser_events" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"browser_profile_id" uuid NOT NULL,
	"actor_id" uuid,
	"action" text NOT NULL,
	"result" text NOT NULL,
	"error_code" text,
	"error_message" text,
	"duration_ms" integer,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "browser_profiles" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "browser_profile_status" DEFAULT 'inactive' NOT NULL,
	"engine" "browser_engine" NOT NULL,
	"fingerprint_id" uuid NOT NULL,
	"proxy_id" uuid,
	"proxy_enabled" boolean DEFAULT false NOT NULL,
	"language_mode" "language_mode" DEFAULT 'custom' NOT NULL,
	"language" text DEFAULT 'en-US' NOT NULL,
	"timezone" text,
	"user_data_dir_key" text NOT NULL,
	"last_started_at" timestamp with time zone,
	"last_stopped_at" timestamp with time zone,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "fingerprints" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"status" "resource_status" DEFAULT 'active' NOT NULL,
	"device_type" "device_type" NOT NULL,
	"os_name" "os_name" NOT NULL,
	"os_version" text NOT NULL,
	"browser_name" text NOT NULL,
	"browser_version" text NOT NULL,
	"user_agent" text NOT NULL,
	"locale" text DEFAULT 'en-US' NOT NULL,
	"timezone" text DEFAULT 'America/New_York' NOT NULL,
	"viewport" jsonb NOT NULL,
	"screen" jsonb NOT NULL,
	"client_hints" jsonb,
	"webgl" jsonb,
	"fonts" jsonb,
	"media" jsonb,
	"hardware" jsonb,
	"seed" text,
	"preset_version" text NOT NULL,
	"compatibility_warnings" jsonb,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"token_hash" text NOT NULL,
	"invited_by" uuid NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"accepted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proxies" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"name" text NOT NULL,
	"protocol" "proxy_protocol" NOT NULL,
	"host" text NOT NULL,
	"port" integer NOT NULL,
	"credential_ref" text,
	"status" "resource_status" DEFAULT 'active' NOT NULL,
	"country" text,
	"city" text,
	"isp" text,
	"timezone" text,
	"detected_ip" text,
	"latency_ms" integer,
	"last_checked_at" timestamp with time zone,
	"check_error" text,
	"deleted_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "proxy_checks" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"proxy_id" uuid NOT NULL,
	"requested_by" uuid NOT NULL,
	"status" "proxy_check_status" DEFAULT 'queued' NOT NULL,
	"latency_ms" integer,
	"metadata" jsonb,
	"error" text,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"user_id" uuid NOT NULL,
	"session_hash" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"last_seen_at" timestamp with time zone,
	"revoked_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"email" text NOT NULL,
	"name" text NOT NULL,
	"role" "user_role" DEFAULT 'user' NOT NULL,
	"status" "user_status" DEFAULT 'invited' NOT NULL,
	"password_hash" text,
	"last_login_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "app_settings" ADD CONSTRAINT "app_settings_updated_by_users_id_fk" FOREIGN KEY ("updated_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_events" ADD CONSTRAINT "browser_events_browser_profile_id_browser_profiles_id_fk" FOREIGN KEY ("browser_profile_id") REFERENCES "public"."browser_profiles"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_events" ADD CONSTRAINT "browser_events_actor_id_users_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_profiles" ADD CONSTRAINT "browser_profiles_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_profiles" ADD CONSTRAINT "browser_profiles_fingerprint_id_fingerprints_id_fk" FOREIGN KEY ("fingerprint_id") REFERENCES "public"."fingerprints"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_profiles" ADD CONSTRAINT "browser_profiles_proxy_id_proxies_id_fk" FOREIGN KEY ("proxy_id") REFERENCES "public"."proxies"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "fingerprints" ADD CONSTRAINT "fingerprints_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_users_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxies" ADD CONSTRAINT "proxies_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxy_checks" ADD CONSTRAINT "proxy_checks_proxy_id_proxies_id_fk" FOREIGN KEY ("proxy_id") REFERENCES "public"."proxies"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "proxy_checks" ADD CONSTRAINT "proxy_checks_requested_by_users_id_fk" FOREIGN KEY ("requested_by") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "app_settings_key_scope_unique" ON "app_settings" USING btree ("key","scope");--> statement-breakpoint
CREATE INDEX "audit_logs_actor_idx" ON "audit_logs" USING btree ("actor_id","created_at");--> statement-breakpoint
CREATE INDEX "audit_logs_entity_idx" ON "audit_logs" USING btree ("entity","entity_id");--> statement-breakpoint
CREATE INDEX "browser_events_profile_idx" ON "browser_events" USING btree ("browser_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "browser_events_actor_idx" ON "browser_events" USING btree ("actor_id");--> statement-breakpoint
CREATE UNIQUE INDEX "browser_profiles_owner_name_unique" ON "browser_profiles" USING btree ("owner_id","name");--> statement-breakpoint
CREATE UNIQUE INDEX "browser_profiles_data_dir_unique" ON "browser_profiles" USING btree ("user_data_dir_key");--> statement-breakpoint
CREATE INDEX "browser_profiles_owner_status_idx" ON "browser_profiles" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "fingerprints_owner_name_unique" ON "fingerprints" USING btree ("owner_id","name");--> statement-breakpoint
CREATE INDEX "fingerprints_owner_status_idx" ON "fingerprints" USING btree ("owner_id","status");--> statement-breakpoint
CREATE UNIQUE INDEX "invitations_token_hash_unique" ON "invitations" USING btree ("token_hash");--> statement-breakpoint
CREATE INDEX "invitations_email_idx" ON "invitations" USING btree ("email");--> statement-breakpoint
CREATE INDEX "invitations_expires_at_idx" ON "invitations" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "proxies_owner_name_unique" ON "proxies" USING btree ("owner_id","name");--> statement-breakpoint
CREATE INDEX "proxies_owner_status_idx" ON "proxies" USING btree ("owner_id","status");--> statement-breakpoint
CREATE INDEX "proxies_last_checked_idx" ON "proxies" USING btree ("last_checked_at");--> statement-breakpoint
CREATE INDEX "proxy_checks_proxy_idx" ON "proxy_checks" USING btree ("proxy_id","created_at");--> statement-breakpoint
CREATE INDEX "proxy_checks_status_idx" ON "proxy_checks" USING btree ("status");--> statement-breakpoint
CREATE UNIQUE INDEX "sessions_session_hash_unique" ON "sessions" USING btree ("session_hash");--> statement-breakpoint
CREATE INDEX "sessions_user_idx" ON "sessions" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "sessions_expires_at_idx" ON "sessions" USING btree ("expires_at");--> statement-breakpoint
CREATE UNIQUE INDEX "users_email_unique" ON "users" USING btree ("email");--> statement-breakpoint
CREATE INDEX "users_status_idx" ON "users" USING btree ("status");