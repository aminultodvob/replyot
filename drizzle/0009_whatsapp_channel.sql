-- ALTER TYPE "public"."AUTOMATION_CHANNEL" ADD VALUE IF NOT EXISTS 'WHATSAPP';--> statement-breakpoint
-- ALTER TYPE "public"."INTEGRATIONS" ADD VALUE IF NOT EXISTS 'WHATSAPP';--> statement-breakpoint
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappBusinessAccountId" text;--> statement-breakpoint
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" text;--> statement-breakpoint
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappBusinessPhone" text;--> statement-breakpoint
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappDisplayName" text;--> statement-breakpoint
ALTER TABLE "BillingUsage" ADD COLUMN IF NOT EXISTS "whatsappMessagesSent" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
DO $$ BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relname = 'Integrations_whatsappPhoneNumberId_key' AND n.nspname = 'public') THEN
        CREATE UNIQUE INDEX "Integrations_whatsappPhoneNumberId_key" ON "Integrations" USING btree ("whatsappPhoneNumberId");
    END IF;
END $$;
