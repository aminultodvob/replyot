
const postgres = require("postgres");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    const migrations = await sql`SELECT * FROM public.__drizzle_migrations`;
    console.log("Public Migrations:", migrations);
  } catch (err) {
    console.log("No public.__drizzle_migrations table found");
  } finally {
    await sql.end();
  }
}

run();
