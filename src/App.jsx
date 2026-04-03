import { useState, useEffect, useCallback } from 'react';
import Header         from './components/Header';
import FilterBar      from './components/FilterBar';
import TaskSection    from './components/TaskSection';
import ExpenseSection from './components/ExpenseSection';
import InsightCard    from './components/InsightCard';
import DailyPhotoTask from './components/DailyPhotoTask';
import HistoryModal   from './components/HistoryModal';
import FeedbackToast, { useToast } from './components/FeedbackToast';
import WelcomeCard    from './components/WelcomeCard';
import ExpPopup, { useExpPopup } from './components/ExpPopup';
import { useGameState }  from './hooks/useGameState';
import { useSheetsAPI }  from './hooks/useSheetsAPI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fireConfetti }  from './utils/confetti';
import ExpenseChart   from './components/ExpenseChart';
import WeeklyReport, { useWeeklyReportTrigger } from './components/WeeklyReport';

export default function App() {
  // ── Dark mode ────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useLocalStorage('dlt_dark', false);
  const [showWelcome, setShowWelcome] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const { show: showWeeklyReport, setShow: setShowWeeklyReport, dismiss: dismissWeekly } = useWeeklyReportTrigger();
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
  }, [darkMode]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState('daily');

  // ── Game state ────────────────────────────────────────────────────────────
  const { exp, streak, levelInfo, addExp, streakBroke } = useGameState();

  // ── Data state ────────────────────────────────────────────────────────────
  const [tasks,    setTasks]    = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [ready,    setReady]    = useState(false);

  const {
    loading,
    fetchTasks,
    addTask:          apiAddTask,
    updateTask:       apiUpdateTask,
    deleteTask:       apiDeleteTask,
    fetchExpenses,
    addExpense:       apiAddExpense,
    addPapRecord:     apiAddPap,
    fetchTodayPap,
    saveStreakToSheets,
    fetchGameState,
    updateGameState,
  } = useSheetsAPI();

  // ── Toasts ────────────────────────────────────────────────────────────────
  const { toasts, addToast } = useToast();

  // ── EXP Popups ─────────────────────────────────────────────────────────────
  const { popups: expPopups, showExpPopup } = useExpPopup();

  // ── Streak broke notification ─────────────────────────────────────────
  useEffect(() => {
    if (streakBroke) {
      setTimeout(() => {
        addToast('Aduh! Streak kemarin putus gara-gara ga pap 😭 Mulai lagi ya!', 'warn');
      }, 1500);
    }
  }, [streakBroke]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Initial load ──────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      // 1. Fetch dasar (Tasks, Expenses)
      const [t, e] = await Promise.all([fetchTasks(), fetchExpenses()]);
      setTasks(t || []);
      setExpenses(e || []);

      // 2. ── Sync Game State (EXP, Streak) ───────────────────────────────────
      try {
        const remoteState = await fetchGameState();
        if (remoteState) {
          const localExp = JSON.parse(localStorage.getItem('dlt_exp') || '0');
          // Update kalau data di Sheets lebih baru (pakai EXP sebagai pembanding simpel)
          // atau jika di lokal masih 0 sedangkan di Sheets sudah ada isinya.
          if (remoteState.exp > localExp) {
            import('./hooks/useGameState').then(() => {
              // Kita paksa update LS biar hook useGameState ambil nilai terbaru nanti
              localStorage.setItem('dlt_exp',        JSON.stringify(remoteState.exp));
              localStorage.setItem('dlt_streak',     JSON.stringify(remoteState.streak));
              localStorage.setItem('dlt_lastActive', JSON.stringify(remoteState.last_active));
              // Force re-render dengan reload/state update? 
              // Karena useGameState sudah jalan, cara terbaik adalah dispatch event atau reload kecil.
              window.location.reload(); 
            });
          }
        }
      } catch (err) {
        console.warn('[Sync] Game state sync failed:', err);
      }

      // 3. ── Cross-device PAP sync ──────────────────────────────────────────
      try {
        const todayKey = new Date().toLocaleDateString('en-CA');
        const localPapString = localStorage.getItem('dlt_daily_pap');
        const localPap = localPapString ? JSON.parse(localPapString) : null;
        
        const hasTodayLocal = localPap?.date === todayKey && localPap?.done === true;
        const hasPhotoUrl   = !!localPap?.photo_url && localPap?.photo_url.length > 5;

        if (!hasTodayLocal || !hasPhotoUrl) {
          const remotePap = await fetchTodayPap();
          if (remotePap && remotePap.status === 'done' && remotePap.photo_url) {
            localStorage.setItem('dlt_daily_pap', JSON.stringify({
              date:      todayKey,
              done:      true,
              photo_url: remotePap.photo_url,
              timestamp: remotePap.timestamp || '',
            }));
            window.dispatchEvent(new Event('pap-synced'));
          }
        }
      } catch (e) {
        console.warn('[PAP Sync] Failed to sync from Sheets:', e);
      }

      setReady(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Game State ke Cloud saat EXP berubah ─────────────────────────────
  useEffect(() => {
    if (ready && exp > 0) {
      updateGameState({ exp, streak, last_active: localStorage.getItem('dlt_lastActive')?.replace(/"/g, '') || '' });
    }
  }, [exp, streak, ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Task handlers ─────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async (title) => {
    const task = await apiAddTask(title);
    setTasks(prev => [task, ...prev]);
  }, [apiAddTask]);

  const handleCompleteTask = useCallback(async (id) => {
    await apiUpdateTask(id, 'done');
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    const prevLevel = levelInfo.level;
    addExp(10);
    showExpPopup(10, 'exp');
    // Level up check (async — level updates after re-render)
    setTimeout(() => {
      const next = JSON.parse(localStorage.getItem('dlt_exp') || '0');
      import('./utils/levels').then(({ getLevelInfo }) => {
        const info = getLevelInfo(next);
        if (info.level > prevLevel) {
          fireConfetti();
          showExpPopup(0, 'levelup', { newLevel: info.level, levelTitle: info.title });
        }
      });
    }, 100);
  }, [apiUpdateTask, addExp, levelInfo, showExpPopup]);

  const handleDeleteTask = useCallback(async (id) => {
    await apiDeleteTask(id);
    setTasks(prev => prev.filter(t => t.id !== id));
  }, [apiDeleteTask]);

  // ── Expense handlers ──────────────────────────────────────────────────────
  const handleAddExpense = useCallback(async (name, amount) => {
    const expense = await apiAddExpense(name, amount);
    setExpenses(prev => [expense, ...prev]);
    // High spending penalty (-2 EXP if over 200k)
    if (amount >= 200000) {
      addExp(-2);
      showExpPopup(-2, 'exp');
      addToast('Dompet kamu nangis 😭 (-2 EXP)', 'warn');
    } else {
      addExp(5);
      showExpPopup(5, 'exp');
    }
  }, [apiAddExpense, addExp, addToast, showExpPopup]);

  if (!ready) {
    return (
      <div
        className="min-h-screen"
        style={{ background: 'var(--bg)' }}
      >
        <div className="max-w-2xl mx-auto px-4 py-6 lg:max-w-4xl space-y-4">
          {/* Skeleton header */}
          <div className="skeleton-card">
            <div className="skeleton-line" style={{ width: '55%' }} />
            <div className="skeleton-line" style={{ width: '35%', height: '10px', animationDelay: '0.1s' }} />
            <div className="skeleton" style={{ height: '10px', width: '100%', borderRadius: '99px', animationDelay: '0.2s' }} />
          </div>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            {[0,1,2,3].map(i => (
              <div key={i} className="skeleton-card" style={{ animationDelay: `${i * 0.08}s` }}>
                <div className="skeleton-line" style={{ width: '40%', animationDelay: `${i * 0.1}s` }} />
                <div className="skeleton-line" style={{ animationDelay: `${i * 0.12}s` }} />
                <div className="skeleton-line" style={{ width: '75%', animationDelay: `${i * 0.14}s` }} />
                <div className="skeleton-line" style={{ width: '60%', animationDelay: `${i * 0.16}s` }} />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', transition: 'background 0.3s ease', position: 'relative', overflow: 'hidden' }}
    >
      {/* ── Decorative blob shapes ── */}
      <div className="deco-blob deco-blob-1" aria-hidden="true" />
      <div className="deco-blob deco-blob-2" aria-hidden="true" />
      <div className="deco-blob deco-blob-3" aria-hidden="true" />

      {/* ── Container ── */}
      <div className="app-container">

        {/* ── Header Row: 3/4 header + 1/4 date card ── */}
        <div className="header-row">
          <div className="header-main">
            <Header
              levelInfo={levelInfo}
              exp={exp}
              streak={streak}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode(d => !d)}
            />
          </div>
          <div className="header-date-card card p-5">
            <p className="text-[10px] font-semibold uppercase tracking-wider mb-1" style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleDateString('id-ID', { weekday: 'long' })}
            </p>
            <p className="text-3xl font-bold leading-none" style={{ color: 'var(--text)', letterSpacing: '-0.03em' }}>
              {new Date().getDate()}
            </p>
            <p className="text-xs font-medium mt-0.5" style={{ color: 'var(--muted)' }}>
              {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}
            </p>
            <div className="mt-3 h-px" style={{ background: 'var(--border)' }} />
            <p className="text-xs font-semibold mt-3 text-center" style={{ color: 'var(--success)' }}>✨ Semangat!</p>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="action-bar">
          <FilterBar active={filter} onChange={setFilter} />
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              className="history-btn"
              onClick={() => setShowHistory(true)}
              aria-label="Buka riwayat harian"
            >
              <span>📅</span>
              <span>Riwayat</span>
            </button>
            <button
              className="history-btn"
              onClick={() => setShowWeeklyReport(true)}
              aria-label="Buka laporan mingguan"
              style={{ background: 'var(--accent-2)', color: 'var(--text)' }}
            >
              <span>📊</span>
              <span>Laporan</span>
            </button>
          </div>
        </div>

        {/* ── Main 3-Column Grid ── */}
        <div className="main-grid">

          {/* ── Column 1: Photo + Task + Insight ── */}
          <div className="col-left">
            <DailyPhotoTask
              onExp={addExp}
              onToast={addToast}
              onAddPap={apiAddPap}
              onSaveStreak={saveStreakToSheets}
              streak={streak}
              onShowExpPopup={showExpPopup}
            />
            <TaskSection
              tasks={tasks}
              filter={filter}
              onAdd={handleAddTask}
              onComplete={handleCompleteTask}
              onDelete={handleDeleteTask}
              onToast={addToast}
            />
            <InsightCard
              tasks={tasks}
              expenses={expenses}
              filter={filter}
            />
          </div>

          {/* ── Column 2: Expense + Chart + Stats ── */}
          <div className="col-center">
            <ExpenseSection
              expenses={expenses}
              filter={filter}
              onAdd={handleAddExpense}
              onToast={addToast}
            />
            <ExpenseChart expenses={expenses} />

            {/* Quick stats card */}
            <div className="card p-5">
              <div className="section-title mb-3">
                <span>⚡</span>
                <span>Status Hari Ini</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <StatTile
                  icon="📋"
                  label="Tasks"
                  value={tasks.filter(t => {
                    const today = new Date().toDateString();
                    return new Date(t.date).toDateString() === today;
                  }).length}
                />
                <StatTile
                  icon="✅"
                  label="Selesai"
                  value={tasks.filter(t => {
                    const today = new Date().toDateString();
                    return t.status === 'done' && new Date(t.date).toDateString() === today;
                  }).length}
                />
                <StatTile
                  icon="🔥"
                  label="Streak"
                  value={`${streak}d`}
                />
              </div>
            </div>
          </div>

        </div>

        {/* ── Footer ── */}
        <div className="footer-credit">
          <p>
            Made with <span className="heart">❤️</span> by <span className="creator-name">Hengky</span>
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            specially for <span className="for-name">matchaa</span> 🍵
          </p>
        </div>
      </div>

      {/* ── Welcome Card ── */}
      {showWelcome && <WelcomeCard onDismiss={() => setShowWelcome(false)} />}

      {/* ── Weekly Report Modal ── */}
      {showWeeklyReport && (
        <WeeklyReport
          tasks={tasks}
          expenses={expenses}
          streak={streak}
          exp={exp}
          onClose={dismissWeekly}
        />
      )}

      {/* ── History Modal ── */}
      {showHistory && (
        <HistoryModal
          tasks={tasks}
          expenses={expenses}
          onClose={() => setShowHistory(false)}
        />
      )}

      {/* ── EXP Popups ── */}
      <ExpPopup popups={expPopups} />

      {/* ── Toasts ── */}
      <FeedbackToast toasts={toasts} />
    </div>
  );
}

function StatTile({ icon, label, value }) {
  return (
    <div
      className="flex flex-col items-center justify-center p-3 rounded-xl text-center"
      style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
    >
      <span className="text-xl mb-1">{icon}</span>
      <span className="text-lg font-bold leading-none" style={{ color: 'var(--text)' }}>{value}</span>
      <span className="text-xs mt-1" style={{ color: 'var(--muted)' }}>{label}</span>
    </div>
  );
}
