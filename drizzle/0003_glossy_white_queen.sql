CREATE TABLE "BillingUsage" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"subscriptionId" uuid,
	"periodStart" timestamp (3) NOT NULL,
	"periodEnd" timestamp (3) NOT NULL,
	"facebookCommentReplies" integer DEFAULT 0 NOT NULL,
	"instagramDmReplies" integer DEFAULT 0 NOT NULL,
	"instagramCommentReplies" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "BillingUsage" ADD CONSTRAINT "BillingUsage_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "BillingUsage" ADD CONSTRAINT "BillingUsage_subscriptionId_Subscription_id_fk" FOREIGN KEY ("subscriptionId") REFERENCES "public"."Subscription"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE UNIQUE INDEX "BillingUsage_user_period_key" ON "BillingUsage" USING btree ("userId","periodStart","periodEnd");
--> statement-breakpoint
CREATE INDEX "BillingUsage_user_period_idx" ON "BillingUsage" USING btree ("userId","periodStart","periodEnd");
