import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BadgeCheck,
  Bot,
  Camera,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  CircleDot,
  ClipboardCheck,
  Database,
  Download,
  Eraser,
  Eye,
  EyeOff,
  FilePlus2,
  FileText,
  Folder,
  HardDrive,
  History,
  LayoutDashboard,
  Link as LinkIcon,
  Link2,
  ListChecks,
  LoaderCircle,
  Package,
  Play,
  Plus,
  Radio,
  RefreshCw,
  Save,
  ScanLine,
  Send,
  ServerCog,
  Shield,
  ShieldCheck,
  ShieldUser,
  SkipForward,
  SlidersHorizontal,
  SquareStop,
  Table2,
  Trash2,
  UserCog,
  WandSparkles
} from 'lucide-react';
import './styles.css';

const DEFAULT_RULES = `pernah menggunakan, pernah mengakses, pernah memakai, pernah mencoba, sudah menggunakan, familiar dengan => Ya
nama, nama lengkap => Aditya Pratama | Ahmad Fauzan | Bima Saputra | Dimas Ramadhan | Fajar Nugroho
program studi, jurusan, prodi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro | Manajemen | Akuntansi | Hukum | Psikologi
angkatan, tahun angkatan => 2022 | 2023 | 2024 | 2025
rekomendasi program studi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
saran, masukan, komentar => Sudah cukup baik dan mudah dipahami | Semoga informasinya semakin lengkap | Tampilan sudah jelas dan nyaman digunakan
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
nama, nama lengkap => Aditya Pratama | Ahmad Fauzan | Bima Saputra | Dimas Ramadhan | Fajar Nugroho
program studi, jurusan, prodi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
angkatan, tahun angkatan => 2022 | 2023 | 2024 | 2025
rekomendasi program studi => Teknik Informatika | Teknik Industri | Sistem Informasi | Matematika | Teknik Elektro
saran, masukan, komentar, kritik, kendala => Website seminarFST sudah cukup membantu, tetapi informasi jadwal dan alur pendaftaran bisa dibuat lebih jelas. | Secara umum website seminarFST mudah digunakan, saran saya tampilan informasi seminar dibuat lebih ringkas.`
};

const DEFAULT_BUILDER = {
  nameWordsMin: 2,
  nameWordsMax: 3,
  yesGateAnswer: 'Ya',
  likertPositive: '4 | 5',
  likertNegative: '1 | 2',
  maxRecommendation: 5,
  feedbackTone: 'natural'
};

const DEFAULTS = {
  systemName: 'KUNEKU',
  ownerName: 'Muhammad Habib Rafi',
  provider: 'openclaw',
  baseUrl: 'http://localhost:18789/v1/responses',
  model: 'openai-codex/gpt-5.4',
  apiKey: '',
  links: '',
  responsesPerLink: 1,
  headless: true,
  dryRun: false,
  smartAutoMode: true,
  localLikertAlways: true,
  disableFastLikert: false,
  fastMode: false,
  reviewBeforeSubmit: true,
  customRulesText: DEFAULT_RULES,
  profiles: defaultProfiles(),
  runItems: [],
  storage: {
    type: 'local',
    mysql: {
      host: '127.0.0.1',
      port: 3306,
      database: 'kuneku',
      user: 'root',
      password: ''
    }
  }
};

function defaultProfiles() {
  return Object.fromEntries(Object.entries(TEMPLATE_RULES).map(([name, rules]) => [
    name,
    { name, rules, locked: true, builder: { ...DEFAULT_BUILDER } }
  ]).concat([
    ['Custom', { name: 'Custom', rules: DEFAULT_RULES, locked: true, builder: { ...DEFAULT_BUILDER } }]
  ]));
}

function withClientDefaults(source = {}) {
  return {
    ...DEFAULTS,
    ...source,
    storage: {
      ...DEFAULTS.storage,
      ...(source.storage || {}),
      mysql: {
        ...DEFAULTS.storage.mysql,
        ...(source.storage?.mysql || {})
      }
    }
  };
}

function App() {
  const [loaded, setLoaded] = useState(false);
  const [running, setRunning] = useState(false);
  const [logs, setLogs] = useState([]);
  const [report, setReport] = useState(null);
  const [pendingReview, setPendingReview] = useState(null);
  const [health, setHealth] = useState(null);
  const [storageDashboard, setStorageDashboard] = useState(null);
  const [storageLoading, setStorageLoading] = useState(false);
  const [status, setStatus] = useState('Siap.');
  const [config, setConfig] = useState(DEFAULTS);
  const [linksText, setLinksText] = useState(DEFAULTS.links);
  const [itemSettings, setItemSettings] = useState({});
  const [linkDraft, setLinkDraft] = useState('');
  const [showToken, setShowToken] = useState(false);
  const [rulesOpen, setRulesOpen] = useState(false);
  const [profilesOpen, setProfilesOpen] = useState(false);
  const [newProfileName, setNewProfileName] = useState('');
  const [previewing, setPreviewing] = useState(false);
  const [previews, setPreviews] = useState([]);
  const [activePage, setActivePage] = useState('overview');
  const logRef = useRef(null);

  const links = useMemo(() => extractLinks(linksText), [linksText]);
  const runItems = useMemo(() => buildRunItems(links, itemSettings, config), [links, itemSettings, config]);
  const totalJobs = runItems.reduce((sum, item) => sum + Math.max(1, Number(item.responsesPerLink || 1)), 0);
  const aiReady = config.provider === 'openclaw' || Boolean(config.apiKey);
  const reportJobs = report?.jobs || [];
  const storageType = config.storage?.type || 'local';
  const storageLabel = storageType === 'mysql' ? 'MySQL' : 'Local JSON';
  const pageMeta = {
    overview: { title: 'Overview', eyebrow: 'Auto Analyze', icon: 'dashboard' },
    forms: { title: 'Google Forms', eyebrow: 'Antrean, scan, eksekusi', icon: 'checklist' },
    settings: { title: 'Settings', eyebrow: 'Identitas, AI, storage, run mode', icon: 'tune' },
    profiles: { title: 'Rules', eyebrow: 'Advanced manual override', icon: 'rule_settings' },
    storage: { title: 'Data Storage', eyebrow: 'Database, backup, dan audit data', icon: 'database' },
    reports: { title: 'Reports', eyebrow: 'Hasil run dan export', icon: 'assignment' },
    logs: { title: 'Live Logs', eyebrow: 'Aktivitas sistem', icon: 'monitoring' }
  };
  const activeMeta = pageMeta[activePage] || pageMeta.overview;
  const navItems = [
    { id: 'overview', label: 'Overview', icon: 'dashboard' },
    { id: 'forms', label: 'Forms', icon: 'checklist', badge: runItems.length },
    { id: 'settings', label: 'Settings', icon: 'tune' },
    { id: 'profiles', label: 'Rules', icon: 'rule_settings', badge: profileNames(config).length },
    { id: 'storage', label: 'Storage', icon: 'database', badge: storageDashboard?.metrics?.reports || reportJobs.length },
    { id: 'reports', label: 'Reports', icon: 'assignment', badge: reportJobs.length },
    { id: 'logs', label: 'Logs', icon: 'monitoring', badge: logs.length }
  ];

  useEffect(() => {
    refreshState(true);
    const timer = setInterval(() => refreshState(false), 1200);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (logRef.current) logRef.current.scrollTop = logRef.current.scrollHeight;
  }, [logs]);

  useEffect(() => {
    if (loaded && (activePage === 'storage' || activePage === 'overview')) {
      loadStorageDashboard(false);
    }
  }, [activePage, loaded]);

  async function refreshState(initial) {
    try {
      const state = await requestJson('/api/state');
      setRunning(Boolean(state.running));
      setLogs(state.logs || []);
      setReport(state.report || null);
      setPendingReview(state.pendingReview || null);
      if (state.storage) setHealth(prev => ({ ...(prev || {}), storage: state.storage }));
      if (initial && state.config) {
        const nextConfig = withClientDefaults({ ...state.config, apiKey: state.config?.apiKey || '' });
        setConfig(nextConfig);
        const savedItems = Array.isArray(state.config.runItems) ? state.config.runItems : [];
        const savedLinks = savedItems.length ? savedItems.map(item => item.url).join('\n') : (state.config.links ?? DEFAULTS.links);
        setLinksText(savedLinks);
        setItemSettings(settingsFromItems(savedItems, nextConfig));
        setLoaded(true);
      }
    } catch (err) {
      setStatus(`Dashboard belum terhubung: ${err.message}`);
    }
  }

  function updateConfig(key, value) {
    setConfig(prev => ({ ...prev, [key]: value }));
  }

  function updateStorage(patch) {
    setConfig(prev => ({
      ...prev,
      storage: {
        ...DEFAULTS.storage,
        ...(prev.storage || {}),
        ...patch,
        mysql: {
          ...DEFAULTS.storage.mysql,
          ...(prev.storage?.mysql || {}),
          ...(patch.mysql || {})
        }
      }
    }));
  }

  function updateMysql(key, value) {
    updateStorage({ mysql: { [key]: value } });
  }

  function applyProviderDefaults(provider) {
    if (provider === 'openclaw') {
      setConfig(prev => ({
        ...prev,
        provider,
        baseUrl: DEFAULTS.baseUrl,
        model: DEFAULTS.model,
        apiKey: ''
      }));
      return;
    }

    if (provider === 'openai') {
      setConfig(prev => ({
        ...prev,
        provider,
        baseUrl: 'https://api.openai.com/v1/responses',
        model: 'chat-latest'
      }));
      return;
    }

    setConfig(prev => ({ ...prev, provider }));
  }

  function payload(extra = {}) {
    return {
      ...config,
      ...extra,
      links: links.join('\n'),
      runItems,
      responsesPerLink: Math.max(1, Number(config.responsesPerLink || 1)),
      headless: Boolean(config.headless),
      dryRun: Boolean(config.dryRun),
      smartAutoMode: config.smartAutoMode !== false,
      localLikertAlways: true,
      disableFastLikert: Boolean(config.disableFastLikert),
      fastMode: Boolean(config.fastMode),
      reviewBeforeSubmit: Boolean(config.reviewBeforeSubmit)
    };
  }

  async function saveConfig() {
    setStatus('Menyimpan config...');
    const result = await requestJson('/api/config', {
      method: 'POST',
      body: JSON.stringify(payload())
    });
    setStatus(result.ok ? 'Config tersimpan.' : result.error || 'Gagal menyimpan config.');
  }

  async function testAI() {
    setStatus('Mengecek koneksi AI...');
    const result = await requestJson('/api/test-ai', {
      method: 'POST',
      body: JSON.stringify(payload())
    });
    setStatus(result.ok ? `AI konek: ${result.endpoint}` : `AI belum konek: ${result.error}`);
  }

  async function checkHealth() {
    setStatus('Mengecek health dashboard, gateway, dan OAuth...');
    const result = await requestJson('/api/health?deep=true');
    setHealth(result);
    const oauthText = result.oauth?.status || 'unknown';
    const aiText = result.ai?.ok ? 'AI connected' : (result.ai?.message || 'AI belum konek');
    const storageText = result.storage?.status || 'storage_unknown';
    setStatus(`Health: gateway ${result.gateway?.status || '-'}, storage ${storageText}, OAuth ${oauthText}, ${aiText}`);
  }

  async function testStorage() {
    setStatus('Mengecek storage...');
    const result = await requestJson('/api/storage/test', {
      method: 'POST',
      body: JSON.stringify(payload())
    });
    setHealth(prev => ({ ...(prev || {}), storage: result }));
    setStatus(result.ok ? `Storage siap: ${result.label}` : `Storage belum siap: ${result.message}`);
    await loadStorageDashboard(false);
  }

  async function loadStorageDashboard(showStatus = true) {
    if (showStatus) setStatus('Memuat dashboard storage...');
    setStorageLoading(true);
    try {
      const result = await requestJson('/api/storage/dashboard');
      setStorageDashboard(result);
      if (result.storage) setHealth(prev => ({ ...(prev || {}), storage: result.storage }));
      if (showStatus) setStatus(result.ok === false ? `Storage error: ${result.message}` : 'Dashboard storage diperbarui.');
      return result;
    } catch (err) {
      setStorageDashboard(prev => ({ ...(prev || {}), ok: false, message: err.message }));
      if (showStatus) setStatus(`Storage error: ${err.message}`);
      return null;
    } finally {
      setStorageLoading(false);
    }
  }

  async function approveSubmit() {
    const result = await requestJson('/api/review/approve', { method: 'POST' });
    setStatus(result.ok ? 'Approval dikirim. Sistem akan menekan Kirim.' : result.error || 'Gagal approve.');
    await refreshState(false);
  }

  async function skipSubmit() {
    const result = await requestJson('/api/review/skip', { method: 'POST' });
    setStatus(result.ok ? 'Job dilewati. Sistem lanjut ke job berikutnya.' : result.error || 'Gagal skip.');
    await refreshState(false);
  }

  async function scanPreview() {
    if (!runItems.length) {
      setStatus('Masukkan minimal 1 link Google Forms.');
      return;
    }
    setPreviewing(true);
    setStatus('Scanning struktur form...');
    try {
      const result = await requestJson('/api/preview', {
        method: 'POST',
        body: JSON.stringify(payload())
      });
      setPreviews(result.previews || []);
      setStatus(`Preview selesai: ${(result.previews || []).length} form discan.`);
    } catch (err) {
      setStatus(`Preview gagal: ${err.message}`);
    } finally {
      setPreviewing(false);
    }
  }

  async function startRun(forceDryRun = null) {
    if (!runItems.length) {
      setStatus('Masukkan minimal 1 link Google Forms.');
      return;
    }

    const dryRun = forceDryRun === null ? config.dryRun : forceDryRun;
    if (!dryRun && config.reviewBeforeSubmit && !window.confirm('Review Before Submit aktif. Sistem akan berhenti di halaman terakhir dan menunggu Approve Submit. Lanjut?')) {
      return;
    }
    if (!dryRun && totalJobs > 10 && !window.confirm(`Kamu akan menjalankan ${totalJobs} submit. Lanjut?`)) {
      return;
    }

    setStatus(`Menjalankan ${runItems.length} form, total ${totalJobs} job...`);
    const result = await requestJson('/api/run', {
      method: 'POST',
      body: JSON.stringify(payload({ dryRun }))
    });
    setStatus(result.ok ? (dryRun ? 'Dry run berjalan.' : 'Sistem berjalan.') : result.error || 'Gagal menjalankan sistem.');
    await refreshState(false);
  }

  async function stopRun() {
    await requestJson('/api/stop', { method: 'POST' });
    setStatus('Stop diminta. Sistem akan berhenti setelah langkah aktif selesai.');
    await refreshState(false);
  }

  function addLinksFromDraft() {
    const next = mergeLinks(links, extractLinks(linkDraft));
    setLinksText(next.join('\n'));
    setLinkDraft('');
    setStatus(next.length ? `${next.length} link siap diproses.` : 'Belum ada link valid.');
  }

  function tidyLinks() {
    const next = extractLinks(linksText);
    setLinksText(next.join('\n'));
    setStatus(`${next.length} link valid tersimpan di antrean.`);
  }

  function removeLink(index) {
    const removed = links[index];
    setLinksText(links.filter((_, itemIndex) => itemIndex !== index).join('\n'));
    setItemSettings(prev => {
      const next = { ...prev };
      delete next[removed];
      return next;
    });
  }

  function clearLinks() {
    setLinksText('');
    setItemSettings({});
    setPreviews([]);
    setStatus('Daftar link dikosongkan.');
  }

  function patchItem(url, patch) {
    setItemSettings(prev => {
      const base = settingsForUrl(url, prev, config);
      const nextItem = { ...base, ...patch };
      if (patch.profileName && patch.profileName !== base.profileName) {
        nextItem.customRulesText = config.profiles?.[patch.profileName]?.rules || base.customRulesText || config.customRulesText;
      }
      return { ...prev, [url]: nextItem };
    });
  }

  function addProfile() {
    const name = cleanProfileName(newProfileName);
    if (!name) {
      setStatus('Nama profile tidak boleh kosong.');
      return;
    }
    if (config.profiles?.[name]) {
      setStatus(`Profile "${name}" sudah ada.`);
      return;
    }
    setConfig(prev => ({
      ...prev,
      profiles: {
        ...(prev.profiles || {}),
        [name]: { name, rules: prev.customRulesText || DEFAULT_RULES, locked: false, builder: { ...DEFAULT_BUILDER } }
      }
    }));
    setNewProfileName('');
    setStatus(`Profile "${name}" dibuat.`);
  }

  function updateProfile(name, patch) {
    setConfig(prev => ({
      ...prev,
      profiles: {
        ...(prev.profiles || {}),
        [name]: { ...(prev.profiles?.[name] || { name }), name, ...patch, locked: Boolean(prev.profiles?.[name]?.locked) }
      }
    }));
    const rules = patch.rules;
    if (typeof rules !== 'string') return;
    setItemSettings(prev => {
      const next = { ...prev };
      for (const [url, item] of Object.entries(next)) {
        if (item.profileName === name) next[url] = { ...item, customRulesText: rules };
      }
      return next;
    });
  }

  function deleteProfile(name) {
    if (config.profiles?.[name]?.locked) return;
    setConfig(prev => {
      const nextProfiles = { ...(prev.profiles || {}) };
      delete nextProfiles[name];
      return { ...prev, profiles: nextProfiles };
    });
    setItemSettings(prev => {
      const next = {};
      for (const [url, item] of Object.entries(prev)) {
        next[url] = item.profileName === name
          ? { ...item, profileName: 'Default', customRulesText: config.profiles?.Default?.rules || config.customRulesText }
          : item;
      }
      return next;
    });
    setStatus(`Profile "${name}" dihapus.`);
  }

  return (
    <div className={`app-shell page-${activePage}`}>
      <aside className="sidebar">
        <div className="brand">
          <div className="brand-mark"><img src="/images/kuneku-logo.png" alt="KUNEKU" /></div>
          <div>
            <h1>KUNEKU</h1>
            <p>Smart form automation</p>
          </div>
        </div>

        <nav className="sidebar-nav" aria-label="Dashboard navigation">
          {navItems.map(item => (
            <button
              className={activePage === item.id ? 'active' : ''}
              type="button"
              key={item.id}
              onClick={() => setActivePage(item.id)}
            >
              <Icon name={item.icon} size={18} />
              <span>{item.label}</span>
              {typeof item.badge === 'number' && <strong>{item.badge}</strong>}
            </button>
          ))}
        </nav>

        <div className="sidebar-summary">
          <div>
            <span>Status</span>
            <strong className={running ? 'ok' : ''}>{running ? 'Running' : 'Idle'}</strong>
          </div>
          <div>
            <span>Storage</span>
            <strong>{storageLabel}</strong>
          </div>
        </div>

        <section className="panel identity-panel">
          <div className="panel-title">
            <Icon name="verified" size={18} />
            <h2>System Identity</h2>
          </div>
          <Field label="Nama Sistem">
            <input value={config.systemName || ''} onChange={event => updateConfig('systemName', event.target.value)} spellCheck="false" />
          </Field>
          <Field label="Owner">
            <input value={config.ownerName || ''} onChange={event => updateConfig('ownerName', event.target.value)} spellCheck="false" />
          </Field>
        </section>

        <section className="panel">
          <div className="panel-title">
            <Icon name="dns" size={18} />
            <h2>AI Backend</h2>
          </div>

          <Field label="Provider">
            <select value={config.provider} onChange={event => applyProviderDefaults(event.target.value)}>
              <option value="openclaw">OpenClaw Gateway</option>
              <option value="openai">OpenAI API Key</option>
              <option value="custom">Custom Backend</option>
            </select>
          </Field>

          <Field label="Base URL">
            <input value={config.baseUrl} onChange={event => updateConfig('baseUrl', event.target.value)} spellCheck="false" />
          </Field>

          <Field label="Model">
            <input value={config.model} onChange={event => updateConfig('model', event.target.value)} spellCheck="false" />
          </Field>

          <Field label="Token / API Key">
            <div className="input-action">
              <input
                type={showToken ? 'text' : 'password'}
                value={config.apiKey}
                onChange={event => updateConfig('apiKey', event.target.value)}
                placeholder="Kosongkan untuk OpenClaw tanpa token"
                spellCheck="false"
              />
              <button className="icon-button" type="button" title="Tampilkan token" onClick={() => setShowToken(prev => !prev)}>
                <Icon name={showToken ? 'visibility_off' : 'visibility'} size={18} />
              </button>
            </div>
          </Field>

          <div className="button-grid">
            <ActionButton icon="save" label="Simpan" onClick={saveConfig} />
            <ActionButton icon="sync" label="Cek AI" variant="secondary" onClick={testAI} />
          </div>
          <button className="wide-secondary" type="button" onClick={checkHealth}>
            <Icon name="health_and_safety" size={18} />
            Health Check
          </button>
          {health && <HealthPanel health={health} />}
        </section>

        <section className="panel storage-panel">
          <div className="panel-title">
            <Icon name="database" size={18} />
            <h2>Data Storage</h2>
          </div>

          <Field label="Mode">
            <select value={storageType} onChange={event => updateStorage({ type: event.target.value })}>
              <option value="local">Local JSON</option>
              <option value="mysql">MySQL Database</option>
            </select>
          </Field>

          {storageType === 'mysql' && (
            <>
              <div className="split">
                <Field label="Host">
                  <input value={config.storage?.mysql?.host || ''} onChange={event => updateMysql('host', event.target.value)} spellCheck="false" />
                </Field>
                <Field label="Port">
                  <input type="number" min="1" value={config.storage?.mysql?.port || 3306} onChange={event => updateMysql('port', event.target.value)} />
                </Field>
              </div>
              <Field label="Database">
                <input value={config.storage?.mysql?.database || ''} onChange={event => updateMysql('database', event.target.value)} spellCheck="false" />
              </Field>
              <div className="split">
                <Field label="User">
                  <input value={config.storage?.mysql?.user || ''} onChange={event => updateMysql('user', event.target.value)} spellCheck="false" />
                </Field>
                <Field label="Password">
                  <input
                    type={showToken ? 'text' : 'password'}
                    value={config.storage?.mysql?.password || ''}
                    onChange={event => updateMysql('password', event.target.value)}
                    placeholder="Kosongkan jika tidak ada"
                    spellCheck="false"
                  />
                </Field>
              </div>
            </>
          )}

          <div className="button-grid">
            <ActionButton icon="save" label="Simpan" onClick={saveConfig} />
            <ActionButton icon="database" label="Cek DB" variant="secondary" onClick={testStorage} />
          </div>
          {health?.storage && <StorageStatus status={health.storage} />}
        </section>

        <section className="panel">
          <div className="panel-title">
            <Icon name="tune" size={18} />
            <h2>Run Settings</h2>
          </div>

          <div className="split">
            <Field label="Isi per link default">
              <input
                type="number"
                min="1"
                value={config.responsesPerLink}
                onChange={event => updateConfig('responsesPerLink', event.target.value)}
              />
            </Field>
            <Field label="Browser">
              <select value={config.headless ? 'true' : 'false'} onChange={event => updateConfig('headless', event.target.value === 'true')}>
                <option value="true">Headless</option>
                <option value="false">Terlihat</option>
              </select>
            </Field>
          </div>

          <label className="toggle-row">
            <input type="checkbox" checked={config.dryRun} onChange={event => updateConfig('dryRun', event.target.checked)} />
            <span>Dry Run default: isi sampai halaman terakhir, tapi tidak klik Kirim.</span>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={config.reviewBeforeSubmit} onChange={event => updateConfig('reviewBeforeSubmit', event.target.checked)} />
            <span>Review Before Submit: berhenti di halaman terakhir dan tunggu Approve Submit.</span>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={config.smartAutoMode !== false} onChange={event => updateConfig('smartAutoMode', event.target.checked)} />
            <span>Auto Analyze: sistem scan struktur form dan memilih strategi jawaban otomatis.</span>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked readOnly disabled />
            <span>Likert lokal tanpa AI: jawaban skala dibuat acak-terdistribusi per responden.</span>
          </label>

          <label className="toggle-row">
            <input type="checkbox" checked={config.fastMode} onChange={event => updateConfig('fastMode', event.target.checked)} />
            <span>Mode Cepat (Fast Mode): kurangi delay pengisian halaman dan pertanyaan.</span>
          </label>

          <button className="wide-secondary" type="button" onClick={() => setRulesOpen(prev => !prev)}>
            <Icon name="auto_fix_high" size={18} />
            {rulesOpen ? 'Tutup Aturan Global' : 'Buka Aturan Global'}
          </button>

          {rulesOpen && (
            <Field label="Aturan AI Global">
              <textarea
                className="rules-textarea"
                value={config.customRulesText}
                onChange={event => updateConfig('customRulesText', event.target.value)}
              />
            </Field>
          )}
        </section>

        <section className="panel">
          <div className="panel-title">
            <Icon name="rule_settings" size={18} />
            <h2>Profile Manager</h2>
          </div>

          <button className="wide-secondary" type="button" onClick={() => setProfilesOpen(prev => !prev)}>
            <Icon name="manage_accounts" size={18} />
            {profilesOpen ? 'Tutup Profile' : 'Kelola Profile'}
          </button>

          {profilesOpen && (
            <div className="profile-manager">
              <div className="profile-add-row">
                <input
                  value={newProfileName}
                  onChange={event => setNewProfileName(event.target.value)}
                  onKeyDown={event => {
                    if (event.key === 'Enter') addProfile();
                  }}
                  placeholder="Nama profile baru"
                  spellCheck="false"
                />
                <button type="button" onClick={addProfile}>
                  <Icon name="add" size={18} />
                </button>
              </div>
              <div className="profile-list">
                {profileNames(config).map(name => (
                  <ProfileEditor
                    key={name}
                    profile={config.profiles[name]}
                    onChange={patch => updateProfile(name, patch)}
                    onDelete={() => deleteProfile(name)}
                  />
                ))}
              </div>
            </div>
          )}
        </section>

        <div className="sidebar-footer">
          <div className={`status-line ${running ? 'live' : ''}`}>
            <Icon name="monitoring" size={18} />
            <div>
              <strong>{running ? 'System Running' : 'System Status'}</strong>
              <span>{loaded ? status : 'Memuat dashboard...'}</span>
            </div>
          </div>
        </div>
      </aside>

      <main className="workspace">
        <header className="topbar">
          <div className="topbar-main">
            <div className="topbar-icon">
              <Icon name={activeMeta.icon} size={22} />
            </div>
            <div className="topbar-copy">
              <p className="eyebrow">{activeMeta.eyebrow}</p>
              <h2>{activeMeta.title}</h2>
              <div className="system-badges" aria-label="System summary">
                <span>
                  <Icon name="database" size={16} />
                  <b>Storage</b>
                  <strong>{storageLabel}</strong>
                </span>
                <span>
                  <Icon name="smart_toy" size={16} />
                  <b>AI</b>
                  <strong>{config.provider}</strong>
                </span>
                <span className={running ? 'ok' : ''}>
                  <Icon name="radio_button_checked" size={16} />
                  <b>Status</b>
                  <strong>{running ? 'Running' : 'Idle'}</strong>
                </span>
              </div>
            </div>
          </div>
          <div className="run-actions">
            <ActionButton icon="document_scanner" label={previewing ? 'Scanning' : 'Scan Preview'} variant="secondary" onClick={scanPreview} disabled={running || previewing || !runItems.length} spin={previewing} />
            <ActionButton icon="shield" label="Dry Run" variant="secondary" onClick={() => startRun(true)} disabled={running || !aiReady || !runItems.length} />
            <ActionButton icon={running ? 'progress_activity' : 'play_arrow'} label={running ? 'Berjalan' : 'Mulai Sistem'} onClick={() => startRun(null)} disabled={running || !aiReady || !runItems.length} spin={running} />
            <ActionButton icon="stop" label="Stop" variant="danger" onClick={stopRun} disabled={!running} />
          </div>
        </header>

        <section className="metrics">
          <Metric icon="link" label="Link valid" value={runItems.length} />
          <Metric icon="note_add" label="Total job" value={totalJobs} />
          <Metric icon="database" label="Storage" value={storageLabel} compact />
          <Metric icon="check_circle" label="Status" value={running ? 'Running' : 'Idle'} compact tone={running ? 'ok' : ''} />
        </section>

        <section className="panel overview-panel page-only page-overview">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="health_and_safety" size={18} />
              <h2>System Readiness</h2>
            </div>
            <button className="small-button" type="button" onClick={checkHealth}>
              <Icon name="sync" size={17} />
              Health Check
            </button>
          </div>
          <div className="overview-grid">
            <div className="overview-card">
              <span>AI Backend</span>
              <strong>{config.provider}</strong>
              <p>{config.baseUrl}</p>
            </div>
            <div className="overview-card">
              <span>Database</span>
              <strong>{health?.storage?.status || 'not_checked'}</strong>
              <p>{health?.storage?.label || `${storageLabel} belum dicek`}</p>
            </div>
            <div className="overview-card">
              <span>Run Mode</span>
              <strong>{config.smartAutoMode !== false ? 'Auto Analyze' : (config.dryRun ? 'Dry Run' : 'Submit Mode')}</strong>
              <p>{config.reviewBeforeSubmit ? 'Review submit aktif.' : 'Eksekusi langsung aktif.'}</p>
            </div>
          </div>
          {health && <HealthPanel health={health} />}
        </section>

        {pendingReview && (
          <ReviewPanel review={pendingReview} onApprove={approveSubmit} onSkip={skipSubmit} />
        )}

        <section className="settings-page page-only page-settings">
          <section className="panel identity-panel">
            <div className="panel-title">
              <Icon name="verified" size={18} />
              <h2>System Identity</h2>
            </div>
            <Field label="Nama Sistem">
              <input value={config.systemName || ''} onChange={event => updateConfig('systemName', event.target.value)} spellCheck="false" />
            </Field>
            <Field label="Owner">
              <input value={config.ownerName || ''} onChange={event => updateConfig('ownerName', event.target.value)} spellCheck="false" />
            </Field>
          </section>

          <section className="panel">
            <div className="panel-title">
              <Icon name="dns" size={18} />
              <h2>AI Backend</h2>
            </div>

            <Field label="Provider">
              <select value={config.provider} onChange={event => applyProviderDefaults(event.target.value)}>
                <option value="openclaw">OpenClaw Gateway</option>
                <option value="openai">OpenAI API Key</option>
                <option value="custom">Custom Backend</option>
              </select>
            </Field>

            <Field label="Base URL">
              <input value={config.baseUrl} onChange={event => updateConfig('baseUrl', event.target.value)} spellCheck="false" />
            </Field>

            <Field label="Model">
              <input value={config.model} onChange={event => updateConfig('model', event.target.value)} spellCheck="false" />
            </Field>

            <Field label="Token / API Key">
              <div className="input-action">
                <input
                  type={showToken ? 'text' : 'password'}
                  value={config.apiKey}
                  onChange={event => updateConfig('apiKey', event.target.value)}
                  placeholder="Kosongkan untuk OpenClaw tanpa token"
                  spellCheck="false"
                />
                <button className="icon-button" type="button" title="Tampilkan token" onClick={() => setShowToken(prev => !prev)}>
                  <Icon name={showToken ? 'visibility_off' : 'visibility'} size={18} />
                </button>
              </div>
            </Field>

            <div className="button-grid">
              <ActionButton icon="save" label="Simpan" onClick={saveConfig} />
              <ActionButton icon="sync" label="Cek AI" variant="secondary" onClick={testAI} />
            </div>
          </section>

          <section className="panel storage-panel">
            <div className="panel-title">
              <Icon name="database" size={18} />
              <h2>Data Storage</h2>
            </div>

            <Field label="Mode">
              <select value={storageType} onChange={event => updateStorage({ type: event.target.value })}>
                <option value="local">Local JSON</option>
                <option value="mysql">MySQL Database</option>
              </select>
            </Field>

            {storageType === 'mysql' && (
              <>
                <div className="split">
                  <Field label="Host">
                    <input value={config.storage?.mysql?.host || ''} onChange={event => updateMysql('host', event.target.value)} spellCheck="false" />
                  </Field>
                  <Field label="Port">
                    <input type="number" min="1" value={config.storage?.mysql?.port || 3306} onChange={event => updateMysql('port', event.target.value)} />
                  </Field>
                </div>
                <Field label="Database">
                  <input value={config.storage?.mysql?.database || ''} onChange={event => updateMysql('database', event.target.value)} spellCheck="false" />
                </Field>
                <div className="split">
                  <Field label="User">
                    <input value={config.storage?.mysql?.user || ''} onChange={event => updateMysql('user', event.target.value)} spellCheck="false" />
                  </Field>
                  <Field label="Password">
                    <input
                      type={showToken ? 'text' : 'password'}
                      value={config.storage?.mysql?.password || ''}
                      onChange={event => updateMysql('password', event.target.value)}
                      placeholder="Kosongkan jika tidak ada"
                      spellCheck="false"
                    />
                  </Field>
                </div>
              </>
            )}

            <div className="button-grid">
              <ActionButton icon="save" label="Simpan" onClick={saveConfig} />
              <ActionButton icon="database" label="Cek DB" variant="secondary" onClick={testStorage} />
            </div>
            {health?.storage && <StorageStatus status={health.storage} />}
          </section>

          <section className="panel">
            <div className="panel-title">
              <Icon name="tune" size={18} />
              <h2>Run Settings</h2>
            </div>

            <div className="split">
              <Field label="Isi per link default">
                <input
                  type="number"
                  min="1"
                  value={config.responsesPerLink}
                  onChange={event => updateConfig('responsesPerLink', event.target.value)}
                />
              </Field>
              <Field label="Browser">
                <select value={config.headless ? 'true' : 'false'} onChange={event => updateConfig('headless', event.target.value === 'true')}>
                  <option value="true">Headless</option>
                  <option value="false">Terlihat</option>
                </select>
              </Field>
            </div>

            <label className="toggle-row">
              <input type="checkbox" checked={config.dryRun} onChange={event => updateConfig('dryRun', event.target.checked)} />
              <span>Dry Run default: isi sampai halaman terakhir, tapi tidak klik Kirim.</span>
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked={config.reviewBeforeSubmit} onChange={event => updateConfig('reviewBeforeSubmit', event.target.checked)} />
              <span>Review Before Submit: berhenti di halaman terakhir dan tunggu Approve Submit.</span>
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked={config.smartAutoMode !== false} onChange={event => updateConfig('smartAutoMode', event.target.checked)} />
              <span>Auto Analyze: sistem scan struktur form dan memilih strategi jawaban otomatis.</span>
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked readOnly disabled />
              <span>Likert lokal tanpa AI: jawaban skala dibuat acak-terdistribusi per responden.</span>
            </label>

            <label className="toggle-row">
              <input type="checkbox" checked={config.fastMode} onChange={event => updateConfig('fastMode', event.target.checked)} />
              <span>Mode Cepat (Fast Mode): kurangi delay pengisian halaman dan pertanyaan.</span>
            </label>

            <button className="wide-secondary" type="button" onClick={() => setRulesOpen(prev => !prev)}>
              <Icon name="auto_fix_high" size={18} />
              {rulesOpen ? 'Tutup Aturan Global' : 'Buka Aturan Global'}
            </button>

            {rulesOpen && (
              <Field label="Aturan AI Global">
                <textarea
                  className="rules-textarea"
                  value={config.customRulesText}
                  onChange={event => updateConfig('customRulesText', event.target.value)}
                />
              </Field>
            )}
          </section>
        </section>

        <section className="storage-page page-only page-storage">
          <section className="panel storage-dashboard-panel">
            <div className="panel-header-row">
              <div className="panel-title">
                <Icon name="database" size={18} />
                <h2>Database Cockpit</h2>
              </div>
              <div className="queue-actions">
                <button className="small-button" type="button" onClick={() => loadStorageDashboard(true)} disabled={storageLoading}>
                  <Icon name={storageLoading ? 'progress_activity' : 'sync'} size={17} className={storageLoading ? 'spin' : ''} />
                  Refresh
                </button>
                <a className="small-button link-button" href="/api/storage/backup" target="_blank" rel="noreferrer">
                  <Icon name="download" size={17} />
                  Backup JSON
                </a>
              </div>
            </div>

            <div className="storage-hero-grid">
              <StorageMetric icon="database" label="Engine" value={storageDashboard?.engine === 'mysql' ? 'MySQL' : storageLabel} />
              <StorageMetric icon="inventory_2" label="Report tersimpan" value={storageDashboard?.metrics?.reports || 0} />
              <StorageMetric icon="task_alt" label="Job sukses" value={storageDashboard?.metrics?.success || 0} tone="ok" />
              <StorageMetric icon="sync_saved_locally" label="Config sync" value={formatDateTime(storageDashboard?.schema?.configSyncedAt)} />
            </div>

            {storageDashboard?.storage && <StorageStatus status={storageDashboard.storage} />}
            {storageDashboard?.ok === false && <p className="preview-error">{storageDashboard.message}</p>}
          </section>

          <section className="panel storage-history-panel">
            <div className="panel-header-row">
              <div className="panel-title">
                <Icon name="history" size={18} />
                <h2>Recent Stored Runs</h2>
              </div>
              <span className="log-count">{storageDashboard?.reports?.length || 0} latest</span>
            </div>
            <div className="storage-run-list">
              {!storageDashboard?.reports?.length ? (
                <div className="empty-state">Belum ada report tersimpan di database.</div>
              ) : storageDashboard.reports.map(item => (
                <StorageRunRow key={item.id || item.startedAt || item.updatedAt} item={item} />
              ))}
            </div>
          </section>

          <section className="panel storage-schema-panel">
            <div className="panel-header-row">
              <div className="panel-title">
                <Icon name="table_chart" size={18} />
                <h2>Schema & Data Safety</h2>
              </div>
              <StatusPill status={storageDashboard?.schema?.ready ? 'ready' : 'not_ready'} />
            </div>
            <div className="storage-schema-grid">
              <div className="schema-table-list">
                {(storageDashboard?.schema?.tables || []).length ? storageDashboard.schema.tables.map(table => (
                  <div className="schema-table-row" key={table.name}>
                    <strong>{table.name}</strong>
                    <span>{table.rows} row</span>
                    <em>{table.sizeKb} KB</em>
                  </div>
                )) : (
                  <div className="empty-state">Schema akan tampil setelah storage berhasil dicek.</div>
                )}
              </div>
              <div className="safety-list">
                {(storageDashboard?.safety || []).map(item => (
                  <div className="safety-item" key={item}>
                    <Icon name="verified_user" size={17} />
                    <span>{item}</span>
                  </div>
                ))}
              </div>
            </div>
          </section>
        </section>

        <section className="panel profiles-page page-only page-profiles">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="rule_settings" size={18} />
              <h2>Profile Manager</h2>
            </div>
            <span className="log-count">{profileNames(config).length} profile</span>
          </div>
          <div className="profile-manager">
            <div className="profile-add-row">
              <input
                value={newProfileName}
                onChange={event => setNewProfileName(event.target.value)}
                onKeyDown={event => {
                  if (event.key === 'Enter') addProfile();
                }}
                placeholder="Nama profile baru"
                spellCheck="false"
              />
              <button type="button" onClick={addProfile}>
                <Icon name="add" size={18} />
              </button>
            </div>
            <div className="profile-list">
              {profileNames(config).map(name => (
                <ProfileEditor
                  key={name}
                  profile={config.profiles[name]}
                  onChange={patch => updateProfile(name, patch)}
                  onDelete={() => deleteProfile(name)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="panel queue-panel">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="checklist" size={18} />
              <h2>Daftar Google Forms</h2>
            </div>
            <div className="queue-actions">
              <button className="small-button" type="button" onClick={tidyLinks}>
                <Icon name="sync" size={17} />
                Rapikan
              </button>
              <button className="small-button danger-text" type="button" onClick={clearLinks}>
                <Icon name="ink_eraser" size={17} />
                Kosongkan
              </button>
            </div>
          </div>

          <div className="add-link-row">
            <input
              value={linkDraft}
              onChange={event => setLinkDraft(event.target.value)}
              onKeyDown={event => {
                if (event.key === 'Enter') addLinksFromDraft();
              }}
              placeholder="Paste satu atau banyak link Google Forms"
              spellCheck="false"
            />
            <button type="button" onClick={addLinksFromDraft}>
              <Icon name="add_link" size={18} />
              Tambah
            </button>
          </div>

          <textarea
            className="links-textarea"
            value={linksText}
            onChange={event => setLinksText(event.target.value)}
            placeholder="Satu baris satu link. Bisa paste banyak link sekaligus."
            spellCheck="false"
          />

          <div className="link-table">
            {runItems.length === 0 ? (
              <div className="empty-state">Belum ada link valid. Paste link Google Forms di atas.</div>
            ) : runItems.map((item, index) => (
              <FormQueueRow
                key={`${item.url}-${index}`}
                item={item}
                index={index}
                preview={previews.find(preview => preview.url === item.url)}
                profiles={config.profiles}
                smartAutoMode={config.smartAutoMode !== false}
                onPatch={patch => patchItem(item.url, patch)}
                onRemove={() => removeLink(index)}
              />
            ))}
          </div>
        </section>

        <section className="panel preview-panel">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="document_scanner" size={18} />
              <h2>Preview Struktur Form</h2>
            </div>
            <span className="log-count">{previews.length} preview</span>
          </div>
          {previews.length === 0 ? (
            <div className="empty-state">Klik Scan Preview untuk membaca halaman, tipe pertanyaan, dan tombol akhir tanpa submit.</div>
          ) : previews.map(preview => (
            <PreviewCard key={`${preview.url}-${preview.index}`} preview={preview} />
          ))}
        </section>

        <section className="panel report-panel">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="assignment" size={18} />
              <h2>Run Report Pro</h2>
            </div>
            <div className="queue-actions">
              <a className="small-button link-button" href="/api/report/export?format=json" target="_blank" rel="noreferrer">
                <Icon name="data_object" size={17} />
                JSON
              </a>
              <a className="small-button link-button" href="/api/report/export?format=csv" target="_blank" rel="noreferrer">
                <Icon name="table_view" size={17} />
                CSV
              </a>
              <a className="small-button link-button" href="/api/report/export?format=pdf" target="_blank" rel="noreferrer">
                <Icon name="picture_as_pdf" size={17} />
                PDF
              </a>
            </div>
          </div>
          <ReportSummary report={report} />
          <div className="job-table">
            {reportJobs.length === 0 ? (
              <div className="empty-state">Report akan muncul setelah sistem dijalankan.</div>
            ) : reportJobs.map(job => <JobRow key={job.id} job={job} />)}
          </div>
        </section>

        <section className="panel log-panel">
          <div className="panel-header-row">
            <div className="panel-title">
              <Icon name="monitoring" size={18} />
              <h2>Live Log</h2>
            </div>
            <span className="log-count">{logs.length} event</span>
          </div>
          <div className="log-box" ref={logRef}>
            {logs.length === 0 ? (
              <div className="empty-state">Log akan muncul saat sistem dijalankan.</div>
            ) : logs.map((item, index) => (
              <div className={`log-line ${item.level || 'info'}`} key={`${item.time}-${index}`}>
                <span>[{item.time}]</span>
                <p>{item.message}</p>
              </div>
            ))}
          </div>
        </section>

        <footer className="workspace-footer">
          <span>KUNEKU</span>
          <strong>Copyright 2026 Muhammad Habib Rafi. All rights reserved.</strong>
        </footer>
      </main>
    </div>
  );
}

function ProfileEditor({ profile, onChange, onDelete }) {
  const [open, setOpen] = useState(false);
  const builder = { ...DEFAULT_BUILDER, ...(profile.builder || {}) };

  function patchBuilder(patch) {
    const nextBuilder = { ...builder, ...patch };
    onChange({ builder: nextBuilder, rules: synthesizeRules(profile.rules, nextBuilder) });
  }

  return (
    <div className="profile-card">
      <div className="profile-card-head">
        <button className="profile-name-button" type="button" onClick={() => setOpen(prev => !prev)}>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={18} />
          <span>{profile.name}</span>
          {profile.locked && <em>system</em>}
        </button>
        {!profile.locked && (
          <button className="icon-button danger-text" type="button" title="Hapus profile" onClick={onDelete}>
            <Icon name="delete" size={18} />
          </button>
        )}
      </div>
      {open && (
        <div className="profile-editor-body">
          <div className="visual-builder">
            <div className="builder-row">
              <span>Nama</span>
              <input type="number" min="1" max="3" value={builder.nameWordsMin} onChange={event => patchBuilder({ nameWordsMin: event.target.value })} />
              <em>s/d</em>
              <input type="number" min="2" max="4" value={builder.nameWordsMax} onChange={event => patchBuilder({ nameWordsMax: event.target.value })} />
              <strong>kata</strong>
            </div>
            <div className="builder-row">
              <span>Gate pernah menggunakan</span>
              <select value={builder.yesGateAnswer} onChange={event => patchBuilder({ yesGateAnswer: event.target.value })}>
                <option value="Ya">Ya</option>
                <option value="Pernah">Pernah</option>
                <option value="Sudah">Sudah</option>
              </select>
            </div>
            <div className="builder-row">
              <span>Likert positif</span>
              <input value={builder.likertPositive} onChange={event => patchBuilder({ likertPositive: event.target.value })} />
            </div>
            <div className="builder-row">
              <span>Likert negatif</span>
              <input value={builder.likertNegative} onChange={event => patchBuilder({ likertNegative: event.target.value })} />
            </div>
            <div className="builder-row">
              <span>Maks rekomendasi checkbox</span>
              <input type="number" min="1" max="5" value={builder.maxRecommendation} onChange={event => patchBuilder({ maxRecommendation: event.target.value })} />
            </div>
          </div>
          <textarea
            className="profile-rules"
            value={profile.rules}
            onChange={event => onChange({ rules: event.target.value })}
          />
        </div>
      )}
    </div>
  );
}

function HealthPanel({ health }) {
  const rows = [
    ['Dashboard', health.dashboard?.status || '-', health.dashboard?.ok],
    ['Gateway', health.gateway?.status || '-', health.gateway?.ok],
    ['Storage', health.storage?.status || '-', health.storage?.ok],
    ['OAuth', health.oauth?.status || '-', health.oauth?.ok],
    ['AI', health.ai?.status || '-', health.ai?.ok]
  ];
  return (
    <div className="health-panel">
      {rows.map(([label, value, ok]) => (
        <div className="health-row" key={label}>
          <span>{label}</span>
          <strong className={ok === false ? 'bad' : ok === true ? 'ok' : ''}>{value}</strong>
        </div>
      ))}
    </div>
  );
}

function StorageStatus({ status }) {
  return (
    <div className={`storage-status ${status.ok === false ? 'bad' : status.ok === true ? 'ok' : ''}`}>
      <Icon name={status.type === 'mysql' ? 'database' : 'folder'} size={18} />
      <div>
        <strong>{status.label || (status.type === 'mysql' ? 'MySQL' : 'Local JSON')}</strong>
        <span>{status.message || status.status}</span>
      </div>
    </div>
  );
}

function StorageMetric({ icon, label, value, tone }) {
  return (
    <div className={`storage-metric ${tone || ''}`}>
      <Icon name={icon} size={19} />
      <div>
        <span>{label}</span>
        <strong>{value ?? '-'}</strong>
      </div>
    </div>
  );
}

function StorageRunRow({ item }) {
  const totals = item.totals || {};
  return (
    <div className="storage-run-row">
      <div>
        <StatusPill status={item.status} />
      </div>
      <div className="storage-run-main">
        <strong>{item.id || 'stored-report'}</strong>
        <span>{formatDateTime(item.startedAt || item.updatedAt)} | {item.linkCount || 0} link | {item.profileCount || 0} profile</span>
      </div>
      <MiniStat label="Jobs" value={totals.queued || 0} />
      <MiniStat label="Success" value={totals.success || 0} tone="ok" />
      <MiniStat label="Failed" value={totals.failed || 0} tone={totals.failed ? 'bad' : ''} />
    </div>
  );
}

function ReviewPanel({ review, onApprove, onSkip }) {
  return (
    <section className="panel review-panel">
      <div className="panel-header-row">
        <div className="panel-title">
          <Icon name="fact_check" size={18} />
          <h2>Review Before Submit</h2>
        </div>
        <StatusPill status="waiting_approval" />
      </div>
      <div className="review-layout">
        <div>
          <strong>{review.profileName} | isi {review.attempt}/{review.totalForLink}</strong>
          <span>{review.url}</span>
          {review.screenshot && (
            <a className="screenshot-link" href={review.screenshot} target="_blank" rel="noreferrer">
              <Icon name="photo_camera" size={17} />
              Screenshot final
            </a>
          )}
        </div>
        <div className="review-actions">
          <ActionButton icon="send" label="Approve Submit" onClick={onApprove} />
          <ActionButton icon="skip_next" label="Skip Job" variant="danger" onClick={onSkip} />
        </div>
      </div>
      <div className="answer-review-list">
        {(review.answers || []).map((item, index) => (
          <div className="answer-review-row" key={`${item.page}-${item.index}-${index}`}>
            <span>H{item.page}</span>
            <p>{item.title}</p>
            <strong>{Array.isArray(item.answer) ? item.answer.join(', ') : item.answer}</strong>
          </div>
        ))}
      </div>
    </section>
  );
}

function FormQueueRow({ item, index, preview, profiles, smartAutoMode, onPatch, onRemove }) {
  const [open, setOpen] = useState(false);
  const names = profileNames({ profiles });
  return (
    <div className="form-card">
      <div className="form-row-main">
        <div className="link-index">{index + 1}</div>
        <div className="link-main">
          <strong>{formTitleFromUrl(item.url)}</strong>
          <span>{item.url}</span>
        </div>
        {smartAutoMode ? (
          <span className="auto-mode-pill">
            <Icon name="wand" size={16} />
            Auto
          </span>
        ) : (
          <select value={item.profileName} onChange={event => onPatch({ profileName: event.target.value })}>
            {names.map(name => <option value={name} key={name}>{name}</option>)}
          </select>
        )}
        <input
          className="mini-input"
          type="number"
          min="1"
          title="Isi per link"
          value={item.responsesPerLink}
          onChange={event => onPatch({ responsesPerLink: event.target.value })}
        />
        <button className="icon-button" type="button" title="Aturan per form" onClick={() => setOpen(prev => !prev)}>
          <Icon name="auto_fix_high" size={18} />
        </button>
        <button className="icon-button danger-text" type="button" title="Hapus link" onClick={onRemove}>
          <Icon name="delete" size={18} />
        </button>
      </div>
      <div className="form-row-meta">
        <span>{smartAutoMode ? 'Auto Analyze' : item.profileName}</span>
        <span>{item.responsesPerLink} isi</span>
        {preview ? <span>{preview.pages?.length || 0} halaman preview</span> : <span>Belum discan</span>}
      </div>
      {open && (
        <textarea
          className="item-rules"
          value={item.customRulesText}
          onChange={event => onPatch({ customRulesText: event.target.value, profileName: item.profileName === 'Custom' ? 'Custom' : item.profileName })}
        />
      )}
    </div>
  );
}

function PreviewCard({ preview }) {
  return (
    <div className={`preview-card ${preview.ok ? '' : 'bad'}`}>
      <div className="preview-head">
        <div>
          <strong>{preview.profileName || 'Default'}</strong>
          <span>{preview.url}</span>
        </div>
        <StatusPill status={preview.ok ? (preview.status || 'ready') : 'failed'} />
      </div>
      {!preview.ok && <p className="preview-error">{preview.error}</p>}
      {(preview.pages || []).map(page => (
        <div className="preview-page" key={`${preview.url}-${page.step}`}>
          <div className="preview-page-title">
            <span>Halaman {page.step}</span>
            <strong>{page.pageType}</strong>
            <em>{page.questionCount} pertanyaan</em>
            {page.action && <em>tombol: {page.action}</em>}
          </div>
          <div className="question-list">
            {(page.questions || []).map(question => (
              <div key={`${page.step}-${question.index}`} className="question-chip">
                <span>{question.semanticType || question.type}</span>
                <p>{question.title}</p>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function ReportSummary({ report }) {
  const totals = report?.totals || { queued: 0, success: 0, dryRun: 0, failed: 0, skipped: 0 };
  return (
    <div className="report-summary">
      <MiniStat label="Queued" value={totals.queued} />
      <MiniStat label="Success" value={totals.success} tone="ok" />
      <MiniStat label="Dry Run" value={totals.dryRun} />
      <MiniStat label="Failed" value={totals.failed} tone="bad" />
      <MiniStat label="Skipped" value={totals.skipped} />
    </div>
  );
}

function JobRow({ job }) {
  const [open, setOpen] = useState(false);
  const answerCount = (job.pages || []).reduce((sum, page) => sum + (page.answers?.length || 0), 0);
  return (
    <div className="job-card">
      <div className="job-row">
        <div>
          <StatusPill status={job.status} />
        </div>
        <div className="job-main">
          <strong>{job.profileName} | isi {job.attempt}/{job.totalForLink}</strong>
          <span>{job.url}</span>
        </div>
        <span>{job.pageCount || 0} halaman</span>
        <span>{formatDuration(job.durationMs)}</span>
        <button className="small-button" type="button" onClick={() => setOpen(prev => !prev)}>
          <Icon name={open ? 'expand_less' : 'expand_more'} size={17} />
          {answerCount} jawaban
        </button>
        {job.screenshot ? (
          <a className="screenshot-link" href={job.screenshot} target="_blank" rel="noreferrer">
            <Icon name="photo_camera" size={17} />
            Screenshot
          </a>
        ) : <span className="muted-text">-</span>}
      </div>
      {open && (
        <div className="job-detail">
          {(job.pages || []).map(page => (
            <div className="job-page-detail" key={`${job.id}-${page.step}`}>
              <strong>Halaman {page.step}: {page.pageType}</strong>
              {(page.answers || []).map(answer => {
                const question = (page.questions || []).find(item => item.index === answer.index) || {};
                return (
                  <div className="answer-review-row compact" key={`${page.step}-${answer.index}`}>
                    <span>{question.semanticType || question.type || 'q'}</span>
                    <p>{question.title || `Pertanyaan ${answer.index + 1}`}</p>
                    <strong>{Array.isArray(answer.answer) ? answer.answer.join(', ') : answer.answer}</strong>
                  </div>
                );
              })}
            </div>
          ))}
          {job.error && <p className="preview-error">{job.error}</p>}
        </div>
      )}
    </div>
  );
}

function StatusPill({ status }) {
  return <span className={`status-pill ${statusClass(status)}`}>{status || 'idle'}</span>;
}

function MiniStat({ label, value, tone }) {
  return (
    <div className={`mini-stat ${tone || ''}`}>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <label className="field">
      <span>{label}</span>
      {children}
    </label>
  );
}

const ICON_MAP = {
  add: Plus,
  add_link: Link2,
  assignment: FileText,
  auto_fix_high: WandSparkles,
  check_circle: CheckCircle2,
  checklist: ListChecks,
  dashboard: LayoutDashboard,
  data_object: FileText,
  database: Database,
  delete: Trash2,
  dns: ServerCog,
  document_scanner: ScanLine,
  download: Download,
  expand_less: ChevronUp,
  expand_more: ChevronDown,
  fact_check: ClipboardCheck,
  folder: Folder,
  health_and_safety: ShieldCheck,
  history: History,
  ink_eraser: Eraser,
  inventory_2: Package,
  link: LinkIcon,
  manage_accounts: UserCog,
  monitoring: Activity,
  note_add: FilePlus2,
  photo_camera: Camera,
  picture_as_pdf: FileText,
  play_arrow: Play,
  progress_activity: LoaderCircle,
  radio_button_checked: CircleDot,
  rule_settings: SlidersHorizontal,
  save: Save,
  send: Send,
  shield: Shield,
  skip_next: SkipForward,
  smart_toy: Bot,
  stop: SquareStop,
  sync: RefreshCw,
  sync_saved_locally: HardDrive,
  table_chart: Table2,
  table_view: Table2,
  task_alt: CheckCircle2,
  tune: SlidersHorizontal,
  verified: BadgeCheck,
  verified_user: ShieldUser,
  visibility: Eye,
  visibility_off: EyeOff,
  wand: WandSparkles
};

function MaterialIcon({ name, size = 18, className = '' }) {
  const LucideIcon = ICON_MAP[name] || Radio;
  return <LucideIcon className={`lucide-icon ${className}`} size={size} aria-hidden="true" strokeWidth={2.15} />;
}

const Icon = MaterialIcon;

function Metric({ icon, label, value, compact, tone }) {
  return (
    <div className={`metric ${tone || ''}`}>
      <Icon name={icon} size={20} />
      <div>
        <span>{label}</span>
        <strong className={compact ? 'compact-value' : ''}>{value}</strong>
      </div>
    </div>
  );
}

function ActionButton({ icon, label, variant = 'primary', disabled, onClick, spin }) {
  return (
    <button className={`action-button ${variant}`} type="button" disabled={disabled} onClick={onClick}>
      <Icon name={icon} size={18} className={spin ? 'spin' : ''} />
      {label}
    </button>
  );
}

async function requestJson(url, options = {}) {
  const response = await fetch(url, {
    headers: { 'Content-Type': 'application/json', ...(options.headers || {}) },
    ...options
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || `HTTP ${response.status}`);
  return data;
}

function buildRunItems(links, itemSettings, config) {
  return links.map((url, index) => {
    const settings = settingsForUrl(url, itemSettings, config);
    const smartAuto = config.smartAutoMode !== false;
    return {
      id: settings.id || `form-${index + 1}`,
      url,
      profileName: smartAuto ? 'Auto Analyze' : settings.profileName,
      customRulesText: settings.customRulesText || config.customRulesText,
      responsesPerLink: Math.max(1, Number(settings.responsesPerLink || config.responsesPerLink || 1))
    };
  });
}

function settingsFromItems(items, config) {
  const out = {};
  for (const item of items || []) {
    if (!item.url) continue;
    const profileName = config.profiles?.[item.profileName] ? item.profileName : inferProfileName(item.url, config);
    out[item.url] = {
      id: item.id || stableItemId(item.url),
      profileName,
      customRulesText: item.customRulesText || config.profiles?.[profileName]?.rules || config.customRulesText,
      responsesPerLink: Math.max(1, Number(item.responsesPerLink || config.responsesPerLink || 1))
    };
  }
  return out;
}

function settingsForUrl(url, itemSettings, config) {
  const existing = itemSettings[url];
  if (existing) return existing;
  const profileName = inferProfileName(url, config);
  return {
    id: stableItemId(url),
    profileName,
    customRulesText: config.profiles?.[profileName]?.rules || config.customRulesText,
    responsesPerLink: Math.max(1, Number(config.responsesPerLink || 1))
  };
}

function inferProfileName(url, config = {}) {
  const source = String(url || '').toLowerCase();
  if ((source.includes('seminarfst') || source.includes('seminar')) && config.profiles?.seminarFST) return 'seminarFST';
  return config.profiles?.Default ? 'Default' : profileNames(config)[0] || 'Default';
}

function profileNames(config) {
  const profiles = config?.profiles || defaultProfiles();
  return Object.keys(profiles).sort((a, b) => {
    const order = name => {
      if (name === 'Default') return 0;
      if (name === 'Survey Kepuasan') return 1;
      if (name === 'Tracer Study') return 2;
      if (name === 'Rekomendasi Prodi') return 3;
      if (name === 'seminarFST') return 4;
      if (name === 'Custom') return 99;
      return 10;
    };
    return order(a) - order(b) || a.localeCompare(b);
  });
}

function synthesizeRules(rules, builder) {
  let next = String(rules || DEFAULT_RULES);
  next = replaceRuleLine(next, /^(pernah menggunakan|pernah mengakses|pernah memakai).*=>.*$/im, `pernah menggunakan, pernah mengakses, pernah memakai, pernah mencoba, sudah menggunakan, familiar dengan => ${builder.yesGateAnswer || 'Ya'}`);
  next = replaceRuleLine(next, /^mudah digunakan,\s*puas,\s*bermanfaat.*=>.*$/im, `mudah digunakan, puas, bermanfaat, nyaman, efektif, jelas => ${builder.likertPositive || '4 | 5'}`);
  next = replaceRuleLine(next, /^rumit,\s*sulit,\s*membingungkan.*=>.*$/im, `rumit, sulit, membingungkan, tidak praktis, kendala, masalah => ${builder.likertNegative || '1 | 2'}`);
  next = replaceRuleLine(next, /^rekomendasi program studi.*=>.*$/im, 'rekomendasi program studi, pilihan program studi, minat program studi => Teknik Informatika | Sistem Informasi | Teknik Industri | Matematika | Teknik Elektro');
  const note = `# Visual Builder: nama ${builder.nameWordsMin || 2}-${builder.nameWordsMax || 3} kata; rekomendasi maksimal ${builder.maxRecommendation || 5} pilihan`;
  if (/^# Visual Builder:.*$/im.test(next)) return next.replace(/^# Visual Builder:.*$/im, note);
  return `${next.trim()}\n${note}`;
}

function replaceRuleLine(source, pattern, line) {
  const text = String(source || '').trim();
  return pattern.test(text) ? text.replace(pattern, line) : `${text}\n${line}`;
}

function cleanProfileName(name) {
  return String(name || '')
    .replace(/[^\w\s.-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .slice(0, 40);
}

function stableItemId(url) {
  let hash = 0;
  for (const char of String(url)) hash = ((hash << 5) - hash + char.charCodeAt(0)) | 0;
  return `form-${Math.abs(hash)}`;
}

function extractLinks(text) {
  const raw = String(text || '');
  const matches = raw.match(/https?:\/\/(?:docs\.google\.com\/forms\/[^\s"'<>]+|forms\.gle\/[^\s"'<>]+)/gi) || [];
  const loose = raw.split(/\s+/).filter(part => /^(docs\.google\.com\/forms\/|forms\.gle\/)/i.test(part));
  return mergeLinks([], matches.concat(loose).map(cleanFormUrl).filter(Boolean));
}

function mergeLinks(current, incoming) {
  const out = [];
  const seen = new Set();
  for (const link of current.concat(incoming)) {
    const clean = cleanFormUrl(link);
    if (!clean || seen.has(clean)) continue;
    seen.add(clean);
    out.push(clean);
  }
  return out;
}

function cleanFormUrl(value) {
  let text = String(value || '').trim().replace(/[),.;]+$/, '');
  if (!text) return '';
  if (!/^https?:\/\//i.test(text)) text = `https://${text}`;
  try {
    const url = new URL(text);
    const host = url.hostname.toLowerCase();
    if (host === 'forms.gle' || (host === 'docs.google.com' && url.pathname.startsWith('/forms/'))) {
      return url.toString();
    }
  } catch (_) {}
  return '';
}

function formTitleFromUrl(link) {
  try {
    const url = new URL(link);
    if (url.hostname === 'forms.gle') return 'Short Google Form';
    const parts = url.pathname.split('/').filter(Boolean);
    const formId = parts.find(part => part.startsWith('1FAI')) || parts[parts.length - 2] || 'Google Form';
    return formId.length > 28 ? `${formId.slice(0, 28)}...` : formId;
  } catch (_) {
    return 'Google Form';
  }
}

function statusClass(status) {
  if (['submitted', 'completed', 'success', 'ready', 'ready_to_submit'].includes(status)) return 'ok';
  if (['dry_run', 'running', 'waiting_approval'].includes(status)) return 'live';
  if (['queued', 'idle'].includes(status)) return 'idle';
  if (['login_required', 'stopped', 'missing_navigation', 'not_ready'].includes(status)) return 'warn';
  return 'bad';
}

function formatDuration(ms) {
  const value = Number(ms || 0);
  if (!value) return '-';
  if (value < 1000) return `${value} ms`;
  return `${(value / 1000).toFixed(1)} s`;
}

function formatDateTime(value) {
  if (!value) return '-';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return '-';
  return date.toLocaleString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

createRoot(document.getElementById('root')).render(<App />);
