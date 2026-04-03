import { useState, useRef, useEffect } from 'react';
import { playChime } from '../utils/sounds';
import { fireConfetti } from '../utils/confetti';

const STORAGE_KEY = 'dlt_daily_pap';

// ── Pesan lucu waktu belum pap ────────────────────────────────────────────────
const IDLE_MESSAGES = [
  {
    text: 'Kamu harini belom pap nih 😤',
    sub:  'Yuk foto dulu baru rebahan!',
    emoji: '😤',
  },
  {
    text: 'Hei! Fotonya mana? 👀',
    sub:  'Streak kamu bahaya banget kalau ga pap hari ini...',
    emoji: '👀',
  },
  {
    text: 'Belom pap = streak ancur 🔥💀',
    sub:  'Masa iya streak habis gara-gara males foto 5 detik?',
    emoji: '💀',
  },
  {
    text: 'Pap dulu dong jangan curang 😏',
    sub:  'Bukti produktif hari ini mana? Jangan ghosting streak~',
    emoji: '😏',
  },
  {
    text: 'Eh masih belum pap nih~',
    sub:  'Nanti streak kamu nangis loh 😭 Jangan sampe!',
    emoji: '😭',
  },
  {
    text: 'Kamu lupa pap ya? Atau emang sengaja? 🤨',
    sub:  'Streaknya udah nunggu dari tadi nih...',
    emoji: '🤨',
  },
  {
    text: 'Pap!!! Pap!!! Pap sekarang!!! 📣',
    sub:  'Oke oke santai, tapi serius deh foto dulu yuk.',
    emoji: '📣',
  },
  {
    text: 'Plot twist: kamu lupa pap 🙃',
    sub:  'Tapi untungnya masih ada waktu! Go go go!',
    emoji: '🙃',
  },
];

// ── Pesan sukses habis pap ────────────────────────────────────────────────────
const DONE_MESSAGES = [
  { text: 'Pap sukses! Streak aman 🔥', sub: 'Kamu keren banget hari ini!' },
  { text: 'Cakep banget! Good job ✨',   sub: 'Foto ini bukti kerennya kamu~' },
  { text: 'Foto kece, hari makin semangat 😎', sub: 'Streak terjaga, EXP bertambah!' },
  { text: 'Bukti nyata kamu produktif 💪', sub: 'Catat: ini hari yang bagus!' },
  { text: 'Streaknya selamat! Alhamdulillah 🙏', sub: '+15 EXP masuk kantong kamu~' },
];

function getTodayKey() {
  // Gunakan local time format YYYY-MM-DD (WIB/GMT+7) agar sinkron dengan API
  return new Date().toLocaleDateString('en-CA');
}

function loadPapState() {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY));
    if (raw && raw.date === getTodayKey()) return raw;
    return null;
  } catch { return null; }
}

function savePapState(data) {
  // Jangan simpan base64 — terlalu besar dan tidak bisa cross-device
  // Simpan hanya Drive URL (photo_url) atau flag done saja
  const { preview: _drop, ...safeData } = data; // buang field preview
  localStorage.setItem(STORAGE_KEY, JSON.stringify({ date: getTodayKey(), ...safeData }));
}

export default function DailyPhotoTask({ onExp, onToast, onAddPap, onSaveStreak, streak, onShowExpPopup }) {
  const [papState, setPapState] = useState(() => loadPapState());
  // preview = base64 DataURL sementara (untuk ditampilkan sebelum submit)
  // setelah submit, kita pakai photo_url (Drive URL) dari papState
  const [preview, setPreview]     = useState(null); // TIDAK load dari LS (base64 tidak disimpan)
  const [uploading, setUploading]   = useState(false);
  const [reUploading, setReUploading] = useState(false);
  const [rePreview, setRePreview]   = useState(null); // preview untuk re-upload
  const [loading, setLoading]     = useState(false);
  const [shaking, setShaking]     = useState(false);
  const fileRef     = useRef(null);
  const reUploadRef = useRef(null); // file input khusus re-upload

  // Drive URL yang tersimpan di LS (untuk cross-device)
  const savedPhotoUrl = papState?.photo_url || null;

  // ── Listen cross-device sync event dari App.jsx ───────────────────────────
  useEffect(() => {
    const onSync = () => {
      const synced = loadPapState();
      if (synced) setPapState(synced);
    };
    window.addEventListener('pap-synced', onSync);
    return () => window.removeEventListener('pap-synced', onSync);
  }, []);

  // Pick deterministic idle message for today
  const dayIndex = new Date().getDate() % IDLE_MESSAGES.length;
  const idleMsg  = IDLE_MESSAGES[dayIndex];
  const doneMsg  = DONE_MESSAGES[new Date().getDate() % DONE_MESSAGES.length];
  const isDone   = Boolean(papState?.done);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);
    const reader = new FileReader();
    reader.onload = (ev) => {
      setPreview(ev.target.result);
      setLoading(false);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async () => {
    if (!preview || isDone) return;

    setUploading(true);
    onToast('Upload foto ke Drive...⏳', 'info');

    const timestamp = new Date().toISOString();
    let photo_url = '';

    // ── Upload foto ke Google Drive ──────────────────────────────────────────
    if (onAddPap) {
      try {
        const result = await onAddPap({
          date:         getTodayKey(),
          status:       'done',
          timestamp,
          photoDataUrl: preview, // kirim base64 ke Drive
        });
        photo_url = result?.photo_url || '';
      } catch (e) {
        console.warn('[PAP] Upload failed:', e);
      }
    }

    // ── Simpan state ke LS (TANPA base64, hanya Drive URL) ──────────────────
    const state = { done: true, photo_url, timestamp };
    savePapState(state);
    setPapState({ date: getTodayKey(), ...state });
    setPreview(null); // hapus base64 dari memory
    setUploading(false);

    playChime();
    fireConfetti();
    onExp(15);
    if (onShowExpPopup) onShowExpPopup(15, 'exp');
    
    if (photo_url) {
      onToast('Pap berhasil! Foto tersimpan di Drive ☁️ +15 EXP 📸✨', 'success');
    } else {
      onToast('Pap tercatat! Tapi foto gagal simpan di Drive (cek console) ⚠️ +15 EXP', 'warn');
    }

    // ── Catat streak ke Sheets juga ───────────────────────────────────────────
    if (onSaveStreak) {
      onSaveStreak({
        date:         getTodayKey(),
        streak_count: streak ?? 0,
        pap_done:     'YES',
      });
    }
  };

  const handleCancel = () => {
    setPreview(null);
    if (fileRef.current) fileRef.current.value = '';
  };

  // ── Re-upload foto untuk PAP yang sudah done tapi belum ada Drive URL ──────
  const handleReUploadChange = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setRePreview(ev.target.result);
    reader.readAsDataURL(file);
  };

  const handleReUpload = async () => {
    if (!rePreview || reUploading) return;
    setReUploading(true);
    onToast('Re-upload foto ke Drive... ⏳', 'info');

    let photo_url  = '';
    let papResult  = null;
    if (onAddPap) {
      try {
        papResult = await onAddPap({
          date:         getTodayKey(),
          status:       'done',
          timestamp:    papState?.timestamp || new Date().toISOString(),
          photoDataUrl: rePreview,
        });
        photo_url = papResult?.photo_url || '';
      } catch (err) {
        console.warn('[PAP] Re-upload threw:', err);
      }
    }

    if (photo_url) {
      const updated = { ...papState, photo_url };
      savePapState(updated);
      setPapState({ date: getTodayKey(), ...updated });
      setRePreview(null);
      if (reUploadRef.current) reUploadRef.current.value = '';
      onToast('Foto berhasil di-upload ke Drive! ☁️📸', 'success');
    } else {
      console.error('[PAP] Re-upload papResult:', papResult);
      onToast(
        papResult?.error
          ? `Upload gagal: ${String(papResult.error).slice(0, 60)}`
          : 'Upload gagal 😭 Buka F12 > Console untuk lihat error detail',
        'warn'
      );
    }
    setReUploading(false);
  };

  const cancelReUpload = () => {
    setRePreview(null);
    if (reUploadRef.current) reUploadRef.current.value = '';
  };

  const handleReset = () => {
    if (window.confirm('Hapus status Pap hari ini dari HP ini saja? (Bisa sinkron ulang lho!)')) {
      localStorage.removeItem(STORAGE_KEY);
      setPapState(null);
      setPreview(null);
      onToast('Status Pap di-reset! Silakan upload baru atau tunggu sinkron otomatis 🔄', 'info');
      // Beri jeda kecil lalu paksa cek ulang sync
      setTimeout(() => window.location.reload(), 800);
    }
  };

  // Shake animation kalau klik tombol upload
  const triggerShake = () => {
    setShaking(true);
    setTimeout(() => setShaking(false), 600);
    fileRef.current?.click();
  };

  return (
    <div
      className="card p-5 relative overflow-hidden"
      style={{
        border: isDone
          ? '1.5px solid var(--success)'
          : '1.5px solid var(--accent-2)',
        transition: 'border-color 0.4s ease',
      }}
    >
      {/* ── Header ── */}
      <div className="section-title mb-3">
        <span>📸</span>
        <span>Kirim Pap Harian</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: isDone ? 'var(--success)' : '#f97316',
            color: '#fff',
          }}
        >
          {isDone ? '✅ Done!' : '⚠️ Wajib Pap'}
        </span>
      </div>

      {!isDone ? (
        <>
          {/* ── Nudge message ── */}
          <div
            className={`px-4 py-3 rounded-2xl mb-4 text-center ${shaking ? 'animate-shake' : ''}`}
            style={{
              background: 'linear-gradient(135deg, rgba(249,115,22,0.12), rgba(251,191,36,0.12))',
              border: '1.5px dashed #f97316',
            }}
          >
            <div className="text-3xl mb-1">{idleMsg.emoji}</div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {idleMsg.text}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {idleMsg.sub}
            </p>
          </div>

          {/* ── Streak warning ── */}
          <div
            className="flex items-center gap-2 px-3 py-2 rounded-xl mb-3 text-xs font-medium"
            style={{
              background: 'rgba(239,68,68,0.08)',
              border: '1px solid rgba(239,68,68,0.25)',
              color: '#ef4444',
            }}
          >
            <span className="text-base">🔥</span>
            <span>
              {streak && streak > 0
                ? `Streak kamu ${streak} hari! Jangan sampe putus gara-gara ga pap~`
                : 'Mulai streak baru hari ini dengan pap! 🚀'}
            </span>
          </div>

          {/* ── Photo preview ── */}
          {preview && (
            <div className="relative mb-3 rounded-2xl overflow-hidden" style={{ border: '2px solid var(--accent)' }}>
              <img
                src={preview}
                alt="preview"
                className="w-full object-cover"
                style={{ maxHeight: '220px' }}
              />
              <button
                onClick={handleCancel}
                className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm"
                style={{ background: 'rgba(0,0,0,0.5)', color: '#fff', backdropFilter: 'blur(4px)' }}
              >
                ✕
              </button>
              <div
                className="absolute bottom-2 left-2 text-xs font-semibold px-2 py-1 rounded-full"
                style={{ background: 'rgba(0,0,0,0.45)', color: '#fff', backdropFilter: 'blur(4px)' }}
              >
                📷 Foto siap dikirim!
              </div>
            </div>
          )}

          {/* ── Buttons ── */}
          {!preview ? (
            <button
              onClick={triggerShake}
              disabled={loading || uploading}
              className="btn-primary w-full py-3 rounded-2xl flex items-center justify-center gap-2 font-bold"
              style={{ fontSize: '0.95rem' }}
            >
              <span className="text-xl">📷</span>
              <span>{loading ? 'Loading foto...' : 'Ambil / Upload Foto Sekarang!'}</span>
            </button>
          ) : (
            <div className="flex gap-2">
              <button
                onClick={handleCancel}
                disabled={uploading}
                className="flex-1 py-2.5 rounded-2xl text-sm font-medium border transition-colors"
                style={{
                  background: 'var(--bg)',
                  border: '1.5px solid var(--border)',
                  color: 'var(--muted)',
                }}
              >
                🔄 Ganti Foto
              </button>
              <button
                onClick={handleSubmit}
                disabled={uploading}
                className="flex-1 btn-primary py-2.5 rounded-2xl flex items-center justify-center gap-1.5 font-bold"
              >
                {uploading ? '⏳ Uploading...' : '✅ Kirim Pap! (+15 EXP)'}
              </button>
            </div>
          )}

          {/* Hidden file input */}
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />
        </>
      ) : (
        /* ── Done state ── */
        <>
          <div
            className="px-4 py-3 rounded-2xl mb-3 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.12), rgba(16,185,129,0.12))',
              border: '1.5px solid var(--success)',
            }}
          >
            <div className="text-3xl mb-1">🎉</div>
            <p className="font-bold text-sm" style={{ color: 'var(--success)' }}>
              {doneMsg.text}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              {doneMsg.sub}
            </p>
            
            {/* Tombol kecil Reset/Ulangi */}
            <button
              onClick={handleReset}
              className="mt-3 text-[10px] uppercase tracking-wider font-bold opacity-40 hover:opacity-100 transition-opacity"
              style={{ color: 'var(--muted)' }}
            >
              🔄 Ulangi / Reset Pap Hari Ini
            </button>
          </div>

          {/* Tampilkan foto dari Drive URL (cross-device!) */}
          {savedPhotoUrl ? (
            <div className="rounded-2xl overflow-hidden mb-3" style={{ border: '2px solid var(--success)' }}>
              <img
                src={savedPhotoUrl}
                alt="pap hari ini"
                className="w-full object-cover"
                style={{ maxHeight: '220px' }}
                onError={(e) => { e.target.style.display = 'none'; }}
              />
            </div>
          ) : (
            // ── Foto belum ter-upload: tampilkan re-upload UI ──────────────
            <div
              className="rounded-2xl mb-3 overflow-hidden"
              style={{ border: '1.5px dashed var(--success)' }}
            >
              {rePreview ? (
                // Preview foto yang dipilih untuk re-upload
                <div className="relative">
                  <img
                    src={rePreview}
                    alt="preview re-upload"
                    className="w-full object-cover"
                    style={{ maxHeight: '180px' }}
                  />
                  <button
                    onClick={cancelReUpload}
                    disabled={reUploading}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold"
                    style={{ background: 'rgba(0,0,0,0.5)', color: '#fff' }}
                  >
                    ✕
                  </button>
                </div>
              ) : (
                // Placeholder: belum ada foto
                <div
                  className="flex flex-col items-center justify-center gap-1.5 py-4 text-xs"
                  style={{ color: 'var(--muted)' }}
                >
                  <span className="text-2xl">📷</span>
                  <span className="font-medium">Foto belum ter-upload ke Drive</span>
                  <span style={{ opacity: 0.7 }}>Upload sekarang biar bisa dilihat di HP lain!</span>
                </div>
              )}

              {/* Re-upload action row */}
              <div className="flex gap-2 p-2">
                <button
                  onClick={() => reUploadRef.current?.click()}
                  disabled={reUploading}
                  className="flex-1 py-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1"
                  style={{
                    background: 'var(--bg)',
                    border: '1.5px solid var(--border)',
                    color: 'var(--text)',
                    opacity: reUploading ? 0.5 : 1,
                  }}
                >
                  🖼️ {rePreview ? 'Ganti' : 'Pilih Foto'}
                </button>
                {rePreview && (
                  <button
                    onClick={handleReUpload}
                    disabled={reUploading}
                    className="flex-1 py-2 rounded-xl text-xs font-bold flex items-center justify-center gap-1"
                    style={{
                      background: 'var(--success)',
                      color: '#fff',
                      opacity: reUploading ? 0.6 : 1,
                    }}
                  >
                    {reUploading ? '⏳ Uploading...' : '☁️ Upload ke Drive'}
                  </button>
                )}
              </div>

              {/* Hidden re-upload input */}
              <input
                ref={reUploadRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleReUploadChange}
              />
            </div>
          )}

          {/* Saved to Sheets badge */}
          <div
            className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 rounded-xl"
            style={{ background: 'rgba(34,197,94,0.1)', color: 'var(--success)' }}
          >
            <span>{savedPhotoUrl ? '☁️' : '⚠️'}</span>
            <span>{savedPhotoUrl ? 'Foto tersimpan di Drive · Bisa dibuka di device lain!' : 'Tercatat di Sheets · Upload foto supaya sync!'}</span>
          </div>
        </>
      )}

      {/* +15 EXP badge top right */}
      <div
        className="absolute top-4 right-16 text-xs font-bold px-2 py-0.5 rounded-full opacity-70"
        style={{ background: 'var(--accent)', color: 'var(--text)' }}
      >
        +15 EXP
      </div>
    </div>
  );
}
