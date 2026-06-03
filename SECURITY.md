# Security Policy

## Data Private

Jangan pernah mengirim file berikut ke repository:

- `forms-gpt-agent/config.json`
- token API/OpenAI/OpenClaw/OAuth
- password database
- log dan report runtime
- screenshot hasil run
- data MySQL lokal
- file zip release lokal

## Pelaporan

Untuk isu keamanan, hubungi maintainer secara privat. Jangan menaruh token, credential, link sensitif, atau screenshot berisi data pribadi di issue publik.

## Praktik Aman

- Gunakan config example untuk dokumentasi publik.
- Putar ulang password/token jika pernah terlanjur tersimpan di file runtime.
- Jalankan `git status --ignored` dan secret scan sederhana sebelum push.
- Simpan SOP production, strategi operasional, dan credential di dokumentasi privat.

