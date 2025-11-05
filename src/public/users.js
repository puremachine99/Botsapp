const userTable = document.getElementById("userTable");
const form = document.getElementById("addForm");
const refreshBtn = document.getElementById("refreshUsers");
const importBtn = document.getElementById("importCsvBtn");
const csvInput = document.getElementById("csvFile");

const channels = ["whatsapp", "telegram", "sms"];
const responOptions = ["Not Responded", "Responded", "Invalid"];

async function fetchUsers() {
  const res = await fetch("/users");
  const users = await res.json();
  userTable.innerHTML = "";
  users.forEach((u) => renderRow(u));
}

function renderRow(u) {
  const tr = document.createElement("tr");
  tr.innerHTML = `
    <td class="px-4 py-3 font-semibold text-zinc-100">${u.full_name}</td>
    <td class="px-4 py-3 text-zinc-300">${u.phone}</td>

    <td class="px-4 py-3">
      <select class="channel bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition">
        <option value="">-</option>
        ${channels
          .map(
            (c) =>
              `<option ${u.channel === c ? "selected" : ""}>${c}</option>`
          )
          .join("")}
      </select>
    </td>

    <td class="px-4 py-3">
      <select class="respon bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition">
        <option value="">-</option>
        ${responOptions
          .map((r) => `<option ${u.respon === r ? "selected" : ""}>${r}</option>`)
          .join("")}
      </select>
    </td>

    <td class="px-4 py-3">
      <input class="keterangan bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition" value="${u.keterangan ?? ''}" placeholder="catatan..." />
    </td>

    <td class="px-4 py-3 text-center">
      <button class="delete bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition">Hapus</button>
    </td>
  `;
  userTable.appendChild(tr);

  const channelSelect = tr.querySelector(".channel");
  const responSelect = tr.querySelector(".respon");
  const ketInput = tr.querySelector(".keterangan");
  const delBtn = tr.querySelector(".delete");

  const saveChange = async () => {
    const updated = {
      full_name: u.full_name,
      phone: u.phone,
      channel: channelSelect.value,
      respon: responSelect.value,
      keterangan: ketInput.value,
    };
    await fetch(`/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    console.log("✅ Updated:", u.full_name);
  };

  channelSelect.addEventListener("change", saveChange);
  responSelect.addEventListener("change", saveChange);
  ketInput.addEventListener("change", saveChange);

  delBtn.addEventListener("click", async () => {
    if (!confirm(`Hapus ${u.full_name}?`)) return;
    await fetch(`/users/${u.id}`, { method: "DELETE" });
    tr.remove();
  });
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const full_name = document.getElementById("name").value;
  const phone = document.getElementById("phone").value;
  const channel = document.getElementById("channel").value;
  const respon = document.getElementById("respon").value;
  const keterangan = document.getElementById("keterangan").value;

  await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, phone, channel, respon, keterangan }),
  });

  form.reset();
  fetchUsers();
});

fetchUsers();

refreshBtn?.addEventListener("click", () => {
  fetchUsers();
});

importBtn?.addEventListener("click", async (e) => {
  e.preventDefault();
  const file = csvInput?.files?.[0];
  if (!file) return alert("Pilih file CSV terlebih dahulu.");
  try {
    const text = await file.text();
    const res = await fetch("/users/import", {
      method: "POST",
      headers: { "Content-Type": "text/csv" },
      body: text,
    });
    const data = await res.json();
    if (!res.ok || data.success === false) {
      throw new Error(data.error || data.detail || "Gagal import");
    }
    alert(`Import selesai. Berhasil: ${data.inserted}, Dilewati: ${data.skipped}`);
    csvInput.value = "";
    fetchUsers();
  } catch (err) {
    alert("Gagal import CSV: " + err.message);
  }
});
