
const postgres = require("postgres");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

async function run() {
  try {
    const tables = await sql`SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'`;
    console.log(tables.map(t => t.table_name));
    
    const migrations = await sql`SELECT * FROM drizzle.__drizzle_migrations`;
    console.log("Migrations:", migrations);
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
