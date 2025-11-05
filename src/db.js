require('dotenv').config();

const DB_DRIVER = process.env.DB_DRIVER || 'postgres';
let db = null;

if (DB_DRIVER === 'postgres') {
  // === PostgreSQL Config ===
  const { Pool } = require('pg');
  const pool = new Pool({
    host: process.env.PGHOST,
    port: process.env.PGPORT || 5432,
    database: process.env.PGDATABASE,
    user: process.env.PGUSER,
    password: process.env.PGPASSWORD,
  });

  pool.connect()
    .then(() => console.log('✅ PostgreSQL connected'))
    .catch(err => console.error('❌ PostgreSQL connection failed:', err));

  db = {
    query: (text, params) => pool.query(text, params),
    close: () => pool.end(),
  };
}
else if (DB_DRIVER === 'sqlite') {
  // === SQLite Config ===
  const path = require('path');
  const Database = require('better-sqlite3');

  const dbFile = process.env.SQLITE_PATH || path.join(__dirname, '../data/app.db');
  const sqlite = new Database(dbFile);
  console.log(`✅ SQLite connected at ${dbFile}`);

  db = {
    query: (text, params = []) => {
      const stmt = sqlite.prepare(text);
      if (/^\s*select/i.test(text)) return stmt.all(params);
      return stmt.run(params);
    },
    close: () => sqlite.close(),
  };
}
else {
  throw new Error(`Unsupported DB_DRIVER: ${DB_DRIVER}`);
}

module.exports = db;
