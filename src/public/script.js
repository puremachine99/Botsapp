const resultBox = document.getElementById("result");
const sendBtn = document.getElementById("sendBtn");
const clearBtn = document.getElementById("clearLog");
const selectAllBtn = document.getElementById("selectAll");
const refreshBtn = document.getElementById("refreshUsers");
const statusLabel = document.getElementById("status");
const userListContainer = document.getElementById("userList");

let users = [];

async function loadUsers() {
  try {
    const res = await fetch("/users");
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    let allUsers = await res.json();

    // Filter hanya team kosong atau "Not Responded"
    users = allUsers.filter(
      (u) =>
        !u.team ||
        u.team.trim() === "" ||
        u.team.toLowerCase() === "not responded"
    );

    if (users.length === 0) {
      userListContainer.innerHTML = `<div class="text-zinc-500 italic">Tidak ada user yang perlu dikirimi pesan.</div>`;
      return;
    }

    renderUserList();
  } catch (err) {
    userListContainer.innerHTML = `<div class="text-red-400 text-sm">❌ Gagal load user: ${err.message}</div>`;
  }
}

function renderUserList() {
  userListContainer.innerHTML = "";
  users.forEach((u) => {
    const card = document.createElement("div");
    card.className =
      "user-card border border-zinc-700 rounded-lg p-3 cursor-pointer hover:bg-zinc-800 transition flex flex-col";
    card.dataset.id = u.id;
    card.dataset.name = u.full_name;
    card.dataset.phone = u.phone;

    card.innerHTML = `
      <div class="flex justify-between items-center">
        <span class="font-semibold text-zinc-100">${u.full_name}</span>
        <span class="text-xs px-2 py-1 rounded-full ${
          u.team && u.team.toLowerCase() === "not responded"
            ? "bg-zinc-700 text-zinc-400"
            : "bg-amber-400 text-zinc-900"
        }">${u.team || "-"}</span>
      </div>
      <div class="text-zinc-400 text-xs mt-1">${u.phone}</div>
    `;

    card.addEventListener("click", () => {
      card.classList.toggle("bg-amber-400/20");
      card.classList.toggle("border-amber-400");
      card.classList.toggle("selected");
    });

    userListContainer.appendChild(card);
  });
}

function getSelectedUsers() {
  return Array.from(document.querySelectorAll(".user-card.selected")).map(
    (el) => ({
      id: el.dataset.id,
      name: el.dataset.name,
      phone: el.dataset.phone,
    })
  );
}

function logOutput(text, isError = false) {
  const now = new Date().toLocaleTimeString();
  const line = `[${now}] ${text}\n`;
  resultBox.textContent += line;
  resultBox.scrollTop = resultBox.scrollHeight;
  if (isError) console.error(text);
}

clearBtn.addEventListener("click", () => {
  resultBox.textContent = "Log dibersihkan...\n";
});

selectAllBtn.addEventListener("click", () => {
  document.querySelectorAll(".user-card").forEach((el) => {
    el.classList.add("selected", "bg-amber-400/20", "border-amber-400");
  });
  logOutput("✅ Semua user dipilih.");
});

refreshBtn.addEventListener("click", () => {
  logOutput("🔄 Memuat ulang daftar user...");
  loadUsers();
});

sendBtn.addEventListener("click", async () => {
  const message = document.getElementById("message").value.trim();
  if (!message) return alert("Pesan tidak boleh kosong!");

  const selected = getSelectedUsers();
  if (selected.length === 0) return alert("Pilih minimal satu penerima!");

  logOutput(`⏳ Mengirim pesan ke ${selected.length} penerima...`);

  for (const user of selected) {
    const personalized = message.replaceAll("{{user}}", user.name);
    try {
      // kirim ke /broadcast (satu nomor)
      const res = await fetch("/broadcast", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: user.phone, message: personalized }),
      });
      const data = await res.json();

      if (data.success) {
        logOutput(`✅ ${user.name} (${user.phone}) — sukses`);

        // update kolom team user langsung saat sukses
        try {
          await fetch(`/users/${user.id}/team`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ team: "Not Responded" }),
          });
          logOutput(`🗂️ ${user.name} ditandai "Not Responded"`);
        } catch (updateErr) {
          logOutput(
            `⚠️ Gagal update status ${user.name}: ${updateErr.message}`,
            true
          );
        }
      } else {
        logOutput(
          `⚠️ ${user.name} (${user.phone}) — gagal: ${
            data.error || data.message
          }`,
          true
        );
      }
    } catch (err) {
      logOutput(
        `❌ ${user.name} (${user.phone}) — error: ${err.message}`,
        true
      );
    }
  }

  logOutput("📩 Pengiriman selesai.");
  loadUsers(); // refresh daftar user biar status ter-update
});

async function checkBotStatus() {
  try {
    const res = await fetch("/broadcast", { method: "OPTIONS" });
    if (res.ok) {
      statusLabel.textContent = "Bot: ✅ Online";
      statusLabel.className =
        "text-sm bg-amber-400 text-zinc-900 px-3 py-1 rounded-full";
    } else throw new Error();
  } catch {
    statusLabel.textContent = "Bot: 🔴 Offline";
    statusLabel.className =
      "text-sm bg-zinc-800 text-red-400 px-3 py-1 rounded-full";
  }
}

checkBotStatus();
setInterval(checkBotStatus, 10000);
loadUsers();
