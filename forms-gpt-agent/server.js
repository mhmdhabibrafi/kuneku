const http = require('http');
const fs = require('fs');
const path = require('path');
const net = require('net');
const { exec } = require('child_process');

const { chromium } = require('playwright');

const APP_NAME = 'KUNEKU';
const APP_OWNER = 'Muhammad Habib Rafi';
const PORT = Number(process.env.PORT || 18888);
const HOST = process.env.HOST || '127.0.0.1';
const ROOT = __dirname;
const PUBLIC = path.join(ROOT, 'public');
const DIST = path.join(ROOT, 'dist');
const CONFIG_FILE = path.join(ROOT, 'config.json');
const NAME_SOURCE_FILE = path.join(ROOT, '..', 'nama-orang-indonesia.json');
const REPORT_DIR = path.join(ROOT, 'reports');
const RESPONDENT_HISTORY_FILE = path.join(REPORT_DIR, 'respondent-history.json');
const DEFAULT_STORAGE = {
  type: 'local',
  mysql: {
    host: '127.0.0.1',
    port: 3306,
    database: 'kuneku',
    user: 'root',
    password: ''
  }
};

const FALLBACK_NAME_PARTS = [
  'Aditya', 'Ahmad', 'Ayu', 'Bagas', 'Bima', 'Dewi', 'Dimas', 'Fajar', 'Fitri',
  'Ilham', 'Intan', 'Maya', 'Nadia', 'Nur', 'Putri', 'Raka', 'Rani', 'Rizky',
  'Siti', 'Yoga', 'Anggraini', 'Handayani', 'Lestari', 'Maulana', 'Nugroho',
  'Oktaviani', 'Prasetyo', 'Pratama', 'Ramadhan', 'Safitri', 'Saputra', 'Setiawan'
];
const COMMON_GIVEN_PARTS = [
  'Aditya', 'Ahmad', 'Aisyah', 'Ajeng', 'Akbar', 'Amalia', 'Ananda', 'Andi',
  'Andika', 'Anisa', 'Ardi', 'Arif', 'Ayu', 'Bagas', 'Bima', 'Dedi', 'Dewi',
  'Dian', 'Dika', 'Dimas', 'Dina', 'Dwi', 'Eka', 'Eko', 'Fajar', 'Farhan',
  'Fitri', 'Hadi', 'Hanif', 'Ika', 'Ilham', 'Ina', 'Indah', 'Intan', 'Irfan',
  'Laili', 'Maya', 'Mila', 'Nadia', 'Nur', 'Putri', 'Raka', 'Rani', 'Reza',
  'Rina', 'Riska', 'Rizky', 'Sandi', 'Sari', 'Siti', 'Tia', 'Vivi', 'Wulan',
  'Yani', 'Yoga', 'Yusuf'
];
const MALE_GIVEN_PARTS = [
  'Aditya', 'Ahmad', 'Akbar', 'Andi', 'Andika', 'Ardi', 'Arif', 'Bagas',
  'Bima', 'Dedi', 'Dika', 'Dimas', 'Eko', 'Fajar', 'Farhan', 'Hadi',
  'Hanif', 'Ilham', 'Irfan', 'Raka', 'Reza', 'Rizky', 'Sandi', 'Yoga', 'Yusuf'
];
const FEMALE_GIVEN_PARTS = [
  'Aisyah', 'Ajeng', 'Amalia', 'Anisa', 'Ayu', 'Dewi', 'Dian', 'Dina',
  'Fitri', 'Ika', 'Ina', 'Indah', 'Intan', 'Laili', 'Maya', 'Mila',
  'Nadia', 'Nur', 'Putri', 'Rani', 'Rina', 'Riska', 'Sari', 'Siti',
  'Tia', 'Vivi', 'Wulan', 'Yani'
];
const COMMON_LAST_PARTS = [
  'Anggraini', 'Cahyono', 'Firmansyah', 'Handayani', 'Hidayat', 'Hidayati',
  'Kurniawan', 'Lestari', 'Maharani', 'Maulana', 'Nugroho', 'Oktaviani',
  'Permata', 'Prasetyo', 'Pratama', 'Purnomo', 'Rahmawati', 'Ramadhan',
  'Safitri', 'Saputra', 'Setiawan', 'Suryani', 'Susanto', 'Utami', 'Wibowo',
  'Wijaya', 'Wulandari'
];
const MALE_LAST_PARTS = [
  'Cahyono', 'Firmansyah', 'Hidayat', 'Kurniawan', 'Maulana', 'Nugroho',
  'Prasetyo', 'Pratama', 'Purnomo', 'Ramadhan', 'Saputra', 'Setiawan',
  'Susanto', 'Wibowo', 'Wijaya'
];
const FEMALE_LAST_PARTS = [
  'Anggraini', 'Handayani', 'Hidayati', 'Lestari', 'Maharani', 'Oktaviani',
  'Permata', 'Rahmawati', 'Safitri', 'Suryani', 'Utami', 'Wulandari'
];
const NAME_STOP_WORDS = new Set(['anak', 'bin', 'binti', 'dan', 'dari', 'di', 'ke', 'yang']);
const INDONESIAN_NAME_PARTS = loadIndonesianNameParts();
const INDONESIAN_NAMES = sampleIndonesianFullNames(24);
const HUMAN_DELAY = {
  fieldMin: 700,
  fieldMax: 1800,
  pageMin: 2200,
  pageMax: 4200
};
const FAST_LIKERT_DELAY = {
  fieldMin: 60,
  fieldMax: 180,
  optionMin: 40,
  optionMax: 140,
  pageMin: 350,
  pageMax: 900
};
const STUCK_SIGNATURE_LIMIT = 8;
const INDONESIAN_CITIES = [
  'Jakarta', 'Bandung', 'Surabaya', 'Yogyakarta', 'Semarang', 'Bogor',
  'Depok', 'Tangerang', 'Bekasi', 'Malang', 'Solo', 'Medan', 'Makassar',
  'Palembang', 'Denpasar', 'Pekanbaru', 'Padang', 'Lampung', 'Pontianak',
  'Banjarmasin', 'Samarinda', 'Balikpapan', 'Manado', 'Mataram', 'Kupang',
  'Ambon', 'Jayapura', 'Cirebon', 'Tasikmalaya', 'Karawang', 'Purwokerto',
  'Tegal', 'Kediri', 'Jember', 'Serang'
];
const INDONESIAN_STREET_NAMES = [
  'Mawar', 'Melati', 'Kenanga', 'Cendana', 'Merpati', 'Garuda',
  'Pemuda', 'Diponegoro', 'Sudirman', 'Kartini', 'Dahlia', 'Anggrek',
  'Ahmad Yani', 'Gatot Subroto', 'Teuku Umar', 'Imam Bonjol', 'Panjaitan',
  'Hayam Wuruk', 'Gajah Mada', 'Veteran'
];
const TRANSPORT_OPTIONS = [
  'Transportasi Umum', 'Sepeda Motor', 'Mobil Pribadi', 'Jalan Kaki',
  'Ojek Online'
];
const RELIGION_OPTIONS = ['Islam', 'Kristen', 'Katolik', 'Hindu', 'Buddha'];
const ECOMMERCE_PLATFORMS = [
  'Shopee', 'Tokopedia', 'Lazada', 'TikTok Shop', 'Blibli', 'Bukalapak'
];

const FEEDBACK_POOL = {
  saran: [
    'Tampilan dibuat lebih responsif agar nyaman diakses dari HP.',
    'Informasi yang ditampilkan sudah cukup lengkap dan mudah dipahami.',
    'Akan lebih baik jika ada fitur pencarian untuk mempermudah navigasi.',
    'Perlu ditambahkan panduan penggunaan untuk pengguna baru.',
    'Font dan warna sudah nyaman, mungkin bisa ditambah mode gelap.',
    'Semoga ke depannya bisa diakses lebih cepat saat jam sibuk.',
    'Menu navigasi sebaiknya dibuat lebih sederhana dan intuitif.',
    'Proses registrasi bisa dipercepat dengan mengurangi langkah yang tidak perlu.',
    'Desain sudah modern, tinggal ditingkatkan dari sisi kecepatan loading.',
    'Bagian FAQ bisa diperluas agar menjawab pertanyaan umum pengguna.',
    'Notifikasi email atau WA akan sangat membantu untuk update status.',
    'Secara keseluruhan sudah baik, tetap dipertahankan kualitasnya.',
    'Kalau bisa ditambahkan fitur unduh data dalam format Excel.',
    'Tampilan dashboard bisa dibuat lebih ringkas supaya tidak membingungkan.',
    'Sudah bagus, semoga ada versi aplikasi mobile-nya juga.',
    'Loading halaman cukup cepat, konten juga relevan.',
    'Akan lebih bagus jika ada tutorial video singkat.',
    'Perlu perbaikan di bagian upload file, kadang gagal.',
    'Secara umum pengalaman menggunakan sistem ini menyenangkan.',
    'Alur pengisian form sudah jelas dan tidak membingungkan.',
    'Informasi kontak dan bantuan sebaiknya lebih mudah ditemukan.',
    'Fitur filter dan sortir data sangat membantu.'
  ],
  kendala: [
    'Belum mengalami kendala yang berarti sejauh ini.',
    'Kadang loading agak lambat saat jam sibuk.',
    'Pernah mengalami error saat upload file berukuran besar.',
    'Halaman terkadang tidak responsif di browser HP.',
    'Agak bingung di awal, tapi setelah dicoba beberapa kali sudah paham.',
    'Tidak ada kendala signifikan, semua berjalan lancar.',
    'Tombol navigasi kadang kurang responsif saat di-klik.',
    'Sempat bingung mencari menu tertentu karena terlalu banyak opsi.',
    'Koneksi internet yang lambat membuat proses jadi lebih lama.',
    'Notifikasi email terkadang masuk ke folder spam.',
    'Proses verifikasi terlalu lama, perlu dipercepat.',
    'Tidak ada masalah, semuanya berfungsi dengan baik.',
    'Sesekali data tidak tersimpan setelah submit, harus mengulang.',
    'Tampilan di tablet kurang optimal, sebagian konten terpotong.',
    'Perlu login ulang terlalu sering, agak merepotkan.'
  ],
  komentar: [
    'Sistem ini sangat membantu dan mudah digunakan.',
    'Pengalaman menggunakannya cukup menyenangkan dan intuitif.',
    'Desainnya modern dan profesional, informasi mudah ditemukan.',
    'Cukup puas dengan fitur-fitur yang tersedia saat ini.',
    'Tampilannya bersih dan rapi, navigasi juga mudah.',
    'Secara keseluruhan sudah memenuhi kebutuhan pengguna.',
    'Sangat terbantu dengan adanya sistem ini untuk kegiatan sehari-hari.',
    'Informasi yang disajikan akurat dan selalu up to date.',
    'Proses pengisian data cepat dan tidak bertele-tele.',
    'Sistem berjalan stabil, jarang mengalami error.',
    'Fitur-fiturnya sudah cukup lengkap untuk kebutuhan saat ini.',
    'User interface-nya ramah pengguna, bahkan untuk pemula.',
    'Respon sistem cukup cepat, tidak perlu menunggu lama.',
    'Senang menggunakan sistem ini karena mempermudah pekerjaan.',
    'Alur kerja di dalam sistem sudah terstruktur dengan baik.'
  ],
  alasan: [
    'Karena sesuai dengan kebutuhan akademik saya.',
    'Karena informasinya lengkap dan mudah dipahami.',
    'Karena proses pendaftarannya mudah dan cepat.',
    'Karena direkomendasikan oleh teman dan dosen.',
    'Karena sudah terbiasa menggunakan sistem yang serupa.',
    'Karena fiturnya membantu menyelesaikan tugas lebih efisien.',
    'Karena tampilannya user-friendly dan tidak membingungkan.',
    'Karena aksesnya mudah, bisa dari mana saja.',
    'Karena kualitas layanannya sudah terbukti baik.',
    'Karena tidak ada alternatif lain yang lebih baik.',
    'Karena sistemnya terintegrasi dengan baik.',
    'Karena memudahkan komunikasi dengan pihak terkait.'
  ],
  harapan: [
    'Semoga sistem ini terus dikembangkan dan ditingkatkan.',
    'Harapannya ada fitur notifikasi real-time di masa depan.',
    'Semoga proses bisa lebih cepat dan efisien ke depannya.',
    'Harapannya bisa diakses dalam bentuk aplikasi mobile.',
    'Semoga informasi yang tersedia semakin lengkap dan akurat.',
    'Semoga tampilan dan performa terus ditingkatkan.',
    'Harapannya ada panduan yang lebih detail untuk pengguna baru.',
    'Semoga ada fitur chat atau bantuan langsung untuk pengguna.',
    'Harapannya sistem ini bisa diintegrasikan dengan platform lain.',
    'Semoga ke depannya maintenance tidak terlalu sering mengganggu.',
    'Semoga respons customer service lebih cepat.',
    'Harapannya bisa lebih personal dan sesuai kebutuhan individu.'
  ]
};

const VALID_PHONE_PREFIXES = [
  '0812', '0813', '0821', '0822', '0852', '0853', '0857', '0858',
  '0811', '0814', '0815', '0816', '0855', '0856', '0817', '0818',
  '0819', '0859', '0877', '0878', '0831', '0832', '0833', '0838'
];

const EMAIL_DOMAINS = [
  'gmail.com', 'gmail.com', 'gmail.com', 'gmail.com',
  'yahoo.com', 'outlook.com', 'mail.com',
  'student.ac.id', 'email.com'
];

const DEFAULT_RULES = `pernah menggunakan, pernah mengakses, pernah memakai, pernah mencoba, sudah menggunakan, familiar dengan => Ya
nama, nama lengkap => ${INDONESIAN_NAMES.join(' | ')}
program studi, jurusan, prodi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro | Manajemen | Akuntansi | Hukum | Psikologi
angkatan, tahun angkatan => 2022 | 2023 | 2024 | 2025
rekomendasi program studi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
saran, masukan, komentar => ${pickMultipleFromPool(FEEDBACK_POOL.saran, 8).join(' | ')}
kota, domisili, asal daerah => Jakarta | Bandung | Surabaya | Yogyakarta | Semarang | Bogor | Malang | Solo | Medan | Makassar | Pekanbaru | Padang | Denpasar | Palembang | Bekasi
domisili negara, berdomisili saat ini, tinggal di indonesia => Indonesia | Ya
platform e-commerce, marketplace, aplikasi belanja online => Shopee | Tokopedia | Lazada | TikTok Shop | Blibli`;

const TEMPLATE_RULES = {
  Default: DEFAULT_RULES,
  'Survey Kepuasan': `${DEFAULT_RULES}
mudah digunakan, puas, bermanfaat, nyaman, efektif, jelas => 4 | 5
rumit, sulit, membingungkan, tidak praktis, kendala, masalah => 1 | 2`,
  'Tracer Study': `${DEFAULT_RULES}
status pekerjaan, bekerja saat ini => Bekerja | Wirausaha
kesesuaian bidang, sesuai jurusan => Sesuai | Cukup sesuai
masa tunggu kerja => Kurang dari 6 bulan | 6-12 bulan`,
  'Rekomendasi Prodi': `${DEFAULT_RULES}
rekomendasi program studi, pilihan program studi, minat program studi => Teknik Informatika | Sistem Informasi | Teknik Industri | Matematika | Teknik Elektro`,
  seminarFST: `pernah menggunakan website seminarfst, apakah anda pernah menggunakan website seminarfst => Ya
nama, nama lengkap => ${INDONESIAN_NAMES.join(' | ')}
program studi, jurusan, prodi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
angkatan, tahun angkatan => 2022 | 2023 | 2024 | 2025
rekomendasi program studi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
saran, masukan, komentar, kritik, kendala => Website seminarFST sudah cukup membantu, tetapi informasi jadwal dan alur pendaftaran bisa dibuat lebih jelas. | Secara umum website seminarFST mudah digunakan, saran saya tampilan informasi seminar dibuat lebih ringkas. | Fitur pencarian seminar bisa ditambahkan agar pengguna lebih cepat menemukan topik yang diinginkan. | Tampilan website sudah rapi, namun loading halaman kadang agak lambat saat banyak pengguna. | Panduan pendaftaran seminar sebaiknya dibuat step-by-step agar mahasiswa baru tidak bingung. | Secara keseluruhan website bermanfaat, mungkin bisa ditambahkan notifikasi email untuk update jadwal. | Website sudah memenuhi kebutuhan informasi seminar, tetap pertahankan kualitasnya. | Navigasi antar halaman sudah cukup intuitif, informasi seminar juga lengkap dan up to date.`
};

let config = loadConfig();
let logs = [];
let running = false;
let stopRequested = false;
let activeBrowser = null;
let lastReport = createEmptyReport();
let pendingReview = null;
let pendingReviewResolver = null;
let storageStatus = storageOverview(config.storage);
let respondentHistory = loadRespondentHistory();
let runIdentityTokens = seedIdentityTokensFromHistory();
let runFeedbackTokens = seedFeedbackTokensFromHistory();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://${req.headers.host}`);

    if (req.method === 'GET' && url.pathname === '/api/state') {
      return json(res, 200, {
        running,
        logs,
        config: publicConfig(config),
        report: publicReport(lastReport),
        storage: storageStatus,
        pendingReview: publicPendingReview()
      });
    }

    if (req.method === 'GET' && url.pathname === '/api/report') {
      return json(res, 200, { ok: true, report: publicReport(lastReport) });
    }

    if (req.method === 'GET' && url.pathname === '/api/report/export') {
      return exportReport(res, url.searchParams.get('format') || 'json');
    }

    if (req.method === 'GET' && url.pathname === '/api/health') {
      const deep = url.searchParams.get('deep') === 'true';
      const result = await healthCheck(config, deep);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/config') {
      const body = await readJson(req);
      config = normalizeConfig(mergeConfigPatch(config, body));
      await saveConfig(config);
      storageStatus = storageOverview(config.storage);
      return json(res, 200, { ok: true, storage: storageStatus });
    }

    if (req.method === 'POST' && url.pathname === '/api/test-ai') {
      const body = await readJson(req);
      const runConfig = normalizeConfig(mergeConfigPatch(config, body));
      const result = await testAIConnection(runConfig);
      return json(res, 200, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/storage/test') {
      const body = await readJson(req);
      const runConfig = normalizeConfig(mergeConfigPatch(config, body));
      const result = await testStorageConnection(runConfig.storage, true);
      return json(res, 200, result);
    }

    if (req.method === 'GET' && url.pathname === '/api/storage/dashboard') {
      const result = await storageDashboard();
      return json(res, result.ok === false ? 500 : 200, result);
    }

    if (req.method === 'GET' && url.pathname === '/api/storage/backup') {
      const backup = await storageBackup();
      return sendDownload(res, `${backup.id}.json`, 'application/json; charset=utf-8', JSON.stringify(backup, null, 2));
    }

    if (req.method === 'POST' && url.pathname === '/api/preview') {
      if (running) return json(res, 409, { ok: false, error: 'Sistem sedang berjalan. Stop dulu sebelum scan preview.' });
      const body = await readJson(req);
      const runConfig = normalizeConfig(mergeConfigPatch(config, body));
      const result = await previewForms(runConfig);
      return json(res, result.ok ? 200 : 500, result);
    }

    if (req.method === 'POST' && url.pathname === '/api/stop') {
      stopRequested = true;
      resolvePendingReview('skip');
      log('Stop diminta. Sistem akan berhenti setelah langkah aktif selesai.', 'warn');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/review/approve') {
      if (!pendingReview) return json(res, 404, { ok: false, error: 'Tidak ada submit yang menunggu approval.' });
      resolvePendingReview('approve');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/review/skip') {
      if (!pendingReview) return json(res, 404, { ok: false, error: 'Tidak ada submit yang menunggu approval.' });
      resolvePendingReview('skip');
      return json(res, 200, { ok: true });
    }

    if (req.method === 'POST' && url.pathname === '/api/run') {
      if (running) return json(res, 409, { ok: false, error: 'Sistem masih berjalan.' });
      const body = await readJson(req);
      const runConfig = normalizeConfig(mergeConfigPatch(config, body));
      config = runConfig;
      await saveConfig(config);
      storageStatus = storageOverview(config.storage);
      runAgent(runConfig).catch(err => log(`Fatal: ${err.message}`, 'err'));
      return json(res, 200, { ok: true });
    }

    if (req.method === 'GET' && url.pathname.startsWith('/reports/')) {
      return serveReportFile(res, url.pathname);
    }

    if (req.method === 'GET') {
      return serveStaticApp(res, url.pathname);
    }

    return json(res, 404, { error: 'not_found' });
  } catch (err) {
    return json(res, 500, { ok: false, error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`${APP_NAME} by ${APP_OWNER} running at http://${HOST}:${PORT}`);
  openDashboard(PORT);
});

function openDashboard(port) {
  if (process.env.NO_OPEN) return;
  const url = `http://localhost:${port}`;
  const command = process.platform === 'win32'
    ? `start "" "${url}"`
    : process.platform === 'darwin'
      ? `open "${url}"`
      : `xdg-open "${url}"`;
  exec(command, () => {});
}

async function runAgent(runConfig) {
  running = true;
  stopRequested = false;
  logs = [];
  respondentHistory = loadRespondentHistory();
  runIdentityTokens = seedIdentityTokensFromHistory();
  runFeedbackTokens = seedFeedbackTokensFromHistory();

  const runItems = normalizeRunItems(runConfig);
  const jobs = expandRunJobs(runItems);
  if (!jobs.length) {
    log('Tidak ada link Google Forms valid.', 'err');
    running = false;
    return;
  }

  lastReport = createRunReport(runConfig, runItems, jobs);
  persistReportSnapshot().catch(() => {});

  try {
    activeBrowser = await launchBrowser(runConfig.headless);
    const context = await activeBrowser.newContext({ viewport: { width: 1366, height: 850 } });
    const page = await context.newPage();

    log(`${runConfig.systemName || APP_NAME} mulai: ${runItems.length} link, ${jobs.length} total job`, 'ok');
    if (runConfig.dryRun) log('Dry Run aktif: sistem isi dan preview jawaban, tapi tidak menekan Kirim.', 'warn');
    log(`Provider: ${runConfig.provider} | Model: ${runConfig.model || '(default)'}`, 'ok');

    for (const job of jobs) {
      if (stopRequested) break;
      const jobConfig = {
        ...runConfig,
        customRulesText: job.customRulesText || runConfig.customRulesText,
        responsesPerLink: job.totalForLink,
        currentJob: job,
        __recordRespondent: !runConfig.dryRun
      };
      const reportJob = startReportJob(job);

      log(`Membuka link ${job.linkIndex + 1}/${runItems.length}, isi ${job.attempt}/${job.totalForLink} (${job.profileName})`);
      try {
        const result = await fillGoogleForm(page, job.url, jobConfig, job);
        finishReportJob(reportJob, result);
      } catch (err) {
        const screenshot = await takeFailureScreenshot(page, job, 'error').catch(() => '');
        const result = { ok: false, status: 'error', error: err.message, screenshot };
        finishReportJob(reportJob, result);
        log(`Job gagal: ${err.message}`, 'err');
      }
    }

    log(stopRequested ? 'Sistem dihentikan.' : 'Semua job selesai.', stopRequested ? 'warn' : 'ok');
    finalizeReport(stopRequested ? 'stopped' : 'completed');
    await activeBrowser.close();
  } catch (err) {
    log(err.message, 'err');
    finalizeReport('error', err.message);
    try { if (activeBrowser) await activeBrowser.close(); } catch (_) {}
  } finally {
    activeBrowser = null;
    pendingReview = null;
    pendingReviewResolver = null;
    running = false;
  }
}

async function launchBrowser(headless) {
  try {
    return await chromium.launch({ channel: 'chrome', headless: !!headless });
  } catch (err) {
    log('Chrome channel tidak tersedia, pakai Chromium bawaan Playwright.', 'warn');
    return chromium.launch({ headless: !!headless });
  }
}

async function fillGoogleForm(page, url, runConfig) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await handleGoogleFormsLoginPrompt(page);
  const pages = [];
  const signatures = new Map();

  for (let step = 1; step <= 50 && !stopRequested; step++) {
    if (isGoogleLoginUrl(page.url())) {
      log('Google membuka halaman login. Sistem tidak login dan kembali ke form.', 'warn');
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
      await page.waitForTimeout(1200);

      if (isGoogleLoginUrl(page.url())) {
        log('Form ini benar-benar mewajibkan login Google, jadi dilewati. Sistem hanya mendukung form publik/tanpa login.', 'err');
        const screenshot = await takeFailureScreenshot(page, runConfig.currentJob, 'login-required').catch(() => '');
        return { ok: false, status: 'login_required', pages, screenshot };
      }
    }

    const promptResult = await handleGoogleFormsLoginPrompt(page);
    if (promptResult === 'dismissed-save-progress') {
      log('Popup simpan progres Google Forms ditutup tanpa login.', 'ok');
    }
    await waitForForm(page);
    const snapshot = mapSnapshot(await readFormSnapshot(page));
    const action = await getNavigationAction(page);
    const pageSummary = summarizeSnapshot(snapshot, step, action);
    pages.push(pageSummary);

    if (snapshot.pageType === 'CONFIRMATION') {
      log('Form sudah sampai halaman konfirmasi.', 'ok');
      return { ok: true, status: 'submitted', pages };
    }

    log(`Halaman ${step}: ${snapshot.pageType}, ${snapshot.questions.length} pertanyaan`);

    const signature = formPageSignature(snapshot, action);
    const seen = (signatures.get(signature) || 0) + 1;
    signatures.set(signature, seen);
    if (shouldTreatAsStuck(snapshot, seen)) {
      const screenshot = await takeFailureScreenshot(page, runConfig.currentJob, 'stuck').catch(() => '');
      log(`Anti-stuck aktif: halaman yang sama terbaca ${seen} kali. Form dilewati.`, 'err');
      return { ok: false, status: 'stuck', pages, screenshot, error: 'Halaman yang sama terbaca berulang.' };
    }

    if (snapshot.questions.length > 0) {
      const answers = await answerQuestions(snapshot, runConfig);
      pageSummary.answers = answers.map(item => ({ index: item.index, answer: item.answer }));
      const applyLogs = await applyAnswersWithPlaywright(page, snapshot.questions, answers, runConfig);
      applyLogs.forEach(item => log(item.message, item.level));
    }

    const fastPage = isFastLikertPage(snapshot.questions);
    let pageMinDelay = fastPage ? FAST_LIKERT_DELAY.pageMin : HUMAN_DELAY.pageMin;
    let pageMaxDelay = fastPage ? FAST_LIKERT_DELAY.pageMax : HUMAN_DELAY.pageMax;
    if (runConfig.fastMode) {
      pageMinDelay = fastPage ? 50 : 150;
      pageMaxDelay = fastPage ? 150 : 400;
    }
    await humanDelay(page, pageMinDelay, pageMaxDelay);
    const nextAction = await getNavigationAction(page);
    if (runConfig.dryRun && nextAction === 'submit') {
      log('Dry Run: halaman terakhir sudah terisi, tombol Kirim tidak ditekan.', 'warn');
      return { ok: true, status: 'dry_run', pages };
    }

    if (runConfig.reviewBeforeSubmit && nextAction === 'submit') {
      const decision = await waitForSubmitApproval(page, runConfig.currentJob, pages);
      if (decision !== 'approve') {
        log('Submit dilewati karena belum/ tidak di-approve.', 'warn');
        return { ok: false, status: stopRequested ? 'stopped' : 'approval_skipped', pages };
      }
      log('Approval diterima. Sistem menekan tombol Kirim.', 'ok');
    }

    const clicked = await clickNextOrSubmit(page);
    if (!clicked) {
      log('Tidak menemukan tombol Berikutnya/Kirim. Berhenti untuk form ini.', 'warn');
      const screenshot = await takeFailureScreenshot(page, runConfig.currentJob, 'missing-navigation').catch(() => '');
      return { ok: false, status: 'missing_navigation', pages, screenshot };
    }

    const moved = await settleAfterNavigationClick(page, runConfig);
    const validationErrors = await readGoogleFormValidationErrors(page);
    if (validationErrors.length) {
      const screenshot = await takeFailureScreenshot(page, runConfig.currentJob, 'validation-failed').catch(() => '');
      const detail = validationErrors.slice(0, 3).join(' | ');
      log(`Validasi Google Forms gagal: ${detail}`, 'err');
      return { ok: false, status: 'validation_failed', pages, screenshot, error: detail };
    }
    if (!moved) {
      log('Masih di halaman yang sama setelah klik. Sistem coba lanjut ulang di langkah berikutnya.', 'warn');
    }
  }

  if (stopRequested) {
    return { ok: false, status: 'stopped', pages };
  }

  log('Batas 50 langkah tercapai. Form dilewati.', 'warn');
  const screenshot = await takeFailureScreenshot(page, runConfig.currentJob, 'step-limit').catch(() => '');
  return { ok: false, status: 'step_limit', pages, screenshot };
}

function shouldTreatAsStuck(snapshot, seen) {
  const limit = snapshot.pageType === 'PROFILE' ? 3 : STUCK_SIGNATURE_LIMIT;
  return seen >= limit;
}

async function settleAfterNavigationClick(page, runConfig = {}) {
  await page.waitForLoadState('domcontentloaded', { timeout: 5000 }).catch(() => {});
  const waitTimeout = runConfig.fastMode ? 400 : 1600;
  await page.waitForTimeout(waitTimeout);

  for (let attempt = 1; attempt <= 3; attempt++) {
    const promptResult = await handleGoogleFormsLoginPrompt(page);
    if (promptResult === 'dismissed-save-progress') {
      log('Popup simpan progres muncul setelah klik. Ditutup, lalu klik lanjut ulang.', 'ok');
      await page.waitForTimeout(runConfig.fastMode ? 100 : 350);
      const clickedAgain = await clickNextOrSubmit(page);
      if (!clickedAgain) return false;
      await page.waitForTimeout(runConfig.fastMode ? 300 : 1200);
      continue;
    }
    return true;
  }

  return true;
}

async function readGoogleFormValidationErrors(page) {
  return page.evaluate(() => {
    const patterns = [
      /^pertanyaan ini wajib diisi\.?$/i,
      /^this is a required question\.?$/i,
      /^this question is required\.?$/i
    ];

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function questionTitle(el) {
      const block = el.closest('div[role="listitem"], div.freebirdFormviewerViewNumberedItemContainer');
      const titleEl = block?.querySelector('[role="heading"], .M7eMe, .freebirdFormviewerComponentsQuestionBaseTitle');
      return (titleEl?.textContent || '').replace(/\s+/g, ' ').trim();
    }

    const errors = [];
    for (const el of Array.from(document.querySelectorAll('div, span'))) {
      if (!isVisible(el)) continue;
      const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!text || text.length > 120) continue;
      if (!text || !patterns.some(pattern => pattern.test(text))) continue;
      const title = questionTitle(el);
      const message = title ? `${title}: ${text}` : text;
      if (!errors.includes(message)) errors.push(message);
    }
    return errors.slice(0, 8);
  }).catch(() => []);
}

async function waitForSubmitApproval(page, job, pages) {
  if (pendingReview) {
    log('Masih ada review submit yang belum selesai. Job ini dilewati untuk mencegah tabrakan.', 'warn');
    return 'skip';
  }

  const reviewId = `review-${Date.now()}-${Math.random().toString(16).slice(2, 8)}`;
  const screenshot = await takeFailureScreenshot(page, job, 'review-before-submit').catch(() => '');
  const answers = collectPageAnswers(pages);
  pendingReview = {
    id: reviewId,
    jobId: job?.id || '',
    url: job?.url || '',
    profileName: job?.profileName || 'Default',
    attempt: job?.attempt || 1,
    totalForLink: job?.totalForLink || 1,
    createdAt: new Date().toISOString(),
    screenshot,
    pages: JSON.parse(JSON.stringify(pages || [])),
    answers
  };

  markReportJobWaitingReview(job, pendingReview);
  log('Review Before Submit aktif: cek ringkasan jawaban lalu klik Approve Submit di dashboard.', 'warn');

  return new Promise(resolve => {
    pendingReviewResolver = decision => {
      pendingReview = null;
      pendingReviewResolver = null;
      resolve(decision);
    };
  });
}

function collectPageAnswers(pages) {
  const out = [];
  for (const page of pages || []) {
    for (const answer of page.answers || []) {
      const question = (page.questions || []).find(item => item.index === answer.index);
      out.push({
        page: page.step,
        index: answer.index,
        title: question?.title || `Pertanyaan ${answer.index + 1}`,
        type: question?.type || '',
        semanticType: question?.semanticType || '',
        answer: answer.answer
      });
    }
  }
  return out;
}

function resolvePendingReview(decision) {
  if (!pendingReviewResolver) return false;
  pendingReviewResolver(decision === 'approve' ? 'approve' : 'skip');
  return true;
}

async function previewForms(runConfig) {
  const items = normalizeRunItems(runConfig);
  if (!items.length) return { ok: false, error: 'Tidak ada link Google Forms valid.' };

  const previews = [];
  let browser;
  try {
    browser = await launchBrowser(true);
    const context = await browser.newContext({ viewport: { width: 1366, height: 850 } });
    const page = await context.newPage();

    for (let index = 0; index < items.length && index < 20; index++) {
      const item = items[index];
      const itemConfig = { ...runConfig, customRulesText: item.customRulesText, __recordRespondent: false };
      try {
        const preview = await previewGoogleForm(page, item.url, itemConfig);
        previews.push({ ok: true, index, url: item.url, profileName: item.profileName, ...preview });
      } catch (err) {
        previews.push({ ok: false, index, url: item.url, profileName: item.profileName, error: err.message, pages: [] });
      }
    }

    await browser.close();
    return { ok: true, previews };
  } catch (err) {
    try { if (browser) await browser.close(); } catch (_) {}
    return { ok: false, error: err.message, previews };
  }
}

async function previewGoogleForm(page, url, runConfig) {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
  await handleGoogleFormsLoginPrompt(page);

  const pages = [];
  const baseRules = parseCustomRules(runConfig.customRulesText || DEFAULT_RULES);

  for (let step = 1; step <= 12; step++) {
    if (isGoogleLoginUrl(page.url())) {
      return { status: 'login_required', pages };
    }

    await handleGoogleFormsLoginPrompt(page);
    await waitForForm(page);
    const snapshot = mapSnapshot(await readFormSnapshot(page));
    const rules = contextualRulesForSnapshot(baseRules, snapshot, runConfig);
    const action = await getNavigationAction(page);
    const summary = summarizeSnapshot(snapshot, step, action);
    pages.push(summary);

    if (snapshot.pageType === 'CONFIRMATION' || action === 'submit' || !snapshot.questions.length) {
      return { status: action === 'submit' ? 'ready_to_submit' : snapshot.pageType.toLowerCase(), pages };
    }

    const respondent = getRespondentProfile(runConfig);
    const diversified = diversifyLikertAnswers(snapshot.questions, fallbackAnswers(snapshot.questions, rules, respondent, runConfig), runConfig);
    const answers = normalizeAnswersForQuestions(snapshot.questions, diversified.answers, respondent).answers;
    await applyAnswersWithPlaywright(page, snapshot.questions, answers, runConfig);
    await humanDelay(page, runConfig.fastMode ? 100 : 500, runConfig.fastMode ? 300 : 900);
    const clicked = await clickNextOrSubmit(page);
    if (!clicked) return { status: 'missing_navigation', pages };
    await settleAfterNavigationClick(page, runConfig);
    const validationErrors = await readGoogleFormValidationErrors(page);
    if (validationErrors.length) {
      return { status: 'validation_failed', error: validationErrors.slice(0, 3).join(' | '), pages };
    }
  }

  return { status: 'preview_step_limit', pages };
}

async function getNavigationAction(page) {
  return page.evaluate(() => {
    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    const buttons = Array.from(document.querySelectorAll('div[role="button"], button[type="submit"], button, a'))
      .filter(isVisible)
      .map(el => ((el.innerText || el.textContent || el.getAttribute('aria-label') || '').trim()))
      .filter(Boolean);

    if (buttons.some(text => /^(kirim|submit|kirim jawaban)$/i.test(text))) return 'submit';
    if (buttons.some(text => /^(berikutnya|next|lanjut|selanjutnya)$/i.test(text))) return 'next';
    if (buttons.some(text => /^(kembali|back)$/i.test(text))) return 'back_only';
    return '';
  }).catch(() => '');
}

function summarizeSnapshot(snapshot, step, action = '') {
  return {
    step,
    pageType: snapshot.pageType,
    formTitle: snapshot.formTitle || '',
    action,
    questionCount: snapshot.questions.length,
    questions: snapshot.questions.map(q => ({
      index: q.index,
      title: q.title,
      type: q.type,
      semanticType: q.semanticType || classifyQuestion(q).semanticType,
      intent: q.intent || classifyQuestion(q).intent,
      options: (q.options || []).slice(0, 10),
      optionCount: (q.options || []).length,
      rowLabel: q.rowLabel || '',
      choiceMin: q.choiceMin || 0,
      choiceMax: q.choiceMax || 0,
      maxLength: q.maxLength || 0,
      placeholder: q.placeholder || ''
    }))
  };
}

function formPageSignature(snapshot, action = '') {
  return [
    snapshot.pageType,
    action,
    ...snapshot.questions.map(q => `${q.type}:${q.title}:${(q.options || []).join('|')}`)
  ].join('~~').toLowerCase();
}

function mapSnapshot(snapshot) {
  const questions = (snapshot.questions || []).map(q => ({ ...q, ...classifyQuestion(q) }));
  return {
    ...snapshot,
    questions,
    pageType: detectPageType({ ...snapshot, questions })
  };
}

function detectPageType(snapshot) {
  if (snapshot.pageType === 'CONFIRMATION') return 'CONFIRMATION';
  const questions = snapshot.questions || [];
  if (!questions.length) return snapshot.pageType || 'INFO';

  const count = type => questions.filter(q => q.intent === type || q.semanticType === type).length;
  const profileCount = questions.filter(q => {
    const profileTypes = [
      'name', 'gender', 'age', 'email', 'phone', 'city', 'birth_place',
      'birth_date', 'nationality', 'domicile_country', 'address', 'residence_area',
      'marital_status', 'guardian', 'transportation', 'religion',
      'education', 'occupation', 'study_program', 'cohort',
      'academic_semester', 'course_topic', 'ecommerce_platform',
      'ai_recommendation_experience', 'shopping_frequency', 'shopping_category'
    ];
    return q.intent === 'profile' || profileTypes.includes(q.semanticType);
  }).length;
  const gateCount = count('gate') + count('yes_no_gate');
  const likertCount = questions.filter(q => q.intent === 'likert' || q.semanticType.startsWith('likert')).length;
  const feedbackCount = count('feedback');

  if (gateCount && questions.length <= 3) return 'GATE';
  if (profileCount >= Math.ceil(questions.length / 2)) return 'PROFILE';
  if (likertCount >= 2) return 'QUESTIONNAIRE';
  if (feedbackCount && questions.length <= 3) return 'FEEDBACK';
  return snapshot.pageType || 'QUESTIONNAIRE';
}

function classifyQuestion(q) {
  const text = questionHaystack(q);
  const options = (q.options || []).map(option => String(option || '').trim());
  const isChoice = ['radio', 'dropdown', 'checkbox', 'grid_radio', 'grid_checkbox'].includes(q.type);
  const hasYesNo = hasOptionLike(options, /^(ya|yes|pernah|sudah)$/i) && hasOptionLike(options, /^(tidak|no|belum)$/i);
  const hasUrbanRural = hasOptionLike(options, /(perkotaan|urban)/i) && hasOptionLike(options, /(perdesaan|pedesaan|rural)/i);
  const likert = isLikertScale(options);
  const surveyScale = isSurveyScaleOptions(options);

  if (hasIndonesiaDomicileOptions(options) && /(domisili|tempat tinggal|tinggal|berada|lokasi|reside|resident|domicile)/.test(text)) {
    return { semanticType: 'domicile_country', intent: 'gate' };
  }
  if (hasYesNo && /(domisili|tempat tinggal|tinggal|berada|lokasi|reside|resident|domicile).*indonesia|indonesia.*(domisili|tempat tinggal|tinggal|berada|lokasi|reside|resident|domicile)/.test(text)) {
    return { semanticType: 'domicile_country', intent: 'gate' };
  }
  if (/\bwali\b|nama wali|orang tua|nama orang tua|guardian|parent/.test(text)) return { semanticType: 'guardian', intent: 'profile' };
  if ((/\bnama\b|nama lengkap|full name/.test(text)) && !(/\bwali\b|orang tua|guardian|parent/.test(text))) return { semanticType: 'name', intent: 'profile' };
  if (/(jenis kelamin|gender|\bkelamin\b|sex)/.test(text)) return { semanticType: 'gender', intent: 'profile' };
  if (/(usia|umur|\bage\b)/.test(text)) return { semanticType: 'age', intent: 'profile' };
  if (/(email|e-mail|surel)/.test(text) && !(isChoice && surveyScale)) return { semanticType: 'email', intent: 'profile' };
  if (/(no hp|nomor hp|telepon|whatsapp|\bwa\b|ponsel|handphone|phone)/.test(text)) return { semanticType: 'phone', intent: 'profile' };
  if (/(kewarganegaraan|kewarnegaraan|kebangsaan|warga negara|nationality|citizenship)/.test(text)) return { semanticType: 'nationality', intent: 'profile' };
  if (hasUrbanRural && /(tempat lahir|alamat|wilayah|tempat tinggal|domisili|lokasi|daerah|desa|kota|place of birth|address)/.test(text)) {
    return { semanticType: 'residence_area', intent: 'profile' };
  }
  if (/(tanggal lahir|tgl lahir|date of birth|birth date)/.test(text)) return { semanticType: 'birth_date', intent: 'profile' };
  if (/(tempat lahir|kota lahir|lahir di|place of birth|birth place)/.test(text)) return { semanticType: 'birth_place', intent: 'profile' };
  if (/(status pernikahan|status perkawinan|marital)/.test(text)) return { semanticType: 'marital_status', intent: 'profile' };
  if (/(transportasi|kendaraan|commute|berangkat|pergi ke|menuju)/.test(text)) return { semanticType: 'transportation', intent: 'profile' };
  if (/(alamat lengkap|alamat rumah|\balamat\b|address)/.test(text)) return { semanticType: 'address', intent: 'profile' };
  if (/(kota|kabupaten|domisili|asal daerah|lokasi|tempat tinggal)/.test(text)) return { semanticType: 'city', intent: 'profile' };
  if (isChoice && !likert && !surveyScale && hasKnownEcommerceOptions(options) && /(platform|marketplace|e-?commerce|toko online|aplikasi belanja|belanja online)/.test(text)) {
    return { semanticType: 'ecommerce_platform', intent: 'profile' };
  }
  if (isChoice && !likert && !surveyScale && /(rekomendasi produk|ai recommendation|produk yang mungkin kamu suka|rekomendasi untukmu|sering dibeli bersama)/.test(text) &&
    /(pernah|melihat|mengklik|berinteraksi|memperhatikan|menggunakan)/.test(text)) {
    return { semanticType: 'ai_recommendation_experience', intent: 'gate' };
  }
  if (isChoice && !likert && !surveyScale && /(frekuensi|seberapa sering|berapa sering).*(belanja|e-?commerce|platform|rekomendasi produk)/.test(text)) {
    return { semanticType: 'shopping_frequency', intent: 'profile' };
  }
  if (isChoice && !likert && !surveyScale && /(kategori produk|jenis produk|produk apa|barang apa).*(beli|dibeli|belanja)|(beli|dibeli|belanja).*(kategori produk|jenis produk|produk apa|barang apa)/.test(text)) {
    return { semanticType: 'shopping_category', intent: 'profile' };
  }
  if (/(agama|religion)/.test(text)) return { semanticType: 'religion', intent: 'profile' };
  if (/(pendidikan|education)/.test(text)) return { semanticType: 'education', intent: 'profile' };
  if (/(pekerjaan|profesi|occupation|job)/.test(text)) return { semanticType: 'occupation', intent: 'profile' };
  if (/(tingkat semester|status akademik|semester saat ini|semester anda|semester \*)/.test(text)) return { semanticType: 'academic_semester', intent: 'profile' };
  if (/(topik|mata kuliah|matakuliah|course|subject)/.test(text)) return { semanticType: 'course_topic', intent: 'profile' };
  if (/(program studi|prodi|jurusan|department|major)/.test(text)) {
    if (/(rekomendasi|pilihan|minat|saran).*(program studi|prodi|jurusan)|(program studi|prodi|jurusan).*(rekomendasi|pilihan|minat|saran)/.test(text)) {
      return { semanticType: 'recommendation_program', intent: 'recommendation' };
    }
    return { semanticType: 'study_program', intent: 'profile' };
  }
  if (/(angkatan|tahun angkatan|tahun masuk|batch|cohort)/.test(text)) return { semanticType: 'cohort', intent: 'profile' };
  if (hasYesNo && /(bersedia|setuju|menyetujui|persetujuan|izin|mengizinkan|konfirmasi|siap|mau|ingin|tertarik|berminat|lanjut|follow up)/.test(text)) {
    return { semanticType: 'consent_yes', intent: 'gate' };
  }
  if (hasYesNo && /(kendala|masalah|kesulitan|error|bug|bingung|keluhan|hambatan|gagal|takut|khawatir|komplain)/.test(text)) {
    return { semanticType: 'yes_no_negative', intent: 'gate' };
  }
  if (hasYesNo && /(pernah|sudah|menggunakan|mengakses|memakai|mencoba|mengunjungi|familiar|experience|used|visited)/.test(text)) {
    return { semanticType: 'yes_no_gate', intent: 'gate' };
  }
  if (hasYesNo) return { semanticType: isNegativeStatement(text) ? 'yes_no_negative' : 'yes_no_positive', intent: 'gate' };
  if (isChoice && !/(lama usaha|berapa lama|sudah berjalan|tahun berjalan|durasi usaha)/.test(text) &&
    /(jenis usaha|tipe usaha|usaha kelolaan|bidang usaha|kategori usaha|sektor usaha|bentuk usaha)/.test(text)) {
    return { semanticType: 'business_type', intent: 'profile' };
  }
  if (isChoice && /(masalah utama|kendala utama|kendala|masalah|kesulitan|hambatan|tantangan|keluhan|pain point|kekhawatiran|khawatir|ragu|takut)/.test(text)) {
    return { semanticType: 'problem_choice', intent: 'feedback' };
  }
  if (isChoice && (/(berapa\s+(?:harga|biaya|tarif)|(?:harga|biaya|tarif).*(?:mahal|murah|terjangkau|worth|pas)|dijual|berbayar|\bmahal\b|\bmurah\b|\bterjangkau\b|\bworth\b|\bpas\b)/.test(text) ||
    options.some(option => /\b(mahal|murah|terjangkau|worth|pas)\b/i.test(option)))) {
    return { semanticType: 'price_opinion', intent: 'rating' };
  }
  if (likert) {
    const negative = isNegativeStatement(text);
    return { semanticType: negative ? 'likert_negative' : 'likert_positive', intent: 'likert' };
  }
  if (surveyScale) {
    if (/(frekuensi|seberapa sering|berapa sering|intensitas|frequency|often)/.test(text)) {
      return { semanticType: isNegativeStatement(text) ? 'frequency_negative' : 'frequency_positive', intent: 'rating' };
    }
    if (/(penting|prioritas|important|priority)/.test(text)) {
      return { semanticType: 'importance_high', intent: 'rating' };
    }
    return { semanticType: isNegativeStatement(text) ? 'rating_negative' : 'rating_positive', intent: 'rating' };
  }
  if (/(kritik|saran|kendala|masukan|komentar|pendapat|ulasan|feedback|alasan|harapan)/.test(text)) {
    return { semanticType: 'feedback', intent: 'feedback' };
  }
  if (isChoice && /(rekomendasi|pilih|pilihan|minat|preferensi|opsi)/.test(text)) {
    return { semanticType: q.type === 'checkbox' ? 'multi_choice_recommendation' : 'choice_recommendation', intent: 'recommendation' };
  }
  if (/(instansi|perusahaan|sekolah|kampus)/.test(text)) {
    return { semanticType: 'profile_other', intent: 'profile' };
  }

  return { semanticType: q.type || 'question', intent: 'question' };
}

function hasOptionLike(options, pattern) {
  return options.some(option => pattern.test(String(option || '').trim()));
}

function hasIndonesiaDomicileOptions(options) {
  const normalized = (options || []).map(option => normalizeChoiceText(option));
  const hasIndonesia = normalized.some(option =>
    option === 'indonesia' ||
    option === 'di indonesia' ||
    option === 'dalam indonesia' ||
    option === 'berdomisili di indonesia'
  );
  const hasOutside = normalized.some(option => /(di luar indonesia|luar indonesia|outside indonesia|outside of indonesia)/.test(option));
  return hasIndonesia && hasOutside;
}

function hasKnownEcommerceOptions(options) {
  const normalized = (options || []).map(option => normalizeChoiceText(option));
  return ECOMMERCE_PLATFORMS.some(platform => {
    const wanted = normalizeChoiceText(platform);
    return normalized.some(option => option === wanted || option.includes(wanted));
  });
}

function isLikertScale(options) {
  if (!options.length) return false;
  const normalized = options.map(option => String(option || '').trim().toLowerCase());
  const has1 = normalized.includes('1');
  const has5 = normalized.includes('5');
  const hasAgreement = normalized.some(isAgreementScaleOptionLabel);
  return (has1 && has5) || hasAgreement;
}

function isSurveyScaleOptions(options) {
  if (!options.length) return false;
  const labels = options
    .map(option => String(option || '').trim().toLowerCase())
    .filter(Boolean);
  if (labels.length < 3) return false;

  const matched = labels.filter(isSurveyScaleOptionLabel);
  return matched.length >= Math.min(3, labels.length);
}

function isAgreementScaleOptionLabel(option) {
  const text = normalizeScaleLabel(option);
  return /^(sangat tidak setuju|tidak setuju|netral|setuju|sangat setuju|strongly disagree|disagree|neutral|agree|strongly agree|sts|ts|n|s|ss)$/.test(text);
}

function isSurveyScaleOptionLabel(option) {
  const text = normalizeScaleLabel(option);
  if (!text || text.length > 28 || text.split(/\s+/).length > 4) return false;
  return (
    /^(tidak pernah|sangat jarang|jarang|kadang|kadang kadang|sering|sangat sering|selalu)$/.test(text) ||
    /^(sangat buruk|buruk|cukup|cukup baik|baik|sangat baik)$/.test(text) ||
    /^(sangat rendah|rendah|sedang|tinggi|sangat tinggi)$/.test(text) ||
    /^(sangat lambat|lambat|sedang|cepat|sangat cepat)$/.test(text) ||
    /^(sangat sulit|sulit|cukup mudah|mudah|sangat mudah)$/.test(text) ||
    /^(sangat tidak puas|tidak puas|cukup puas|puas|sangat puas)$/.test(text)
  );
}

function normalizeScaleLabel(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[()]/g, ' ')
    .replace(/[-_/]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isNegativeStatement(text) {
  if (/tidak takut salah|tidak khawatir|percaya diri/.test(text)) return false;
  return /(rumit|sulit|membingungkan|tidak praktis|ribet|kendala|masalah|error|takut salah|butuh bantuan|bantuan orang lain|belajar dulu|membiasakan diri|tidak konsisten|lambat|kurang jelas|tidak nyaman|tidak puas|risiko|rawan|tidak aman)/.test(text);
}

function getRespondentProfile(runConfig) {
  if (runConfig?.__respondentProfile) return runConfig.__respondentProfile;

  const profile = createUniqueRespondentProfile(runConfig);
  if (runConfig && typeof runConfig === 'object') {
    Object.defineProperty(runConfig, '__respondentProfile', {
      value: profile,
      enumerable: false,
      writable: true,
      configurable: true
    });
  }
  return profile;
}

function createUniqueRespondentProfile(runConfig = {}) {
  let fallback = null;

  for (let guard = 0; guard < 160; guard++) {
    const profile = createRespondentProfile();
    fallback = fallback || profile;
    if (!isRespondentProfileUsed(profile)) {
      rememberRespondentProfile(profile, runConfig);
      return profile;
    }
  }

  const profile = ensureUniqueContactFields(fallback || createRespondentProfile());
  rememberRespondentProfile(profile, runConfig);
  return profile;
}

function ensureUniqueContactFields(profile) {
  const next = { ...profile };
  for (let guard = 0; guard < 80 && isIdentityTokenUsed('name', identityValue(next.name)); guard++) {
    next.name = pickIndonesianFullName(next.gender);
    next.email = generateRealisticEmail(next.name);
  }
  for (let guard = 0; guard < 80 && isIdentityTokenUsed('email', identityValue(next.email)); guard++) {
    next.email = generateRealisticEmail(next.name);
  }
  for (let guard = 0; guard < 80 && isIdentityTokenUsed('phone', identityValue(next.phone)); guard++) {
    next.phone = generateRealisticPhone();
  }
  return next;
}

function isRespondentProfileUsed(profile) {
  return profileIdentityTokens(profile).some(token => isIdentityTokenUsedToken(token));
}

function isIdentityTokenUsed(type, value) {
  return isIdentityTokenUsedToken(identityToken(type, value));
}

function isIdentityTokenUsedToken(token) {
  return !!token && runIdentityTokens.has(token);
}

function rememberRespondentProfile(profile, runConfig = {}) {
  for (const token of profileIdentityTokens(profile)) runIdentityTokens.add(token);

  if (!shouldPersistGeneratedData(runConfig)) return;

  const entry = {
    createdAt: new Date().toISOString(),
    formId: runConfig.currentJob?.itemId || '',
    url: runConfig.currentJob?.url || '',
    attempt: runConfig.currentJob?.attempt || 0,
    name: profile.name,
    email: profile.email,
    phone: profile.phone
  };

  const existing = new Set((respondentHistory.profiles || []).flatMap(item => profileIdentityTokens(item)));
  if (profileIdentityTokens(entry).some(token => existing.has(token))) return;

  respondentHistory.profiles = [entry, ...(respondentHistory.profiles || [])].slice(0, 5000);
  saveRespondentHistory();
}

function profileIdentityTokens(profile) {
  return [
    identityToken('name', identityValue(profile?.name)),
    identityToken('email', identityValue(profile?.email)),
    identityToken('phone', identityValue(profile?.phone))
  ].filter(Boolean);
}

function identityToken(type, value) {
  const clean = identityValue(value);
  return clean ? `${type}:${clean}` : '';
}

function identityValue(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '')
    .trim();
}

function shouldPersistGeneratedData(runConfig = {}) {
  return runConfig.__recordRespondent !== false && !runConfig.dryRun;
}

function loadRespondentHistory() {
  try {
    const parsed = JSON.parse(fs.readFileSync(RESPONDENT_HISTORY_FILE, 'utf8'));
    return {
      version: 1,
      profiles: Array.isArray(parsed.profiles) ? parsed.profiles.slice(0, 5000) : [],
      feedback: Array.isArray(parsed.feedback) ? parsed.feedback.slice(0, 5000) : []
    };
  } catch (_) {
    return { version: 1, profiles: [], feedback: [] };
  }
}

function saveRespondentHistory() {
  try {
    ensureDir(REPORT_DIR);
    const safe = {
      version: 1,
      updatedAt: new Date().toISOString(),
      profiles: (respondentHistory.profiles || []).slice(0, 5000),
      feedback: (respondentHistory.feedback || []).slice(0, 5000)
    };
    fs.writeFileSync(RESPONDENT_HISTORY_FILE, JSON.stringify(safe, null, 2), 'utf8');
  } catch (err) {
    log(`Riwayat responden gagal disimpan: ${err.message}`, 'warn');
  }
}

function seedIdentityTokensFromHistory() {
  const tokens = new Set();
  for (const profile of respondentHistory?.profiles || []) {
    for (const token of profileIdentityTokens(profile)) tokens.add(token);
  }
  return tokens;
}

function seedFeedbackTokensFromHistory() {
  const tokens = new Set();
  for (const item of respondentHistory?.feedback || []) {
    const token = feedbackToken(item?.text || item);
    if (token) tokens.add(token);
  }
  return tokens;
}

function createRespondentProfile() {
  const gender = Math.random() < 0.5 ? 'male' : 'female';
  const age = randomInt(18, 39);
  const city = pick(INDONESIAN_CITIES);
  const birthPlace = pick(INDONESIAN_CITIES);
  const street = pick(INDONESIAN_STREET_NAMES);
  const residenceArea = Math.random() < 0.68 ? 'Perkotaan' : 'Perdesaan';
  const maritalStatus = age >= 28 && Math.random() < 0.45 ? 'Sudah Menikah' : 'Belum Menikah';
  const name = pickIndonesianFullName(gender);

  return {
    name,
    gender,
    genderLabel: gender === 'male' ? 'Laki - Laki' : 'Perempuan',
    age,
    nationality: 'Indonesia',
    birthPlace,
    birthDate: makeBirthDate(age),
    city,
    address: `Jl. ${street} No. ${randomInt(3, 98)}, ${city}`,
    residenceArea,
    maritalStatus,
    guardianName: pickIndonesianFullName(Math.random() < 0.5 ? 'male' : 'female'),
    transportation: pick(TRANSPORT_OPTIONS),
    religion: pick(RELIGION_OPTIONS),
    education: pick(['SMA/SMK', 'Diploma', 'Sarjana']),
    occupation: pick(['Mahasiswa', 'Karyawan Swasta', 'Wirausaha']),
    email: generateRealisticEmail(name),
    phone: generateRealisticPhone()
  };
}

function generateRealisticEmail(fullName) {
  const parts = String(fullName || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, '')
    .split(/\s+/)
    .filter(Boolean);
  if (parts.length < 2) parts.push('user');

  const domain = pick(EMAIL_DOMAINS);
  const separator = pick(['.', '_', '']);
  const style = randomInt(0, 5);

  switch (style) {
    case 0: return `${parts[0]}${separator}${parts[parts.length - 1]}@${domain}`;
    case 1: return `${parts[0]}${separator}${parts[parts.length - 1]}${randomInt(1, 99)}@${domain}`;
    case 2: return `${parts[0]}${parts[1]?.[0] || ''}${randomInt(10, 99)}@${domain}`;
    case 3: return `${parts[0][0]}${separator}${parts[parts.length - 1]}${randomInt(1, 999)}@${domain}`;
    case 4: return `${parts.join(separator)}@${domain}`;
    default: return `${parts[0]}${randomInt(100, 999)}@${domain}`;
  }
}

function generateRealisticPhone() {
  const prefix = pick(VALID_PHONE_PREFIXES);
  const remaining = 12 - prefix.length;
  let number = prefix;
  for (let i = 0; i < remaining; i++) {
    number += String(randomInt(0, 9));
  }
  return number;
}

function makeBirthDate(age) {
  const year = new Date().getFullYear() - age;
  const month = String(randomInt(1, 12)).padStart(2, '0');
  const day = String(randomInt(1, 28)).padStart(2, '0');
  return `${day}/${month}/${year}`;
}

async function answerQuestions(snapshot, runConfig) {
  const rules = contextualRulesForSnapshot(parseCustomRules(runConfig.customRulesText || DEFAULT_RULES), snapshot, runConfig);
  const respondent = getRespondentProfile(runConfig);
  const localFirst = buildSmartLocalAnswers(snapshot.questions, rules, respondent, runConfig);
  const finalAnswers = [...localFirst.answers];
  const answered = new Set(finalAnswers.map(item => item.index));
  const aiQuestions = (snapshot.questions || []).filter(q => !answered.has(q.index));

  if (localFirst.likertCount) {
    log(`Likert lokal: ${localFirst.likertCount} pertanyaan skala dijawab acak-terdistribusi tanpa AI.`, 'ok');
  }

  try {
    if (aiQuestions.length) {
      const aiSnapshot = { ...snapshot, questions: aiQuestions };
      const aiAnswers = await callAI(aiSnapshot, { ...runConfig, customRulesText: rulesToText(rules) }, respondent);
      finalAnswers.push(...enforceCustomRules(aiQuestions, aiAnswers, rules, respondent, runConfig));
    } else {
      log('Semua pertanyaan halaman ini aman dijawab lokal dari hasil mapper.', 'ok');
    }

    const answeredAfterAi = new Set(finalAnswers.map(item => item.index));
    const missing = snapshot.questions.filter(q => !answeredAfterAi.has(q.index));

    if (missing.length) {
      log(`AI melewatkan ${missing.length} pertanyaan, isi fallback.`, 'warn');
      finalAnswers.push(...fallbackAnswers(missing, rules, respondent, runConfig));
    }

    const diversified = diversifyLikertAnswers(snapshot.questions, finalAnswers, runConfig);
    if (diversified.adjustedCount) {
      log(`${diversified.adjustedCount} jawaban Likert dibuat lebih bervariasi.`, 'ok');
    }

    const normalized = normalizeAnswersForQuestions(snapshot.questions, diversified.answers, respondent);
    if (normalized.adjustedCount) {
      log(`${normalized.adjustedCount} jawaban disesuaikan dengan konteks/batas field.`, 'ok');
    }
    return normalized.answers;
  } catch (err) {
    log(`AI gagal: ${err.message}. Pertanyaan tersisa diisi fallback rules/random.`, 'warn');
    const answeredAfterLocal = new Set(finalAnswers.map(item => item.index));
    const missing = snapshot.questions.filter(q => !answeredAfterLocal.has(q.index));
    finalAnswers.push(...fallbackAnswers(missing, rules, respondent, runConfig));
    const diversified = diversifyLikertAnswers(snapshot.questions, finalAnswers, runConfig);
    if (diversified.adjustedCount) {
      log(`${diversified.adjustedCount} jawaban Likert fallback dibuat lebih bervariasi.`, 'ok');
    }
    const normalized = normalizeAnswersForQuestions(snapshot.questions, diversified.answers, respondent);
    if (normalized.adjustedCount) {
      log(`${normalized.adjustedCount} jawaban fallback disesuaikan dengan konteks/batas field.`, 'ok');
    }
    return normalized.answers;
  }
}

function buildSmartLocalAnswers(questions, rules, respondent, runConfig = {}) {
  const localQuestions = [];
  let likertCount = 0;

  for (const q of questions || []) {
    if (isLikertQuestion(q)) {
      likertCount++;
      localQuestions.push(q);
      continue;
    }

    const localChoice = isChoiceQuestion(q) && (q.options || []).length > 0;
    if (isHighConfidenceLocalQuestion(q) || findMatchingRule(q, rules || []) || localChoice) {
      localQuestions.push(q);
    }
  }

  if (!localQuestions.length) return { answers: [], likertCount };

  const fallback = fallbackAnswers(localQuestions, rules, respondent, runConfig);
  const diversified = diversifyLikertAnswers(localQuestions, fallback, runConfig);
  const normalized = normalizeAnswersForQuestions(localQuestions, diversified.answers, respondent);
  return { answers: normalized.answers, likertCount };
}

function buildFastLocalAnswers(questions, rules, respondent, runConfig = {}) {
  const list = questions || [];
  const likertCount = list.filter(isLikertQuestion).length;
  if (!likertCount || !isFastLikertPage(list, rules)) {
    return { enabled: false, answers: [], likertCount };
  }

  const riskyText = list.filter(q => isTextQuestion(q) && !canAnswerQuestionLocally(q, rules));
  if (riskyText.length) {
    return { enabled: false, answers: [], likertCount };
  }

  const fallback = fallbackAnswers(list, rules, respondent, runConfig);
  const diversified = diversifyLikertAnswers(list, fallback, runConfig);
  const normalized = normalizeAnswersForQuestions(list, diversified.answers, respondent);
  return { enabled: true, answers: normalized.answers, likertCount };
}

function isFastLikertPage(questions, rules = parseCustomRules(DEFAULT_RULES)) {
  const list = questions || [];
  if (!list.length) return false;

  const likertCount = list.filter(isLikertQuestion).length;
  if (!likertCount) return false;
  if (likertCount === list.length) return true;

  const localCount = list.filter(q => isLikertQuestion(q) || canAnswerQuestionLocally(q, rules)).length;
  const likertHeavy = likertCount >= 3 || likertCount >= Math.ceil(list.length * 0.6);
  return likertHeavy && localCount === list.length;
}

function isLikertQuestion(q) {
  const mapped = q?.semanticType ? q : { ...(q || {}), ...classifyQuestion(q || {}) };
  return mapped.intent === 'likert' ||
    mapped.intent === 'rating' ||
    String(mapped.semanticType || '').startsWith('likert') ||
    String(mapped.semanticType || '').startsWith('rating') ||
    String(mapped.semanticType || '').startsWith('frequency') ||
    mapped.semanticType === 'importance_high' ||
    isLikertScale(mapped.options || []) ||
    isSurveyScaleOptions(mapped.options || []);
}

function canAnswerQuestionLocally(q, rules) {
  if (!q) return false;
  if (isLikertQuestion(q)) return true;
  if (findMatchingRule(q, rules || [])) return true;

  const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
  if ([
    'name', 'gender', 'age', 'email', 'phone', 'city', 'birth_place',
    'birth_date', 'nationality', 'domicile_country', 'address', 'residence_area',
    'marital_status', 'guardian', 'transportation', 'religion',
    'education', 'occupation', 'cohort', 'academic_semester',
    'course_topic', 'ecommerce_platform', 'ai_recommendation_experience',
    'shopping_frequency', 'shopping_category', 'study_program',
    'recommendation_program', 'multi_choice_recommendation',
    'business_type', 'problem_choice', 'price_opinion',
    'yes_no_gate', 'yes_no_positive', 'yes_no_negative', 'consent_yes',
    'frequency_positive', 'frequency_negative', 'rating_positive', 'rating_negative',
    'importance_high', 'feedback'
  ].includes(mapped.semanticType)) {
    return true;
  }

  if (mapped.type === 'checkbox' || mapped.type === 'dropdown') return (mapped.options || []).length > 0;
  if (mapped.type === 'radio') return (mapped.options || []).length > 0 && !isTextQuestion(mapped);

  return false;
}

async function callAI(snapshot, runConfig, respondent) {
  const url = resolveEndpoint(runConfig);
  const headers = { 'Content-Type': 'application/json' };
  const token = runConfig.apiKey || '';
  if (token) headers.Authorization = `Bearer ${token}`;

  if (runConfig.provider === 'openai' && !token) {
    throw new Error('OpenAI API key kosong.');
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), Number(runConfig.aiTimeoutMs || 30000));

  try {
    const messages = buildPrompt(snapshot, runConfig.customRulesText || DEFAULT_RULES, respondent);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: runConfig.model || (runConfig.provider === 'openclaw' ? 'openai-codex/gpt-5.4' : 'chat-latest'),
        input: buildRequestInput(messages, runConfig),
        temperature: 0.85,
        max_output_tokens: 2048
      })
    });

    const rawText = await response.text();
    if (!response.ok) throw new Error(`AI backend error ${response.status}: ${rawText.slice(0, 300)}`);

    let data;
    try { data = JSON.parse(rawText); } catch (_) { data = rawText; }
    const text = extractAIText(data);
    const json = parseJsonArray(text);
    log(`AI memberi ${json.length} jawaban.`, 'ok');
    return json;
  } catch (err) {
    if (err.name === 'AbortError') throw new Error(`Timeout AI setelah ${Math.round(Number(runConfig.aiTimeoutMs || 30000) / 1000)} detik`);
    throw err;
  } finally {
    clearTimeout(timeout);
  }
}

async function testAIConnection(runConfig) {
  const endpoint = resolveEndpoint(runConfig);
  const headers = { 'Content-Type': 'application/json' };
  const token = runConfig.apiKey || '';
  if (token) headers.Authorization = `Bearer ${token}`;

  if (runConfig.provider === 'openai' && !token) {
    return { ok: false, error: 'OpenAI API key kosong. Untuk Codex OAuth, pilih OpenClaw Gateway.' };
  }

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 12000);

  try {
    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      signal: controller.signal,
      body: JSON.stringify({
        model: runConfig.model || (runConfig.provider === 'openclaw' ? 'openai-codex/gpt-5.4' : 'chat-latest'),
        input: [
          {
            type: runConfig.provider === 'openclaw' ? 'message' : undefined,
            role: 'user',
            content: [
              {
                type: 'input_text',
                text: 'Balas singkat dengan JSON valid: [{"index":0,"answer":"AI connected"}]'
              }
            ]
          }
        ],
        temperature: 0,
        max_output_tokens: 80
      })
    });

    const rawText = await response.text();
    if (!response.ok) {
      return { ok: false, error: `AI backend error ${response.status}: ${rawText.slice(0, 220)}` };
    }

    let data;
    try { data = JSON.parse(rawText); } catch (_) { data = rawText; }
    return { ok: true, endpoint, message: extractAIText(data).slice(0, 160) || 'AI connected' };
  } catch (err) {
    if (err.name === 'AbortError') {
      return { ok: false, error: `Timeout konek ke ${endpoint}. Pastikan OpenClaw Gateway sudah jalan.` };
    }
    return { ok: false, error: `${err.message}. Pastikan OpenClaw Gateway sudah jalan di ${endpoint}.` };
  } finally {
    clearTimeout(timeout);
  }
}

function buildPrompt(snapshot, rulesText, respondent) {
  const variationSeed = randomInt(1, 999);
  const systemPrompt = `Kamu adalah sistem pengisi Google Forms untuk kebutuhan testing/QA.
PRINSIP UTAMA: Setiap responden UNIK. Jawaban harus natural, realistis, dan BERBEDA dari responden lain.
Untuk pilihan ganda/dropdown/checkbox, jawaban harus PERSIS sesuai pilihan yang tersedia.
Patuhi ATURAN AI PRO. Jika judul/deskripsi pertanyaan cocok dengan kata kunci aturan, pilih jawaban HANYA dari daftar aturan.
Jika ada pertanyaan gerbang seperti "pernah menggunakan/mengakses/memakai X" dengan opsi Ya/Tidak, pilih jawaban berpengalaman seperti Ya agar kuesioner utama bisa dianalisis.
Jika pertanyaan gerbang menanyakan domisili negara dan opsinya Indonesia/Di luar Indonesia, pilih Indonesia.
Untuk skala Likert, variasikan jawaban: kalimat positif gunakan campuran Setuju/Sangat Setuju atau 4/5, jangan semuanya Sangat Setuju; kalimat negatif gunakan campuran Tidak Setuju/Sangat Tidak Setuju atau 1/2.
Untuk biodata, jangan menukar jawaban antar field: usia harus angka umur/rentang umur, kewarganegaraan Indonesia/WNI, wali harus sesuai opsi wali/nama wali, dan transportasi jenis kendaraan/angkutan.
Jika field seperti tempat lahir atau alamat hanya menyediakan pilihan Perkotaan/Perdesaan, pilih salah satu opsi itu persis; jangan memaksa nama kota atau alamat teks.
Sebelum menjawab isian teks, analisa judul, deskripsi, placeholder, dan batas karakter pertanyaan.
Jika ada batas karakter, jawaban teks wajib utuh, natural, dan tidak melebihi batas tersebut. Jangan mengirim kalimat yang terpotong.
Untuk short_text tanpa batas eksplisit, tetap jawab ringkas maksimal 50 karakter.
Untuk data profil seperti nama, email, nomor HP, prodi, angkatan, atau domisili, gunakan format yang sesuai dengan pertanyaannya.
Untuk nama orang Indonesia, gunakan 2-3 kata dan jangan satu kata.
Untuk rekomendasi program studi atau pilihan checkbox sejenis, pilih maksimal 5 opsi yang paling relevan.

ATURAN VARIASI JAWABAN TEKS (PENTING):
- Untuk pertanyaan saran/masukan/komentar/pendapat, WAJIB buat kalimat yang UNIK dan BERBEDA setiap kali. Jangan pakai template yang sama.
- Gunakan gaya bahasa yang natural seperti mahasiswa Indonesia sungguhan.
- Variasikan panjang jawaban: kadang singkat (1 kalimat), kadang sedang (2 kalimat).
- Jangan hanya bilang "sudah baik" — sebutkan aspek SPESIFIK yang disukai atau perlu diperbaiki.
- Contoh variasi: bahas tampilan, kecepatan, kemudahan navigasi, kelengkapan informasi, fitur yang kurang, pengalaman pribadi, dll.
- Seed variasi: ${variationSeed} — gunakan ini sebagai inspirasi sudut pandang unik.

Output harus JSON array valid tanpa markdown.
Format: [{"index": 0, "answer": "jawaban"}].
Untuk checkbox, answer boleh array.`;

  let userPrompt = `Konteks halaman/form:\n${snapshot.text || '(tidak ada konteks)'}\n\n`;
  userPrompt += `ATURAN AI PRO:\n${rulesText || '(tidak ada aturan khusus)'}\n\n`;
  if (respondent) {
    userPrompt += `Profil responden konsisten untuk halaman ini:\n`;
    userPrompt += `Nama: ${respondent.name}\n`;
    userPrompt += `Jenis kelamin: ${respondent.genderLabel}\n`;
    userPrompt += `Usia: ${respondent.age}\n`;
    userPrompt += `Kewarganegaraan: ${respondent.nationality}\n`;
    userPrompt += `Domisili negara: Indonesia\n`;
    userPrompt += `Tempat lahir: ${respondent.birthPlace}\n`;
    userPrompt += `Domisili: ${respondent.city}\n`;
    userPrompt += `Alamat: ${respondent.address}\n`;
    userPrompt += `Wali: ${respondent.guardianName}\n`;
    userPrompt += `Transportasi: ${respondent.transportation}\n`;
    userPrompt += `Email: ${respondent.email}\n`;
    userPrompt += `No HP: ${respondent.phone}\n\n`;
  }
  userPrompt += 'Pertanyaan:\n';
  snapshot.questions.forEach(q => {
    userPrompt += `[Q${q.index}] ${q.title}\n`;
    if (q.description) userPrompt += `Deskripsi: ${q.description}\n`;
    userPrompt += `Tipe: ${q.type}\n`;
    if (q.semanticType) userPrompt += `Mapper: ${q.semanticType} / ${q.intent || 'question'}\n`;
    if (q.placeholder) userPrompt += `Placeholder: ${q.placeholder}\n`;
    if (q.maxLength) userPrompt += `Batas karakter: maksimum ${q.maxLength} karakter\n`;
    if (q.constraintText) userPrompt += `Petunjuk validasi: ${q.constraintText}\n`;
    if (q.options?.length) userPrompt += `Pilihan: ${q.options.join(' | ')}\n`;
    userPrompt += '\n';
  });

  return [
    { role: 'developer', content: [{ type: 'input_text', text: systemPrompt }] },
    { role: 'user', content: [{ type: 'input_text', text: userPrompt }] }
  ];
}

function buildRequestInput(messages, runConfig) {
  if (runConfig.provider !== 'openclaw') return messages;
  return messages.map(item => ({
    type: 'message',
    role: item.role,
    content: item.content
  }));
}

function resolveEndpoint(runConfig) {
  const raw = runConfig.baseUrl || (runConfig.provider === 'openclaw'
    ? 'http://localhost:18789/v1/responses'
    : 'https://api.openai.com/v1/responses');
  const clean = raw.replace(/\/$/, '');

  if (clean.endsWith('/responses')) return clean;
  if (runConfig.provider === 'openclaw') return `${clean}/v1/responses`;
  return `${clean}/responses`;
}

function extractAIText(data) {
  if (typeof data === 'string') return data;
  if (data.output_text) return data.output_text;
  if (data.text) return data.text;
  if (data.content) return data.content;

  const chunks = [];
  for (const item of data.output || []) {
    for (const content of item.content || []) {
      if (content.text) chunks.push(content.text);
    }
  }
  return chunks.join('\n').trim();
}

function parseJsonArray(text) {
  let jsonText = String(text || '').trim();
  const codeBlock = jsonText.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlock) jsonText = codeBlock[1].trim();
  const arrMatch = jsonText.match(/\[[\s\S]*\]/);
  if (arrMatch) jsonText = arrMatch[0];
  const parsed = JSON.parse(jsonText);
  return Array.isArray(parsed) ? parsed : [];
}

async function waitForForm(page) {
  for (let i = 0; i < 30; i++) {
    const ready = await page.evaluate(() => {
      return !!(
        document.querySelector('div[role="listitem"]') ||
        document.querySelector('form') ||
        document.querySelector('.freebirdFormviewerViewResponseConfirmationMessage') ||
        Array.from(document.querySelectorAll('a')).some(a => /jawaban lain|another response/i.test(a.textContent || ''))
      );
    });
    if (ready) return;
    await page.waitForTimeout(500);
  }
}

function isGoogleLoginUrl(rawUrl) {
  try {
    const url = new URL(rawUrl);
    return url.hostname.toLowerCase() === 'accounts.google.com';
  } catch (_) {
    return false;
  }
}

async function handleGoogleFormsLoginPrompt(page) {
  const result = await page.evaluate(() => {
    const loginText = /(login ke google|masuk ke google|sign in|login|simpan progres|save progress|save your progress)/i;
    const saveProgressDialogText = /(simpan otomatis jawaban|save your progress|automatically save)/i;
    const saveProgressAnyText = /(simpan otomatis jawaban|save your progress|automatically save|menyimpan progres|simpan progres|save progress)/i;
    const dismissText = /(oke|ok|mengerti|got it|tutup|close|lanjutkan|continue|jangan sekarang|nanti|not now|skip)/i;
    const navigationText = /(berikutnya|next|lanjut\b|selanjutnya|kirim|submit|kirim jawaban|kembali|back)/i;

    function isVisible(el) {
      const rect = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function clickEl(el) {
      el.scrollIntoView({ block: 'center' });
      el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
      el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      el.click();
    }

    for (const link of document.querySelectorAll('a[href]')) {
      const href = link.getAttribute('href') || '';
      const text = link.textContent || '';
      if (href.includes('accounts.google.com') || loginText.test(text)) {
        link.dataset.formsGptIgnoredLogin = 'true';
        link.setAttribute('aria-disabled', 'true');
        link.removeAttribute('href');
        link.style.pointerEvents = 'none';
      }
    }

    function hasFormQuestion(el) {
      return !!el.querySelector('div[role="listitem"], div.freebirdFormviewerViewNumberedItemContainer');
    }

    function hasPromptButton(el) {
      return Array.from(el.querySelectorAll('div[role="button"], button, [role="button"]'))
        .some(button => {
          if (!isVisible(button)) return false;
          const label = `${button.textContent || ''} ${button.getAttribute('aria-label') || ''}`.trim();
          return label && !/(login|masuk|sign in)/i.test(label) && !navigationText.test(label);
        });
    }

    const dialogs = Array.from(document.querySelectorAll('[role="dialog"], [aria-modal="true"]'))
      .filter(el => isVisible(el) && saveProgressAnyText.test(el.innerText || el.textContent || '') && !hasFormQuestion(el));

    const titleMatches = Array.from(document.querySelectorAll('h1, h2, h3, div, span'))
      .filter(el => {
        if (!isVisible(el)) return false;
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        return text.length <= 120 && saveProgressDialogText.test(text);
      });

    const fallbackPanels = [];
    for (const title of titleMatches) {
      let candidate = title;
      for (let i = 0; i < 8 && candidate && candidate !== document.body; i++) {
        const text = candidate.innerText || candidate.textContent || '';
        if (saveProgressDialogText.test(text) && !hasFormQuestion(candidate) && hasPromptButton(candidate)) {
          fallbackPanels.push(candidate);
          break;
        }
        candidate = candidate.parentElement;
      }
    }

    fallbackPanels.sort((a, b) => {
      const ar = a.getBoundingClientRect();
      const br = b.getBoundingClientRect();
      return (ar.width * ar.height) - (br.width * br.height);
    });

    const saveDialog = dialogs[0] || fallbackPanels[0] || null;
    if (!saveDialog) return 'none';

    const buttons = Array.from(saveDialog.querySelectorAll('div[role="button"], button, [role="button"]'))
      .filter(isVisible)
      .filter(el => {
        const label = `${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`;
        return !/(login|masuk|sign in)/i.test(label) && !navigationText.test(label);
      });

    const preferred = buttons.find(el => dismissText.test(`${el.textContent || ''} ${el.getAttribute('aria-label') || ''}`));
    const target = preferred || (buttons.length === 1 ? buttons[0] : null);
    if (target) {
      clickEl(target);
      return 'dismissed-save-progress';
    }

    return 'save-progress-found';
  }).catch(() => {});

  if (result === 'save-progress-found') {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(300);
    return 'dismissed-save-progress';
  }

  return result || 'none';
}

async function readFormSnapshot(page) {
  return page.evaluate(() => {
    const body = document.querySelector('div.freebirdFormviewerViewItemList') || document.querySelector('form') || document.body;
    const text = (body?.innerText || '').replace(/\s+/g, ' ').slice(0, 2500);
    const formTitle = (document.querySelector('h1')?.textContent || document.querySelector('[role="heading"]')?.textContent || document.title || '')
      .replace(/\s+/g, ' ')
      .trim();
    const hasConfirmation =
      !!document.querySelector('.freebirdFormviewerViewResponseConfirmationMessage') ||
      Array.from(document.querySelectorAll('a')).some(a => /jawaban lain|another response|isi jawaban lain/i.test(a.textContent || ''));

    const questions = [];
    const blocks = document.querySelectorAll('div[role="listitem"], div.freebirdFormviewerViewNumberedItemContainer');

    function getTextMeta(control, block) {
      const constraintText = extractConstraintText(block);
      return {
        maxLength: readMaxLength(control, block, constraintText),
        placeholder: (control.getAttribute('placeholder') || control.getAttribute('aria-label') || '').replace(/\s+/g, ' ').trim(),
        constraintText
      };
    }

    function readMaxLength(control, block, constraintText) {
      const attr = parsePositiveInt(control.getAttribute('maxlength'));
      if (attr) return attr;

      const prop = parsePositiveInt(control.maxLength);
      if (prop) return prop;

      return parseTextLimit(constraintText || (block.innerText || block.textContent || ''));
    }

    function parsePositiveInt(value) {
      const number = Number(value);
      return Number.isFinite(number) && number > 0 ? Math.floor(number) : 0;
    }

    function extractConstraintText(block) {
      const source = (block.innerText || block.textContent || '').replace(/\s+/g, ' ').trim();
      const patterns = [
        /maks(?:imal|imum)?\.?\s*(?:panjang\s*)?(?:jawaban\s*)?(?:adalah\s*)?(\d{1,4})\s*(?:karakter|huruf|characters|chars)/i,
        /(?:max|maximum)\.?\s*(\d{1,4})\s*(?:karakter|huruf|characters|chars)/i,
        /(?:paling banyak|tidak lebih dari|no more than|at most)\s*(\d{1,4})\s*(?:karakter|huruf|characters|chars)/i,
        /(?:limit|batas)\s*(?:maksimal\s*)?(\d{1,4})\s*(?:karakter|huruf|characters|chars)/i,
        /(\d{1,4})\s*(?:karakter|huruf|characters|chars)\s*(?:maks(?:imal)?|maximum|max|atau kurang|or less)/i
      ];

      for (const pattern of patterns) {
        const match = source.match(pattern);
        if (match) return match[0].slice(0, 160);
      }
      return '';
    }

    function parseTextLimit(text) {
      const source = String(text || '');
      const values = [];
      const patterns = [
        /maks(?:imal|imum)?\.?\s*(?:panjang\s*)?(?:jawaban\s*)?(?:adalah\s*)?(\d{1,4})\s*(?:karakter|huruf|characters|chars)/ig,
        /(?:max|maximum)\.?\s*(\d{1,4})\s*(?:karakter|huruf|characters|chars)/ig,
        /(?:paling banyak|tidak lebih dari|no more than|at most)\s*(\d{1,4})\s*(?:karakter|huruf|characters|chars)/ig,
        /(?:limit|batas)\s*(?:maksimal\s*)?(\d{1,4})\s*(?:karakter|huruf|characters|chars)/ig,
        /(\d{1,4})\s*(?:karakter|huruf|characters|chars)\s*(?:maks(?:imal)?|maximum|max|atau kurang|or less)/ig
      ];

      for (const pattern of patterns) {
        for (const match of source.matchAll(pattern)) {
          const value = parsePositiveInt(match[1]);
          if (value) values.push(value);
        }
      }

      return values.length ? Math.min(...values) : 0;
    }

    function pushQuestion(question) {
      questions.push({
        index: questions.length,
        blockIndex: question.blockIndex,
        ...question
      });
    }

    function cleanVisibleText(value) {
      return String(value || '').replace(/\s+/g, ' ').trim();
    }

    function extractChoiceMeta(block) {
      const source = cleanVisibleText(block.innerText || block.textContent || '');
      const maxPatterns = [
        /pilih\s+(?:maksimal|paling banyak|hingga|sampai)\s+(\d{1,2})/i,
        /(?:maksimal|maximum|max|at most|up to|no more than)\s+(\d{1,2})\s*(?:pilihan|opsi|options|jawaban)?/i,
        /(?:choose|select)\s+(?:up to|at most|no more than)\s+(\d{1,2})/i,
        /(\d{1,2})\s*(?:pilihan|opsi|options)\s*(?:maksimal|maximum|max)/i
      ];
      const minPatterns = [
        /pilih\s+(?:minimal|setidaknya|sekurang-kurangnya)\s+(\d{1,2})/i,
        /(?:minimal|minimum|min|at least)\s+(\d{1,2})\s*(?:pilihan|opsi|options|jawaban)?/i,
        /(?:choose|select)\s+(?:at least)\s+(\d{1,2})/i
      ];

      const findNumber = patterns => {
        for (const pattern of patterns) {
          const match = source.match(pattern);
          if (match) {
            const value = parsePositiveInt(match[1]);
            if (value) return value;
          }
        }
        return 0;
      };

      return {
        choiceMin: findNumber(minPatterns),
        choiceMax: findNumber(maxPatterns),
        constraintText: extractConstraintText(block)
      };
    }

    function rowLabelForGroup(group, fallback) {
      const direct = cleanVisibleText(group.getAttribute('aria-label'));
      if (direct && direct.length <= 120) return direct;

      const labelledBy = cleanVisibleText(group.getAttribute('aria-labelledby'));
      if (labelledBy) {
        const label = labelledBy
          .split(/\s+/)
          .map(id => document.getElementById(id)?.textContent || '')
          .map(cleanVisibleText)
          .filter(Boolean)
          .join(' ');
        if (label && label.length <= 120) return label;
      }

      const row = group.closest('[role="row"], .freebirdFormviewerComponentsQuestionGridRow, .appsMaterialWizToggleRadiogroupElContainer');
      const rowHeader = row?.querySelector('[role="rowheader"], [data-row-label], .freebirdFormviewerComponentsQuestionGridRowHeader');
      const rowText = cleanVisibleText(rowHeader?.textContent || '');
      if (rowText && rowText.length <= 120) return rowText;

      return fallback;
    }

    blocks.forEach((block, index) => {
      const titleEl = block.querySelector('[role="heading"]') || block.querySelector('.M7eMe') || block.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle');
      const title = titleEl ? titleEl.textContent.trim() : '';
      if (!title) return;

      const descEl = block.querySelector('.freebirdFormviewerComponentsQuestionBaseDescription');
      const description = descEl ? descEl.textContent.trim() : '';

      const radioGroups = Array.from(block.querySelectorAll('div[role="radiogroup"]'));
      if (radioGroups.length > 1) {
        radioGroups.forEach((group, rowIndex) => {
          const options = Array.from(group.querySelectorAll('div[role="radio"]'))
            .map(el => el.getAttribute('aria-label') || el.closest('[data-value]')?.getAttribute('data-value') || el.textContent.trim())
            .map(cleanVisibleText)
            .filter(Boolean);
          const rowLabel = rowLabelForGroup(group, `Baris ${rowIndex + 1}`);
          pushQuestion({
            blockIndex: index,
            rowIndex,
            rowLabel,
            title: `${title} - ${rowLabel}`,
            description,
            type: 'grid_radio',
            options
          });
        });
        return;
      }

      const radioGroup = radioGroups[0];
      if (radioGroup) {
        const options = Array.from(radioGroup.querySelectorAll('div[role="radio"]'))
          .map(el => el.getAttribute('aria-label') || el.closest('[data-value]')?.getAttribute('data-value') || el.textContent.trim())
          .map(cleanVisibleText)
          .filter(Boolean);
        pushQuestion({ blockIndex: index, title, description, type: 'radio', options });
        return;
      }

      const checkboxes = block.querySelectorAll('div[role="checkbox"]');
      if (checkboxes.length) {
        const options = Array.from(checkboxes).map(el => cleanVisibleText(el.getAttribute('aria-label') || el.textContent)).filter(Boolean);
        pushQuestion({ blockIndex: index, title, description, type: 'checkbox', options, ...extractChoiceMeta(block) });
        return;
      }

      const dropdown = block.querySelector('div[role="listbox"]');
      if (dropdown) {
        const options = Array.from(block.querySelectorAll('div[role="option"]'))
          .map(el => el.getAttribute('data-value') || el.textContent.trim())
          .map(cleanVisibleText)
          .filter(value => value && value !== 'Pilih');
        pushQuestion({ blockIndex: index, title, description, type: 'dropdown', options });
        return;
      }

      const textarea = block.querySelector('textarea');
      if (textarea) {
        pushQuestion({ blockIndex: index, title, description, type: 'long_text', options: [], ...getTextMeta(textarea, block) });
        return;
      }

      const textInput = block.querySelector('input[type="text"]:not([readonly]):not([aria-hidden="true"])');
      if (textInput) {
        pushQuestion({ blockIndex: index, title, description, type: 'short_text', options: [], ...getTextMeta(textInput, block) });
      }
    });

    let pageType = 'QUESTIONNAIRE';
    if (hasConfirmation) pageType = 'CONFIRMATION';
    else if (!questions.length) pageType = 'INFO';
    else if (questions.map(q => q.title.toLowerCase()).join(' ').match(/nama|usia|umur|jenis kelamin|pendidikan|pekerjaan|domisili|profil/)) pageType = 'PROFILE';

    return { text, questions, pageType, formTitle };
  });
}

async function clickNextOrSubmit(page) {
  if (isGoogleLoginUrl(page.url())) return false;

  const labels = [/^Berikutnya$/i, /^Next$/i, /^Lanjut$/i, /^Selanjutnya$/i, /^Kirim$/i, /^Submit$/i, /^Kirim jawaban$/i];
  for (const label of labels) {
    const button = page.getByRole('button', { name: label }).first();
    if (await button.count().catch(() => 0)) {
      await button.scrollIntoViewIfNeeded().catch(() => {});
      await button.click({ timeout: 7000 });
      return true;
    }
  }

  return page.evaluate(() => {
    if (location.hostname === 'accounts.google.com') return false;

    const keywords = ['Berikutnya', 'Next', 'Lanjut', 'Selanjutnya', 'Kirim', 'Submit', 'Kirim jawaban'];
    const all = Array.from(document.querySelectorAll('div[role="button"], button[type="submit"], button, a'));
    const target = all.find(el => {
      const text = (el.innerText || el.textContent || '').trim().toLowerCase();
      const href = el.getAttribute?.('href') || '';
      const ignoredLogin = el.dataset?.formsGptIgnoredLogin === 'true' ||
        href.includes('accounts.google.com') ||
        /(login|masuk|sign in|simpan progres|save progress|save your progress)/i.test(text);
      return !ignoredLogin && keywords.some(keyword => text.includes(keyword.toLowerCase()));
    });
    if (!target) return false;
    target.scrollIntoView({ block: 'center' });
    target.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    target.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    target.click();
    return true;
  });
}

async function applyAnswersWithPlaywright(page, questions, answers, runConfig = {}) {
  const logs = [];
  const byIndex = new Map((answers || []).map(item => [item.index, item.answer]));
  const blocks = page.locator('div[role="listitem"], div.freebirdFormviewerViewNumberedItemContainer');

  const fastLikertDelay = runConfig.fastMode
    ? { fieldMin: 15, fieldMax: 50, optionMin: 10, optionMax: 30, pageMin: 50, pageMax: 150 }
    : FAST_LIKERT_DELAY;
  const humanDelayConf = runConfig.fastMode
    ? { fieldMin: 120, fieldMax: 350, optionMin: 50, optionMax: 150, pageMin: 150, pageMax: 400 }
    : HUMAN_DELAY;

  for (const q of questions || []) {
    if (!byIndex.has(q.index)) continue;
    const block = blocks.nth(Number.isInteger(q.blockIndex) ? q.blockIndex : q.index);
    const value = byIndex.get(q.index);
    const title = q.title || `Q${q.index}`;
    const fastLikert = isLikertQuestion(q);
    const delayConfig = fastLikert ? fastLikertDelay : humanDelayConf;

    try {
      await block.scrollIntoViewIfNeeded({ timeout: 7000 }).catch(() => {});
      await humanDelay(
        page,
        delayConfig.fieldMin,
        delayConfig.fieldMax
      );

      if (q.type === 'short_text' || q.type === 'long_text') {
        const input = q.type === 'long_text'
          ? block.locator('textarea').first()
          : block.locator('input[type="text"]:not([readonly]):not([aria-hidden="true"])').first();
        const textValue = constrainAnswerToQuestion(q, value);
        await input.fill(String(textValue || ''), { timeout: 7000 });
        await humanDelay(page, runConfig.fastMode ? 50 : 250, runConfig.fastMode ? 150 : 700);
        const limitNote = q.maxLength ? ` (${String(textValue || '').length}/${q.maxLength} karakter)` : '';
        logs.push({ level: 'ok', message: `${title} -> ${String(textValue || '').slice(0, 50)}${limitNote}` });
        continue;
      }

      if (q.type === 'dropdown') {
        if (!hasAnswerValue(value)) {
          logs.push({ level: 'warn', message: `${title} dilewati: tidak ada jawaban valid untuk opsi yang tersedia` });
          continue;
        }
        const selected = await chooseDropdownOption(page, block, value, q.options || [], delayConfig);
        logs.push({ level: selected ? 'ok' : 'warn', message: `${title} -> ${selected || value}` });
        continue;
      }

      if (q.type === 'radio' || q.type === 'grid_radio') {
        if (!hasAnswerValue(value)) {
          logs.push({ level: 'warn', message: `${title} dilewati: tidak ada jawaban valid untuk opsi yang tersedia` });
          continue;
        }
        const scope = q.type === 'grid_radio'
          ? block.locator('div[role="radiogroup"]').nth(Number(q.rowIndex || 0))
          : block;
        const selected = await chooseRoleOption(page, scope, 'radio', value, q.options || [], delayConfig);
        logs.push({ level: selected ? 'ok' : 'warn', message: `${title} -> ${selected || value}` });
        continue;
      }

      if (q.type === 'checkbox') {
        const values = Array.isArray(value) ? value : [value];
        if (!values.some(hasAnswerValue)) {
          logs.push({ level: 'warn', message: `${title} dilewati: tidak ada jawaban valid untuk opsi yang tersedia` });
          continue;
        }
        const selected = [];
        for (const item of values) {
          const picked = await chooseRoleOption(page, block, 'checkbox', item, q.options || [], delayConfig);
          if (picked) selected.push(picked);
        }
        logs.push({ level: selected.length ? 'ok' : 'warn', message: `${title} -> ${(selected.length ? selected : values).join(', ')}` });
      }
    } catch (err) {
      logs.push({ level: 'warn', message: `${title} gagal: ${err.message}` });
    }
  }

  return logs;
}

async function chooseDropdownOption(page, block, value, options, delay = null) {
  const wanted = String(value || '').trim();
  const candidates = optionCandidates(wanted, options);
  if (!wanted || !candidates.length) return '';

  const listbox = block.locator('div[role="listbox"]').first();
  await listbox.click({ timeout: 7000 });
  await humanDelay(page, delay?.optionMin ?? 350, delay?.optionMax ?? 900);
  const listboxBox = await listbox.boundingBox().catch(() => null);

  for (const candidate of candidates) {
    const scopedOption = await findVisibleOptionNearBox(page, candidate, listboxBox);
    if (scopedOption) {
      await page.mouse.click(scopedOption.x + scopedOption.width / 2, scopedOption.y + scopedOption.height / 2);
      await humanDelay(page, delay?.optionMin ?? 350, delay?.optionMax ?? 900);
      return scopedOption.text || candidate;
    }

    const option = page.getByRole('option', { name: new RegExp(`^\\s*${escapeRegex(candidate)}\\s*$`, 'i') }).first();
    if (await option.count().catch(() => 0)) {
      await option.click({ timeout: 7000 });
      await humanDelay(page, delay?.optionMin ?? 350, delay?.optionMax ?? 900);
      return candidate;
    }
  }

  await page.keyboard.press('Escape').catch(() => {});
  return '';
}

async function findVisibleOptionNearBox(page, candidate, listboxBox) {
  if (!listboxBox) return null;

  return page.evaluate(({ candidate, listboxBox }) => {
    const normalize = value => String(value || '')
      .toLowerCase()
      .replace(/&/g, ' dan ')
      .replace(/[^a-z0-9]+/g, ' ')
      .replace(/\s+/g, ' ')
      .trim();

    const wanted = normalize(candidate);
    if (!wanted) return null;

    function isVisible(el, rect) {
      const style = getComputedStyle(el);
      return rect.width > 0 && rect.height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
    }

    function overlapsHorizontally(rect, box) {
      return rect.left < box.x + box.width + 40 && rect.right > box.x - 40;
    }

    const options = Array.from(document.querySelectorAll('div[role="option"]'))
      .map(el => {
        const rect = el.getBoundingClientRect();
        const text = (el.innerText || el.textContent || '').replace(/\s+/g, ' ').trim();
        const key = normalize(text);
        return {
          text,
          key,
          visible: isVisible(el, rect),
          x: rect.x,
          y: rect.y,
          width: rect.width,
          height: rect.height,
          distance: Math.abs((rect.y + rect.height / 2) - (listboxBox.y + listboxBox.height / 2))
        };
      })
      .filter(item => item.visible && item.key && (item.key === wanted || item.key.includes(wanted) || wanted.includes(item.key)))
      .filter(item => overlapsHorizontally({ left: item.x, right: item.x + item.width }, listboxBox))
      .sort((a, b) => a.distance - b.distance);

    return options[0] || null;
  }, { candidate, listboxBox }).catch(() => null);
}

async function chooseRoleOption(page, block, role, value, options, delay = null) {
  const candidates = optionCandidates(value, options);
  if (!hasAnswerValue(value) || !candidates.length) return '';

  for (const candidate of candidates) {
    const option = block.getByRole(role, { name: new RegExp(`^\\s*${escapeRegex(candidate)}\\s*$`, 'i') }).first();
    if (await option.count().catch(() => 0)) {
      await option.click({ timeout: 7000 });
      await humanDelay(page, delay?.optionMin ?? 250, delay?.optionMax ?? 650);
      return candidate;
    }
  }

  const controls = block.locator(`div[role="${role}"]`);
  const count = await controls.count().catch(() => 0);
  if (!count) return '';
  return '';
}

function optionCandidates(value, options) {
  const wanted = String(value || '').trim();
  const out = [];
  if (wanted) out.push(wanted);
  const wantedKey = normalizeChoiceText(wanted);

  for (const option of options || []) {
    const text = String(option || '').trim();
    if (!text || /^pilih$/i.test(text)) continue;
    const optionKey = normalizeChoiceText(text);
    if (wantedKey && optionKey === wantedKey) out.unshift(text);
    else if (wantedKey && optionKey && (optionKey.includes(wantedKey) || wantedKey.includes(optionKey))) out.push(text);
  }

  return uniqueValues(out);
}

function escapeRegex(value) {
  return String(value || '').replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

async function applyAnswersInPage(answers) {
  const logs = [];
  const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
  const rand = (a, b) => Math.floor(Math.random() * (b - a + 1)) + a;

  function clickEl(el) {
    if (!el) return false;
    el.scrollIntoView({ block: 'center' });
    el.dispatchEvent(new MouseEvent('mouseover', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mousedown', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('mouseup', { bubbles: true }));
    el.dispatchEvent(new MouseEvent('click', { bubbles: true }));
    el.click();
    return true;
  }

  function similarity(a, b) {
    a = String(a || '').toLowerCase();
    b = String(b || '').toLowerCase();
    if (a === b) return 1;
    if (!a || !b) return 0;
    if (a.includes(b) || b.includes(a)) return 0.8;
    return 0;
  }

  async function typeText(el, value) {
    el.focus();
    el.value = '';
    el.dispatchEvent(new Event('input', { bubbles: true }));
    for (const char of String(value)) {
      el.value += char;
      el.dispatchEvent(new Event('input', { bubbles: true }));
      await wait(rand(5, 20));
    }
    el.dispatchEvent(new Event('change', { bubbles: true }));
    el.blur();
  }

  const blocks = Array.from(document.querySelectorAll('div[role="listitem"], div.freebirdFormviewerViewNumberedItemContainer'));

  for (const item of answers || []) {
    const block = blocks[item.index];
    if (!block) continue;

    const titleEl = block.querySelector('[role="heading"]') || block.querySelector('.M7eMe') || block.querySelector('.freebirdFormviewerComponentsQuestionBaseTitle');
    const title = titleEl ? titleEl.textContent.trim() : `Q${item.index}`;
    const value = item.answer;

    try {
      const radioGroup = block.querySelector('div[role="radiogroup"]');
      if (radioGroup) {
        const radios = Array.from(radioGroup.querySelectorAll('div[role="radio"]'));
        const target = radios.find(el => (el.getAttribute('aria-label') || '').trim().toLowerCase() === String(value).trim().toLowerCase()) ||
          radios.find(el => similarity(el.getAttribute('aria-label') || el.textContent, value) > 0.5) ||
          radios[0];
        clickEl(target);
        logs.push({ level: 'ok', message: `${title} -> ${target?.getAttribute('aria-label') || value}` });
        await wait(120);
        continue;
      }

      const checkboxes = Array.from(block.querySelectorAll('div[role="checkbox"]'));
      if (checkboxes.length) {
        const values = Array.isArray(value) ? value : [value];
        for (const answer of values) {
          const target = checkboxes.find(el => similarity(el.getAttribute('aria-label') || el.textContent, answer) > 0.5);
          if (target && target.getAttribute('aria-checked') !== 'true') clickEl(target);
          await wait(100);
        }
        logs.push({ level: 'ok', message: `${title} -> ${values.join(', ')}` });
        continue;
      }

      const dropdown = block.querySelector('div[role="listbox"]');
      if (dropdown) {
        clickEl(dropdown);
        await wait(400);
        const options = Array.from(document.querySelectorAll('div[role="option"]'));
        const target = options.find(el => similarity(el.getAttribute('data-value') || el.textContent, value) > 0.5) || options[1] || options[0];
        clickEl(target);
        logs.push({ level: 'ok', message: `${title} -> ${target?.textContent?.trim() || value}` });
        await wait(150);
        continue;
      }

      const textInput = block.querySelector('textarea') || block.querySelector('input[type="text"]:not([readonly]):not([aria-hidden="true"])');
      if (textInput) {
        await typeText(textInput, value);
        logs.push({ level: 'ok', message: `${title} -> ${String(value).slice(0, 50)}` });
      }
    } catch (err) {
      logs.push({ level: 'warn', message: `${title} gagal: ${err.message}` });
    }
  }

  return logs;
}

function fallbackAnswers(questions, rules, respondent, runConfig = {}) {
  return questions.map(q => {
    const smartFirst = getSmartMappedAnswer(q, respondent, runConfig);
    if (isHighConfidenceLocalQuestion(q) && hasAnswerValue(smartFirst)) {
      const localAnswer = q.options?.length
        ? (adaptAnswerToOptions(q, smartFirst, { strict: true }) || pickContextualOption(q, respondent))
        : adaptAnswerToOptions(q, smartFirst);
      if (hasAnswerValue(localAnswer)) return { index: q.index, answer: localAnswer };
    }

    const rule = findMatchingRule(q, rules);
    if (rule) return { index: q.index, answer: chooseRuleAnswer(q, rule.answers) };

    const smartAnswer = smartFirst;
    if (smartAnswer !== null && smartAnswer !== undefined && smartAnswer !== '') {
      return { index: q.index, answer: adaptAnswerToOptions(q, smartAnswer) };
    }

    if (q.type === 'checkbox') {
      const generic = chooseGenericChoiceAnswer(q, respondent, runConfig);
      return { index: q.index, answer: Array.isArray(generic) ? generic : (generic ? [generic] : []) };
    }
    if (q.options?.length) {
      return { index: q.index, answer: chooseGenericChoiceAnswer(q, respondent, runConfig) };
    }
    return { index: q.index, answer: q.type === 'long_text' ? pickSmartFeedbackText(q, getEffectiveTextMaxLength(q), runConfig) : contextualFallbackText(q, getEffectiveTextMaxLength(q)) };
  });
}

function parseCustomRules(text) {
  return String(text || '')
    .split(/\r?\n/)
    .map(line => line.trim())
    .filter(line => line && !line.startsWith('#') && line.includes('=>'))
    .map(line => {
      const [left, ...rightParts] = line.split('=>');
      return {
        keywords: left.split(',').map(item => item.trim().toLowerCase()).filter(Boolean),
        answers: rightParts.join('=>').split('|').map(item => item.trim()).filter(Boolean)
      };
    })
    .filter(rule => rule.keywords.length && rule.answers.length);
}

function rulesToText(rules) {
  return (rules || [])
    .map(rule => `${(rule.keywords || []).join(', ')} => ${(rule.answers || []).join(' | ')}`)
    .filter(line => line.trim() !== '=>')
    .join('\n');
}

function contextualRulesForSnapshot(rules, snapshot, runConfig = {}) {
  if (runConfig.smartAutoMode === false) return rules || [];

  const formText = `${snapshot?.formTitle || ''} ${snapshot?.text || ''}`.toLowerCase();
  return (rules || []).filter(rule => {
    const keywordText = (rule.keywords || []).join(' ').toLowerCase();
    if (/(seminarfst|seminar fst|website seminar)/.test(keywordText) && !/(seminarfst|seminar fst|website seminar)/.test(formText)) {
      return false;
    }
    return true;
  });
}

function enforceCustomRules(questions, answers, rules, respondent, runConfig = {}) {
  const byIndex = new Map((answers || []).filter(item => Number.isInteger(item.index)).map(item => [item.index, item]));
  for (const q of questions) {
    const smartAnswer = getSmartMappedAnswer(q, respondent, runConfig);
    if (isHighConfidenceLocalQuestion(q) && hasAnswerValue(smartAnswer)) {
      const localAnswer = q.options?.length
        ? (adaptAnswerToOptions(q, smartAnswer, { strict: true }) || pickContextualOption(q, respondent))
        : adaptAnswerToOptions(q, smartAnswer);
      if (hasAnswerValue(localAnswer)) {
        byIndex.set(q.index, { index: q.index, answer: localAnswer });
        continue;
      }
    }

    const rule = findMatchingRule(q, rules);
    if (rule) {
      byIndex.set(q.index, { index: q.index, answer: chooseRuleAnswer(q, rule.answers) });
      continue;
    }

    if (smartAnswer !== null && smartAnswer !== undefined && smartAnswer !== '') {
      byIndex.set(q.index, { index: q.index, answer: adaptAnswerToOptions(q, smartAnswer) });
    }
  }
  return Array.from(byIndex.values());
}

function findMatchingRule(q, rules) {
  const haystack = `${q.title} ${q.description || ''}`.toLowerCase();
  return rules.find(rule => rule.keywords.some(keyword => matchesRuleKeyword(haystack, keyword)));
}

function matchesRuleKeyword(haystack, keyword) {
  const cleanKeyword = String(keyword || '').toLowerCase().replace(/\s+/g, ' ').trim();
  if (!cleanKeyword) return false;
  if (cleanKeyword.includes(' ')) return haystack.includes(cleanKeyword);
  return new RegExp(`(^|[^a-z0-9])${escapeRegex(cleanKeyword)}([^a-z0-9]|$)`, 'i').test(haystack);
}

function chooseRuleAnswer(q, answers) {
  if (!answers.length) return '';
  if (!q.options?.length) return pick(answers);

  for (const answer of answers) {
    const exact = q.options.find(option => sameChoiceValue(option, answer));
    if (exact) return exact;
  }

  for (const answer of answers) {
    const partial = q.options.find(option => {
      const a = normalizeChoiceText(answer);
      const o = normalizeChoiceText(option);
      return o.includes(a) || a.includes(o);
    });
    if (partial) return partial;
  }

  return pickContextualOption(q) || chooseGenericChoiceAnswer(q);
}

function isHighConfidenceLocalQuestion(q) {
  const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
  return [
    'name', 'gender', 'age', 'email', 'phone', 'city', 'birth_place',
    'birth_date', 'nationality', 'domicile_country', 'address', 'residence_area',
    'marital_status', 'guardian', 'transportation', 'religion',
    'education', 'occupation', 'cohort', 'academic_semester',
    'course_topic', 'ecommerce_platform', 'ai_recommendation_experience',
    'shopping_frequency', 'shopping_category', 'study_program',
    'recommendation_program', 'multi_choice_recommendation', 'choice_recommendation',
    'business_type', 'problem_choice', 'price_opinion',
    'yes_no_gate', 'yes_no_positive', 'yes_no_negative', 'consent_yes',
    'frequency_positive', 'frequency_negative', 'rating_positive', 'rating_negative',
    'importance_high', 'likert_negative', 'likert_positive'
  ].includes(mapped.semanticType);
}

function getSmartMappedAnswer(q, respondent, runConfig = {}) {
  const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
  const compact = questionHaystack(mapped);
  const options = mapped.options || [];
  const profile = respondent || createRespondentProfile();

  if (mapped.semanticType === 'name') return profile.name;
  if (mapped.semanticType === 'gender') return chooseGenderAnswer(mapped, profile);
  if (mapped.semanticType === 'age') return chooseAgeAnswer(mapped, profile);
  if (mapped.semanticType === 'email') return profile.email;
  if (mapped.semanticType === 'phone') return profile.phone;
  if (mapped.semanticType === 'nationality') return pickBestOption(mapped, ['Indonesia', 'WNI', 'Warga Negara Indonesia']) || profile.nationality;
  if (mapped.semanticType === 'domicile_country') return chooseIndonesiaDomicileAnswer(mapped);
  if (mapped.semanticType === 'birth_date') return profile.birthDate;
  if (mapped.semanticType === 'birth_place') return pickBestOption(mapped, [profile.birthPlace, ...INDONESIAN_CITIES]) || profile.birthPlace;
  if (mapped.semanticType === 'city') return pickBestOption(mapped, [profile.city, ...INDONESIAN_CITIES]) || profile.city;
  if (mapped.semanticType === 'address') return options.length ? (pickContextualOption(mapped, profile) || profile.address) : profile.address;
  if (mapped.semanticType === 'residence_area') return pickBestOption(mapped, [profile.residenceArea, 'Perkotaan', 'Perdesaan']) || profile.residenceArea;
  if (mapped.semanticType === 'marital_status') return chooseMaritalStatusAnswer(mapped, profile);
  if (mapped.semanticType === 'guardian') return options.length ? (pickBestOption(mapped, ['Orang tua', 'Wali', 'Ayah/Ibu']) || pickContextualOption(mapped, profile)) : profile.guardianName;
  if (mapped.semanticType === 'transportation') return chooseTransportationAnswer(mapped, profile);
  if (mapped.semanticType === 'religion') return pickBestOption(mapped, [profile.religion, ...RELIGION_OPTIONS]) || profile.religion;
  if (mapped.semanticType === 'education') return pickBestOption(mapped, [profile.education, 'SMA/SMK', 'Diploma', 'Sarjana']) || profile.education;
  if (mapped.semanticType === 'occupation') return pickBestOption(mapped, [profile.occupation, 'Mahasiswa', 'Karyawan Swasta', 'Wirausaha']) || profile.occupation;
  if (mapped.semanticType === 'business_type') return chooseBusinessTypeAnswer(mapped, runConfig);
  if (mapped.semanticType === 'academic_semester') return chooseAcademicSemesterAnswer(mapped);
  if (mapped.semanticType === 'course_topic') return chooseCourseTopicAnswer(mapped);
  if (mapped.semanticType === 'ecommerce_platform') return chooseEcommercePlatformAnswer(mapped, runConfig);
  if (mapped.semanticType === 'ai_recommendation_experience') return chooseAIRecommendationExperienceAnswer(mapped);
  if (mapped.semanticType === 'shopping_frequency') return chooseShoppingFrequencyAnswer(mapped, runConfig);
  if (mapped.semanticType === 'shopping_category') return chooseShoppingCategoryAnswer(mapped, runConfig);
  if (mapped.semanticType === 'cohort') return pickBestOption(mapped, ['2022', '2023', '2024', '2025']) || pick(['2022', '2023', '2024', '2025']);
  if (mapped.semanticType === 'study_program') {
    return pickBestOption(mapped, ['Teknik Informatika', 'Sistem Informasi', 'Teknik Industri', 'Matematika', 'Teknik Elektro', 'Manajemen', 'Akuntansi', 'Hukum', 'Psikologi'])
      || pick(['Teknik Informatika', 'Sistem Informasi', 'Teknik Industri']);
  }
  if (mapped.semanticType === 'recommendation_program' || mapped.semanticType === 'multi_choice_recommendation' || mapped.semanticType === 'choice_recommendation') {
    const preferred = ['Teknik Informatika', 'Sistem Informasi', 'Teknik Industri', 'Matematika', 'Teknik Elektro'];
    const chosen = chooseMultipleOptions(mapped, preferred, 5, runConfig);
    if (mapped.type === 'checkbox') return chosen;
    if (options.length) return chosen[0] || pick(options);
    return chosen.length ? chosen.join(', ') : preferred.slice(0, 5).join(', ');
  }
  if (mapped.semanticType === 'yes_no_gate') {
    return pickBestOption(mapped, ['Ya', 'Pernah', 'Sudah', 'Yes']) || 'Ya';
  }
  if (mapped.semanticType === 'consent_yes' || mapped.semanticType === 'yes_no_positive') return chooseYesNoAnswer(mapped, 'yes');
  if (mapped.semanticType === 'yes_no_negative') return chooseYesNoAnswer(mapped, 'no');
  if (mapped.semanticType === 'frequency_positive') return chooseFrequencyAnswer(mapped, 'positive');
  if (mapped.semanticType === 'frequency_negative') return chooseFrequencyAnswer(mapped, 'negative');
  if (mapped.semanticType === 'rating_positive') return chooseRatingAnswer(mapped, 'positive');
  if (mapped.semanticType === 'rating_negative') return chooseRatingAnswer(mapped, 'negative');
  if (mapped.semanticType === 'importance_high') return chooseImportanceAnswer(mapped);
  if (mapped.semanticType === 'likert_negative') return chooseLikertAnswer(mapped, 'negative');
  if (mapped.semanticType === 'likert_positive') return chooseLikertAnswer(mapped, 'positive');
  if (mapped.semanticType === 'problem_choice') return chooseProblemChoiceAnswer(mapped, runConfig);
  if (mapped.semanticType === 'price_opinion') return choosePriceOpinionAnswer(mapped, runConfig);
  if (mapped.semanticType === 'feedback') return pickSmartFeedbackText(mapped, getEffectiveTextMaxLength(mapped), runConfig);

  if (compact.includes('seminarfst') || compact.includes('seminar fst')) {
    const seminarAnswer = getSeminarFSTAnswer(mapped);
    if (seminarAnswer !== null && seminarAnswer !== undefined && seminarAnswer !== '') return seminarAnswer;
  }

  return null;
}

function chooseIndonesiaDomicileAnswer(q) {
  const text = questionHaystack(q);
  if (q.options?.length) {
    const options = meaningfulOptions(q.options);
    const exact = options.find(option => {
      const value = normalizeChoiceText(option);
      return (
        value === 'indonesia' ||
        value === 'di indonesia' ||
        value === 'dalam indonesia' ||
        value === 'berdomisili di indonesia'
      );
    });
    if (exact) return exact;

    const positive = options.find(option => {
      const value = normalizeChoiceText(option);
      return /indonesia/.test(value) && !/(luar|outside)/.test(value);
    });
    if (positive) return positive;
  }

  if (hasOptionLike(q.options || [], /^(ya|yes)$/i) && hasOptionLike(q.options || [], /^(tidak|no)$/i)) {
    return /(luar indonesia|outside indonesia|outside of indonesia)/.test(text)
      ? chooseYesNoAnswer(q, 'no')
      : chooseYesNoAnswer(q, 'yes');
  }

  return q.options?.length ? (pickBestOption(q, ['Indonesia']) || meaningfulOptions(q.options)[0] || '') : 'Indonesia';
}

function chooseEcommercePlatformAnswer(q, runConfig = {}) {
  if (!q.options?.length) return pick(ECOMMERCE_PLATFORMS);
  const selected = chooseDistributedOptions(q, runConfig, 1, q.type === 'checkbox' ? Math.min(2, getChoiceMax(q)) : 1, ECOMMERCE_PLATFORMS);
  if (q.type === 'checkbox') return selected;
  return selected[0] || pickBestOption(q, ECOMMERCE_PLATFORMS) || pick(meaningfulOptions(q.options));
}

function chooseAIRecommendationExperienceAnswer(q) {
  const preferred = [
    'Ya, saya pernah melihat dan mengklik/berinteraksi dengan rekomendasi tersebut',
    'Ya, saya pernah melihatnya, tetapi tidak pernah mengklik atau berinteraksi',
    'Pernah melihat dan berinteraksi',
    'Pernah melihat',
    'Ya'
  ];
  if (!q.options?.length) return preferred[0];

  const direct = pickBestOption(q, preferred);
  if (direct) return direct;

  const positive = meaningfulOptions(q.options).find(option => {
    const text = normalizeChoiceText(option);
    return /(ya|pernah|melihat|mengklik|berinteraksi)/.test(text) && !/(tidak|belum|never)/.test(text);
  });
  return positive || meaningfulOptions(q.options)[0] || '';
}

function chooseShoppingFrequencyAnswer(q, runConfig = {}) {
  const preferred = [
    '1-2 kali sebulan',
    '1-2 kali',
    '3-5 kali sebulan',
    'Kadang-kadang (sesekali)',
    'Kadang-kadang',
    'Sering'
  ];
  if (!q.options?.length) return pick(['1-2 kali sebulan', '3-5 kali sebulan', 'Kadang-kadang']);

  const selected = chooseDistributedOptions(q, runConfig, 1, 1, preferred);
  return selected[0] || pickBestOption(q, preferred) || meaningfulOptions(q.options)[0] || '';
}

function chooseShoppingCategoryAnswer(q, runConfig = {}) {
  const preferred = [
    'Fashion',
    'Elektronik',
    'Kecantikan',
    'Perawatan diri',
    'Makanan dan minuman',
    'Perlengkapan rumah'
  ];
  if (!q.options?.length) return pick(preferred);
  const selected = chooseDistributedOptions(q, runConfig, 1, q.type === 'checkbox' ? Math.min(3, getChoiceMax(q)) : 1, preferred);
  if (q.type === 'checkbox') return selected;
  return selected[0] || pickBestOption(q, preferred) || pick(meaningfulOptions(q.options));
}

function chooseGenderAnswer(q, profile) {
  const preferred = profile.gender === 'male'
    ? ['Laki - Laki', 'Laki-laki', 'Laki Laki', 'Pria', 'Male']
    : ['Perempuan', 'Wanita', 'Female'];
  return pickBestOption(q, preferred) || preferred[0];
}

function chooseAgeAnswer(q, profile) {
  const age = Number(profile.age || 21);
  if (!q.options?.length) return String(age);

  const matchingRange = q.options.find(option => ageFitsOption(option, age));
  if (matchingRange) return matchingRange;

  const preferred = [
    String(age),
    `${age} tahun`,
    '18 - 24',
    '18-24',
    '21 - 25',
    '21-25',
    '20 - 25',
    '20-25'
  ];
  return pickBestOption(q, preferred) || pickContextualOption(q, profile);
}

function ageFitsOption(option, age) {
  const text = String(option || '').toLowerCase();
  const numbers = Array.from(text.matchAll(/\d{1,3}/g)).map(match => Number(match[0])).filter(Number.isFinite);
  if (!numbers.length) return false;

  if (numbers.length >= 2) {
    const low = Math.min(numbers[0], numbers[1]);
    const high = Math.max(numbers[0], numbers[1]);
    return age >= low && age <= high;
  }

  const only = numbers[0];
  if (/(kurang|<|di bawah|under|below)/.test(text)) return age < only;
  if (/(lebih|>|di atas|over|above)/.test(text)) return age > only;
  return age === only;
}

function chooseMaritalStatusAnswer(q, profile) {
  const preferred = profile.maritalStatus === 'Sudah Menikah'
    ? ['Sudah Menikah', 'Menikah', 'Kawin', 'Married']
    : ['Belum Menikah', 'Lajang', 'Tidak Kawin', 'Single'];
  return pickBestOption(q, preferred) || preferred[0];
}

function chooseTransportationAnswer(q, profile) {
  const preferred = [profile.transportation, ...TRANSPORT_OPTIONS, 'Kendaraan Pribadi', 'Angkutan Umum'];
  return pickBestOption(q, preferred) || profile.transportation;
}

function chooseAcademicSemesterAnswer(q) {
  if (!q.options?.length) return pick(['2', '4', '6']);
  if (hasOptionLike(q.options, /^1$/) && hasOptionLike(q.options, /^2$/)) {
    return pickBestOption(q, ['1', '2']) || pick(q.options);
  }
  const options = meaningfulOptions(q.options);
  return pickBestOption(q, ['6', '8', '4', '2', '10', '12']) || (options.length ? options[Math.floor((options.length - 1) / 2)] : '');
}

function chooseCourseTopicAnswer(q) {
  const courses = [
    'Pemrograman Dasar',
    'Kalkulus',
    'Statistika',
    'Basis Data',
    'Algoritma dan Struktur Data',
    'Bahasa Inggris',
    'Pengantar Teknologi Informasi'
  ];
  if (q.options?.length) {
    const options = meaningfulOptions(q.options);
    return pickBestOption(q, courses) || (options.length ? options[0] : '');
  }
  return pick(courses);
}

function chooseBusinessTypeAnswer(q, runConfig = {}) {
  const preferred = [
    'Toko Kelontong / Warung Sembako',
    'Toko Kelontong',
    'Warung Sembako',
    'UMKM Kuliner Rumahan',
    'UMKM Kuliner',
    'Pedagang Pasar Tradisional',
    'Pedagang Pasar'
  ];
  if (!q.options?.length) return pick(['Toko kelontong', 'UMKM kuliner rumahan', 'Pedagang pasar tradisional']);

  const selected = chooseDistributedOptions(q, runConfig, 1, 1, preferred);
  if (q.type === 'checkbox') return selected;
  return selected[0] || pick(meaningfulOptions(q.options));
}

function chooseProblemChoiceAnswer(q, runConfig = {}) {
  if (!q.options?.length) return pickSmartFeedbackText(q, getEffectiveTextMaxLength(q), runConfig);

  const options = meaningfulOptions(q.options || []);
  if (!options.length) return q.type === 'checkbox' ? [] : '';
  if (q.type !== 'checkbox') return chooseDistributedOptions(q, runConfig, 1, 1)[0] || pick(options);

  const compact = questionHaystack(q);
  const minCount = Math.max(1, getChoiceMin(q));
  const maxByQuestion = Math.min(options.length, getChoiceMax(q), 3);
  const allowsMultiple = /(boleh pilih|pilih.*lebih dari|lebih dari 1|lebih dari satu|centang|checkbox|multiple)/.test(compact);
  const maxCount = Math.max(minCount, allowsMultiple ? maxByQuestion : minCount);
  return chooseDistributedOptions(q, runConfig, minCount, maxCount);
}

function choosePriceOpinionAnswer(q, runConfig = {}) {
  const preferred = [
    'Cukup Terjangkau / Pas',
    'Cukup Terjangkau',
    'Pas',
    'Agak Mahal, tetapi worth it dengan kepraktisannya',
    'Agak Mahal',
    'Sangat Murah'
  ];
  if (!q.options?.length) return pick(['Cukup terjangkau', 'Agak mahal, tetapi masih masuk akal']);

  const selected = chooseDistributedOptions(q, runConfig, 1, 1, preferred);
  if (q.type === 'checkbox') return selected;
  return selected[0] || pick(meaningfulOptions(q.options));
}

function pickBestOption(q, preferred) {
  if (!q.options?.length) return '';
  for (const answer of preferred) {
    const adapted = adaptAnswerToOptions(q, answer, { strict: true });
    if (adapted && q.options.includes(adapted)) return adapted;
  }
  return '';
}

function chooseMultipleOptions(q, preferred, maxCount, runConfig = {}) {
  const limit = Math.max(1, Math.min(Number(maxCount || 5), getChoiceMax(q), 5));
  if (!q.options?.length) return preferred.slice(0, limit);

  const chosen = [];
  for (const answer of preferred) {
    const adapted = adaptAnswerToOptions(q, answer, { strict: true });
    if (adapted && q.options.includes(adapted) && !chosen.includes(adapted)) chosen.push(adapted);
    if (chosen.length >= limit) return chosen;
  }

  const filler = chooseDistributedOptions(q, runConfig, 1, limit);
  for (const option of filler) {
    if (!chosen.some(item => sameChoiceValue(item, option))) chosen.push(option);
    if (chosen.length >= limit) break;
  }
  return chosen;
}

function chooseDistributedOptions(q, runConfig = {}, minCount = 1, maxCount = 1, preferred = []) {
  const options = meaningfulOptions(q.options || []);
  if (!options.length) return [];

  const seed = choiceSeedFor(q, runConfig);
  const attempt = choiceAttemptFor(runConfig);
  const preferredAdapted = uniqueValues((preferred || [])
    .map(item => adaptAnswerToOptions(q, item, { strict: true }))
    .filter(Boolean));
  const priority = preferredAdapted.length ? preferredAdapted : options;
  const rest = options.filter(option => !priority.some(item => sameChoiceValue(item, option)));
  const ordered = uniqueValues([
    ...sortOptionsBySeed(priority, seed, attempt),
    ...sortOptionsBySeed(rest, seed + 17, attempt)
  ]);

  const min = Math.max(1, Math.min(options.length, Number(minCount) || 1));
  const max = Math.max(min, Math.min(options.length, Number(maxCount) || min));
  const count = min === max ? min : min + ((seed + attempt) % (max - min + 1));
  return ordered.slice(0, count);
}

function sortOptionsBySeed(options, seed, attempt = 1) {
  const sorted = [...(options || [])].sort((a, b) => {
    const scoreA = stableHash(`${seed}|${normalizeChoiceText(a)}`);
    const scoreB = stableHash(`${seed}|${normalizeChoiceText(b)}`);
    return scoreA - scoreB;
  });
  if (sorted.length <= 1) return sorted;

  const offset = Math.abs((Number(attempt) || 1) - 1 + (seed % sorted.length)) % sorted.length;
  return sorted.slice(offset).concat(sorted.slice(0, offset));
}

function choiceSeedFor(q, runConfig = {}) {
  const job = runConfig.currentJob || {};
  return stableHash([
    job.itemId || '',
    job.url || '',
    job.totalForLink || runConfig.responsesPerLink || '',
    q.index,
    q.title || '',
    (q.options || []).join('|')
  ].join('~'));
}

function choiceAttemptFor(runConfig = {}) {
  const job = runConfig.currentJob || {};
  const attempt = Number(job.attempt || runConfig.currentAttempt || 0);
  if (Number.isFinite(attempt) && attempt > 0) return Math.floor(attempt);
  return randomInt(1, 1000000);
}

function chooseLikertAnswer(q, direction) {
  const options = q.options || [];
  if (!options.length) return direction === 'negative' ? '2' : '4';

  const candidates = likertCandidateSequence(q, direction);
  if (candidates.length) return pickVariedLikertAnswer(candidates, null);

  return options[Math.min(options.length - 1, Math.floor(options.length * 0.75))];
}

function chooseYesNoAnswer(q, direction) {
  const preferred = direction === 'no'
    ? ['Tidak', 'Belum', 'Tidak Pernah', 'No']
    : ['Ya', 'Setuju', 'Bersedia', 'Pernah', 'Sudah', 'Yes'];
  return pickBestOption(q, preferred) || preferred[0];
}

function chooseFrequencyAnswer(q, direction) {
  const candidates = ratingCandidateSequence(q, direction);
  if (candidates.length >= 2) return pickVariedLikertAnswer(candidates, null);
  const preferred = direction === 'negative'
    ? ['Tidak Pernah', 'Jarang', 'Sangat Jarang', '1', '2']
    : ['Sering', 'Sangat Sering', 'Selalu', '4', '5'];
  return pickRandomFromPreferred(q, preferred) || chooseLikertAnswer(q, direction === 'negative' ? 'negative' : 'positive');
}

function chooseRatingAnswer(q, direction) {
  const candidates = ratingCandidateSequence(q, direction);
  if (candidates.length >= 2) return pickVariedLikertAnswer(candidates, null);
  const preferred = direction === 'negative'
    ? [
      'Tidak Pernah', 'Jarang', 'Sangat Rendah', 'Rendah',
      'Sangat Buruk', 'Buruk', 'Tidak Puas', 'Sangat Tidak Puas',
      'Tidak Setuju', 'Sangat Tidak Setuju', '1', '2'
    ]
    : [
      'Sangat Baik', 'Baik', 'Sangat Puas', 'Puas',
      'Sangat Mudah', 'Mudah', 'Sangat Jelas', 'Jelas',
      'Sangat Bermanfaat', 'Bermanfaat', 'Sangat Tinggi', 'Tinggi',
      'Setuju', 'Sangat Setuju', '4', '5'
    ];
  return pickRandomFromPreferred(q, preferred) || chooseLikertAnswer(q, direction === 'negative' ? 'negative' : 'positive');
}

function pickRandomFromPreferred(q, preferred) {
  if (!q.options?.length) return '';
  const matched = [];
  for (const answer of preferred) {
    const adapted = adaptAnswerToOptions(q, answer, { strict: true });
    if (adapted && q.options.includes(adapted) && !matched.includes(adapted)) matched.push(adapted);
  }
  if (matched.length >= 2) return pick(matched);
  return matched[0] || '';
}

function chooseImportanceAnswer(q) {
  return pickBestOption(q, ['Sangat Penting', 'Penting', 'Prioritas Tinggi', 'Tinggi', '4', '5'])
    || chooseRatingAnswer(q, 'positive');
}

function diversifyLikertAnswers(questions, answers, runConfig = {}) {
  const byIndex = new Map((answers || []).filter(item => item && Number.isInteger(item.index)).map(item => [item.index, { ...item }]));
  let adjustedCount = 0;

  const POSITIVE_TYPES = [
    'likert_positive', 'rating_positive', 'frequency_positive', 'importance_high'
  ];
  const NEGATIVE_TYPES = [
    'likert_negative', 'rating_negative', 'frequency_negative'
  ];

  for (const direction of ['positive', 'negative']) {
    const targetTypes = direction === 'positive' ? POSITIVE_TYPES : NEGATIVE_TYPES;
    const scaleQuestions = (questions || []).filter(q => {
      const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
      const semantic = mapped.semanticType || '';
      return targetTypes.includes(semantic);
    });

    const planned = [];
    let previousAnswer = null;

    for (const q of scaleQuestions) {
      const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
      const isRating = String(mapped.semanticType || '').startsWith('rating') ||
        String(mapped.semanticType || '').startsWith('frequency') ||
        mapped.semanticType === 'importance_high';
      const sequence = isRating
        ? ratingCandidateSequence(q, direction)
        : likertCandidateSequence(q, direction);
      if (sequence.length < 2) continue;

      const nextAnswer = pickDistributedScaleAnswer(q, direction, sequence, previousAnswer, runConfig);
      previousAnswer = nextAnswer;
      planned.push({ q, answer: nextAnswer, sequence });
    }

    const uniquePlanned = uniqueValues(planned.map(item => item.answer));
    if (planned.length > 1 && uniquePlanned.length === 1) {
      const pivot = planned[randomInt(0, planned.length - 1)];
      const alternative = pivot.sequence.find(item => !sameAnswerValue(item, pivot.answer));
      if (alternative) pivot.answer = alternative;
    }

    for (const item of planned) {
      const { q, answer: nextAnswer } = item;
      const current = byIndex.get(q.index);
      if (!current) continue;

      if (JSON.stringify(current.answer) !== JSON.stringify(nextAnswer)) {
        byIndex.set(q.index, { ...current, answer: nextAnswer });
        adjustedCount++;
      }
    }
  }

  return { answers: Array.from(byIndex.values()), adjustedCount };
}

function pickDistributedScaleAnswer(q, direction, sequence, previousAnswer, runConfig = {}) {
  const unique = uniqueValues(sequence);
  if (!unique.length) return '';
  if (unique.length === 1) return unique[0];

  const job = runConfig.currentJob || {};
  const attempt = Math.max(1, Number(job.attempt || 0) || randomInt(1, 100000));
  const total = Math.max(1, Number(job.totalForLink || runConfig.responsesPerLink || 1) || 1);
  const seed = stableHash([
    job.itemId || '',
    job.url || '',
    q.index,
    q.title || '',
    direction,
    attempt
  ].join('|'));
  const ratio = ((seed % 1000) + 1) / 1000;
  const phase = (attempt + (seed % 7)) % Math.max(2, Math.min(13, total));
  const groups = getLikertOptionGroups(q.options || []);
  const moderate = direction === 'negative' ? groups.negativeModerate : groups.positiveModerate;
  const strong = direction === 'negative' ? groups.negativeStrong : groups.positiveStrong;
  const neutral = groups.neutral[0];

  let preferred = [];
  if (neutral && total >= 12 && (phase === 0 || ratio < 0.08)) {
    preferred = [neutral];
  } else {
    const primary = moderate[0] || unique[0];
    const secondary = strong[0] || unique.find(item => !sameAnswerValue(item, primary)) || primary;
    preferred = ratio < 0.58
      ? [primary, secondary, ...unique]
      : [secondary, primary, ...unique];
  }

  let answer = uniqueValues(preferred)[0] || pickVariedLikertAnswer(unique, previousAnswer);
  if (previousAnswer !== null && sameAnswerValue(answer, previousAnswer)) {
    const alternative = uniqueValues(preferred.concat(unique)).find(item => !sameAnswerValue(item, previousAnswer));
    if (alternative && (phase % 3 !== 1 || ratio > 0.33)) answer = alternative;
  }
  return answer;
}

function pickVariedLikertAnswer(sequence, previousAnswer) {
  const unique = uniqueValues(sequence);
  if (!unique.length) return '';
  if (unique.length === 1) return unique[0];

  let pool = [unique[0], unique[0], ...unique.slice(1)];
  if (previousAnswer !== null && Math.random() < 0.7) {
    const different = pool.filter(item => !sameAnswerValue(item, previousAnswer));
    if (different.length) pool = different;
  }

  return pick(pool);
}

function sameAnswerValue(a, b) {
  return String(a || '').trim().toLowerCase() === String(b || '').trim().toLowerCase();
}

function stableHash(value) {
  let hash = 2166136261;
  const text = String(value || '');
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function likertCandidateSequence(q, direction) {
  const groups = getLikertOptionGroups(q.options || []);
  const moderate = direction === 'negative' ? groups.negativeModerate : groups.positiveModerate;
  const strong = direction === 'negative' ? groups.negativeStrong : groups.positiveStrong;

  const ordered = [];
  if (moderate.length) ordered.push(moderate[0]);
  if (strong.length) ordered.push(strong[0]);
  if (moderate.length > 1) ordered.push(moderate[1]);
  if (strong.length > 1) ordered.push(strong[1]);

  return uniqueValues(ordered);
}

function getLikertOptionGroups(options) {
  const groups = {
    positiveStrong: [],
    positiveModerate: [],
    negativeStrong: [],
    negativeModerate: [],
    neutral: []
  };

  for (const option of options || []) {
    const text = String(option || '').trim().toLowerCase();
    if (!text) continue;

    // Numeric scale 1-5
    if (text === '5') groups.positiveStrong.push(option);
    else if (text === '4') groups.positiveModerate.push(option);
    else if (text === '3') groups.neutral.push(option);
    else if (text === '2') groups.negativeModerate.push(option);
    else if (text === '1') groups.negativeStrong.push(option);
    // Setuju/Tidak Setuju scale
    else if (/(sangat\s+tidak\s+setuju|strongly\s+disagree|\bsts\b)/.test(text)) groups.negativeStrong.push(option);
    else if (/(tidak\s+setuju|disagree|\bts\b)/.test(text)) groups.negativeModerate.push(option);
    else if (/(netral|neutral|\bn\b)/.test(text)) groups.neutral.push(option);
    else if (/(sangat\s+setuju|strongly\s+agree|\bss\b)/.test(text)) groups.positiveStrong.push(option);
    else if (/(^|\s|\()setuju(\s|\)|$)|\bagree\b|\bs\b/.test(text)) groups.positiveModerate.push(option);
    // Baik/Buruk scale (survey rating)
    else if (/(sangat\s+baik|sangat\s+puas|sangat\s+mudah|sangat\s+jelas|sangat\s+bermanfaat|sangat\s+tinggi|sangat\s+sering)/.test(text)) groups.positiveStrong.push(option);
    else if (/^(baik|puas|mudah|jelas|bermanfaat|tinggi|sering)$/.test(text)) groups.positiveModerate.push(option);
    else if (/^(cukup|cukup baik|cukup puas|kadang-kadang|sedang|biasa|netral)/.test(text)) groups.neutral.push(option);
    else if (/^(buruk|tidak puas|sulit|tidak jelas|rendah|jarang)$/.test(text)) groups.negativeModerate.push(option);
    else if (/(sangat\s+buruk|sangat\s+tidak\s+puas|sangat\s+sulit|sangat\s+rendah|sangat\s+jarang|tidak\s+pernah)/.test(text)) groups.negativeStrong.push(option);
  }

  return groups;
}

function ratingCandidateSequence(q, direction) {
  const groups = getLikertOptionGroups(q.options || []);
  const moderate = direction === 'negative' ? groups.negativeModerate : groups.positiveModerate;
  const strong = direction === 'negative' ? groups.negativeStrong : groups.positiveStrong;

  const ordered = [];
  if (moderate.length) ordered.push(moderate[0]);
  if (strong.length) ordered.push(strong[0]);
  if (moderate.length > 1) ordered.push(moderate[1]);
  if (strong.length > 1) ordered.push(strong[1]);

  if (!ordered.length) {
    return likertCandidateSequence(q, direction);
  }

  return uniqueValues(ordered);
}

function uniqueValues(values) {
  const seen = new Set();
  const unique = [];
  for (const value of values) {
    const key = String(value || '').trim().toLowerCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    unique.push(value);
  }
  return unique;
}

function normalizeChoiceText(value) {
  return String(value || '')
    .toLowerCase()
    .replace(/&/g, ' dan ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function sameChoiceValue(a, b) {
  return normalizeChoiceText(a) === normalizeChoiceText(b);
}

function hasAnswerValue(value) {
  if (Array.isArray(value)) return value.some(hasAnswerValue);
  return String(value ?? '').trim() !== '';
}

function getSeminarFSTAnswer(q) {
  const haystack = `${q.title || ''} ${q.description || ''}`.toLowerCase();
  const compact = haystack.replace(/\s+/g, ' ');
  const options = q.options || [];

  if (!compact.includes('seminarfst') && !compact.includes('seminar fst')) {
    if (/\bnama\b/.test(compact)) return pickIndonesianFullName();
    if (/(program studi|prodi|jurusan)/.test(compact)) {
      return pick(['Teknik Informatika', 'Teknik Industri', 'Sistem Informasi', 'Matematika', 'Teknik Elektro']);
    }
    if (/(angkatan|tahun angkatan)/.test(compact)) return pick(['2022', '2023', '2024', '2025']);
    return null;
  }

  if (compact.includes('pernah menggunakan website seminarfst') || compact.includes('pernah menggunakan website seminar fst')) {
    return 'Ya';
  }

  if (/\bnama\b/.test(compact)) return pickIndonesianFullName();

  if (/(program studi|prodi|jurusan)/.test(compact)) {
    return pick(['Teknik Informatika', 'Teknik Industri', 'Sistem Informasi', 'Matematika', 'Teknik Elektro']);
  }

  if (/(angkatan|tahun angkatan)/.test(compact)) return pick(['2022', '2023', '2024', '2025']);

  if (/(kritik|saran|kendala|masukan)/.test(compact)) {
    return pick([
      'Website seminarFST sudah cukup membantu, tetapi tampilan jadwal dan alur pendaftaran bisa dibuat lebih jelas agar pengguna baru lebih mudah mengikuti seminar.',
      'Secara umum website seminarFST mudah digunakan. Saran saya, informasi seminar dan status pendaftaran dibuat lebih ringkas supaya cepat dipahami.',
      'Website seminarFST sudah baik, namun bagian panduan penggunaan sebaiknya diperjelas agar mahasiswa baru tidak bingung saat pertama kali mencoba.',
      'Fitur pencarian topik seminar bisa ditambahkan agar pengguna lebih cepat menemukan seminar yang sesuai minat.',
      'Tampilan website sudah rapi dan profesional. Mungkin bisa ditambahkan reminder otomatis sebelum jadwal seminar dimulai.',
      'Loading halaman kadang agak lambat saat banyak pengguna mengakses bersamaan, mungkin bisa dioptimasi dari sisi server.',
      'Navigasi antar halaman sudah cukup intuitif, tetapi halaman utama bisa dibuat lebih informatif dengan menampilkan seminar terbaru.',
      'Secara keseluruhan website bermanfaat untuk kegiatan seminar. Semoga terus dikembangkan dengan fitur-fitur baru yang memudahkan pengguna.'
    ]);
  }

  const hasLikertNumbers = options.some(option => String(option).trim() === '1') &&
    options.some(option => String(option).trim() === '5');
  if (hasLikertNumbers) {
    const confidentNoFear = /tidak takut salah/.test(compact);
    const negative = !confidentNoFear && /(rumit|bantuan orang lain|panduan teknis|tidak konsisten|membingungkan|tidak praktis|ribet|takut salah|membiasakan diri|belajar dulu|sulit|kendala)/.test(compact);
    if (negative) return pick(['1', '2']);

    const positive = /(sering menggunakan|mudah digunakan|terintegrasi|orang lain.*mempelajari|mempelajari.*mudah|percaya diri|selama masa perkuliahan|praktis)/.test(compact);
    if (positive) return pick(['4', '5']);

    return '4';
  }

  return null;
}

function pickContextualOption(q, respondent) {
  if (!q.options?.length) return '';

  const mapped = q.semanticType ? q : { ...q, ...classifyQuestion(q) };
  const profile = respondent || createRespondentProfile();
  const text = questionHaystack(mapped);

  if (mapped.semanticType === 'gender') return chooseGenderAnswer(mapped, profile);
  if (mapped.semanticType === 'age') return chooseAgeAnswer(mapped, profile);
  if (mapped.semanticType === 'nationality') return pickBestOption(mapped, ['Indonesia', 'WNI', 'Warga Negara Indonesia']);
  if (mapped.semanticType === 'domicile_country') return chooseIndonesiaDomicileAnswer(mapped);
  if (mapped.semanticType === 'birth_place') return pickBestOption(mapped, [profile.birthPlace, ...INDONESIAN_CITIES]);
  if (mapped.semanticType === 'city') return pickBestOption(mapped, [profile.city, ...INDONESIAN_CITIES]);
  if (mapped.semanticType === 'residence_area') return pickBestOption(mapped, [profile.residenceArea, 'Perkotaan', 'Perdesaan']);
  if (mapped.semanticType === 'marital_status') return chooseMaritalStatusAnswer(mapped, profile);
  if (mapped.semanticType === 'guardian') return pickBestOption(mapped, ['Orang tua', 'Wali', 'Ayah/Ibu']);
  if (mapped.semanticType === 'transportation') return chooseTransportationAnswer(mapped, profile);
  if (mapped.semanticType === 'religion') return pickBestOption(mapped, [profile.religion, ...RELIGION_OPTIONS]);
  if (mapped.semanticType === 'education') return pickBestOption(mapped, [profile.education, 'SMA/SMK', 'Diploma', 'Sarjana']);
  if (mapped.semanticType === 'occupation') return pickBestOption(mapped, [profile.occupation, 'Mahasiswa', 'Karyawan Swasta', 'Wirausaha']);
  if (mapped.semanticType === 'academic_semester') return chooseAcademicSemesterAnswer(mapped);
  if (mapped.semanticType === 'course_topic') return chooseCourseTopicAnswer(mapped);
  if (mapped.semanticType === 'ecommerce_platform') return chooseEcommercePlatformAnswer(mapped);
  if (mapped.semanticType === 'ai_recommendation_experience') return chooseAIRecommendationExperienceAnswer(mapped);
  if (mapped.semanticType === 'shopping_frequency') return chooseShoppingFrequencyAnswer(mapped);
  if (mapped.semanticType === 'shopping_category') return chooseShoppingCategoryAnswer(mapped);
  if (mapped.semanticType === 'yes_no_gate') return pickBestOption(mapped, ['Ya', 'Pernah', 'Sudah', 'Yes']);
  if (mapped.semanticType === 'consent_yes' || mapped.semanticType === 'yes_no_positive') return chooseYesNoAnswer(mapped, 'yes');
  if (mapped.semanticType === 'yes_no_negative') return chooseYesNoAnswer(mapped, 'no');
  if (mapped.semanticType === 'frequency_positive') return chooseFrequencyAnswer(mapped, 'positive');
  if (mapped.semanticType === 'frequency_negative') return chooseFrequencyAnswer(mapped, 'negative');
  if (mapped.semanticType === 'rating_positive') return chooseRatingAnswer(mapped, 'positive');
  if (mapped.semanticType === 'rating_negative') return chooseRatingAnswer(mapped, 'negative');
  if (mapped.semanticType === 'importance_high') return chooseImportanceAnswer(mapped);
  if (mapped.semanticType === 'likert_negative') return chooseLikertAnswer(mapped, 'negative');
  if (mapped.semanticType === 'likert_positive') return chooseLikertAnswer(mapped, 'positive');

  if (isLikertScale(mapped.options || [])) {
    return chooseLikertAnswer(mapped, isNegativeStatement(text) ? 'negative' : 'positive');
  }

  if (isSurveyScaleOptions(mapped.options || [])) {
    if (/(frekuensi|seberapa sering|berapa sering|intensitas|frequency|often)/.test(text)) {
      return chooseFrequencyAnswer(mapped, isNegativeStatement(text) ? 'negative' : 'positive');
    }
    if (/(penting|prioritas|important|priority)/.test(text)) return chooseImportanceAnswer(mapped);
    return chooseRatingAnswer(mapped, isNegativeStatement(text) ? 'negative' : 'positive');
  }

  if (hasOptionLike(mapped.options, /^(ya|yes)$/i) && hasOptionLike(mapped.options, /^(tidak|no)$/i)) {
    if (/(kendala|masalah|kesulitan|error|bug|bingung|keluhan|hambatan|gagal|takut|khawatir|komplain)/.test(text)) {
      return chooseYesNoAnswer(mapped, 'no');
    }
    if (/(bersedia|setuju|menyetujui|persetujuan|izin|mengizinkan|konfirmasi|siap|mau|ingin|tertarik|berminat)/.test(text)) {
      return chooseYesNoAnswer(mapped, 'yes');
    }
    if (/(pernah|sudah|menggunakan|mengakses|memakai|mencoba|mengunjungi|familiar)/.test(text)) {
      return pickBestOption(mapped, ['Ya', 'Pernah', 'Sudah', 'Yes']);
    }
  }

  return '';
}

function chooseGenericChoiceAnswer(q, respondent, runConfig = {}) {
  const contextual = pickContextualOption(q, respondent);
  if (contextual) return contextual;

  const options = meaningfulOptions(q.options || []);
  if (!options.length) return q.type === 'checkbox' ? [] : '';

  if (q.type === 'checkbox') {
    const compact = questionHaystack(q);
    const allowsMultiple = /(boleh pilih|pilih.*lebih dari|lebih dari 1|lebih dari satu|pilih maksimal|maksimal|minimal|paling banyak|hingga|sampai|centang|checkbox|multiple)/.test(compact);
    const minCount = Math.max(1, getChoiceMin(q));
    const maxCount = allowsMultiple
      ? Math.max(minCount, Math.min(options.length, getChoiceMax(q), 2))
      : minCount;
    return chooseDistributedOptions(q, runConfig, minCount, maxCount);
  }

  return chooseDistributedOptions(q, runConfig, 1, 1)[0] || pick(options);
}

function meaningfulOptions(options) {
  return (options || [])
    .map(option => String(option || '').trim())
    .filter(option => option && !/^(pilih|choose|select|lainnya:?|other:?|others?)$/i.test(option));
}

function adaptAnswerToOptions(q, answer, options = {}) {
  if (Array.isArray(answer)) return answer.map(item => adaptAnswerToOptions(q, item, options)).filter(Boolean);
  if (!q.options?.length) return answer;

  const raw = String(answer || '').trim();
  if (!raw) return '';

  const exact = q.options.find(option => sameChoiceValue(option, raw));
  if (exact) return exact;

  const partial = q.options.find(option => {
    const a = normalizeChoiceText(raw);
    const o = normalizeChoiceText(option);
    return a && o && (o.includes(a) || a.includes(o));
  });
  if (partial) return partial;

  if (options.strict) return '';
  return chooseRuleAnswer(q, [raw]);
}

function normalizeAnswersForQuestions(questions, answers, respondent) {
  const byQuestion = new Map((questions || []).map(q => [q.index, q]));
  let adjustedCount = 0;

  const normalized = (answers || [])
    .filter(item => item && Number.isInteger(item.index))
    .map(item => {
      const q = byQuestion.get(item.index);
      if (!q) return item;

      const answer = constrainAnswerToQuestion(q, item.answer, respondent);
      if (JSON.stringify(answer) !== JSON.stringify(item.answer)) adjustedCount++;
      return { ...item, answer };
    });

  return { answers: normalized, adjustedCount };
}

function constrainAnswerToQuestion(q, answer, respondent) {
  if (q?.type === 'checkbox') return constrainChoiceAnswer(q, answer, respondent);

  if (Array.isArray(answer)) {
    return answer.map(item => constrainAnswerToQuestion(q, item, respondent)).filter(Boolean);
  }

  if (!isTextQuestion(q)) return constrainChoiceAnswer(q, answer, respondent);

  const maxLength = getEffectiveTextMaxLength(q);
  let text = cleanAnswerText(answer);
  if (!text) text = contextualFallbackText(q, maxLength);

  if (!maxLength || text.length <= maxLength) return text;

  const contextual = contextualShortReplacement(q, maxLength);
  if (contextual) return contextual;

  return fitTextToMax(text, maxLength);
}

function constrainChoiceAnswer(q, answer, respondent) {
  if (!q.options?.length) return answer;

  if (q.type === 'checkbox') {
    const rawValues = Array.isArray(answer)
      ? answer
      : String(answer || '').split(/[,;|]/).map(item => item.trim()).filter(Boolean);
    const adapted = uniqueValues(rawValues.map(item => adaptAnswerToOptions(q, item, { strict: true })).filter(Boolean));
    if (adapted.length) return completeCheckboxAnswers(q, adapted, respondent);

    const smart = getSmartMappedAnswer(q, respondent);
    const smartValues = Array.isArray(smart) ? smart : [smart];
    const smartAdapted = uniqueValues(smartValues.map(item => adaptAnswerToOptions(q, item, { strict: true })).filter(Boolean));
    if (smartAdapted.length) return completeCheckboxAnswers(q, smartAdapted, respondent);

    const contextual = pickContextualOption(q, respondent);
    if (contextual) return completeCheckboxAnswers(q, [contextual], respondent);
    const generic = chooseGenericChoiceAnswer(q, respondent);
    return completeCheckboxAnswers(q, Array.isArray(generic) ? generic : (generic ? [generic] : []), respondent);
  }

  const adapted = adaptAnswerToOptions(q, answer, { strict: true });
  if (adapted) return adapted;

  const smart = getSmartMappedAnswer(q, respondent);
  const smartAdapted = adaptAnswerToOptions(q, smart, { strict: true });
  if (smartAdapted) return smartAdapted;

  return pickContextualOption(q, respondent) || chooseGenericChoiceAnswer(q, respondent) || '';
}

function completeCheckboxAnswers(q, values, respondent) {
  const max = getChoiceMax(q);
  const min = getChoiceMin(q);
  const out = uniqueValues((values || []).map(item => adaptAnswerToOptions(q, item, { strict: true })).filter(Boolean));
  const options = meaningfulOptions(q.options || []);

  for (const option of options) {
    if (out.length >= min) break;
    if (!out.some(item => sameChoiceValue(item, option))) out.push(option);
  }

  if (!out.length && options.length) out.push(options[0]);
  return out.slice(0, max);
}

function getChoiceMax(q) {
  const value = Number(q?.choiceMax || 0);
  if (Number.isFinite(value) && value > 0) return Math.max(1, Math.min(20, Math.floor(value)));
  return 5;
}

function getChoiceMin(q) {
  const value = Number(q?.choiceMin || 0);
  if (!Number.isFinite(value) || value <= 0) return 1;
  return Math.max(1, Math.min(getChoiceMax(q), Math.floor(value)));
}

function isTextQuestion(q) {
  return q && (q.type === 'short_text' || q.type === 'long_text');
}

function isChoiceQuestion(q) {
  return q && ['radio', 'dropdown', 'checkbox', 'grid_radio', 'grid_checkbox'].includes(q.type);
}

function getQuestionMaxLength(q) {
  const value = Number(q?.maxLength || 0);
  return Number.isFinite(value) && value > 0 ? Math.floor(value) : 0;
}

function getEffectiveTextMaxLength(q) {
  const explicit = getQuestionMaxLength(q);
  if (explicit) return explicit;
  return q?.type === 'short_text' ? 50 : 0;
}

function cleanAnswerText(answer) {
  return String(answer ?? '')
    .replace(/\s+/g, ' ')
    .trim();
}

function contextualShortReplacement(q, maxLength) {
  const compact = questionHaystack(q);
  const candidates = [];

  if (/\bwali\b|nama wali|orang tua/.test(compact)) candidates.push(pickIndonesianFullName());
  if ((/\bnama\b|nama lengkap/.test(compact)) && !(/\bwali\b|orang tua/.test(compact))) candidates.push(pickIndonesianFullName());
  if (/(usia|umur|\bage\b)/.test(compact)) candidates.push(String(randomInt(18, 29)));
  if (/(jenis kelamin|gender|\bkelamin\b)/.test(compact)) candidates.push('Laki - Laki', 'Perempuan');
  if (/(kewarganegaraan|kewarnegaraan|kebangsaan|warga negara|nationality)/.test(compact)) candidates.push('Indonesia');
  if (/(domisili|tempat tinggal|tinggal|berada|lokasi).*(indonesia|negara)|negara.*(domisili|tempat tinggal|tinggal|berada|lokasi)/.test(compact)) candidates.push('Indonesia');
  if (/(tempat lahir|kota lahir)/.test(compact)) candidates.push(pick(INDONESIAN_CITIES));
  if (/(tanggal lahir|tgl lahir|date of birth)/.test(compact)) candidates.push(makeBirthDate(randomInt(19, 28)));
  if (/(status pernikahan|status perkawinan|marital)/.test(compact)) candidates.push('Belum Menikah');
  if (/(transportasi|kendaraan)/.test(compact)) candidates.push(pick(TRANSPORT_OPTIONS));
  if (/(agama|religion)/.test(compact)) candidates.push(pick(RELIGION_OPTIONS));
  if (/(alamat lengkap|alamat rumah|\balamat\b|address)/.test(compact)) {
    const city = pick(INDONESIAN_CITIES);
    candidates.push(`Jl. ${pick(INDONESIAN_STREET_NAMES)} No. ${randomInt(3, 98)}, ${city}`);
  }
  if (/(topik|mata kuliah|matakuliah|course|subject)/.test(compact)) candidates.push('Pemrograman Dasar', 'Kalkulus', 'Basis Data');
  if (/(tingkat semester|status akademik|semester saat ini|semester anda|semester \*)/.test(compact)) candidates.push('6', '4', '2');
  if (/(email|e-mail|surel)/.test(compact)) candidates.push(generateRealisticEmail(pickIndonesianFullName()));
  if (/(no hp|nomor hp|telepon|whatsapp|\bwa\b|ponsel|handphone)/.test(compact)) candidates.push(generateRealisticPhone());
  if (/(kota|domisili|asal daerah|tempat tinggal)/.test(compact)) candidates.push(pick(INDONESIAN_CITIES));
  if (/(program studi|prodi|jurusan|rekomendasi program studi)/.test(compact)) candidates.push(pick(['Teknik Informatika', 'Sistem Informasi', 'Teknik Industri']));
  if (/(angkatan|tahun angkatan)/.test(compact)) candidates.push(pick(['2022', '2023', '2024', '2025']));
  if (/(platform|marketplace|e-?commerce|toko online|aplikasi belanja|belanja online)/.test(compact)) candidates.push(pick(ECOMMERCE_PLATFORMS));
  if (/(kategori produk|jenis produk|produk apa|barang apa)/.test(compact)) candidates.push(pick(['Fashion', 'Elektronik', 'Kecantikan', 'Perlengkapan rumah']));
  if (/(kritik|kendala)/.test(compact)) candidates.push(...pickMultipleFromPool(FEEDBACK_POOL.kendala, 3));
  if (/(saran|masukan)/.test(compact)) candidates.push(...pickMultipleFromPool(FEEDBACK_POOL.saran, 3));
  if (/(komentar|pendapat|ulasan|pengalaman)/.test(compact)) candidates.push(...pickMultipleFromPool(FEEDBACK_POOL.komentar, 3));
  if (/(alasan|mengapa|kenapa)/.test(compact)) candidates.push(...pickMultipleFromPool(FEEDBACK_POOL.alasan, 3));
  if (/(harapan|ekspektasi)/.test(compact)) candidates.push(...pickMultipleFromPool(FEEDBACK_POOL.harapan, 3));

  return firstFittingText(candidates, maxLength);
}

function pickSmartFeedbackText(q, maxLength = 0, runConfig = {}) {
  const compact = questionHaystack(q);
  let pool = [];

  if (/(kritik|kendala|masalah|kesulitan|hambatan)/.test(compact)) {
    pool = FEEDBACK_POOL.kendala;
  } else if (/(saran|masukan|rekomendasi\b)/.test(compact)) {
    pool = FEEDBACK_POOL.saran;
  } else if (/(harapan|ekspektasi|ke depan|masa depan)/.test(compact)) {
    pool = FEEDBACK_POOL.harapan;
  } else if (/(alasan|mengapa|kenapa|sebab|motivasi)/.test(compact)) {
    pool = FEEDBACK_POOL.alasan;
  } else if (/(komentar|pendapat|ulasan|pengalaman|kesan|pesan)/.test(compact)) {
    pool = FEEDBACK_POOL.komentar;
  } else {
    pool = [...FEEDBACK_POOL.saran, ...FEEDBACK_POOL.komentar];
  }

  if (!pool.length) return contextualFallbackText(q, maxLength);

  return pickUniqueFeedbackText([...pool, ...buildContextualFeedbackVariants(q)], q, maxLength, runConfig);
}

function pickUniqueFeedbackText(pool, q, maxLength = 0, runConfig = {}) {
  const candidates = uniqueValues((pool || [])
    .map(cleanAnswerText)
    .filter(Boolean)
    .map(item => maxLength ? fitTextToMax(item, maxLength) : item))
    .filter(item => item && (!maxLength || item.length <= maxLength));

  if (!candidates.length) return contextualFallbackText(q, maxLength);

  const unused = candidates.filter(item => !runFeedbackTokens.has(feedbackToken(item)));
  const chosen = pick(unused.length ? unused : candidates);
  rememberFeedbackText(chosen, runConfig);
  return chosen;
}

function buildContextualFeedbackVariants(q) {
  const compact = questionHaystack(q);
  const variants = [];

  if (/(e-?commerce|marketplace|belanja online|rekomendasi produk|ai recommendation|produk yang mungkin kamu suka|untukmu|sering dibeli bersama)/.test(compact)) {
    variants.push(
      'Rekomendasi produk cukup membantu saat mencari barang yang mirip dengan kebutuhan saya.',
      'Fitur rekomendasi membuat proses membandingkan produk terasa lebih cepat dan praktis.',
      'Saya lebih terbantu jika rekomendasi menampilkan alasan produk itu cocok dengan pencarian saya.',
      'Rekomendasi yang relevan membuat saya lebih percaya diri sebelum memasukkan produk ke keranjang.',
      'Kadang rekomendasinya masih terlalu umum, tetapi tetap membantu menemukan pilihan awal.',
      'Akan lebih baik jika rekomendasi produk bisa disaring berdasarkan harga dan ulasan pembeli.'
    );
  }

  const aspects = [
    'tampilan',
    'alur penggunaan',
    'kecepatan akses',
    'kelengkapan informasi',
    'navigasi',
    'fitur pencarian',
    'notifikasi',
    'kejelasan instruksi'
  ];
  const actions = [
    'dibuat lebih ringkas',
    'ditata lebih konsisten',
    'ditingkatkan lagi',
    'dibuat lebih mudah dipahami',
    'dioptimalkan saat banyak pengguna',
    'dilengkapi dengan panduan singkat'
  ];

  const seed = stableHash(`${compact}|${Date.now()}|${Math.random()}`);
  for (let i = 0; i < 8; i++) {
    const aspect = aspects[(seed + i * 3) % aspects.length];
    const action = actions[(seed + i * 5) % actions.length];
    variants.push(`Menurut saya ${aspect} sudah cukup baik, tetapi masih bisa ${action}.`);
  }

  return variants;
}

function rememberFeedbackText(text, runConfig = {}) {
  const token = feedbackToken(text);
  if (!token) return;
  runFeedbackTokens.add(token);

  if (!shouldPersistGeneratedData(runConfig)) return;

  respondentHistory.feedback = [
    { createdAt: new Date().toISOString(), text: cleanAnswerText(text) },
    ...(respondentHistory.feedback || []).filter(item => feedbackToken(item?.text || item) !== token)
  ].slice(0, 5000);
  saveRespondentHistory();
}

function feedbackToken(value) {
  return cleanAnswerText(value)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function pickMultipleFromPool(pool, count) {
  const shuffled = [...pool].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

function contextualFallbackText(q, maxLength = 0) {
  const contextual = contextualShortReplacement(q, maxLength);
  if (contextual) return contextual;

  const genericPool = [
    'Sudah cukup jelas dan mudah dipahami.',
    'Secara umum sudah baik dan informatif.',
    'Tidak ada masalah berarti, semua berjalan lancar.',
    'Pengalaman yang menyenangkan dan bermanfaat.',
    'Informasinya lengkap dan mudah diakses.',
    'Tampilannya sudah bagus dan user-friendly.',
    'Cukup puas dengan layanan yang diberikan.',
    'Semoga terus ditingkatkan kualitasnya.',
    'Proses penggunaannya intuitif dan efisien.',
    'Sudah memenuhi kebutuhan pengguna dengan baik.'
  ];

  const fallback = q?.type === 'long_text'
    ? pick(genericPool)
    : pick(['Baik', 'Sudah baik', 'Cukup baik', 'Memuaskan', 'Bagus']);
  return fitTextToMax(fallback, maxLength);
}

function firstFittingText(candidates, maxLength) {
  const values = candidates.map(cleanAnswerText).filter(Boolean);
  if (!values.length) return '';
  if (!maxLength) return values[0];
  return values.find(value => value.length <= maxLength) || fitTextToMax(values[0], maxLength);
}

function fitTextToMax(text, maxLength) {
  const clean = cleanAnswerText(text);
  if (!maxLength || clean.length <= maxLength) return clean;
  if (maxLength <= 3) return clean.slice(0, maxLength).trim();

  const firstSentence = clean.split(/[.!?]\s*/)[0].trim();
  if (firstSentence && firstSentence.length <= maxLength) return firstSentence;

  const wordCut = clean
    .slice(0, maxLength)
    .replace(/\s+\S*$/, '')
    .replace(/[,.!?;:]+$/, '')
    .trim();
  if (wordCut.length >= Math.min(8, maxLength)) return wordCut;

  return clean.slice(0, maxLength).trim();
}

function questionHaystack(q) {
  return `${q?.title || ''} ${q?.description || ''} ${q?.placeholder || ''} ${q?.constraintText || ''}`
    .toLowerCase()
    .replace(/\s+/g, ' ');
}

function normalizeRunItems(runConfig) {
  const rawItems = Array.isArray(runConfig.runItems) && runConfig.runItems.length
    ? runConfig.runItems
    : normalizeFormLinks(runConfig.links).map((url, index) => ({
      id: `form-${index + 1}`,
      url,
      profileName: runConfig.smartAutoMode !== false ? 'Auto Analyze' : inferProfileName(url, runConfig.customRulesText),
      customRulesText: runConfig.customRulesText,
      responsesPerLink: runConfig.responsesPerLink
    }));

  const out = [];
  const seen = new Set();
  for (let index = 0; index < rawItems.length; index++) {
    const item = rawItems[index] || {};
    const url = cleanFormUrl(item.url || item.link || item.href || '');
    if (!url || seen.has(url)) continue;
    seen.add(url);
    const profileName = runConfig.smartAutoMode !== false
      ? 'Auto Analyze'
      : String(item.profileName || inferProfileName(url, item.customRulesText || runConfig.customRulesText));
    const profileRules = runConfig.smartAutoMode !== false ? '' : runConfig.profiles?.[item.profileName]?.rules;

    out.push({
      id: String(item.id || `form-${index + 1}`),
      url,
      profileName,
      customRulesText: refreshNameRule(item.customRulesText || item.rules || profileRules || runConfig.customRulesText || DEFAULT_RULES),
      responsesPerLink: Math.max(1, Number(item.responsesPerLink || runConfig.responsesPerLink || 1))
    });
  }

  return out;
}

function expandRunJobs(items) {
  const jobs = [];
  for (let linkIndex = 0; linkIndex < items.length; linkIndex++) {
    const item = items[linkIndex];
    for (let attempt = 1; attempt <= item.responsesPerLink; attempt++) {
      jobs.push({
        id: `${item.id}-${attempt}-${Date.now()}-${Math.random().toString(16).slice(2, 6)}`,
        itemId: item.id,
        linkIndex,
        url: item.url,
        profileName: item.profileName,
        customRulesText: item.customRulesText,
        attempt,
        totalForLink: item.responsesPerLink
      });
    }
  }
  return jobs;
}

function inferProfileName(url, rulesText = '') {
  const source = `${url} ${rulesText}`.toLowerCase();
  if (source.includes('seminarfst') || source.includes('seminar fst')) return 'seminarFST';
  return 'Default';
}

function normalizeFormLinks(raw) {
  const text = Array.isArray(raw) ? raw.join('\n') : String(raw || '');
  const matches = text.match(/https?:\/\/(?:docs\.google\.com\/forms\/[^\s"'<>]+|forms\.gle\/[^\s"'<>]+)/gi) || [];
  const loose = text.split(/\s+/).filter(part => /^(docs\.google\.com\/forms\/|forms\.gle\/)/i.test(part));
  const seen = new Set();
  const out = [];

  for (let url of matches.concat(loose)) {
    url = cleanFormUrl(url);
    if (url && !seen.has(url)) {
      seen.add(url);
      out.push(url);
    }
  }
  return out;
}

function cleanFormUrl(raw) {
  let url = String(raw || '').trim().replace(/[),.;]+$/, '');
  if (!url) return '';
  if (!/^https?:\/\//i.test(url)) url = `https://${url}`;
  try {
    const parsed = new URL(url);
    const host = parsed.hostname.toLowerCase();
    const ok = host === 'forms.gle' || (host === 'docs.google.com' && parsed.pathname.startsWith('/forms/'));
    return ok ? parsed.toString() : '';
  } catch (_) {
    return '';
  }
}

function normalizeConfig(value) {
  const profiles = normalizeProfiles(value.profiles || {}, value.customRulesText || DEFAULT_RULES);
  return {
    systemName: cleanSystemName(value.systemName || APP_NAME),
    ownerName: cleanSystemName(value.ownerName || APP_OWNER),
    provider: value.provider || 'openclaw',
    baseUrl: value.baseUrl || 'http://localhost:18789/v1/responses',
    model: value.model || (value.provider === 'openai' ? 'chat-latest' : 'openai-codex/gpt-5.4'),
    apiKey: value.apiKey || '',
    customRulesText: refreshNameRule(value.customRulesText || DEFAULT_RULES),
    links: value.links || '',
    profiles,
    runItems: Array.isArray(value.runItems) ? value.runItems.map(item => ({
      id: String(item.id || ''),
      url: cleanFormUrl(item.url || item.link || ''),
      profileName: String(item.profileName || 'Default'),
      customRulesText: refreshNameRule(item.customRulesText || profiles[item.profileName]?.rules || value.customRulesText || DEFAULT_RULES),
      responsesPerLink: Math.max(1, Number(item.responsesPerLink || value.responsesPerLink || 1))
    })).filter(item => item.url) : [],
    responsesPerLink: Math.max(1, Number(value.responsesPerLink || 1)),
    headless: !!value.headless,
    dryRun: !!value.dryRun,
    smartAutoMode: value.smartAutoMode !== false,
    localLikertAlways: true,
    disableFastLikert: !!value.disableFastLikert,
    fastMode: !!value.fastMode,
    reviewBeforeSubmit: value.reviewBeforeSubmit !== false,
    storage: normalizeStorage(value.storage)
  };
}

function mergeConfigPatch(base, patch = {}) {
  const merged = {
    ...base,
    ...patch
  };

  if (patch.apiKey === 'saved') merged.apiKey = base.apiKey || '';

  if (patch.storage) {
    merged.storage = {
      ...(base.storage || DEFAULT_STORAGE),
      ...patch.storage,
      mysql: {
        ...DEFAULT_STORAGE.mysql,
        ...(base.storage?.mysql || {}),
        ...(patch.storage.mysql || {})
      }
    };
    if (patch.storage.mysql?.password === 'saved') {
      merged.storage.mysql.password = base.storage?.mysql?.password || '';
    }
  }

  return merged;
}

function cleanSystemName(value) {
  return String(value || '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 80);
}

function normalizeStorage(value = {}) {
  const source = value && typeof value === 'object' ? value : {};
  const mysql = source.mysql && typeof source.mysql === 'object' ? source.mysql : {};
  return {
    type: source.type === 'mysql' ? 'mysql' : 'local',
    mysql: {
      host: String(mysql.host || DEFAULT_STORAGE.mysql.host).trim() || DEFAULT_STORAGE.mysql.host,
      port: Math.max(1, Math.min(65535, Number(mysql.port || DEFAULT_STORAGE.mysql.port))),
      database: cleanMysqlIdentifier(mysql.database || DEFAULT_STORAGE.mysql.database),
      user: String(mysql.user || DEFAULT_STORAGE.mysql.user).trim(),
      password: String(mysql.password || '')
    }
  };
}

function normalizeProfiles(rawProfiles, globalRules) {
  const profiles = {};
  const source = rawProfiles && typeof rawProfiles === 'object' ? rawProfiles : {};

  for (const [name, profile] of Object.entries(source)) {
    const cleanName = cleanProfileName(name);
    if (!cleanName) continue;
    const rules = typeof profile === 'string' ? profile : profile?.rules;
    profiles[cleanName] = {
      name: cleanName,
      rules: refreshNameRule(rules || globalRules || DEFAULT_RULES),
      locked: isSystemProfile(cleanName),
      builder: normalizeProfileBuilder(profile?.builder)
    };
  }

  profiles.Default = {
    name: 'Default',
    rules: refreshNameRule(profiles.Default?.rules || TEMPLATE_RULES.Default || globalRules || DEFAULT_RULES),
    locked: true,
    builder: normalizeProfileBuilder(profiles.Default?.builder)
  };

  for (const [name, rules] of Object.entries(TEMPLATE_RULES)) {
    if (name === 'Default') continue;
    profiles[name] = {
      name,
      rules: refreshNameRule(profiles[name]?.rules || rules),
      locked: true,
      builder: normalizeProfileBuilder(profiles[name]?.builder)
    };
  }

  profiles.Custom = {
    name: 'Custom',
    rules: refreshNameRule(profiles.Custom?.rules || globalRules || DEFAULT_RULES),
    locked: true,
    builder: normalizeProfileBuilder(profiles.Custom?.builder)
  };

  return profiles;
}

function isSystemProfile(name) {
  return name === 'Default' || name === 'seminarFST' || name === 'Survey Kepuasan' || name === 'Tracer Study' || name === 'Rekomendasi Prodi' || name === 'Custom';
}

function normalizeProfileBuilder(value = {}) {
  value = value && typeof value === 'object' ? value : {};
  return {
    nameWordsMin: Math.max(1, Math.min(3, Number(value.nameWordsMin || 2))),
    nameWordsMax: Math.max(2, Math.min(4, Number(value.nameWordsMax || 3))),
    yesGateAnswer: value.yesGateAnswer || 'Ya',
    likertPositive: value.likertPositive || '4 | 5',
    likertNegative: value.likertNegative || '1 | 2',
    maxRecommendation: Math.max(1, Math.min(5, Number(value.maxRecommendation || 5))),
    feedbackTone: value.feedbackTone || 'natural'
  };
}

function cleanProfileName(name) {
  return String(name || '')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function refreshNameRule(text) {
  const nameRule = `nama, nama lengkap => ${sampleIndonesianFullNames(24).join(' | ')}`;
  const source = String(text || DEFAULT_RULES);
  if (/^nama\s*,\s*nama lengkap\s*=>.*$/im.test(source)) {
    return source.replace(/^nama\s*,\s*nama lengkap\s*=>.*$/im, nameRule);
  }
  return `${source.trim()}\n${nameRule}`;
}

function loadConfig() {
  try {
    return normalizeConfig(JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8')));
  } catch (_) {
    return normalizeConfig({});
  }
}

async function saveConfig(nextConfig) {
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(nextConfig, null, 2));
  await persistAppState(nextConfig);
}

function publicConfig(value) {
  return {
    ...value,
    apiKey: value.apiKey ? 'saved' : '',
    storage: publicStorage(value.storage)
  };
}

function publicStorage(storage) {
  const normalized = normalizeStorage(storage);
  return {
    ...normalized,
    mysql: {
      ...normalized.mysql,
      password: normalized.mysql.password ? 'saved' : ''
    }
  };
}

function storageOverview(storage) {
  const normalized = normalizeStorage(storage);
  if (normalized.type !== 'mysql') {
    return {
      ok: true,
      type: 'local',
      status: 'local_json',
      message: 'Local JSON aktif.',
      label: 'Local JSON'
    };
  }

  return {
    ok: null,
    type: 'mysql',
    status: 'not_checked',
    message: 'MySQL belum dicek.',
    label: `${normalized.mysql.user || 'user'}@${normalized.mysql.host}:${normalized.mysql.port}/${normalized.mysql.database}`
  };
}

async function testStorageConnection(storage, updateStatus = false) {
  const normalized = normalizeStorage(storage);
  if (normalized.type !== 'mysql') {
    const local = storageOverview(normalized);
    if (updateStatus) storageStatus = local;
    return local;
  }

  let connection;
  try {
    connection = await openMysqlConnection(normalized.mysql, true);
    await connection.ping();
    const result = {
      ok: true,
      type: 'mysql',
      status: 'connected',
      message: 'MySQL connected. Schema siap dipakai.',
      label: `${normalized.mysql.user || 'user'}@${normalized.mysql.host}:${normalized.mysql.port}/${normalized.mysql.database}`
    };
    storageStatus = result;
    return result;
  } catch (err) {
    const result = {
      ok: false,
      type: 'mysql',
      status: 'error',
      message: err.message,
      label: `${normalized.mysql.user || 'user'}@${normalized.mysql.host}:${normalized.mysql.port}/${normalized.mysql.database}`
    };
    if (updateStatus) storageStatus = result;
    return result;
  } finally {
    try { if (connection) await connection.end(); } catch (_) {}
  }
}

async function storageDashboard() {
  const normalized = normalizeStorage(config.storage);
  const base = {
    generatedAt: new Date().toISOString(),
    storage: storageOverview(normalized),
    engine: normalized.type,
    database: publicStorage(normalized),
    metrics: {
      reports: 0,
      jobs: 0,
      success: 0,
      failed: 0,
      dryRun: 0,
      skipped: 0
    },
    schema: {
      ready: normalized.type !== 'mysql',
      tables: [],
      configSyncedAt: null
    },
    latestReport: summarizeStoredReport(lastReport),
    reports: [],
    safety: storageSafetyNotes(normalized)
  };

  if (normalized.type !== 'mysql') {
    return {
      ok: true,
      ...base,
      storage: storageOverview(normalized),
      reports: lastReport?.id ? [summarizeStoredReport(lastReport)] : [],
      message: 'Local JSON aktif. Untuk penyimpanan utama gunakan MySQL.'
    };
  }

  let connection;
  try {
    connection = await openMysqlConnection(normalized.mysql, true);
    await connection.ping();

    const [stateRows] = await connection.query('SELECT state_key, updated_at FROM kk_app_state ORDER BY updated_at DESC');
    const [tableRows] = await connection.query(
      `SELECT table_name AS name, table_rows AS rowCount, data_length AS dataLength, index_length AS indexLength
       FROM information_schema.tables
       WHERE table_schema = ? AND table_name IN ('kk_app_state', 'kk_run_reports')
       ORDER BY table_name`,
      [normalized.mysql.database]
    );
    const [reportRows] = await connection.query(
      `SELECT id, status, started_at, ended_at, updated_at, report_json
       FROM kk_run_reports
       ORDER BY COALESCE(started_at, updated_at) DESC
       LIMIT 12`
    );
    const [countRows] = await connection.query('SELECT COUNT(*) AS total FROM kk_run_reports');

    const reports = reportRows.map(row => summarizeStoredReport(parseStoredReport(row.report_json), row));
    const metrics = reports.reduce((acc, item) => {
      acc.reports += 1;
      acc.jobs += Number(item.totals?.queued || 0);
      acc.success += Number(item.totals?.success || 0);
      acc.failed += Number(item.totals?.failed || 0);
      acc.dryRun += Number(item.totals?.dryRun || 0);
      acc.skipped += Number(item.totals?.skipped || 0);
      return acc;
    }, { reports: 0, jobs: 0, success: 0, failed: 0, dryRun: 0, skipped: 0 });
    metrics.reports = Number(countRows[0]?.total || metrics.reports);

    const configState = stateRows.find(row => row.state_key === 'config');
    const result = {
      ok: true,
      ...base,
      storage: {
        ok: true,
        type: 'mysql',
        status: 'connected',
        message: 'MySQL connected. Schema siap dipakai.',
        label: `${normalized.mysql.user || 'user'}@${normalized.mysql.host}:${normalized.mysql.port}/${normalized.mysql.database}`
      },
      metrics,
      schema: {
        ready: hasRequiredStorageTables(tableRows),
        tables: tableRows.map(row => ({
          name: row.name,
          rows: Number(row.rowCount || 0),
          sizeKb: Math.round((Number(row.dataLength || 0) + Number(row.indexLength || 0)) / 1024)
        })),
        configSyncedAt: configState?.updated_at ? new Date(configState.updated_at).toISOString() : null
      },
      latestReport: reports[0] || summarizeStoredReport(lastReport),
      reports,
      message: 'Storage dashboard siap.'
    };
    storageStatus = result.storage;
    return result;
  } catch (err) {
    const failed = {
      ok: false,
      ...base,
      storage: {
        ok: false,
        type: 'mysql',
        status: 'error',
        message: err.message,
        label: `${normalized.mysql.user || 'user'}@${normalized.mysql.host}:${normalized.mysql.port}/${normalized.mysql.database}`
      },
      message: err.message
    };
    storageStatus = failed.storage;
    return failed;
  } finally {
    try { if (connection) await connection.end(); } catch (_) {}
  }
}

async function storageBackup() {
  const normalized = normalizeStorage(config.storage);
  const backup = {
    id: `kuneku-storage-backup-${timestampSlug()}`,
    generatedAt: new Date().toISOString(),
    app: {
      name: config.systemName || APP_NAME,
      owner: config.ownerName || APP_OWNER
    },
    storage: publicStorage(normalized),
    config: publicConfig(config),
    reports: [],
    note: 'Backup ini tidak menyertakan password database atau API key.'
  };

  if (normalized.type !== 'mysql') {
    backup.reports = lastReport?.id ? [publicReport(lastReport)] : [];
    return backup;
  }

  let connection;
  try {
    connection = await openMysqlConnection(normalized.mysql, true);
    const [rows] = await connection.query(
      `SELECT report_json
       FROM kk_run_reports
       ORDER BY COALESCE(started_at, updated_at) DESC
       LIMIT 100`
    );
    backup.reports = rows.map(row => parseStoredReport(row.report_json)).filter(Boolean);
    return backup;
  } finally {
    try { if (connection) await connection.end(); } catch (_) {}
  }
}

function hasRequiredStorageTables(rows) {
  const names = new Set((rows || []).map(row => String(row.name || '').toLowerCase()));
  return names.has('kk_app_state') && names.has('kk_run_reports');
}

function parseStoredReport(value) {
  if (!value) return null;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(String(value));
  } catch (_) {
    return null;
  }
}

function summarizeStoredReport(report, row = {}) {
  const source = report || {};
  const totals = source.totals || {};
  return {
    id: source.id || row.id || '',
    status: source.status || row.status || 'idle',
    startedAt: source.startedAt || mysqlRowDate(row.started_at),
    endedAt: source.endedAt || mysqlRowDate(row.ended_at),
    updatedAt: mysqlRowDate(row.updated_at),
    profileCount: Array.isArray(source.runItems) ? new Set(source.runItems.map(item => item.profileName || 'Default')).size : 0,
    linkCount: Array.isArray(source.runItems) ? source.runItems.length : 0,
    totals: {
      queued: Number(totals.queued || 0),
      success: Number(totals.success || 0),
      dryRun: Number(totals.dryRun || 0),
      failed: Number(totals.failed || 0),
      skipped: Number(totals.skipped || 0)
    },
    error: source.error || ''
  };
}

function mysqlRowDate(value) {
  if (!value) return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
}

function storageSafetyNotes(storage) {
  if (storage.type !== 'mysql') {
    return [
      'Mode Local JSON cocok untuk konfigurasi ringan, bukan database utama.',
      'Aktifkan MySQL untuk menyimpan config dan run report secara persisten.'
    ];
  }
  return [
    'Password dan API key tidak pernah dikirim kembali ke dashboard.',
    'Schema dibuat otomatis dengan tabel kk_app_state dan kk_run_reports.',
    'Backup JSON mengekspor config aman dan maksimal 100 report terbaru.'
  ];
}

async function persistAppState(nextConfig) {
  const storage = normalizeStorage(nextConfig.storage);
  if (storage.type !== 'mysql') {
    storageStatus = storageOverview(storage);
    return;
  }

  let connection;
  try {
    connection = await openMysqlConnection(storage.mysql, true);
    await connection.execute(
      'REPLACE INTO kk_app_state (state_key, state_json, updated_at) VALUES (?, ?, NOW())',
      ['config', JSON.stringify(nextConfig)]
    );
    storageStatus = {
      ok: true,
      type: 'mysql',
      status: 'synced',
      message: 'Config tersimpan ke MySQL.',
      label: `${storage.mysql.user || 'user'}@${storage.mysql.host}:${storage.mysql.port}/${storage.mysql.database}`
    };
  } catch (err) {
    storageStatus = {
      ok: false,
      type: 'mysql',
      status: 'sync_failed',
      message: err.message,
      label: `${storage.mysql.user || 'user'}@${storage.mysql.host}:${storage.mysql.port}/${storage.mysql.database}`
    };
  } finally {
    try { if (connection) await connection.end(); } catch (_) {}
  }
}

async function persistReportSnapshot() {
  const storage = normalizeStorage(config.storage);
  if (storage.type !== 'mysql' || !lastReport?.id) return;

  let connection;
  try {
    connection = await openMysqlConnection(storage.mysql, true);
    await connection.execute(
      `REPLACE INTO kk_run_reports
        (id, status, started_at, ended_at, report_json, updated_at)
       VALUES (?, ?, ?, ?, ?, NOW())`,
      [
        lastReport.id,
        lastReport.status || 'idle',
        mysqlDate(lastReport.startedAt),
        mysqlDate(lastReport.endedAt),
        JSON.stringify(publicReport(lastReport))
      ]
    );
    storageStatus = {
      ok: true,
      type: 'mysql',
      status: 'report_synced',
      message: 'Run report tersimpan ke MySQL.',
      label: `${storage.mysql.user || 'user'}@${storage.mysql.host}:${storage.mysql.port}/${storage.mysql.database}`
    };
  } catch (err) {
    storageStatus = {
      ok: false,
      type: 'mysql',
      status: 'report_sync_failed',
      message: err.message,
      label: `${storage.mysql.user || 'user'}@${storage.mysql.host}:${storage.mysql.port}/${storage.mysql.database}`
    };
  } finally {
    try { if (connection) await connection.end(); } catch (_) {}
  }
}

async function openMysqlConnection(mysqlConfig, ensureSchema) {
  const mysql = require('mysql2/promise');
  const database = cleanMysqlIdentifier(mysqlConfig.database || DEFAULT_STORAGE.mysql.database);
  const connection = await mysql.createConnection({
    host: mysqlConfig.host,
    port: mysqlConfig.port,
    user: mysqlConfig.user,
    password: mysqlConfig.password,
    connectTimeout: 6000,
    charset: 'utf8mb4'
  });

  if (ensureSchema) {
    await connection.query(`CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  }

  await connection.query(`USE \`${database}\``);

  if (ensureSchema) {
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kk_app_state (
        state_key VARCHAR(80) NOT NULL PRIMARY KEY,
        state_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
    await connection.query(`
      CREATE TABLE IF NOT EXISTS kk_run_reports (
        id VARCHAR(80) NOT NULL PRIMARY KEY,
        status VARCHAR(40) NOT NULL,
        started_at DATETIME NULL,
        ended_at DATETIME NULL,
        report_json LONGTEXT NOT NULL,
        updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
        INDEX idx_status (status),
        INDEX idx_started_at (started_at)
      ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);
  }

  return connection;
}

function cleanMysqlIdentifier(value) {
  const clean = String(value || DEFAULT_STORAGE.mysql.database)
    .replace(/[^a-zA-Z0-9_]/g, '_')
    .replace(/^_+|_+$/g, '')
    .slice(0, 64);
  return clean || DEFAULT_STORAGE.mysql.database;
}

function mysqlDate(value) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function createEmptyReport() {
  return {
    id: '',
    systemName: APP_NAME,
    ownerName: APP_OWNER,
    status: 'idle',
    dryRun: false,
    startedAt: '',
    endedAt: '',
    error: '',
    totals: { queued: 0, success: 0, dryRun: 0, failed: 0, skipped: 0 },
    items: [],
    jobs: []
  };
}

function createRunReport(runConfig, items, jobs) {
  return {
    id: timestampSlug(),
    systemName: runConfig.systemName || APP_NAME,
    ownerName: runConfig.ownerName || APP_OWNER,
    status: 'running',
    dryRun: !!runConfig.dryRun,
    startedAt: new Date().toISOString(),
    endedAt: '',
    error: '',
    totals: { queued: jobs.length, success: 0, dryRun: 0, failed: 0, skipped: 0 },
    items: items.map((item, index) => ({
      index,
      id: item.id,
      url: item.url,
      profileName: item.profileName,
      responsesPerLink: item.responsesPerLink
    })),
    jobs: jobs.map(job => ({
      id: job.id,
      itemId: job.itemId,
      linkIndex: job.linkIndex,
      url: job.url,
      profileName: job.profileName,
      attempt: job.attempt,
      totalForLink: job.totalForLink,
      status: 'queued',
      startedAt: '',
      endedAt: '',
      durationMs: 0,
      pageCount: 0,
      questionCount: 0,
      screenshot: '',
      error: '',
      pages: []
    }))
  };
}

function startReportJob(job) {
  const reportJob = lastReport.jobs.find(item => item.id === job.id);
  if (reportJob) {
    reportJob.status = 'running';
    reportJob.startedAt = new Date().toISOString();
  }
  return reportJob;
}

function finishReportJob(reportJob, result) {
  if (!reportJob) return;
  const endedAt = Date.now();
  const startedAt = reportJob.startedAt ? Date.parse(reportJob.startedAt) : endedAt;
  reportJob.endedAt = new Date(endedAt).toISOString();
  reportJob.durationMs = Math.max(0, endedAt - startedAt);
  reportJob.status = result.status || (result.ok ? 'success' : 'failed');
  reportJob.pageCount = (result.pages || []).length;
  reportJob.questionCount = (result.pages || []).reduce((sum, page) => sum + (page.questionCount || 0), 0);
  reportJob.screenshot = result.screenshot || '';
  reportJob.error = result.error || '';
  reportJob.pages = result.pages || [];
  recalcReportTotals();
  persistReportSnapshot().catch(() => {});
}

function markReportJobWaitingReview(job, review) {
  if (!job || !lastReport?.jobs) return;
  const reportJob = lastReport.jobs.find(item => item.id === job.id);
  if (!reportJob) return;
  reportJob.status = 'waiting_approval';
  reportJob.reviewId = review.id;
  reportJob.screenshot = review.screenshot || reportJob.screenshot;
  reportJob.pages = review.pages || reportJob.pages || [];
  reportJob.pageCount = (review.pages || []).length;
  reportJob.questionCount = (review.pages || []).reduce((sum, page) => sum + (page.questionCount || 0), 0);
  recalcReportTotals();
  persistReportSnapshot().catch(() => {});
}

function recalcReportTotals() {
  const totals = { queued: lastReport.jobs.length, success: 0, dryRun: 0, failed: 0, skipped: 0 };
  for (const job of lastReport.jobs) {
    if (job.status === 'submitted') totals.success++;
    else if (job.status === 'dry_run') totals.dryRun++;
    else if (job.status === 'queued' || job.status === 'running' || job.status === 'waiting_approval') {}
    else if (job.status === 'login_required' || job.status === 'stopped' || job.status === 'approval_skipped') totals.skipped++;
    else totals.failed++;
  }
  lastReport.totals = totals;
}

function finalizeReport(status, error = '') {
  if (!lastReport || lastReport.status === 'idle') return;
  for (const job of lastReport.jobs || []) {
    if (job.status === 'running' || job.status === 'waiting_approval') {
      job.status = status === 'stopped' ? 'stopped' : 'failed';
      job.endedAt = new Date().toISOString();
    }
  }
  lastReport.status = status;
  lastReport.endedAt = new Date().toISOString();
  lastReport.error = error;
  recalcReportTotals();
  persistReportSnapshot().catch(() => {});
}

function publicReport(report) {
  return report || createEmptyReport();
}

function publicPendingReview() {
  if (!pendingReview) return null;
  return pendingReview;
}

async function healthCheck(runConfig, deep = false) {
  const endpoint = resolveEndpoint(runConfig);
  const gateway = await tcpEndpointCheck(endpoint);
  const storage = deep ? await testStorageConnection(runConfig.storage, true) : storageOverview(runConfig.storage);
  const result = {
    ok: false,
    dashboard: { ok: true, port: PORT, status: 'running' },
    gateway,
    storage,
    ai: { ok: null, status: deep ? 'checking' : 'not_checked', message: '' },
    oauth: { ok: null, status: deep ? 'checking' : 'unknown', message: '' }
  };

  if (deep && gateway.ok) {
    const ai = await testAIConnection({ ...runConfig, aiTimeoutMs: 12000 });
    result.ai = { ok: !!ai.ok, status: ai.ok ? 'connected' : 'error', message: ai.message || ai.error || '' };
    const message = String(ai.error || ai.message || '').toLowerCase();
    if (ai.ok) result.oauth = { ok: true, status: 'valid', message: 'OAuth/API credential valid.' };
    else if (/invalidated|auth|unauthori[sz]ed|401|token/.test(message)) {
      result.oauth = { ok: false, status: 'token_invalid', message: ai.error || 'Token OAuth invalid atau expired.' };
    } else {
      result.oauth = { ok: false, status: 'ai_error', message: ai.error || 'AI belum bisa dihubungi.' };
    }
  }

  result.ok = result.dashboard.ok && result.gateway.ok && (result.ai.ok !== false) && (result.storage.ok !== false);
  return result;
}

function tcpEndpointCheck(endpoint) {
  return new Promise(resolve => {
    let parsed;
    try { parsed = new URL(endpoint); } catch (err) {
      return resolve({ ok: false, status: 'invalid_url', endpoint, message: err.message });
    }

    const port = Number(parsed.port || (parsed.protocol === 'https:' ? 443 : 80));
    const socket = net.createConnection({ host: parsed.hostname, port });
    const done = value => {
      socket.removeAllListeners();
      socket.destroy();
      resolve({ endpoint, host: parsed.hostname, port, ...value });
    };
    socket.setTimeout(2500);
    socket.once('connect', () => done({ ok: true, status: 'listening', message: 'Gateway port aktif.' }));
    socket.once('timeout', () => done({ ok: false, status: 'timeout', message: 'Gateway timeout.' }));
    socket.once('error', err => done({ ok: false, status: 'closed', message: err.message }));
  });
}

function exportReport(res, format) {
  const report = publicReport(lastReport);
  const safeId = report.id || 'kuneku-report';
  const cleanFormat = String(format || 'json').toLowerCase();

  if (cleanFormat === 'csv') {
    return sendDownload(res, `${safeId}.csv`, 'text/csv; charset=utf-8', reportToCsv(report));
  }

  if (cleanFormat === 'pdf') {
    return sendDownload(res, `${safeId}.pdf`, 'application/pdf', reportToPdf(report));
  }

  return sendDownload(res, `${safeId}.json`, 'application/json; charset=utf-8', JSON.stringify(report, null, 2));
}

function sendDownload(res, filename, contentType, body) {
  res.writeHead(200, {
    'Content-Type': contentType,
    'Content-Disposition': `attachment; filename="${filename}"`
  });
  res.end(body);
}

function reportToCsv(report) {
  const rows = [['job_id', 'status', 'profile', 'attempt', 'url', 'page', 'question', 'type', 'semantic_type', 'answer', 'duration_ms', 'screenshot', 'error']];
  for (const job of report.jobs || []) {
    const answers = [];
    for (const page of job.pages || []) {
      for (const answer of page.answers || []) {
        const question = (page.questions || []).find(item => item.index === answer.index) || {};
        answers.push({
          page: page.step,
          question: question.title || '',
          type: question.type || '',
          semanticType: question.semanticType || '',
          answer: answer.answer
        });
      }
    }

    if (!answers.length) {
      rows.push([job.id, job.status, job.profileName, `${job.attempt}/${job.totalForLink}`, job.url, '', '', '', '', '', job.durationMs || 0, job.screenshot || '', job.error || '']);
      continue;
    }

    for (const item of answers) {
      rows.push([job.id, job.status, job.profileName, `${job.attempt}/${job.totalForLink}`, job.url, item.page, item.question, item.type, item.semanticType, Array.isArray(item.answer) ? item.answer.join(' | ') : item.answer, job.durationMs || 0, job.screenshot || '', job.error || '']);
    }
  }
  return rows.map(row => row.map(csvCell).join(',')).join('\r\n');
}

function csvCell(value) {
  const text = String(value ?? '');
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

function reportToPdf(report) {
  const lines = [
    `${config.systemName || APP_NAME} - Run Report`,
    `Status: ${report.status || 'idle'}`,
    `Started: ${report.startedAt || '-'}`,
    `Ended: ${report.endedAt || '-'}`,
    `Totals: queued ${report.totals?.queued || 0}, success ${report.totals?.success || 0}, dry run ${report.totals?.dryRun || 0}, failed ${report.totals?.failed || 0}, skipped ${report.totals?.skipped || 0}`,
    ''
  ];

  for (const job of report.jobs || []) {
    lines.push(`${job.status} | ${job.profileName} | isi ${job.attempt}/${job.totalForLink}`);
    lines.push(job.url);
    if (job.error) lines.push(`Error: ${job.error}`);
    for (const page of job.pages || []) {
      lines.push(`Halaman ${page.step}: ${page.pageType} (${page.questionCount || 0} pertanyaan)`);
      for (const answer of page.answers || []) {
        const question = (page.questions || []).find(item => item.index === answer.index) || {};
        const value = Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer;
        lines.push(`- ${question.title || `Q${answer.index}`}: ${value}`);
      }
    }
    lines.push('');
  }

  return createSimplePdf(lines.slice(0, 180));
}

function createSimplePdf(lines) {
  const escaped = lines.map(line => `(${escapePdfText(String(line).slice(0, 105))}) Tj T*`).join('\n');
  const stream = `BT\n/F1 9 Tf\n40 800 Td\n12 TL\n${escaped}\nET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream, 'utf8')} >>\nstream\n${stream}\nendstream`
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  objects.forEach((object, index) => {
    offsets.push(Buffer.byteLength(pdf, 'utf8'));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  });
  const xref = Buffer.byteLength(pdf, 'utf8');
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  for (let i = 1; i < offsets.length; i++) {
    pdf += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF`;
  return Buffer.from(pdf, 'utf8');
}

function escapePdfText(text) {
  return text.replace(/\\/g, '\\\\').replace(/\(/g, '\\(').replace(/\)/g, '\\)');
}

function log(message, level = 'info') {
  const item = { time: new Date().toLocaleTimeString('id-ID'), level, message };
  logs.push(item);
  if (logs.length > 400) logs.shift();
  console.log(`[${item.time}] ${message}`);
}

function pick(items) {
  return items[Math.floor(Math.random() * items.length)];
}

async function humanDelay(page, minMs, maxMs) {
  const ms = randomInt(minMs, maxMs);
  await page.waitForTimeout(ms);
}

async function takeFailureScreenshot(page, job, reason) {
  ensureDir(path.join(REPORT_DIR, 'screenshots'));
  const safeReason = String(reason || 'failure').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 40);
  const safeJob = String(job?.id || 'job').replace(/[^a-z0-9_-]+/gi, '-').slice(0, 70);
  const fileName = `${timestampSlug()}-${safeJob}-${safeReason}.png`;
  const filePath = path.join(REPORT_DIR, 'screenshots', fileName);
  await page.screenshot({ path: filePath, fullPage: true }).catch(async () => {
    await page.screenshot({ path: filePath }).catch(() => {});
  });
  return `/reports/screenshots/${fileName}`;
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function timestampSlug() {
  return new Date().toISOString().replace(/[:.]/g, '-');
}

function randomInt(min, max) {
  const low = Math.max(0, Math.floor(Number(min) || 0));
  const high = Math.max(low, Math.floor(Number(max) || low));
  return Math.floor(Math.random() * (high - low + 1)) + low;
}

function loadIndonesianNameParts() {
  try {
    const raw = fs.readFileSync(NAME_SOURCE_FILE, 'utf8');
    let values;

    try {
      values = flattenNameValues(JSON.parse(raw));
    } catch (_) {
      values = raw.split(/\r?\n/);
    }

    const parts = values
      .flatMap(value => String(value || '').split(/[\r\n,;|]+/))
      .map(normalizeNamePart)
      .filter(Boolean);
    const unique = Array.from(new Set(parts));
    return unique.length >= 20 ? unique : FALLBACK_NAME_PARTS;
  } catch (_) {
    return FALLBACK_NAME_PARTS;
  }
}

function flattenNameValues(value) {
  if (Array.isArray(value)) return value.flatMap(flattenNameValues);
  if (value && typeof value === 'object') return Object.values(value).flatMap(flattenNameValues);
  return [value];
}

function normalizeNamePart(value) {
  const clean = String(value || '')
    .replace(/[_-]+/g, ' ')
    .replace(/[^a-zA-Z\s']/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .toLowerCase();

  if (!clean) return '';
  if (clean.length < 3 || clean.length > 20) return '';
  if (NAME_STOP_WORDS.has(clean)) return '';
  if (clean.split(/\s+/).length > 2) return '';
  return clean.split(/\s+/).map(toTitleCase).join(' ');
}

function toTitleCase(value) {
  return String(value || '')
    .split("'")
    .map(part => part ? part[0].toUpperCase() + part.slice(1).toLowerCase() : part)
    .join("'");
}

function sampleIndonesianFullNames(count) {
  const out = new Set();
  for (let i = 0; i < count * 4 && out.size < count; i++) {
    out.add(pickIndonesianFullName());
  }
  return Array.from(out);
}

function pickIndonesianFullName(genderPreference = '') {
  const parts = INDONESIAN_NAME_PARTS.length ? INDONESIAN_NAME_PARTS : FALLBACK_NAME_PARTS;
  const lookup = new Map(parts.map(part => [part.toLowerCase(), part]));
  const preference = String(genderPreference || '').toLowerCase();
  const female = preference === 'female' || preference === 'perempuan'
    ? true
    : preference === 'male' || preference === 'laki-laki' || preference === 'laki'
      ? false
      : Math.random() < 0.52;
  const availableLastPool = COMMON_LAST_PARTS
    .map(part => lookup.get(part.toLowerCase()))
    .filter(Boolean);
  const preferredLastPool = (female ? FEMALE_LAST_PARTS : MALE_LAST_PARTS)
    .map(part => lookup.get(part.toLowerCase()))
    .filter(Boolean);
  const lastPool = preferredLastPool.length >= 6
    ? preferredLastPool
    : (availableLastPool.length >= 8 ? availableLastPool : COMMON_LAST_PARTS);
  const lastKeys = new Set(lastPool.map(part => part.toLowerCase()));
  const availableGivenPool = COMMON_GIVEN_PARTS
    .map(part => lookup.get(part.toLowerCase()))
    .filter(Boolean);
  const preferredGivenPool = (female ? FEMALE_GIVEN_PARTS : MALE_GIVEN_PARTS)
    .map(part => lookup.get(part.toLowerCase()))
    .filter(Boolean);
  const givenPool = parts.filter(part => !lastKeys.has(part.toLowerCase()));
  const firstMiddlePool = preferredGivenPool.length >= 10
    ? preferredGivenPool
    : availableGivenPool.length >= 20
    ? availableGivenPool
    : (givenPool.length >= 20 ? givenPool : parts);
  const wordTarget = Math.random() < 0.32 ? 3 : 2;
  const chosen = [];
  const used = new Set();
  const first = pickDistinctNamePart(firstMiddlePool, used);
  if (first) chosen.push(first);

  if (wordTarget === 3) {
    const middle = pickDistinctNamePart(firstMiddlePool, used, chosen);
    if (middle) chosen.push(middle);
  }

  const last = pickDistinctNamePart(lastPool, used, chosen);
  if (last) chosen.push(last);

  while (chosen.length < 2) {
    const fallback = pick(FALLBACK_NAME_PARTS);
    if (!used.has(fallback.toLowerCase()) && !chosen.some(part => looksTooSimilar(part, fallback))) {
      used.add(fallback.toLowerCase());
      chosen.push(fallback);
    }
  }

  return chosen.join(' ').replace(/\s+/g, ' ').trim();
}

function pickDistinctNamePart(pool, used, chosen = []) {
  for (let guard = 0; guard < 40; guard++) {
    const part = pick(pool);
    const key = String(part || '').toLowerCase();
    if (!part || used.has(key)) continue;
    if (chosen.some(item => looksTooSimilar(item, part))) continue;
    used.add(key);
    return part;
  }
  return '';
}

function looksTooSimilar(a, b) {
  const left = String(a || '').toLowerCase().replace(/[^a-z]/g, '');
  const right = String(b || '').toLowerCase().replace(/[^a-z]/g, '');
  if (!left || !right) return false;
  return left.slice(0, 4) === right.slice(0, 4) || left.includes(right) || right.includes(left);
}

function serveStaticApp(res, pathname) {
  const root = fs.existsSync(path.join(DIST, 'index.html')) ? DIST : PUBLIC;
  const cleanPath = decodeURIComponent(pathname || '/')
    .replace(/\\/g, '/')
    .replace(/^\/+/, '');
  const requested = cleanPath ? path.join(root, cleanPath) : path.join(root, 'index.html');
  const resolved = path.resolve(requested);
  const rootResolved = path.resolve(root);
  const relative = path.relative(rootResolved, resolved);

  if (!relative.startsWith('..') && !path.isAbsolute(relative) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return serveFile(res, resolved);
  }

  return serveFile(res, path.join(root, 'index.html'));
}

function serveReportFile(res, pathname) {
  const cleanPath = decodeURIComponent(pathname || '')
    .replace(/^\/reports\/?/, '')
    .replace(/\\/g, '/');
  const requested = path.join(REPORT_DIR, cleanPath);
  const resolved = path.resolve(requested);
  const rootResolved = path.resolve(REPORT_DIR);
  const relative = path.relative(rootResolved, resolved);

  if (!relative.startsWith('..') && !path.isAbsolute(relative) && fs.existsSync(resolved) && fs.statSync(resolved).isFile()) {
    return serveFile(res, resolved);
  }

  return json(res, 404, { ok: false, error: 'report_file_not_found' });
}

function serveFile(res, filePath) {
  res.writeHead(200, { 'Content-Type': contentTypeFor(filePath) });
  res.end(fs.readFileSync(filePath));
}

function contentTypeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.mjs': 'text/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.svg': 'image/svg+xml',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.ico': 'image/x-icon'
  }[ext] || 'application/octet-stream';
}

function json(res, status, body) {
  res.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(body));
}

function readJson(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.setEncoding('utf8');
    req.on('data', chunk => data += chunk);
    req.on('end', () => {
      try { resolve(data ? JSON.parse(data) : {}); } catch (err) { reject(err); }
    });
    req.on('error', reject);
  });
}
