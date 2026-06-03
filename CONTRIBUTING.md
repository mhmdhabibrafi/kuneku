# Contributing

KUNEKU adalah project proprietary milik Muhammad Habib Rafi. Kontribusi hanya diterima dari maintainer atau pihak yang mendapat izin langsung.

## Standar Perubahan

- Jangan commit token, API key, password database, cookie, OAuth credential, log runtime, report lama, atau data MySQL lokal.
- Gunakan `forms-gpt-agent/config.example.json` atau `config.rdp.json` sebagai template config publik.
- Simpan perubahan UI tetap konsisten dengan brand KUNEKU dan warna utama `#0cc0df`.
- Pastikan perubahan logic form tetap general untuk banyak Google Forms, bukan hanya satu form tertentu.
- Hindari perubahan besar yang tidak berkaitan dengan issue/tugas.

## Verifikasi Lokal

Jalankan:

```bash
cd forms-gpt-agent
node --check server.js
npm run build
```

Untuk Control Panel di Windows:

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

## Pull Request

PR harus menjelaskan:

- tujuan perubahan;
- file utama yang berubah;
- hasil test/build;
- risiko yang masih ada.

