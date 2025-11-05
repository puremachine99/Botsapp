# WhatsApp Broadcast Panel

Panel web ini memudahkan Anda mengirim pesan WhatsApp ke banyak kontak sekaligus. Kontak disimpan rapi di database, dan pengiriman dilakukan oleh bot WhatsApp yang terkoneksi melalui browser.

---

## Apa yang Bisa Dilakukan?
- Menambahkan dan mengelola kontak (nama, nomor, channel, respon, dan keterangan).
- Mengirim pesan broadcast dengan sapaan personal otomatis.
- Menyaring daftar penerima berdasarkan channel/respon (lanjutan opsional).
- Melihat status bot dan log pengiriman secara langsung di layar.

---

## Sebelum Mulai
Siapkan terlebih dahulu:
- **Node.js 18 atau lebih baru** (ikuti instruksi di https://nodejs.org bila belum terpasang).
- **PostgreSQL 13 atau lebih baru**. Anda bisa memakai instalasi lokal atau server yang sudah ada.
- **Browser** (Chrome/Edge/Firefox) untuk membuka panelnya.

---

## Langkah Cepat Instalasi
1. **Salin contoh pengaturan**
   - Duplikat file `.env.example` (jika belum ada, buat `.env` baru) dan isi informasi koneksi database Anda:
     ```env
     PGHOST=localhost
     PGPORT=5432
     PGDATABASE=botwa
     PGUSER=postgres
     PGPASSWORD=your_password
     ```
     Abaikan bagian `BSP_...` jika belum membutuhkannya.

2. **Siapkan tabel kontak**
   - Masuk ke PostgreSQL dan jalankan perintah ini sekali saja:
     ```sql
     CREATE TABLE IF NOT EXISTS users (
       id SERIAL PRIMARY KEY,
       full_name TEXT NOT NULL,
       phone TEXT NOT NULL,
       channel TEXT,
       respon TEXT,
       keterangan TEXT,
       opt_in BOOLEAN NOT NULL DEFAULT TRUE,
       created_at TIMESTAMPTZ DEFAULT NOW()
     );
     ```
   - Ingin contoh data awal? Tambahkan:
     ```sql
     INSERT INTO users (full_name, phone, channel, respon, keterangan)
     VALUES
       ('Budi', '081234567890', 'WhatsApp', 'Not Responded', 'Follow up promo A'),
       ('Sari', '081298765432', 'Telegram', 'Responded', 'Sudah konfirmasi hadir');
     ```

3. **Install aplikasi**
   ```bash
   npm install
   ```

---

## Cara Menjalankan
1. **Mulai server**
   - Mode nyaman untuk pengembangan:
     ```bash
     npm run dev
     ```
   - Mode siap jalan (sederhana):
     ```bash
     npm start
     ```
2. **Hubungkan bot WhatsApp**
   - Saat perintah di atas berjalan, terminal akan menampilkan QR code.
   - Buka WhatsApp di ponsel → menu *Linked Devices* → *Link a device* → scan QR di terminal.
   - Status di layar utama akan berubah menjadi “Bot: ✅ Online” begitu bot siap.
3. **Buka panel**
   - Layar broadcast: [http://localhost:3000/](http://localhost:3000/)
   - Manajemen responden: [http://localhost:3000/users.html](http://localhost:3000/users.html)

---

## Mengirim Broadcast Pertama Anda
1. **Tentukan penerima**  
   Gunakan filter channel/respon di halaman utama jika ingin menargetkan grup tertentu. Kosongkan bila ingin kirim ke semua.
2. **Tulis pesan**  
   Anda bisa menyapa secara personal dengan kode berikut:
   - `{{nama}}` → nama responden
   - `{{dept}}` → channel (misal WhatsApp/Telegram)
   - `{{team}}` → status respon
   - `{{tags}}` → keterangan tambahan
3. **Klik “Kirim Broadcast”**  
   Pantau prosesnya di log. Sistem mengirim satu per satu dengan jeda acak supaya aman dari blokir.

Contoh pesan:
```
Halo {{nama}},
Pengumuman ini dikirim via channel {{dept}}.
Status respon terakhir: {{team}}.
Catatan tambahan: {{tags}}
```

---

## Halaman Manajemen Responden
- Tambah responden baru di sisi kiri (nama, nomor, channel, respon, keterangan).
- Ubah informasi dengan dropdown channel/respon dan kolom keterangan.
- Hapus responden jika sudah tidak diperlukan.
- Data yang ditampilkan selalu tersinkron dengan database.

---

## Jika Mengalami Kendala
- **QR code tidak muncul**  
  Pastikan perintah `npm run dev` atau `npm start` tidak error. Jika ingin login ulang, hapus folder `.wwebjs_auth` lalu jalankan kembali.
- **Tidak bisa konek database**  
  Cek ulang isi `.env` dan pastikan PostgreSQL menerima koneksi dari komputer Anda.
- **Pesan tidak terkirim**  
  Format nomor harus internasional. Aplikasi akan mengubah awalan `0` menjadi `62`, lalu menambahkan `@c.us`.
- **Status bot tetap Offline**  
  Tunggu beberapa detik setelah scan atau lihat pesan di terminal. Jika masih gagal, coba restart server dan scan ulang.

---

## Informasi Tambahan (Opsional)
- File utama backend ada di `src/server.js`, sedangkan bot WhatsApp ada di `src/bot.js`.
- Frontend berada di folder `src/public/`.
- Jika ingin membangun ulang file CSS Tailwind:
  ```bash
  npx tailwindcss -i src/public/css/tailwind.css -o src/public/css/output.css --minify
  ```
- Script bantu `src/test-db.js` bisa digunakan untuk mengecek koneksi database.

---

## Catatan Lisensi
Proyek ini ditujukan untuk penggunaan internal. Silakan sesuaikan dan kembangkan sesuai kebutuhan tim Anda.
