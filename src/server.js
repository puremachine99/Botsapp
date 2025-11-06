// node src/server.js
require("dotenv").config();
const express = require("express");
const path = require("path");
const db = require("./db");
const { initBot, sendMessageBatch, getRandomAssetImage } = require("./bot");

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
    const mediaPath = getRandomAssetImage();
    const recipients = [{ phone, mediaPath }];
    const { sent, failed } = await sendMessageBatch(recipients, message);

    if (sent === 0) {
      return res.status(500).json({
        success: false,
        error: failed ? "Failed to send message" : "Bot is not ready",
      });
    }

    res.json({
      success: true,
      sent,
      failed,
      media: mediaPath ? `/assets/${path.basename(mediaPath)}` : null,
    });
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
      "SELECT id, full_name, phone, channel, respon, keterangan, respon AS team FROM users ORDER BY id"
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
    const { full_name, phone, channel, respon, keterangan } = req.body;
    const { rows } = await db.query(
      "INSERT INTO users (full_name, phone, channel, respon, keterangan) VALUES ($1,$2,$3,$4,$5) RETURNING *",
      [full_name, phone, channel, respon, keterangan]
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
    const { full_name, phone, channel, respon, keterangan } = req.body;
    const { rows } = await db.query(
      `UPDATE users 
       SET full_name=$1, phone=$2, channel=$3, respon=$4, keterangan=$5 
       WHERE id=$6 RETURNING *`,
      [full_name, phone, channel, respon, keterangan, id]
    );
    res.json(rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to update user" });
  }
});
// === Endpoint: update team user saja ===
// Endpoint lama (kompatibilitas): map "team" ke kolom "respon"
app.patch("/users/:id/team", async (req, res) => {
  try {
    const id = req.params.id;
    const { team } = req.body;

    if (!team) {
      return res.status(400).json({ error: "Team value is required" });
    }

    const { rows } = await db.query(
      `UPDATE users SET respon = $1 WHERE id = $2 RETURNING id, full_name, respon`,
      [team, id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      message: `User #${id} updated with respon = '${team}'`,
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

// === Endpoint: import CSV sederhana ===
// Terima body bertipe text/csv dengan header: full_name,phone,department,team,tags
app.post(
  "/users/import",
  express.text({ type: "text/csv", limit: "5mb" }),
  async (req, res) => {
    try {
      const csv = (req.body || "").trim();
      if (!csv) return res.status(400).json({ error: "Empty CSV" });

      const lines = csv.split(/\r?\n/).filter(Boolean);
      if (lines.length < 2) {
        return res.status(400).json({ error: "CSV must include header and rows" });
      }

      const header = lines[0]
        .split(",")
        .map((h) => h.trim().toLowerCase());
      const needed = ["full_name", "phone", "channel", "respon", "keterangan"];
      // toleransi variasi header
      const norm = (s) => s.replace(/\s+/g, "_").toLowerCase();
      const idx = Object.fromEntries(
        needed.map((k) => [k, header.findIndex((h) => norm(h) === k)])
      );
      if (idx.full_name < 0 || idx.phone < 0) {
        return res.status(400).json({
          error: "Header minimal memuat full_name dan phone",
          header,
        });
      }

      let inserted = 0;
      let skipped = 0;

      await db.query("BEGIN");
      try {
        for (let i = 1; i < lines.length; i++) {
          const cols = lines[i].split(",").map((c) => c.trim());
          const full_name = cols[idx.full_name] || "";
          const phone = cols[idx.phone] || "";
          const channel = idx.channel >= 0 ? cols[idx.channel] || null : null;
          const respon = idx.respon >= 0 ? cols[idx.respon] || null : null;
          const keterangan = idx.keterangan >= 0 ? cols[idx.keterangan] || null : null;
          if (!full_name || !phone) {
            skipped++;
            continue;
          }
          await db.query(
            "INSERT INTO users (full_name, phone, channel, respon, keterangan) VALUES ($1,$2,$3,$4,$5)",
            [full_name, phone, channel, respon, keterangan]
          );
          inserted++;
        }
        await db.query("COMMIT");
      } catch (e) {
        await db.query("ROLLBACK");
        throw e;
      }

      res.json({ success: true, inserted, skipped, total: lines.length - 1 });
    } catch (err) {
      console.error("CSV import error:", err);
      res.status(500).json({ error: "Failed to import CSV", detail: err.message });
    }
  }
);

app.listen(PORT, () =>
  console.log(`🚀 Server running at http://localhost:${PORT}`)
);
