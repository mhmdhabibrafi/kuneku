# KUNEKU

Versi non-extension ala OpenClaw. Sistem berjalan lokal, membuka browser sendiri dengan Playwright, membaca Google Forms, meminta jawaban ke backend AI, lalu mengisi form.
Dashboard sekarang memakai React JS + Vite, sedangkan backend tetap Node.js.

Versi aktif: `v1.1`.

## Cara Jalan

Double click:

```text
start-forms-agent.bat
```

Dashboard akan terbuka di:

```text
http://localhost:18888
```

Contoh link form seminarFST hanya template/demo awal di kolom Link Forms:

```text
https://docs.google.com/forms/d/e/1FAIpQLSdiLt7DDFFKCvVAIms--gRW5BD2MBHrm1Kij-_s_sG_U_TWbA/formResponse
```

Untuk paket RDP, link awal sengaja dikosongkan. Paste link Google Forms sendiri dari dashboard sebelum menjalankan `Scan Preview`, `Dry Run`, atau `Mulai Sistem`.

## Banyak Google Forms

KUNEKU didesain general untuk banyak jenis Google Forms, bukan hanya seminarFST. Sistem membaca struktur form, memetakan tipe pertanyaan, lalu memakai profile/rules yang cocok. Contoh: kuesioner keamanan perusahaan, survey kepuasan aplikasi, tracer study, rekomendasi program studi, atau form riset lain.

Dashboard mendukung antrean banyak link. Kamu bisa:

- paste satu atau banyak link di input `Paste satu atau banyak link Google Forms`, lalu klik `Tambah`;
- paste banyak link langsung di textarea daftar link, satu baris satu link;
- klik `Rapikan` untuk mengambil link Google Forms valid dan membuang duplikat;
- atur `Isi per link` untuk menentukan berapa kali setiap link diisi.
- atur profile per link: `Default`, `Survey Kepuasan`, `Tracer Study`, `Rekomendasi Prodi`, `seminarFST`, atau `Custom`.
- buka aturan per form untuk memberi rules khusus pada link tertentu.

Sistem akan memproses antrean berurutan:

```text
link 1 isi 1..n
link 2 isi 1..n
link 3 isi 1..n
```

Link yang didukung: `docs.google.com/forms/...` dan `forms.gle/...`.

## Fitur Pro

### Per-Form Profile

Setiap link di antrean punya profile sendiri. Profile membawa aturan jawaban, template, visual builder, dan jumlah isi per link. Ini membuat satu sesi bisa mengisi beberapa Google Forms dengan konteks berbeda.

### Profile Builder Visual

Profile bisa diatur dari UI tanpa selalu menulis rules manual:

- nama 2-3 kata;
- pertanyaan gerbang `pernah menggunakan/mengakses/memakai` dijawab `Ya`;
- skala Likert positif cenderung `4/5`;
- skala Likert negatif cenderung `1/2`;
- rekomendasi checkbox dibatasi maksimal 5 pilihan.

### Smart Form Mapper

Saat preview/run, sistem mengklasifikasi pertanyaan menjadi tipe seperti `name`, `email`, `phone`, `study_program`, `cohort`, `yes_no_gate`, `likert_positive`, `likert_negative`, `feedback`, dan `recommendation_program`. Ini membantu AI memahami form umum, bukan hanya satu form tertentu.

### Preview Struktur Form

Klik `Scan Preview` untuk membaca halaman, tipe pertanyaan, opsi dropdown/radio, dan tombol akhir. Preview tidak menekan tombol `Kirim`.

### Dry Run Mode

Klik `Dry Run` untuk menjalankan pengisian sampai halaman terakhir tanpa submit. Ini cocok untuk validasi jawaban sebelum menjalankan submit sungguhan.

### Review Before Submit

Jika aktif, sistem berhenti di halaman terakhir sebelum klik `Kirim`. Dashboard menampilkan ringkasan jawaban dan screenshot final. Kamu bisa klik `Approve Submit` untuk lanjut mengirim, atau `Skip Job` untuk melewati job.

### Run Report Pro

Setelah run, dashboard menampilkan status tiap job: `queued`, `running`, `waiting_approval`, `submitted`, `dry_run`, `stuck`, `failed`, atau status lain. Report juga menyimpan jumlah sukses, dry-run, gagal, dilewati, jawaban yang dipakai, screenshot error/final, dan bisa diekspor ke JSON, CSV, atau PDF.

### OAuth Health Check

Klik `Health Check` untuk melihat status dashboard, gateway, OAuth/token, dan koneksi AI. Kalau token invalid/expired, jalankan login OAuth ulang dari control panel.

### Anti-Stuck Screenshot

Kalau halaman yang sama terbaca berulang atau tombol navigasi tidak ditemukan, sistem otomatis menghentikan job itu, mengambil screenshot, lalu report menampilkan link screenshot di dashboard.

## Provider

### OpenClaw Gateway

Pakai ini kalau kamu ingin login Codex OAuth dikelola oleh OpenClaw.

Cara paling mudah: double click file ini dari folder utama:

```text
connect-openclaw-codex.bat
```

File itu akan menjalankan login Codex OAuth lalu menyalakan gateway di `http://localhost:18789`.

Cara manual:

1. Buka terminal/cmd dan login Codex OAuth di OpenClaw:

```bash
openclaw models auth login --provider openai-codex
```

2. Ikuti redirect login di browser sampai sukses.

3. Jalankan OpenClaw Gateway dan aktifkan OpenResponses HTTP API di port `18789`.

4. Di dashboard KUNEKU:

```text
Provider: OpenClaw Gateway (Codex OAuth)
Base URL: http://localhost:18789/v1/responses
Model: openai-codex/gpt-5.4
Token/API Key: kosongkan jika gateway tidak pakai token
```

5. Klik `Cek Koneksi AI`. Kalau berhasil, baru klik `Mulai Sistem`.

Catatan: ChatGPT Plus yang login di browser tidak otomatis menjadi API. Mode tanpa credit API dilakukan lewat OpenClaw Gateway yang sudah login OAuth Codex, lalu KUNEKU memanggil gateway lokal itu.

### OpenAI API Key

```text
Provider: OpenAI API Key
Base URL: https://api.openai.com/v1/responses
Model: chat-latest
Token/API Key: isi-api-key-anda
```

## Aturan AI Pro

Contoh:

```text
pernah menggunakan website seminarfst, apakah anda pernah menggunakan website seminarfst => Ya
nama, nama lengkap => Aditya Pratama | Ahmad Fauzan | Bima Saputra | Dimas Ramadhan | Fajar Nugroho | Rizky Maulana | Bagas Setiawan | Ilham Akbar | Yoga Prasetyo | Raka Firmansyah | Siti Rahmawati | Ayu Lestari | Nadia Putri | Dewi Anggraini | Nur Aisyah | Fitri Handayani | Intan Permata | Maya Safitri | Rani Oktaviani | Putri Maharani
program studi, jurusan, prodi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
angkatan, tahun angkatan => 2022 | 2023 | 2024 | 2025
```

ChatGPT membaca aturan ini, dan sistem tetap memaksa jawaban agar tidak keluar dari daftar aturan.

## Login Google Forms

Sistem tidak akan login Google untuk menyimpan progres. Banner seperti `Login ke Google untuk menyimpan progres` akan diabaikan. Kalau sebuah form benar-benar mewajibkan akun Google, sistem akan melewati form itu karena target mode lokal ini adalah form publik/tanpa login.

## Aturan Advanced

Mode utama sekarang adalah Auto Analyze. Aturan/profile di bawah ini tetap ada sebagai override advanced jika benar-benar diperlukan:

- `Default`: aturan survey umum.
- `Survey Kepuasan`: cocok untuk UX/kepuasan layanan, termasuk Likert positif/negatif.
- `Tracer Study`: cocok untuk alumni/pekerjaan/kesesuaian bidang.
- `Rekomendasi Prodi`: cocok untuk pilihan/rekomendasi program studi.
- `seminarFST`: contoh template khusus untuk form seminarFST.
- `Custom`: tempat aturan bebas per form.

## Aturan Legacy seminarFST

`seminarFST` sekarang hanya salah satu template. Sistem utama tetap general untuk Google Forms lain. Template ini punya aturan:

- Nama diisi dengan nama realistis orang Indonesia.
- Pertanyaan `Apakah Anda pernah menggunakan website seminarFST?` selalu dijawab `Ya`.
- Program studi dipilih dari `Teknik Informatika`, `Teknik Industri`, `Sistem Informasi`, `Matematika`, atau `Teknik Elektro`.
- Angkatan dipilih dari `2022`, `2023`, `2024`, atau `2025`.
- Skala 1-5 dipilih pintar: kalimat positif cenderung `4/5`, kalimat negatif seperti rumit/ribet/membingungkan cenderung `1/2`.
- Kritik/saran/kendala diisi natural dan spesifik untuk website seminarFST.
- Untuk isian teks, sistem membaca batas karakter seperti `maksimal 50 karakter`, lalu membuat jawaban pendek yang tetap utuh dan sesuai konteks. Isian pendek tanpa batas eksplisit juga dijaga ringkas maksimal 50 karakter.
