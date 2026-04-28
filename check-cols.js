
const postgres = require("postgres");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    const cols = await sql`SELECT column_name, data_type FROM information_schema.columns WHERE table_schema = 'drizzle' AND table_name = '__drizzle_migrations'`;
    console.log(cols);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
