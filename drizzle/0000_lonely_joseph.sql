CREATE TABLE "entities" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text NOT NULL,
	"group_parent_id" uuid,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "sync_logs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"source" text NOT NULL,
	"run_at" timestamp DEFAULT now() NOT NULL,
	"status" text NOT NULL,
	"records" integer DEFAULT 0 NOT NULL,
	"message" text
);
--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_group_parent_id_entities_id_fk" FOREIGN KEY ("group_parent_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;