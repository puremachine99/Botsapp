// src/test-db.js
const db = require("./db");

(async () => {
  try {
    const result = await db.query("SELECT * FROM users");
    console.table(result.rows);
  } catch (err) {
    console.error("Error:", err);
  } finally {
    process.exit(0);
  }
})();
