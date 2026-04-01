CREATE TYPE "public"."PAYMENT_HISTORY_STATUS" AS ENUM('PENDING', 'PAID', 'FAILED', 'CANCELED', 'REFUNDED');--> statement-breakpoint
CREATE TABLE "PaymentHistory" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"subscriptionId" uuid,
	"provider" "PAYMENT_PROVIDER" DEFAULT 'UDDOKTAPAY' NOT NULL,
	"invoiceId" text NOT NULL,
	"externalPaymentId" text,
	"plan" "SUBSCRIPTION_PLAN" DEFAULT 'PRO' NOT NULL,
	"amount" text NOT NULL,
	"currency" text NOT NULL,
	"status" "PAYMENT_HISTORY_STATUS" DEFAULT 'PENDING' NOT NULL,
	"billingPeriodStart" timestamp (3),
	"billingPeriodEnd" timestamp (3),
	"paidAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "PaymentHistory" ADD CONSTRAINT "PaymentHistory_subscriptionId_Subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "PaymentHistory_invoiceId_key" ON "PaymentHistory" USING btree ("invoiceId");--> statement-breakpoint
CREATE INDEX "PaymentHistory_user_created_idx" ON "PaymentHistory" USING btree ("userId","createdAt");