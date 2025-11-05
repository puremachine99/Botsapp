// src/server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");
const { initBot, sendMessageBatch } = require("./bot");

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, "public")));

let waClientReady = false;

// === Inisialisasi bot WhatsApp ===
(async () => {
  const client = await initBot();
  client.on("ready", () => {
    waClientReady = true;
    console.log("🤖 WhatsApp Bot sudah siap digunakan!");
  });
})();

// === Endpoint Broadcast ===
app.post("/broadcast", async (req, res) => {
  const { phone, message } = req.body;
  if (!phone || !message) {
    return res
      .status(400)
      .json({ success: false, error: "Missing phone/message" });
  }

  try {
    // panggil bot kirim ke 1 nomor aja
    await sendMessageBatch([{ phone }], message);
    res.json({ success: true });
  } catch (err) {
    console.error("send error:", err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// === Jalankan Server ===
const PORT = process.env.PORT || 3000;

// === Endpoint: get semua user ===
app.get("/users", async (req, res) => {
  try {
    const { rows } = await db.query(
      "SELECT id, full_name, phone, department, team, tags FROM users ORDER BY id"
    );
    res.json(rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch users" });
  }
});

// === Endpoint: tambah user ===
app.post("/users", async (req, res) => {
  try {
    const { full_name, phone, department, team, tags } = req.body;
    const { rows } = await db.query(
      "INSERT INTO users (full_name, phone, department, team, tags) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [full_name, phone, department, team, tags]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to insert user" });
  }
});

// === Endpoint: update user ===
app.put("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const { full_name, phone, department, team, tags } = req.body;
    const { rows } = await db.query(
      `UPDATE users 
       SET full_name=$1, phone=$2, department=$3, team=$4, tags=$5 
       WHERE id=$6 RETURNING *`,
      [full_name, phone, department, team, tags, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});
// === Endpoint: update team user saja ===
app.patch("/users/:id/team", async (req, res) => {
  try {
    const id = req.params.id;
    const { team } = req.body;

    if (!team) {
      return res.status(400).json({ error: "Team value is required" });
    }

    const { rows } = await db.query(
      `UPDATE users SET team = $1 WHERE id = $2 RETURNING id, full_name, team`,
      [team, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `User #${id} updated with team = '${team}'`,
      data: rows[0],
    });
  } catch (err) {
    console.error("❌ Error updating team:", err);
    res.status(500).json({ error: "Failed to update team" });
  }
});

// === Endpoint: hapus user ===
app.delete("/users/:id", async (req, res) => {
  try {
    const id = req.params.id;
    await db.query("DELETE FROM users WHERE id=$1", [id]);
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to delete user" });
  }
});

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
