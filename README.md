# KUNEKU

![Version](https://img.shields.io/badge/version-v1.1-0cc0df)
![Node.js](https://img.shields.io/badge/Node.js-LTS-339933)
![React](https://img.shields.io/badge/React-19-61dafb)
![Windows](https://img.shields.io/badge/Control%20Panel-WinForms-0078d4)
![License](https://img.shields.io/badge/license-Proprietary-111827)

KUNEKU adalah sistem otomasi Google Forms lokal untuk membaca struktur form, membuat jawaban kontekstual, mengisi form dengan Playwright, dan menyimpan report lewat Local JSON atau MySQL.

Repository ini bernama `kuneku`, sedangkan nama produk/aplikasinya tetap KUNEKU.

## Versi

Versi aktif: `v1.1`

Build utama:

```text
KUNEKU-ControlPanel.exe
```

## Sorotan

- Dashboard web React + Vite untuk mengelola antrean Google Forms.
- Backend Node.js yang menjalankan Playwright untuk scan preview, dry run, review, dan submit.
- Auto Analyze untuk membaca konteks form umum, bukan hanya satu template form.
- Anti double data untuk nama, email, nomor HP, dan feedback yang sudah dipakai.
- Domicile-aware answer, termasuk gate yang mengharuskan domisili Indonesia.
- Profile/rules per form agar banyak link bisa diproses dengan konteks berbeda.
- Review Before Submit dengan screenshot final sebelum tombol kirim ditekan.
- Run Report Pro dengan export JSON, CSV, dan PDF.
- Control Panel Windows untuk menjalankan Dashboard, OpenClaw Gateway, dan MySQL lokal.
- Paket RDP bersih tanpa log lama, report lama, password runtime, atau data MySQL lokal.

## Komponen Aplikasi

- `Dashboard`: UI utama di `http://localhost:18888`.
- `Forms Agent`: backend Node.js yang membaca config, menjalankan queue, dan mengisi form.
- `OpenClaw Gateway`: gateway lokal untuk Codex OAuth/OpenResponses.
- `Control Panel`: aplikasi WinForms untuk start/stop service lokal.
- `Storage`: Local JSON default, dengan opsi MySQL lokal.

## Teknologi

- Node.js LTS
- React 19
- Vite 8
- Playwright
- MySQL 5.7+/MariaDB atau MySQL portable lokal
- WinForms C# (.NET Framework compiler)
- OpenClaw Gateway atau OpenAI Responses API

## Instalasi Lokal

1. Clone repository:

```bash
git clone https://github.com/mhmdhabibrafi/kuneku.git
cd kuneku
```

2. Install dependency dashboard:

```bash
cd forms-gpt-agent
npm install
npm run build
cd ..
```

3. Siapkan config runtime:

```powershell
Copy-Item forms-gpt-agent/config.example.json forms-gpt-agent/config.json
```

4. Jalankan control panel:

```text
KUNEKU-ControlPanel.exe
```

5. Dari Control Panel:

- klik `Login OAuth` jika memakai OpenClaw/Codex OAuth;
- klik `Start` pada `KUNEKU Dashboard`;
- klik `Start` pada `OpenClaw Gateway`;
- klik `Open Dashboard`.

## Konfigurasi

File runtime aktif:

```text
forms-gpt-agent/config.json
```

File tersebut tidak ikut GitHub karena bisa berisi token API, password MySQL, link aktif, dan state runtime.

Template aman:

```text
forms-gpt-agent/config.example.json
forms-gpt-agent/config.rdp.json
```

Konfigurasi utama:

- `provider`: `openclaw` atau `openai`.
- `baseUrl`: endpoint OpenResponses/Responses API.
- `model`: model AI yang dipakai.
- `apiKey`: kosongkan jika OpenClaw Gateway tidak membutuhkan token.
- `links` / `runItems`: daftar Google Forms yang akan diproses.
- `profiles`: template aturan jawaban.
- `storage.type`: `local` atau `mysql`.
- `reviewBeforeSubmit`: tahan di halaman akhir sebelum submit.
- `dryRun`: isi form tanpa klik submit.

## OpenClaw dan AI

Mode OpenClaw Gateway cocok jika ingin memakai login Codex OAuth lokal.

```text
Provider: OpenClaw Gateway
Base URL: http://localhost:18789/v1/responses
Model: openai-codex/gpt-5.4
Token/API Key: kosong jika gateway lokal tidak memakai token
```

Mode OpenAI API Key juga tersedia:

```text
Provider: OpenAI API Key
Base URL: https://api.openai.com/v1/responses
Model: chat-latest
Token/API Key: isi-api-key-anda
```

Credential production harus disimpan di `config.json` lokal atau environment privat, bukan di repository.

## Struktur Project

```text
control-panel/       Source WinForms, icon, dan runner service
forms-gpt-agent/     Backend Node.js, dashboard React, config template, dan build dist
images/              Asset visual KUNEKU
scripts/             Script packaging RDP
BUAT-ZIP-RDP.bat     Entry point untuk membuat paket RDP
START-DI-RDP.bat     Starter cepat di mesin RDP
```

Folder runtime yang tidak ikut source control:

```text
forms-gpt-agent/config.json
forms-gpt-agent/node_modules/
forms-gpt-agent/reports/
logs/
reports/
_release/
control-panel/mysql-9.7.0-winx64/
```

## Testing

Jalankan validasi backend dan build dashboard:

```bash
cd forms-gpt-agent
node --check server.js
npm run build
```

Compile Control Panel di Windows:

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

CI GitHub juga menjalankan check Node, build dashboard, dan compile WinForms di Windows.

## Paket RDP

Buat paket RDP:

```text
BUAT-ZIP-RDP.bat
```

Paket dibuat di `_release` dan memakai config bersih. Paket tidak membawa log/report lama, password runtime, atau data MySQL lokal.

Opsi paket:

```powershell
.\BUAT-ZIP-RDP.bat -Lite
.\BUAT-ZIP-RDP.bat -IncludeMySql
```

## Keamanan Repository

Repository ini disiapkan agar aman untuk source control:

- `config.json` runtime di-ignore.
- Password, API key, OAuth token, log, report, dan data MySQL lokal tidak dipush.
- `node_modules`, `_release`, dan file zip tidak dipush.
- README publik hanya berisi dokumentasi umum, bukan SOP production privat.
- Detail operasional, token, credential, dan strategi internal sebaiknya tetap berada di dokumentasi privat.

Jika repository dibuat publik, source code tetap dapat dipelajari orang lain. Untuk perlindungan maksimal, gunakan repository private atau lisensi proprietary.

## Checklist Uji Cepat

- Dashboard terbuka di `http://localhost:18888`.
- Health Check membaca status Dashboard, Gateway, OAuth, AI, dan Storage.
- Scan Preview membaca halaman, tipe pertanyaan, opsi, dan tombol akhir.
- Dry Run mengisi sampai halaman terakhir tanpa submit.
- Review Before Submit menahan proses sebelum klik `Kirim`.
- Auto Analyze memilih jawaban sesuai konteks form.
- Gate domisili Indonesia dijawab benar saat form membutuhkan responden Indonesia.
- Nama, email, nomor HP, dan feedback tidak dobel dalam run.
- Export report JSON, CSV, dan PDF berjalan.
- Control Panel bisa start/stop Dashboard, Gateway, dan MySQL.
- Paket RDP tidak membawa config private atau data runtime lama.

## Changelog

Lihat `CHANGELOG.md`.

## Lisensi

Kode ini menggunakan lisensi proprietary. Lihat `LICENSE`.

Copyright 2026 Muhammad Habib Rafi. All rights reserved.
