DROP INDEX IF EXISTS "User_clerkId_key";--> statement-breakpoint
ALTER TABLE "User" DROP COLUMN IF EXISTS "clerkId";--> statement-breakpoint
ALTER TABLE "User" ADD COLUMN "passwordHash" text NOT NULL;--> statement-breakpoint
CREATE TABLE "PasswordResetToken" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"userId" uuid NOT NULL,
	"tokenHash" text NOT NULL,
	"expiresAt" timestamp (3) NOT NULL,
	"usedAt" timestamp (3),
	"createdAt" timestamp (3) DEFAULT now() NOT NULL
);--> statement-breakpoint
ALTER TABLE "PasswordResetToken" ADD CONSTRAINT "PasswordResetToken_userId_User_id_fk" FOREIGN KEY ("userId") REFERENCES "public"."User"("id") ON DELETE cascade ON UPDATE cascade;--> statement-breakpoint
CREATE UNIQUE INDEX "PasswordResetToken_tokenHash_key" ON "PasswordResetToken" USING btree ("tokenHash");--> statement-breakpoint
CREATE INDEX "PasswordResetToken_userId_idx" ON "PasswordResetToken" USING btree ("userId");
