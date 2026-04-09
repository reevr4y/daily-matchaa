import { useEffect, useState } from 'react';
import ThemePicker from './ThemePicker';

export default function Header({ levelInfo, exp, streak, darkMode, onToggleDark, onShowSettings, theme, onThemeChange }) {
  const [animate, setAnimate] = useState(false);

  const GREETINGS = [
    "Hi, sayang 👋",
    "Halo, cintaku ✨",
    "Semangat yaa, sayang 💖",
    "Kamu hebat banget hari ini 💙"
  ];

  const SUBTITLES = [
    "Hari ini kamu pasti bisa! ✨",
    "Jangan lupa senyum yaa matchaaww~ 🥰",
    "Satu-satu ya, yang penting jalan terus 💪",
    "Aku selalu support kamu di sini! 🌸"
  ];

  const [displayGreeting] = useState(() => GREETINGS[Math.floor(Math.random() * GREETINGS.length)]);
  const [displaySubtitle] = useState(() => SUBTITLES[Math.floor(Math.random() * SUBTITLES.length)]);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  return (
    <header className="w-full">
      {/* Top row: greeting + dark toggle */}
      <div className="flex flex-col sm:flex-row items-center sm:items-center justify-between gap-6 mb-8 pt-2">
        <div className={`flex flex-col items-center sm:items-start transition-all duration-1000 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-4'}`}>
          <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2" style={{ color: 'var(--text)', fontFamily: "'Poppins', sans-serif" }}>
            {displayGreeting}
          </h1>
          <p className="text-sm md:text-md font-medium opacity-80 bg-accent/30 px-4 py-1.5 rounded-full" style={{ color: 'var(--text)' }}>
            {displaySubtitle}
          </p>
        </div>

        <div className="flex items-center gap-3 md:gap-4 flex-shrink-0 w-full sm:w-auto justify-center sm:justify-end">
          {/* Theme Picker */}
          <div className="glass-premium p-1.5 rounded-full flex items-center gap-2">
             <ThemePicker currentTheme={theme} onChange={onThemeChange} />
          </div>
          
          <div className="flex items-center gap-3">
            {/* Streak badge */}
            {streak > 0 && (
              <div className="streak-badge flex-shrink-0 text-xs shadow-sm bg-accent md:scale-110">
                <span className="streak-fire">🔥</span> {streak}d
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={onShowSettings}
              className="w-10 h-10 md:w-12 md:h-12 flex items-center justify-center rounded-full bg-white/40 glass-premium border border-white/50 hover:scale-115 active:scale-90 transition-all text-base md:text-lg flex-shrink-0 shadow-sm"
              title="Pengaturan"
              aria-label="Open settings"
            >
              ⚙️
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="dark-toggle flex-shrink-0 scale-110 md:scale-125"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              <div className="dark-toggle-knob flex items-center justify-center text-[10px] md:text-xs">
                {darkMode ? '🌙' : '☀️'}
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Level + EXP */}
      <div className={`transition-all duration-700 delay-200 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2'}`}>
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <div className="level-badge">
              ⭐ Lv.{levelInfo.level}
            </div>
            <span className="text-xs font-medium" style={{ color: 'var(--muted)' }}>
              {levelInfo.title}
            </span>
          </div>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {levelInfo.isMax
              ? '✨ Max Level!'
              : `${levelInfo.currentExp} / ${levelInfo.expToNext} EXP`
            }
          </span>
        </div>

        <div className="exp-bar-track">
          <div
            className="exp-bar-fill"
            style={{ width: `${levelInfo.progress}%` }}
          />
        </div>

        <div className="flex justify-between mt-1.5">
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            Total: {exp} EXP
          </span>
          <span className="text-xs" style={{ color: 'var(--muted)' }}>
            {levelInfo.progress}%
          </span>
        </div>
      </div>
    </header>
  );
}
