
const postgres = require("postgres");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    console.log("Running migration manually...");
    
    const migration = `
ALTER TYPE "public"."AUTOMATION_CHANNEL" ADD VALUE IF NOT EXISTS 'WHATSAPP';
ALTER TYPE "public"."INTEGRATIONS" ADD VALUE IF NOT EXISTS 'WHATSAPP';
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappBusinessAccountId" text;
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappPhoneNumberId" text;
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappBusinessPhone" text;
ALTER TABLE "Integrations" ADD COLUMN IF NOT EXISTS "whatsappDisplayName" text;
ALTER TABLE "BillingUsage" ADD COLUMN IF NOT EXISTS "whatsappMessagesSent" integer DEFAULT 0 NOT NULL;
CREATE UNIQUE INDEX IF NOT EXISTS "Integrations_whatsappPhoneNumberId_key" ON "Integrations" USING btree ("whatsappPhoneNumberId");
    `;

    const statements = migration.split(';').map(s => s.trim()).filter(s => s.length > 0);

    for (const statement of statements) {
      console.log(`Executing: ${statement}`);
      try {
        await sql.unsafe(statement);
        console.log("Success");
      } catch (err) {
        if (err.message.includes("already exists")) {
          console.log(`Already exists, skipping...`);
        } else {
          console.error(`Error executing statement: ${err.message}`);
        }
      }
    }
    
    console.log("Done");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
