CREATE TYPE "public"."PAYMENT_PROVIDER" AS ENUM('UDDOKTAPAY');
--> statement-breakpoint
CREATE TYPE "public"."SUBSCRIPTION_STATUS" AS ENUM(
	'INACTIVE',
	'PENDING',
	'ACTIVE',
	'EXPIRED',
	'CANCELED',
	'FAILED'
);
--> statement-breakpoint
DROP INDEX "Subscription_customerId_key";
--> statement-breakpoint
ALTER TABLE "Subscription"
	ADD COLUMN "provider" "PAYMENT_PROVIDER",
	ADD COLUMN "status" "SUBSCRIPTION_STATUS" DEFAULT 'INACTIVE' NOT NULL,
	ADD COLUMN "billingPeriodStart" timestamp (3),
	ADD COLUMN "billingPeriodEnd" timestamp (3),
	ADD COLUMN "lastPaymentAt" timestamp (3),
	ADD COLUMN "externalPaymentId" text,
	ADD COLUMN "invoiceId" text,
	ADD COLUMN "renewalReminderSentAt" timestamp (3);
--> statement-breakpoint
ALTER TABLE "Subscription" DROP COLUMN "customerId";
--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_invoiceId_key" ON "Subscription" USING btree ("invoiceId");
