CREATE TABLE IF NOT EXISTS "ProcessedExternalEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"provider" text NOT NULL,
	"eventKey" text NOT NULL,
	"status" text DEFAULT 'SUCCESS' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"processedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX IF NOT EXISTS "ProcessedExternalEvent_provider_event_key" ON "ProcessedExternalEvent" USING btree ("provider","eventKey");
--> statement-breakpoint
CREATE INDEX IF NOT EXISTS "ProcessedExternalEvent_provider_created_idx" ON "ProcessedExternalEvent" USING btree ("provider","createdAt");
