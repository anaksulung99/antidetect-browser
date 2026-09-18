CREATE TYPE "public"."browser_job_status" AS ENUM('queued', 'running', 'succeeded', 'failed', 'cancelled');--> statement-breakpoint
CREATE TABLE "browser_jobs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"owner_id" uuid NOT NULL,
	"browser_profile_id" uuid NOT NULL,
	"url" text NOT NULL,
	"status" "browser_job_status" DEFAULT 'queued' NOT NULL,
	"attempts" integer DEFAULT 0 NOT NULL,
	"max_attempts" integer DEFAULT 3 NOT NULL,
	"result" jsonb,
	"error" text,
	"queued_at" timestamp with time zone DEFAULT now() NOT NULL,
	"started_at" timestamp with time zone,
	"finished_at" timestamp with time zone,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "browser_jobs" ADD CONSTRAINT "browser_jobs_owner_id_users_id_fk" FOREIGN KEY ("owner_id") REFERENCES "public"."users"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "browser_jobs" ADD CONSTRAINT "browser_jobs_browser_profile_id_browser_profiles_id_fk" FOREIGN KEY ("browser_profile_id") REFERENCES "public"."browser_profiles"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "browser_jobs_owner_idx" ON "browser_jobs" USING btree ("owner_id","created_at");--> statement-breakpoint
CREATE INDEX "browser_jobs_profile_idx" ON "browser_jobs" USING btree ("browser_profile_id","created_at");--> statement-breakpoint
CREATE INDEX "browser_jobs_status_idx" ON "browser_jobs" USING btree ("status","created_at");