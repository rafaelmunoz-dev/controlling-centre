CREATE TABLE "purchase_orders" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"order_number" text NOT NULL,
	"status" text,
	"priority" text,
	"entity_id" uuid NOT NULL,
	"department_name" text,
	"requested_by_name" text,
	"requested_by_email" text,
	"approved_by_name" text,
	"approved_by_email" text,
	"created_at" timestamp,
	"approved_at" timestamp,
	"executed_at" timestamp,
	"completed_at" timestamp,
	"source_order_id" text NOT NULL,
	CONSTRAINT "purchase_orders_order_number_unique" UNIQUE("order_number"),
	CONSTRAINT "purchase_orders_source_order_id_unique" UNIQUE("source_order_id")
);
--> statement-breakpoint
CREATE TABLE "order_items" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"description" text,
	"quantity" numeric(12, 2),
	"unit" text
);
--> statement-breakpoint
CREATE TABLE "order_suppliers" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"purchase_order_id" uuid NOT NULL,
	"supplier_name" text,
	"amount" numeric(12, 2),
	"currency" text
);
--> statement-breakpoint
ALTER TABLE "entities" ADD COLUMN "code" text;--> statement-breakpoint
ALTER TABLE "purchase_orders" ADD CONSTRAINT "purchase_orders_entity_id_entities_id_fk" FOREIGN KEY ("entity_id") REFERENCES "public"."entities"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_items" ADD CONSTRAINT "order_items_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "order_suppliers" ADD CONSTRAINT "order_suppliers_purchase_order_id_purchase_orders_id_fk" FOREIGN KEY ("purchase_order_id") REFERENCES "public"."purchase_orders"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "entities" ADD CONSTRAINT "entities_code_unique" UNIQUE("code");