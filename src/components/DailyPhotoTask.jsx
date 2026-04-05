import { useState, useRef, useEffect } from 'react';
import { playChime } from '../utils/sounds';
import { fireConfetti } from '../utils/confetti';

const STORAGE_KEY = 'dlt_daily_pap';

// ── Pesan lucu waktu belum absen ───────────────────────────────────────────
const IDLE_MESSAGES = [
  {
    text: 'Hei cantik, belom absen nih 😤',
    sub:  'Yuk foto dulu, aku pengen lihat wajah kamu!',
    emoji: '🥺',
  },
  {
    text: 'Mana absen cantiknya? 👀',
    sub:  'Streak bahaya kalau ga absen hari ini...',
    emoji: '😍',
  },
  {
    text: 'Kangen liat mukamu 🥺',
    sub:  'Absen sebentar dong, baru deh rebahan~',
    emoji: '💕',
  },
  {
    text: 'Foto dong, pasti cantik banget hari ini 😏',
    sub:  'Streak kamu sayang banget kalau putus gara-gara ini~',
    emoji: '😏',
  },
  {
    text: 'Eh kamu lupa absen ya? 🤨',
    sub:  'Jangan dong, aku pengen lihat kamu tiap hari!',
    emoji: '🤨',
  },
  {
    text: 'Absen sekarang! Aku nunggu foto kamu 📣',
    sub:  'Pasti cantik banget deh hari ini, buktiin!',
    emoji: '📣',
  },
  {
    text: 'Belum absen nih~ ayo dong 🙃',
    sub:  'Masih ada waktu! Aku mau lihat senyumu hari ini~',
    emoji: '🙃',
  },
  {
    text: 'Absen dulu ya sayang 💖',
    sub:  'Tiap hari aku nunggu foto kamu loh~',
    emoji: '💖',
  },
];

// ── Pesan sukses habis absen ──────────────────────────────────────────────────
const DONE_MESSAGES = [
  { text: 'Cantik banget sih kamu hari ini! 😍',     sub: 'Makin hari makin cakep deh~ +15 EXP!' },
  { text: 'Makin cantik aja tiap hari 💕',            sub: 'Beneran deh, foto ini bikin senyum terus~' },
  { text: 'Aduh, cantiknya keterlaluan 😭✨',          sub: 'Streak aman, hati aku makin klepek-klepek!' },
  { text: 'Cantiknya konsisten, persis kayak streak-nya 🔥', sub: 'Makasih udah absen hari ini, aku suka banget~' },
  { text: 'Kamu makin glowing setiap harinya 🌟',     sub: 'Semangat terus ya! +15 EXP udah di kantong~' },
  { text: 'Foto setiap hari karena emang selalu cakep 💖', sub: 'Gatau deh kok bisa secantik itu tiap hari~' },
  { text: 'Aduhai, cantik banget sih! 🥰',            sub: 'Aku lucky banget bisa lihat foto kamu tiap hari!' },
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
  const [rePreview, setRePreview]   = useState(null);
  const [loading, setLoading]     = useState(false);
  const [shaking, setShaking]     = useState(false);
  const [lightbox, setLightbox]   = useState(false); // fullscreen photo viewer
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
      onToast('Absen berhasil! Foto tersimpan di Drive ☁️ +15 EXP 📸✨', 'success');
    } else {
      onToast('Absen tercatat! Tapi foto gagal simpan di Drive (cek console) ⚠️ +15 EXP', 'warn');
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
    if (window.confirm('Hapus status Absen hari ini dari HP ini saja? (Bisa sinkron ulang lho!)')) {
      localStorage.removeItem(STORAGE_KEY);
      setPapState(null);
      setPreview(null);
      onToast('Status Absen di-reset! Silakan upload baru atau tunggu sinkron otomatis 🔄', 'info');
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
        <span>Absen Cantik Hari Ini</span>
        <div className="ml-auto flex items-center gap-1.5">
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full opacity-60"
            style={{ background: 'var(--accent)', color: 'var(--text)' }}
          >
            +15 EXP
          </span>
          <span
            className="text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{
              background: isDone ? 'var(--success)' : '#f97316',
              color: '#fff',
            }}
          >
            {isDone ? '✅ Done!' : '⚠️ Wajib Absen'}
          </span>
        </div>
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
                ? `Streak kamu ${streak} hari! Jangan sampe putus gara-gara ga absen~`
                : 'Mulai streak baru hari ini dengan absen! 🚀'}
            </span>
          </div>

          {/* ── Photo preview ── */}
          {preview && (
            <div
              className="relative mb-3 rounded-2xl overflow-hidden"
              style={{ 
                border: '2px solid var(--accent)', 
                aspectRatio: '1 / 1',
                background: 'rgba(0,0,0,0.03)' 
              }}
            >
              <img
                src={preview}
                alt="preview"
                className="w-full h-full object-contain"
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
                {uploading ? '⏳ Uploading...' : '✅ Setor Muka (+15 EXP)'}
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
              🔄 Ulangi / Reset Absen Hari Ini
            </button>
          </div>

          {/* Tampilkan foto dari Drive URL (cross-device!) */}
          {savedPhotoUrl ? (
            <div
              className="rounded-2xl overflow-hidden mb-3 aspect-square w-full shrink-0"
              style={{
                border:      '2px solid var(--success)',
                cursor:      'zoom-in',
                background:  'rgba(0,0,0,0.03)',
              }}
              onClick={() => setLightbox(true)}
              title="Klik untuk lihat foto penuh"
            >
              <img
                src={savedPhotoUrl}
                alt="absen hari ini"
                style={{
                  width:      '100%',
                  height:     '100%',
                  objectFit:  'contain',
                  background: 'rgba(0,0,0,0.03)',
                  display:    'block',
                }}
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
                <div 
                  className="relative" 
                  style={{ 
                    aspectRatio: '1 / 1', 
                    background: 'rgba(0,0,0,0.03)' 
                  }}
                >
                  <img
                    src={rePreview}
                    alt="preview re-upload"
                    className="w-full h-full object-contain"
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
      {/* +15 EXP badge top right (now inside header) */}

      {/* ── Lightbox / Fullscreen Photo ── */}
      {lightbox && savedPhotoUrl && (
        <div
          onClick={() => setLightbox(false)}
          style={{
            position:        'fixed',
            inset:           0,
            zIndex:          99999,
            background:      'rgba(0,0,0,0.92)',
            display:         'flex',
            alignItems:      'center',
            justifyContent:  'center',
            cursor:          'zoom-out',
            padding:         '1.5rem',
            animation:       'fadeIn 0.2s ease',
          }}
        >
          <img
            src={savedPhotoUrl}
            alt="pap fullscreen"
            style={{
              maxWidth:     '100%',
              maxHeight:    '90vh',
              borderRadius: '1rem',
              boxShadow:    '0 0 60px rgba(0,0,0,0.6)',
              objectFit:    'contain',
            }}
            onClick={e => e.stopPropagation()}
          />
          <button
            onClick={() => setLightbox(false)}
            style={{
              position:   'absolute',
              top:        '1.25rem',
              right:      '1.25rem',
              background: 'rgba(255,255,255,0.15)',
              border:     'none',
              color:      '#fff',
              width:      '40px',
              height:     '40px',
              borderRadius: '50%',
              fontSize:   '1.1rem',
              cursor:     'pointer',
              display:    'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backdropFilter: 'blur(4px)',
            }}
          >
            ✕
          </button>
          <p
            style={{
              position:  'absolute',
              bottom:    '1.25rem',
              left:      '50%',
              transform: 'translateX(-50%)',
              color:     'rgba(255,255,255,0.5)',
              fontSize:  '0.75rem',
              whiteSpace: 'nowrap',
            }}
          >
            Klik di luar foto untuk tutup
          </p>
        </div>
      )}
    </div>
  );
}
