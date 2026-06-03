# KUNEKU

KUNEKU control center untuk dashboard, OpenClaw Gateway, dan MySQL lokal.

File utama:

```text
KUNEKU-ControlPanel.exe
```

Build terbaru juga tersedia sebagai `KUNEKU-ControlPanel-v8.exe`.

Untuk pindah ke RDP, jalankan `BUAT-ZIP-RDP.bat`. Paket zip akan dibuat di folder `_release` dengan config bersih, tanpa log/report lama, tanpa password runtime, dan tanpa data MySQL lokal.

Cara pakai:

1. Buka `KUNEKU-ControlPanel.exe`.
2. Klik `Login OAuth` jika token OpenClaw/Codex belum login atau expired.
3. Jika window login sudah menampilkan `OpenAI OAuth complete` dan `Default model set`, login sudah berhasil. Window login boleh ditutup jika tidak kembali ke prompt.
4. Jika window login terasa stuck, klik `Close Login` di Control Panel. Itu hanya menutup proses login OAuth, bukan mematikan Dashboard atau Gateway.
5. Klik `Start` pada `KUNEKU Dashboard`.
6. Klik `Start` pada `OpenClaw Gateway`.
7. Jika ingin memakai MySQL, klik `Start` pada `MySQL Database`, lalu pilih `Data Storage` -> `MySQL Database` di dashboard.
8. Klik `Open Dashboard` untuk membuka `http://localhost:18888`.
9. Klik `Cek AI` untuk memastikan koneksi AI aktif.

Catatan:

- Panel tidak otomatis menjalankan service saat dibuka.
- Brand color dikunci ke `#0cc0df`.
- UI Control Center memakai layout cockpit yang lebih rapi: quick actions, service cards, status chips, dan activity log yang lebih mudah dibaca.
- Log service tersimpan di folder `logs`.
- Storage default memakai file lokal. Di dashboard, pilih `Data Storage` -> `MySQL Database` jika ingin menyimpan config dan run report ke MySQL.
- Tombol MySQL otomatis memakai portable server di `control-panel\mysql-9.7.0-winx64\bin\mysqld.exe`.
- Saat pertama kali dijalankan, Control Panel akan membuat `data` dan `kuneku-my.ini` untuk MySQL portable.
- Database dashboard dikunci ke koneksi lokal `127.0.0.1` dan config aktif memakai user aplikasi `kuneku_app`, bukan root.
- Jika portable MySQL tidak ditemukan, tombol MySQL akan mencoba Windows service MySQL/MariaDB yang tersedia.
- Stop service dari panel akan mematikan proses yang sedang listen di port `18888`, `18789`, atau `3306`.
