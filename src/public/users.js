const userTable = document.getElementById("userTable");
const form = document.getElementById("addForm");
const refreshBtn = document.getElementById("refreshUsers");

const departments = ["HR", "Finance", "IT"];
const teams = ["shift_pagi", "shift_malam"];
const tagOptions = ["remote", "onsite", "contract", "fulltime"];

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
      <select class="dept bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition">
        <option value="">-</option>
        ${departments
          .map(
            (d) =>
              `<option ${u.department === d ? "selected" : ""}>${d}</option>`
          )
          .join("")}
      </select>
    </td>

    <td class="px-4 py-3">
      <select class="team bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition">
        <option value="">-</option>
        ${teams
          .map((t) => `<option ${u.team === t ? "selected" : ""}>${t}</option>`)
          .join("")}
      </select>
    </td>

    <td class="px-4 py-3">
      <select class="tags bg-zinc-900 border border-zinc-700 text-zinc-100 rounded-lg px-2 py-1 w-full focus:ring-2 focus:ring-amber-400 focus:border-amber-400 transition" multiple>
        ${tagOptions
          .map(
            (t) =>
              `<option ${u.tags?.includes(t) ? "selected" : ""}>${t}</option>`
          )
          .join("")}
      </select>
    </td>

    <td class="px-4 py-3 text-center">
      <button class="delete bg-red-500 hover:bg-red-600 text-white px-3 py-1.5 rounded text-xs font-semibold transition">Hapus</button>
    </td>
  `;
  userTable.appendChild(tr);

  const deptSelect = tr.querySelector(".dept");
  const teamSelect = tr.querySelector(".team");
  const tagsSelect = tr.querySelector(".tags");
  const delBtn = tr.querySelector(".delete");

  const saveChange = async () => {
    const updated = {
      full_name: u.full_name,
      phone: u.phone,
      department: deptSelect.value,
      team: teamSelect.value,
      tags: Array.from(tagsSelect.selectedOptions).map((o) => o.value),
    };
    await fetch(`/users/${u.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updated),
    });
    console.log("✅ Updated:", u.full_name);
  };

  deptSelect.addEventListener("change", saveChange);
  teamSelect.addEventListener("change", saveChange);
  tagsSelect.addEventListener("change", saveChange);

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
  const department = document.getElementById("department").value;
  const team = document.getElementById("team").value;

  await fetch("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ full_name, phone, department, team, tags: [] }),
  });

  form.reset();
  fetchUsers();
});

fetchUsers();

refreshBtn?.addEventListener("click", () => {
  fetchUsers();
});
