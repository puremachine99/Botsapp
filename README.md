# WhatsApp Broadcast Panel

Aplikasi panel web sederhana untuk melakukan broadcast pesan WhatsApp ke daftar kontak yang tersimpan di PostgreSQL. Bot menggunakan whatsapp-web.js (scan QR via terminal) dan panel frontend memakai Tailwind CSS.

## Fitur
- Kelola data responden (CRUD) via halaman `users.html`.
- Filter broadcast berdasarkan `department`, `team`, dan `tags` (array).
- Template variabel di pesan: `{{nama}}`, `{{dept}}`, `{{team}}`, `{{tags}}`.
- Pengiriman bertahap dengan jeda acak untuk mengurangi risiko dibatasi.

## Prasyarat
- Node.js 18+ dan npm
- PostgreSQL 13+ yang dapat diakses
- Browser untuk mengakses panel

## Konfigurasi
1. Salin `.env` contoh dan sesuaikan kredensial database:
   ```env
   PGHOST=localhost
   PGPORT=5432
   PGDATABASE=botwa
   PGUSER=postgres
   PGPASSWORD=your_password

   # Optional placeholder kalau kelak terintegrasi BSP pihak ketiga
   BSP_API_URL=https://api.your-bsp.example/send
   BSP_API_KEY=your_bsp_api_key_here
   ```

2. Buat database dan tabel `users` di PostgreSQL (menyesuaikan nama DB di `.env`).
   Jalankan SQL berikut:
   ```sql
   CREATE TABLE IF NOT EXISTS users (
     id SERIAL PRIMARY KEY,
     full_name TEXT NOT NULL,
     phone TEXT NOT NULL,
     department TEXT,
     team TEXT,
     tags TEXT[] DEFAULT '{}',
     opt_in BOOLEAN NOT NULL DEFAULT TRUE
   );

   -- Contoh data awal (opsional)
   INSERT INTO users (full_name, phone, department, team, tags)
   VALUES
     ('Budi', '081234567890', 'IT', 'shift_pagi', ARRAY['fulltime']),
     ('Sari', '081298765432', 'HR', 'shift_malam', ARRAY['remote','contract']);
   ```

Catatan: Aplikasi melakukan broadcast hanya ke `users` dengan `opt_in = TRUE`.

## Instalasi
- Install dependency:
  ```bash
  npm install
  ```

## Menjalankan
- Mode pengembangan (auto-restart):
  ```bash
  npm run dev
  ```
- Mode produksi sederhana:
  ```bash
  npm start
  ```

Saat pertama kali berjalan, lihat terminal untuk QR code. Scan menggunakan aplikasi WhatsApp (menu Linked Devices) hingga status bot menjadi siap.

- Akses panel broadcast: `http://localhost:3000/`
- Akses manajemen responden: `http://localhost:3000/users.html`

## Cara Pakai Broadcast
- Pilih filter (opsional): `Department`, `Team`, dan `Tags` (pisahkan tag dengan koma di halaman utama).
- Tulis pesan. Anda dapat menyapa personal dengan variabel:
  - `{{nama}}` → `users.full_name`
  - `{{dept}}` → `users.department`
  - `{{team}}` → `users.team`
  - `{{tags}}` → daftar tag bergabung dengan koma
- Klik "Kirim Broadcast" dan pantau log di bagian bawah.

Contoh pesan:
```
Halo {{nama}},
Pengumuman untuk departemen {{dept}} (team {{team}}).
Tag kamu: {{tags}}
```

## Struktur Proyek (ringkas)
- `src/server.js` — Server Express, static file, endpoint `/broadcast` dan CRUD `/users`.
- `src/db.js` — Koneksi pool PostgreSQL via `pg` dan `.env`.
- `src/bot.js` — Inisialisasi whatsapp-web.js, scan QR, dan util `sendMessageBatch`.
- `src/public/` — Frontend (HTML, JS, Tailwind output).
  - `index.html` & `script.js` — Panel broadcast.
  - `users.html` & `users.js` — Manajemen responden.
  - `css/output.css` — Hasil build Tailwind.
- `tailwind.config.js` — Konfigurasi konten untuk Tailwind.

## Catatan Pengembangan
- Tailwind output sudah ada di `src/public/css/output.css`. Jika ingin rebuild:
  ```bash
  npx tailwindcss -i src/public/css/tailwind.css -o src/public/css/output.css --minify
  ```
- Script bantu DB: `src/test-db.js` untuk uji koneksi dan listing tabel `users`.

## Troubleshooting
- Tidak muncul QR di terminal: pastikan proses tidak error, dan puppeteer diizinkan (argumen `--no-sandbox` sudah disetel). Coba hapus folder `.wwebjs_auth` jika ingin login ulang.
- Gagal konek DB: cek `.env` dan hak akses PostgreSQL.
- Broadcast tidak terkirim: pastikan nomor `phone` valid. Aplikasi otomatis mengubah awalan `0` menjadi `62` dan menambahkan suffix `@c.us`.
- Status bot di UI "Offline": tunggu beberapa detik setelah scan atau lihat log terminal untuk status `ready`.

## Lisensi
Proyek ini untuk penggunaan internal. Sesuaikan sesuai kebutuhan Anda.
