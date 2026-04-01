CREATE TYPE "public"."AUTOMATION_CHANNEL" AS ENUM('INSTAGRAM', 'FACEBOOK_MESSENGER');--> statement-breakpoint
CREATE TYPE "public"."INTEGRATIONS" AS ENUM('INSTAGRAM', 'FACEBOOK_MESSENGER');--> statement-breakpoint
CREATE TYPE "public"."LISTENERS" AS ENUM('SMARTAI', 'MESSAGE');--> statement-breakpoint
CREATE TYPE "public"."MEDIATYPE" AS ENUM('IMAGE', 'VIDEO', 'CAROSEL_ALBUM');--> statement-breakpoint
CREATE TYPE "public"."SUBSCRIPTION_PLAN" AS ENUM('PRO', 'FREE');--> statement-breakpoint
CREATE TABLE "Automation" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" text DEFAULT 'Untitled' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"active" boolean DEFAULT false NOT NULL,
	"channel" "AUTOMATION_CHANNEL" DEFAULT 'INSTAGRAM' NOT NULL,
	"userId" uuid
);
--> statement-breakpoint
CREATE TABLE "Dms" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automationId" uuid,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"channel" "AUTOMATION_CHANNEL" DEFAULT 'INSTAGRAM' NOT NULL,
	"senderId" text,
	"reciever" text,
	"message" text
);
--> statement-breakpoint
CREATE TABLE "Integrations" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" "INTEGRATIONS" DEFAULT 'INSTAGRAM' NOT NULL,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"userId" uuid,
	"token" text NOT NULL,
	"expiresAt" timestamp (3),
	"instagramId" text,
	"facebookPageId" text,
	"pageName" text
);
--> statement-breakpoint
CREATE TABLE "Keyword" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"word" text NOT NULL,
	"automationId" uuid
);
--> statement-breakpoint
CREATE TABLE "Listener" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"automationId" uuid NOT NULL,
	"listener" "LISTENERS" DEFAULT 'MESSAGE' NOT NULL,
	"prompt" text NOT NULL,
	"commentReply" text,
	"dmCount" integer DEFAULT 0 NOT NULL,
	"commentCount" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "Post" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"postid" text NOT NULL,
	"caption" text,
	"media" text NOT NULL,
	"mediaType" "MEDIATYPE" DEFAULT 'IMAGE' NOT NULL,
	"automationId" uuid
);
--> statement-breakpoint
CREATE TABLE "Subscription" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL,
	"plan" "SUBSCRIPTION_PLAN" DEFAULT 'FREE' NOT NULL,
	"updatedAt" timestamp (3) DEFAULT now() NOT NULL,
	"customerId" text
);
--> statement-breakpoint
CREATE TABLE "Trigger" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"type" text NOT NULL,
	"automationId" uuid
);
--> statement-breakpoint
CREATE TABLE "User" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"clerkId" text NOT NULL,
	"email" text NOT NULL,
	"firstname" text,
	"lastname" text,
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "Automation" ADD CONSTRAINT "Automation_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Dms" ADD CONSTRAINT "Dms_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE set null ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Integrations" ADD CONSTRAINT "Integrations_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Keyword" ADD CONSTRAINT "Keyword_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Listener" ADD CONSTRAINT "Listener_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Post" ADD CONSTRAINT "Post_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Subscription" ADD CONSTRAINT "Subscription_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
ALTER TABLE "Trigger" ADD CONSTRAINT "Trigger_automationId_Automation_id_fk" FOREIGN KEY ("automationId") REFERENCES "public"."Automation"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "Integrations_token_key" ON "Integrations" USING btree ("token");--> statement-breakpoint
CREATE UNIQUE INDEX "Integrations_instagramId_key" ON "Integrations" USING btree ("instagramId");--> statement-breakpoint
CREATE UNIQUE INDEX "Integrations_facebookPageId_key" ON "Integrations" USING btree ("facebookPageId");--> statement-breakpoint
CREATE UNIQUE INDEX "Keyword_automationId_word_key" ON "Keyword" USING btree ("automationId","word");--> statement-breakpoint
CREATE UNIQUE INDEX "Listener_automationId_key" ON "Listener" USING btree ("automationId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_userId_key" ON "Subscription" USING btree ("userId");--> statement-breakpoint
CREATE UNIQUE INDEX "Subscription_customerId_key" ON "Subscription" USING btree ("customerId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_clerkId_key" ON "User" USING btree ("clerkId");--> statement-breakpoint
CREATE UNIQUE INDEX "User_email_key" ON "User" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "User_firstname_key" ON "User" USING btree ("firstname");--> statement-breakpoint
CREATE UNIQUE INDEX "User_lastname_key" ON "User" USING btree ("lastname");