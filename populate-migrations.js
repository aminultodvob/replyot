
const postgres = require("postgres");
const fs = require("fs");
const path = require("path");
const crypto = require("crypto");

const DATABASE_URL = "postgresql://neondb_owner:npg_Y21EnycWtgbk@ep-wandering-credit-a10ezec0-pooler.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require";
const sql = postgres(DATABASE_URL, { ssl: "require" });

const drizzleDir = path.join(__dirname, "drizzle");

async function run() {
  try {
    const journal = JSON.parse(fs.readFileSync(path.join(drizzleDir, "meta", "_journal.json"), "utf8"));
    
    for (const entry of journal.entries) {
      const sqlFile = entry.tag + ".sql";
      const sqlPath = path.join(drizzleDir, sqlFile);
      
      if (fs.existsSync(sqlPath)) {
        const content = fs.readFileSync(sqlPath, "utf8");
        const hash = crypto.createHash("sha256").update(content).digest("hex");
        
        console.log(`Inserting ${entry.tag} with hash ${hash}`);
        
        await sql`
          INSERT INTO drizzle.__drizzle_migrations (hash, created_at)
          VALUES (${hash}, ${BigInt(Date.now())})
          ON CONFLICT DO NOTHING
        `;
      }
    }
    
    console.log("Done populating migrations table.");
  } catch (err) {
    console.error(err);
  } finally {
    await sql.end();
  }
}

run();
