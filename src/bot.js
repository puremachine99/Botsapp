// src/bot.js
const { Client, LocalAuth } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");

let client;
let isReady = false;

async function initBot() {
  client = new Client({
    authStrategy: new LocalAuth(),
    puppeteer: {
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    },
  });

  client.on("qr", (qr) => {
    console.clear();
    console.log("📱 Scan QR berikut untuk login ke WhatsApp:");
    qrcode.generate(qr, { small: true });
  });

  client.on("ready", () => {
    isReady = true;
    console.log("✅ WhatsApp bot siap digunakan!");
  });

  client.on("disconnected", (reason) => {
    isReady = false;
    console.log("⚠️ Bot terputus:", reason);
  });

  client.on("message", async (msg) => {
    const text = msg.body.toLowerCase().trim();
    if (text === "ping") await msg.reply("pong 🏓");
  });

  await client.initialize();
  return client;
}

async function sendMessageBatch(users, text, delay = [3000, 7000]) {
  if (!isReady) {
    console.log("⚠️ Bot belum siap, tunggu READY dulu.");
    return { sent: 0, failed: users.length };
  }

  let sent = 0,
    failed = 0;

  for (const u of users) {
    // Format nomor WhatsApp
    const phone = (u.phone || "").replace(/\D/g, "").replace(/^0/, "62");
    const chatId = `${phone}@c.us`;

    // Ganti placeholder template
    const message = text
      .replace(/{{\s*nama\s*}}/gi, u.full_name || "")
      .replace(/{{\s*dept\s*}}/gi, u.department || "-")
      .replace(/{{\s*team\s*}}/gi, u.team || "-")
      .replace(/{{\s*tags\s*}}/gi, (u.tags || []).join(", "));

    try {
      await client.sendMessage(chatId, message);
      sent++;
      console.log(`✅ Sent to ${u.full_name} (${chatId})`);
    } catch (err) {
      failed++;
      console.error(`❌ Failed to ${chatId}:`, err.message);
    }

    // Delay acak antar pesan
    const randomDelay =
      Math.floor(Math.random() * (delay[1] - delay[0] + 1)) + delay[0];
    await new Promise((r) => setTimeout(r, randomDelay));
  }

  return { sent, failed };
}

module.exports = { initBot, sendMessageBatch };
