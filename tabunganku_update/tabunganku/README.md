# Tabunganku v1.5 — ©marnzproyek

Buka `index.html` di browser (atau jalankan `python3 -m http.server` di folder ini lalu buka http://localhost:8000).
Untuk fitur "pasang sebagai aplikasi" dan notifikasi, aplikasi harus dibuka lewat https:// atau localhost.

## Struktur
- `index.html` — kerangka halaman, nav bawah, jam real-time
- `css/style.css` — tampilan
- `js/store.js` — data & penyimpanan di database Google (Firebase Firestore, project `marnz-proyek-8e247`, sama dengan index.html Marnz Store)
- `js/auth.js` + `css/auth.css` — layar Login/Daftar (Email, Google, GitHub) & animasi meteor, disalin dari index.html Marnz Store
- `js/charts.js` — grafik garis, donat, bar, gauge (SVG)
- `js/pet.js` — Streak Pet (level, evolusi, vault, spin)
- `js/app.js` — halaman Home, Savings Chart, About, Account, Contact, Pengaturan
- `legal/privacy-policy.html`, `legal/terms-of-service.html` — dibuka otomatis dari Pengaturan
- `foto/profil/` — folder foto profil (`default.svg` = foto bawaan)
- `sw.js`, `manifest.webmanifest`, `icons/` — PWA & notifikasi

## Aturan penting
- Maks 5 target; minimal 1. Mau buat baru saat penuh → hapus 1 dulu.
- Streak menyala hanya dari PEMASUKAN. Pengeluaran tidak menyalakan.
- 1 EXP per hari (pemasukan hari ini), 7 EXP = 1 level. Junior Lv1–4, Evolusi Lv5–9, Ultimate Lv10+.
- Lv2–9: pakaian basic. Lv10+: tiap naik level dapat 1 spin.

## Login & database Google (Firebase)
- Data tiap akun disimpan di Firestore: koleksi `tabunganku_users`, dokumen = UID akun. (Koleksi `marnz_database` milik Marnz Store tidak disentuh.)
- Data lama di perangkat (localStorage `tabunganku.v1`) otomatis dipindahkan sekali ke akun pertama yang login/daftar di perangkat itu.
- Di Firebase Console, pastikan:
  1. Authentication > Sign-in method: **Email/Password, Google, GitHub** aktif (GitHub butuh Client ID & Secret dari GitHub OAuth App; callback URL-nya ditampilkan Firebase).
  2. Authentication > Settings > Authorized domains: tambahkan domain tempat Tabunganku dipasang (mis. `xxx.netlify.app`).
  3. Firestore > Rules: izinkan tiap akun mengakses datanya sendiri, contoh:
     ```
     match /tabunganku_users/{uid} {
       allow read, write: if request.auth != null && request.auth.uid == uid;
     }
     ```
- Login lewat Google/GitHub tidak jalan bila dibuka lewat `file://`; pakai hosting (Netlify) atau `python3 -m http.server`.
- Tombol **Keluar** ada di halaman Account.
