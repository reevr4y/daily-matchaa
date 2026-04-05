import { useState, useEffect } from 'react';

export default function ScrapbookModal({ onClose, papRecords = [] }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 300);
  };

  // Extract PAP records from tasks if they aren't provided separately
  // Assuming papRecords is an array of { photo_url, date, timestamp }

  return (
    <div className={`fixed inset-0 z-[12000] flex items-center justify-center p-4 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      <div className="absolute inset-0 bg-black/60 backdrop-blur-md" onClick={handleClose} />

      <div className={`relative w-full max-w-2xl bg-white dark:bg-[#252320] rounded-[2rem] p-8 shadow-2xl overflow-hidden transition-all duration-500 transform ${animate ? 'translate-y-0 scale-100' : 'translate-y-12 scale-90'}`}>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h2 className="text-3xl font-black italic tracking-tighter" style={{ color: 'var(--text)' }}>BUKU KENANGAN 📒</h2>
            <p className="text-sm font-medium" style={{ color: 'var(--muted)' }}>Koleksi momen cantik Matchaa harian~</p>
          </div>
          <button
            onClick={handleClose}
            className="w-12 h-12 flex items-center justify-center rounded-full bg-black/5 dark:bg-white/5 hover:scale-110 transition-all"
            style={{ color: 'var(--text)' }}
          >
            ✕
          </button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-6 max-h-[60vh] overflow-y-auto pr-2 custom-scrollbar">
          {papRecords.length === 0 ? (
            <div className="col-span-full py-20 text-center text-muted">
              <span className="text-4xl mb-4 block">📸</span>
              <p>Belum ada foto yang tersimpan nih~</p>
              <p className="text-xs mt-1">Ayo absen hari ini buat mulai koleksi!</p>
            </div>
          ) : (
            papRecords.map((rc, idx) => (
              <div
                key={idx}
                className="group relative bg-[#F8F5F0] dark:bg-[#1C1A17] p-2 pb-8 rounded-lg shadow-lg rotate-[-2deg] transition-all hover:rotate-0 hover:scale-105 hover:z-10"
                style={{ border: '1px solid var(--border)' }}
              >
                <div className="aspect-square bg-black/5 rounded-sm overflow-hidden mb-2">
                  <img src={rc.photo_url} alt={`Absen ${rc.date}`} className="w-full h-full object-cover grayscale-[0.2] group-hover:grayscale-0 transition-all" />
                </div>
                <p className="text-[10px] font-bold text-center uppercase tracking-widest leading-none opacity-60">
                  {new Date(rc.date).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })}
                </p>
                {/* Sticker placeholder */}
                {idx % 3 === 0 && <span className="absolute -top-2 -right-2 text-2xl rotate-12 drop-shadow-md">✨</span>}
                {idx % 4 === 1 && <span className="absolute -bottom-1 -left-1 text-2xl -rotate-12 drop-shadow-md">🏎️</span>}
              </div>
            ))
          )}
        </div>

        <div className="mt-8 pt-6 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
          <p className="text-xs text-center italic" style={{ color: 'var(--muted)' }}>
            "Setiap foto adalah bukti kamu semangat hari ini!" — Machii 🐱
          </p>
        </div>
      </div>
    </div>
  );
}
