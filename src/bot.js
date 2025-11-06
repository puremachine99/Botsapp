// src/bot.js
const { Client, LocalAuth, MessageMedia } = require("whatsapp-web.js");
const qrcode = require("qrcode-terminal");
const fs = require("fs");
const path = require("path");

let client;
let isReady = false;
let cachedAssetImages = null;
const assetsDir = path.join(__dirname, "public", "assets");

function getAssetImages() {
  if (cachedAssetImages !== null) return cachedAssetImages;

  try {
    const entries = fs.readdirSync(assetsDir, { withFileTypes: true });
    cachedAssetImages = entries
      .filter(
        (entry) =>
          entry.isFile() &&
          /\.(jpe?g|png|gif|webp|bmp)$/i.test(entry.name || "")
      )
      .map((entry) => path.join(assetsDir, entry.name));
    if (cachedAssetImages.length === 0) {
      console.warn("⚠️ Folder assets tidak memiliki gambar yang valid.");
    }
  } catch (err) {
    cachedAssetImages = [];
    console.error("⚠️ Gagal membaca folder assets:", err.message);
  }

  return cachedAssetImages;
}

function getRandomAssetImage() {
  const assets = getAssetImages();
  if (!assets.length) return null;
  const index = Math.floor(Math.random() * assets.length);
  return assets[index];
}

function guessMimeType(filePath) {
  const ext = (path.extname(filePath) || "").toLowerCase();
  switch (ext) {
    case ".jpg":
    case ".jpeg":
      return "image/jpeg";
    case ".png":
      return "image/png";
    case ".gif":
      return "image/gif";
    case ".webp":
      return "image/webp";
    case ".bmp":
      return "image/bmp";
    default:
      return "application/octet-stream";
  }
}

function createMediaFromPath(filePath) {
  const mimeType = guessMimeType(filePath);
  const filename = path.basename(filePath);
  const base64Data = fs.readFileSync(filePath, { encoding: "base64" });
  return new MessageMedia(mimeType, base64Data, filename);
}

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
  const assetImages = getAssetImages();

  for (const u of users) {
    // Format nomor WhatsApp
    const phone = (u.phone || "").replace(/\D/g, "").replace(/^0/, "62");
    const chatId = `${phone}@c.us`;

    // Ganti placeholder template
    const message = text
      .replace(/{{\s*nama\s*}}/gi, u.full_name || "")
      .replace(/{{\s*dept\s*}}/gi, u.channel || "-")
      .replace(/{{\s*team\s*}}/gi, u.respon || "-")
      .replace(/{{\s*tags\s*}}/gi, u.keterangan || "-");

    // Prioritaskan mediaPath jika disediakan, fallback ke random asset
    let chosenImage = null;
    if (u.mediaPath) {
      try {
        if (fs.existsSync(u.mediaPath)) {
          chosenImage = u.mediaPath;
        } else {
          console.warn(
            `⚠️ mediaPath tidak ditemukan (${u.mediaPath}), gunakan random image.`
          );
        }
      } catch (checkErr) {
        console.warn(
          `⚠️ Gagal cek mediaPath (${u.mediaPath}): ${checkErr.message}`
        );
      }
    }
    if (!chosenImage && assetImages.length > 0) {
      const randomIndex = Math.floor(Math.random() * assetImages.length);
      chosenImage = assetImages[randomIndex];
    }

    try {
      if (chosenImage) {
        try {
          const media = createMediaFromPath(chosenImage);
          await client.sendMessage(chatId, media, { caption: message });
          console.log(
            `🖼️ Kirim gambar ${path.basename(
              chosenImage
            )} ke ${u.full_name || phone} (${chatId})`
          );
        } catch (mediaErr) {
          console.warn(
            `⚠️ Gagal kirim gambar (${chosenImage}) ke ${chatId}, fallback teks: ${mediaErr.message}`
          );
          await client.sendMessage(chatId, message);
        }
      } else {
        await client.sendMessage(chatId, message);
      }
      sent++;
      console.log(`✅ Sent to ${u.full_name || phone} (${chatId})`);
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

module.exports = { initBot, sendMessageBatch, getRandomAssetImage };
