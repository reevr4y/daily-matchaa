import { useState, useEffect } from 'react';
import { playPop } from '../utils/sounds';

export default function SettingsModal({ settings, setSettings, onClose, onToast }) {
  const [localSettings, setLocalSettings] = useState(settings);
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setAnimate(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const handleSave = () => {
    setSettings(localSettings);
    playPop();
    onToast('Pengaturan disimpan! ✨', 'success');
    handleClose();
  };

  const handleClose = () => {
    setAnimate(false);
    setTimeout(onClose, 300);
  };

  return (
    <div className={`fixed inset-0 z-[12000] flex items-center justify-center p-4 transition-all duration-300 ${animate ? 'opacity-100' : 'opacity-0'}`}>
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/40 backdrop-blur-sm" 
        onClick={handleClose}
      />
      
      {/* Modal Card */}
      <div className={`relative w-full max-w-sm card p-6 transition-all duration-500 transform ${animate ? 'translate-y-0 scale-100' : 'translate-y-12 scale-90'}`}>
        <div className="flex items-center justify-between mb-6">
          <div className="section-title mb-0">
            <span>⚙️</span>
            <span>Pengaturan</span>
          </div>
          <button 
            onClick={handleClose}
            className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
            style={{ color: 'var(--muted)' }}
          >
            <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
              <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </button>
        </div>

        <div className="space-y-5">
          <div className="space-y-2">
            <label className="text-xs font-bold px-1 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Batas Harian (IDR)
            </label>
            <input 
              type="number"
              value={localSettings.daily}
              onChange={e => setLocalSettings({...localSettings, daily: Number(e.target.value)})}
              className="input-field"
              placeholder="100000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold px-1 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Batas Mingguan (IDR)
            </label>
            <input 
              type="number"
              value={localSettings.weekly}
              onChange={e => setLocalSettings({...localSettings, weekly: Number(e.target.value)})}
              className="input-field"
              placeholder="700000"
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold px-1 uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
              Batas Bulanan (IDR)
            </label>
            <input 
              type="number"
              value={localSettings.monthly}
              onChange={e => setLocalSettings({...localSettings, monthly: Number(e.target.value)})}
              className="input-field"
              placeholder="2000000"
            />
          </div>
        </div>

        <div className="mt-8 flex gap-3">
          <button 
            onClick={handleClose}
            className="flex-1 py-3 rounded-xl font-semibold text-sm transition-all"
            style={{ border: '1px solid var(--border)', color: 'var(--muted)', background: 'var(--bg)' }}
          >
            Batal
          </button>
          <button 
            onClick={handleSave}
            className="flex-1 btn-primary"
          >
            Simpan ✨
          </button>
        </div>

        <div className="mt-4 pt-4 border-t border-dashed" style={{ borderColor: 'var(--border)' }}>
          <p className="text-[10px] text-center italic" style={{ color: 'var(--muted)' }}>
            Gunakan angka saja tanpa titik/koma (contoh: 200000)
          </p>
        </div>
      </div>
    </div>
  );
}
