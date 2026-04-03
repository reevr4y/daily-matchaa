import { useEffect, useState } from 'react';
import ThemePicker from './ThemePicker';

export default function Header({ levelInfo, exp, streak, darkMode, onToggleDark, onShowSettings, theme, onThemeChange }) {
  const [animate, setAnimate] = useState(false);

  useEffect(() => {
    setTimeout(() => setAnimate(true), 100);
  }, []);

  return (
    <header className="w-full">
      {/* Top row: greeting + dark toggle */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className={`flex-1 min-w-0 transition-all duration-700 ${animate ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2'}`}>
          <h1 className="text-2xl font-bold leading-tight truncate" style={{ color: 'var(--text)' }}>
            Matchaaawwww 👋
          </h1>
          <p className="text-sm mt-0.5 truncate" style={{ color: 'var(--muted)' }}>
            Selamat datang di ruang produktifmu~
          </p>
        </div>

        <div className="flex items-center gap-2.5 flex-shrink-0 mt-1">
          {/* Theme Picker */}
          <ThemePicker currentTheme={theme} onChange={onThemeChange} />
          
          <div className="flex items-center gap-2">
            {/* Streak badge */}
            {streak > 0 && (
              <div className="streak-badge flex-shrink-0">
                <span className="streak-fire">🔥</span> {streak}d
              </div>
            )}

            {/* Settings button */}
            <button
              onClick={onShowSettings}
              className="w-10 h-10 flex items-center justify-center rounded-full bg-accent border-[1.5px] border-accent-2 hover:scale-110 active:scale-95 transition-all text-base flex-shrink-0"
              title="Pengaturan"
              aria-label="Open settings"
            >
              ⚙️
            </button>

            {/* Dark mode toggle */}
            <button
              onClick={onToggleDark}
              className="dark-toggle flex-shrink-0"
              title={darkMode ? 'Switch to light mode' : 'Switch to dark mode'}
              aria-label="Toggle dark mode"
            >
              <div className="dark-toggle-knob flex items-center justify-center text-xs">
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
