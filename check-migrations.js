
const postgres = require("postgres");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    const rows = await sql`SELECT * FROM drizzle.__drizzle_migrations ORDER BY created_at DESC LIMIT 5`;
    console.log(JSON.stringify(rows, null, 2));
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
