# KUNEKU - Paket RDP

Paket ini dibuat supaya folder KUNEKU bisa dipindah ke RDP tanpa membawa log, report lama, password database, atau data MySQL lokal dari komputer asal.

## Cara Pindah ke RDP

1. Jalankan `BUAT-ZIP-RDP.bat` di komputer ini.
2. Upload file `.zip` dari folder `_release` ke RDP.
3. Extract zip di RDP, misalnya ke `C:\KUNEKU`.
4. Jalankan `START-DI-RDP.bat` atau `KUNEKU-ControlPanel.exe`.
5. Klik `Login OAuth` jika OpenClaw/Codex belum login.
6. Klik `Start` pada `KUNEKU Dashboard`.
7. Klik `Start` pada `OpenClaw Gateway`.
8. Buka `http://localhost:18888`, lalu klik `Cek AI`.

## Kebutuhan di RDP

- Windows RDP.
- Node.js LTS sudah terinstall dan masuk PATH.
- Google Chrome direkomendasikan. Jika Chrome tidak ada, jalankan `npx playwright install chromium` dari folder `forms-gpt-agent`.
- OpenClaw sudah terinstall dan masuk PATH jika memakai mode Codex OAuth.

## Catatan Aman

- Config awal RDP memakai `dryRun: true`, `reviewBeforeSubmit: true`, dan storage `Local JSON`.
- Link Google Forms dikosongkan agar tidak ada run tidak sengaja dari config lama.
- `forms-gpt-agent\config.json` di paket berasal dari `forms-gpt-agent\config.rdp.json`.
- Folder `logs`, `reports`, dan `control-panel\mysql-9.7.0-winx64\data` tidak ikut paket zip.

## Opsi Paket

Default `BUAT-ZIP-RDP.bat` membuat paket praktis: kode, build dashboard, executable control panel, dan `node_modules`.

Untuk paket kecil tanpa `node_modules`:

```powershell
.\BUAT-ZIP-RDP.bat -Lite
```

Untuk ikut membawa portable MySQL binary juga:

```powershell
.\BUAT-ZIP-RDP.bat -IncludeMySql
```

Mode `-IncludeMySql` tetap tidak membawa folder data MySQL lama, jadi database portable akan dibuat ulang saat pertama kali tombol MySQL dijalankan.
