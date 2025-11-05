// src/db.js
require('dotenv').config();
const { Pool } = require('pg');

// Pool koneksi PostgreSQL
const pool = new Pool({
  host: process.env.PGHOST,
  port: process.env.PGPORT || 5432,
  database: process.env.PGDATABASE,
  user: process.env.PGUSER,
  password: process.env.PGPASSWORD,
});

pool.connect()
  .then(() => console.log('✅ Koneksi ke PostgreSQL berhasil'))
  .catch(err => console.error('❌ Gagal konek ke PostgreSQL:', err));

module.exports = {
  query: (text, params) => pool.query(text, params),
  pool,
};
