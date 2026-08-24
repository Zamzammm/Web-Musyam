# E-Voting Musyawarah Ambalan 2026/2027

Sistem pemungutan suara elektronik untuk pemilihan **Pemangku Adat Putri/Putra**
dan **Pradana Putri/Putra**. Frontend statis (HTML/CSS/JS murni) + backend
PHP/MySQL contoh yang siap disesuaikan.

## Struktur Proyek

```
evoting/
├── index.html          # Halaman login (NIS/Token)
├── vote.html            # Bilik suara (4 kategori)
├── success.html          # Halaman terima kasih
├── admin.html            # Dashboard panitia (Chart.js)
├── css/style.css          # Sistem desain bersama
├── js/
│   ├── candidates.js       # Data kandidat & kategori (sumber tunggal)
│   ├── login.js             # Logika halaman login
│   ├── vote.js               # Logika bilik suara + modal konfirmasi
│   └── admin.js                # Logika dashboard + polling hasil
└── backend/
    ├── schema.sql             # Skema database MySQL + data awal
    ├── config.php               # Koneksi database
    └── api/
        ├── login.php             # Verifikasi kode & buat sesi
        ├── vote.php                # Simpan suara (atomik, anti double-vote)
        └── results.php              # Rekap suara untuk dashboard
```

## Cara Menjalankan (Local / Server PHP)

1. **Siapkan database**
   ```bash
   mysql -u root -p < backend/schema.sql
   ```
   Lalu isi tabel `voters` dengan daftar peserta asli, misalnya:
   ```sql
   INSERT INTO voters (full_name, code) VALUES
     ('Andi Saputra', '2425-0001'),
     ('Budi Santoso', '2425-0002');
   ```
   `code` bisa berupa NIS asli atau token acak yang dicetak di kartu undangan.

2. **Atur kredensial database** lewat environment variable (disarankan) atau
   edit langsung `backend/config.php`:
   ```bash
   export EVOTING_DB_HOST=127.0.0.1
   export EVOTING_DB_NAME=evoting_ambalan
   export EVOTING_DB_USER=root
   export EVOTING_DB_PASS=rahasia
   ```

3. **Jalankan server PHP** dari folder proyek:
   ```bash
   php -S localhost:8000
   ```
   Buka `http://localhost:8000/index.html` di browser.

4. **Ganti kata sandi dashboard panitia** di `js/admin.js`
   (`ADMIN_PASSWORD_HINT`) sebelum acara — lihat catatan keamanan di bawah.

## Alur Sistem

1. **Login** — peserta memasukkan NIS/Token → `login.php` mengecek apakah
   kode terdaftar dan belum dipakai, lalu menerbitkan `session_token`
   sekali pakai (berlaku 20 menit).
2. **Memilih** — `vote.html` menampilkan 4 kategori sebagai kartu badge.
   Setelah 4 kategori terisi, tombol "Kirim Suara" aktif dan memunculkan
   modal konfirmasi.
3. **Kirim suara** — `vote.php` memvalidasi ulang sesi & kandidat, lalu
   menyimpan seluruh suara dan mengunci status `has_voted` dalam **satu
   transaksi database** (`FOR UPDATE`) sehingga tidak mungkin ada
   double-voting meski dua permintaan datang bersamaan.
4. **Dashboard panitia** — `admin.html` melakukan polling ke
   `results.php` setiap 10 detik dan menggambar ulang grafik Chart.js
   secara real-time.

## Kenapa Tidak Pakai `localStorage`?

Status "sudah memilih" sengaja **tidak** disimpan di penyimpanan browser
(localStorage/sessionStorage/cookie panjang). Kebenaran satu-satunya ada
di database lewat kolom `voters.has_voted` dan constraint unik
`votes(voter_id, category_id)`. Sesi login diteruskan lewat parameter URL
yang pendek umurnya (20 menit) — ini mencegah peserta membuka tab baru,
menghapus data browser, atau berbagi perangkat untuk memilih dua kali.

## Catatan Keamanan — Wajib Dibaca Sebelum Acara

- **Dashboard panitia**: gerbang kata sandi di `admin.js` hanya proteksi
  ringan sisi klien. Sebelum dipakai sungguhan, tambahkan autentikasi
  panitia yang nyata (session PHP/`password_hash`, atau login terpisah)
  dan proteksi `results.php` di sisi server — lihat komentar
  `require_admin_session()` di file tersebut.
- **HTTPS**: jalankan di atas HTTPS saat produksi agar NIS/Token dan
  suara tidak bisa disadap di jaringan Wi-Fi acara.
- **Rate limiting**: tambahkan pembatasan percobaan login per IP di
  `login.php` untuk mencegah tebak-tebak kode secara brute force.
- **Token unik vs NIS**: jika ingin suara benar-benar anonim, gunakan
  token acak (bukan NIS) yang dicetak terpisah dari daftar hadir, supaya
  panitia sendiri tidak bisa menautkan suara ke identitas peserta.
- **Backup**: ekspor `votes` dan `voters` (`mysqldump`) setelah masa
  pemungutan suara ditutup, sebelum mengumumkan hasil.

## Kustomisasi Kandidat

Untuk mengubah daftar kandidat, ubah di **dua tempat** agar frontend dan
backend tetap sinkron:
1. `js/candidates.js` (ditampilkan di `vote.html` & grafik `admin.html`)
2. `backend/schema.sql` tabel `categories` dan `candidates` (atau lakukan
   `INSERT`/`UPDATE` langsung di database)

## Desain

Tema visual mengikuti motif **kartu tanda anggota & lencana Pramuka**:
palet cokelat muda (`#EDE3CE`) dan cokelat tua (`#241A10`) dengan aksen
emas lencana (`#B98A2E`), garis putus-putus ala jahitan tenda pada tiap
kartu, dan kandidat ditampilkan sebagai lencana bundar. Tipografi
memakai `Fraunces` (judul, berkarakter seperti stempel) dan `Work Sans`
(isi), dengan `Space Mono` untuk kode NIS/Token agar terasa seperti kartu
tercetak.
