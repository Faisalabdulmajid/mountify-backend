import postgres from "postgres";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
const __dirname = path.dirname(fileURLToPath(import.meta.url));

let sql;
let using = "";

async function tryConnect(connectionString) {
  try {
    const testSql = postgres(connectionString);
    await testSql`SELECT 1`;
    return testSql;
  } catch (err) {
    console.error("DB connect error:", err && err.stack ? err.stack : err);
    return null;
  }
}

async function initDb() {
  // Coba Supabase dulu
  if (process.env.DATABASE_URL) {
    const supabaseSql = await tryConnect(process.env.DATABASE_URL);
    if (supabaseSql) {
      using = "supabase";
      return supabaseSql;
    }
  }
  // Fallback ke lokal
  const localConn = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
  };
  const localUrl = `postgresql://${localConn.username}:${localConn.password}@${localConn.host}:${localConn.port}/${localConn.database}`;
  const localSql = await tryConnect(localUrl);
  if (localSql) {
    using = "local";
    return localSql;
  } else {
    console.error(
      "DB connect error: Tidak bisa konek ke database lokal maupun Supabase!"
    );
  }
  throw new Error("Tidak bisa konek ke database manapun!");
}

// Inisialisasi dan log info ke dotenv
const dbPromise = initDb().then((db) => {
  // Tulis info ke .env
  const envPath = process.env.ENV_PATH || path.join(__dirname, "../.env");
  let envContent = fs.readFileSync(envPath, "utf-8");
  envContent = envContent.replace(/DB_IN_USE=.*/g, "");
  envContent += `\nDB_IN_USE=${using}`;
  fs.writeFileSync(envPath, envContent);
  console.log(`\u2705 Database terhubung ke: ${using}`);
  console.log(`DB_IN_USE=${using}`);
  return db;
});

export default new Proxy(
  {},
  {
    get: function (_, prop) {
      return async (...args) => {
        const db = await dbPromise;
        return db[prop](...args);
      };
    },
  }
);
