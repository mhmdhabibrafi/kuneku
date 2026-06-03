# Changelog

Semua perubahan penting KUNEKU dicatat di file ini.

## v1.1 - 2026-06-04

- Merapikan struktur repository agar siap dipublikasikan di GitHub.
- Menambahkan README root bergaya dokumentasi produk.
- Menambahkan `CHANGELOG.md`, `LICENSE`, `CONTRIBUTING.md`, `SECURITY.md`, dan workflow CI.
- Menetapkan versi aktif sebagai `v1.1`.
- Menghapus build/penamaan alternatif lama; build utama adalah `KUNEKU-ControlPanel.exe`.
- Merapikan UI dashboard dan Control Panel.
- Menghapus card author sidebar dan teks original-system footer yang ditandai.
- Menambahkan config example yang aman untuk repository publik.
- Menjaga file runtime private seperti `config.json`, log, report, node_modules, release zip, dan data MySQL lokal agar tidak ikut Git.
- Meningkatkan Auto Analyze, dedupe data responden, domicile-aware answer, dan jawaban kontekstual untuk banyak jenis Google Forms.

## v1.0 - 2026-05-30

- Rilis awal KUNEKU dengan dashboard web, backend Node.js, Playwright form runner, OpenClaw Gateway, dan Control Panel Windows.
