# KUNEKU Control Panel

Control Panel adalah aplikasi Windows untuk menjalankan service lokal KUNEKU tanpa membuka terminal manual.

## Versi

Versi aktif: `v1.1`

File utama:

```text
KUNEKU-ControlPanel.exe
```

## Fungsi Utama

- Login OAuth OpenClaw/Codex.
- Start/stop KUNEKU Dashboard di port `18888`.
- Start/stop OpenClaw Gateway di port `18789`.
- Start/stop MySQL lokal di port `3306`.
- Buka dashboard dan folder log dari satu tempat.
- Menampilkan status RUNNING/STOPPED, port, PID, dan activity log.

## Cara Pakai

1. Buka `KUNEKU-ControlPanel.exe`.
2. Klik `Login OAuth` jika token OpenClaw/Codex belum login atau expired.
3. Jika window login menampilkan `OpenAI OAuth complete` dan `Default model set`, login sudah berhasil.
4. Klik `Start` pada `KUNEKU Dashboard`.
5. Klik `Start` pada `OpenClaw Gateway`.
6. Jika ingin memakai MySQL, klik `Start` pada `MySQL Database`.
7. Klik `Open Dashboard` untuk membuka `http://localhost:18888`.
8. Klik `Cek AI` untuk memastikan koneksi AI aktif.

## Catatan Operasional

- Panel tidak otomatis menjalankan service saat dibuka.
- Brand color dikunci ke `#0cc0df`.
- Log service tersimpan di folder `logs`.
- Storage default memakai file lokal.
- MySQL portable lokal tidak ikut GitHub karena ukuran besar dan data runtime.
- Jika portable MySQL tersedia, panel memakai `control-panel\mysql-9.7.0-winx64\bin\mysqld.exe`.
- Jika portable MySQL tidak tersedia, tombol MySQL mencoba Windows service MySQL/MariaDB yang tersedia.
- Stop service dari panel mematikan proses yang listen di port `18888`, `18789`, atau `3306`.

## Build Manual

```powershell
& "$env:WINDIR\Microsoft.NET\Framework64\v4.0.30319\csc.exe" `
  /nologo /target:winexe /platform:anycpu /optimize+ `
  /win32icon:"control-panel\kuneku.ico" `
  /reference:System.dll `
  /reference:System.Drawing.dll `
  /reference:System.Windows.Forms.dll `
  /reference:System.ServiceProcess.dll `
  /out:"KUNEKU-ControlPanel.exe" `
  "control-panel\KuesionerKuControlPanel.cs"
```
