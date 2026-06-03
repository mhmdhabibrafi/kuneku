# KUNEKU

KUNEKU adalah sistem otomasi Google Forms lokal dengan dashboard web, control panel Windows, OpenClaw/OpenAI backend, dan opsi penyimpanan MySQL.

## Isi Repo

- `forms-gpt-agent/` - backend Node.js, dashboard React/Vite, dan engine pengisian form.
- `control-panel/` - source WinForms untuk `KUNEKU-ControlPanel.exe`.
- `scripts/` - script packaging RDP.
- `KUNEKU-ControlPanel.exe` - control panel Windows hasil build terbaru.
- `KUNEKU-ControlPanel-v8.exe` - salinan build kompatibel untuk shortcut lama.
- `BUAT-ZIP-RDP.bat` - pembuat paket zip untuk dipindah ke RDP.

## Cara Jalan

1. Install Node.js LTS.
2. Masuk ke folder `forms-gpt-agent`, lalu jalankan:

```bash
npm install
npm run build
```

3. Dari folder utama, buka:

```text
KUNEKU-ControlPanel.exe
```

4. Klik `Login OAuth` jika memakai OpenClaw/Codex OAuth.
5. Klik `Start` pada `KUNEKU Dashboard`.
6. Klik `Start` pada `OpenClaw Gateway`.
7. Klik `Open Dashboard` untuk membuka `http://localhost:18888`.

## Config

File runtime aktif adalah:

```text
forms-gpt-agent/config.json
```

File tersebut tidak dipush karena bisa berisi password/token. Untuk contoh config bersih, lihat:

```text
forms-gpt-agent/config.example.json
forms-gpt-agent/config.rdp.json
```

## Paket RDP

Jalankan:

```text
BUAT-ZIP-RDP.bat
```

Paket akan dibuat di folder `_release`. Paket default membawa source, build dashboard, executable, dan dependency yang dibutuhkan, tetapi tidak membawa log/report lama, password runtime, atau data MySQL lokal.

## Catatan

- `node_modules`, log, report, data MySQL lokal, dan config private tidak ikut GitHub.
- Portable MySQL besar tidak ikut repo. Jika dibutuhkan untuk paket RDP, gunakan opsi `-IncludeMySql` pada script packaging lokal.
- Detail fitur dashboard ada di `forms-gpt-agent/README.md`.
- Detail control panel ada di `CONTROL_PANEL_README.md`.

Copyright 2026 Muhammad Habib Rafi. All rights reserved.

