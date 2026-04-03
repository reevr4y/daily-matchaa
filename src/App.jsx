import { useState, useEffect, useCallback } from 'react';
import Header         from './components/Header';
import FilterBar      from './components/FilterBar';
import TaskSection    from './components/TaskSection';
import ExpenseSection from './components/ExpenseSection';
import InsightCard    from './components/InsightCard';
import DailyPhotoTask from './components/DailyPhotoTask';
import FeedbackToast, { useToast } from './components/FeedbackToast';
import WelcomeCard    from './components/WelcomeCard';
import { useGameState }  from './hooks/useGameState';
import { useSheetsAPI }  from './hooks/useSheetsAPI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { fireConfetti }  from './utils/confetti';

export default function App() {
  // ── Dark mode ────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useLocalStorage('dlt_dark', false);
  const [showWelcome, setShowWelcome] = useState(true);
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
    saveStreakToSheets,
  } = useSheetsAPI();

  // ── Toasts ────────────────────────────────────────────────────────────────
  const { toasts, addToast } = useToast();

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
      const [t, e] = await Promise.all([fetchTasks(), fetchExpenses()]);
      setTasks(t || []);
      setExpenses(e || []);
      setReady(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Task handlers ─────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async (title) => {
    const task = await apiAddTask(title);
    setTasks(prev => [task, ...prev]);
  }, [apiAddTask]);

  const handleCompleteTask = useCallback(async (id) => {
    await apiUpdateTask(id, 'done');
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    const prev = levelInfo.level;
    addExp(10);
    // Level up check (async — level updates after re-render)
    setTimeout(() => {
      const next = JSON.parse(localStorage.getItem('dlt_exp') || '0');
      import('./utils/levels').then(({ getLevelInfo }) => {
        const newLevel = getLevelInfo(next).level;
        if (newLevel > prev) {
          fireConfetti();
          addToast(`Level naik! Sekarang Lv.${newLevel} 🎉`, 'success');
        }
      });
    }, 100);
  }, [apiUpdateTask, addExp, levelInfo, addToast]);

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
      addToast('Dompet kamu nangis 😭 (-2 EXP)', 'warn');
    } else {
      addExp(5);
    }
  }, [apiAddExpense, addExp, addToast]);

  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{ background: 'var(--bg)' }}
      >
        <div className="text-center animate-pulse-soft">
          <div className="text-4xl mb-3">🌿</div>
          <p className="text-sm" style={{ color: 'var(--muted)' }}>Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', transition: 'background 0.3s ease' }}
    >
      {/* ── Container ── */}
      <div className="max-w-2xl mx-auto px-4 py-6 lg:max-w-4xl">

        {/* ── Header ── */}
        <Header
          levelInfo={levelInfo}
          exp={exp}
          streak={streak}
          darkMode={darkMode}
          onToggleDark={() => setDarkMode(d => !d)}
        />

        {/* ── Filter ── */}
        <FilterBar active={filter} onChange={setFilter} />

        {/* ── Main Grid ── */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* Left column */}
          <div className="space-y-4">
            <DailyPhotoTask
              onExp={addExp}
              onToast={addToast}
              onAddPap={apiAddPap}
              onSaveStreak={saveStreakToSheets}
              streak={streak}
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

          {/* Right column */}
          <div className="space-y-4">
            <ExpenseSection
              expenses={expenses}
              filter={filter}
              onAdd={handleAddExpense}
              onToast={addToast}
            />

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
                  label="Done"
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
