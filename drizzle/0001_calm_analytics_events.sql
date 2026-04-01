CREATE TABLE "AutomationEvent" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"automationId" uuid,
	"channel" "AUTOMATION_CHANNEL" DEFAULT 'INSTAGRAM' NOT NULL,
	"triggerType" text,
	"eventType" text NOT NULL,
	"senderId" text,
	"postId" text,
	"commentId" text,
	"status" text DEFAULT 'INFO' NOT NULL,
	"reason" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "AutomationEvent" ADD CONSTRAINT "AutomationEvent_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;
--> statement-breakpoint
ALTER TABLE "AutomationEvent" ADD CONSTRAINT "AutomationEvent_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE set null ON UPDATE cascade;
--> statement-breakpoint
CREATE INDEX "AutomationEvent_user_created_idx" ON "AutomationEvent" USING btree ("userId","createdAt");
--> statement-breakpoint
CREATE INDEX "AutomationEvent_automation_created_idx" ON "AutomationEvent" USING btree ("automationId","createdAt");
