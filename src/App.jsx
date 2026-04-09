import { useState, useEffect, useCallback, useRef, lazy, Suspense } from 'react';
import Header         from './components/Header';
import FilterBar      from './components/FilterBar';
import TaskSection    from './components/TaskSection';
import ExpenseSection from './components/ExpenseSection';
import InsightCard    from './components/InsightCard';
import DailyPhotoTask from './components/DailyPhotoTask';
import HistoryModal   from './components/HistoryModal';
import FeedbackToast, { useToast } from './components/FeedbackToast';
import WelcomeCard    from './components/WelcomeCard';
import TomorrowTaskSection from './components/TomorrowTaskSection';
import ExpPopup, { useExpPopup } from './components/ExpPopup';
import { useGameState }  from './hooks/useGameState';
import { useSheetsAPI }  from './hooks/useSheetsAPI';
import { useLocalStorage } from './hooks/useLocalStorage';
import { useDebouncedLocalStorage } from './hooks/useDebouncedLocalStorage';
import { useCurrentDate } from './hooks/useCurrentDate';
import { fireConfetti }  from './utils/confetti';
import ExpenseChart   from './components/ExpenseChart';
import WeeklyReport, { useWeeklyReportTrigger } from './components/WeeklyReport';
import SettingsModal from './components/SettingsModal';
import DeskBuddy from './components/DeskBuddy';
import AuraEffect from './components/AuraEffect';
import ScrapbookModal from './components/ScrapbookModal';
import InteractiveTrails from './components/InteractiveTrails';
import EmoteReaction from './components/EmoteReaction';
import StickerManager from './components/StickerManager';
import ScrollReveal from './components/ScrollReveal';
import SparkleBurst from './components/ui/SparkleBurst';

// Lazy load decorative components
import SkyEffects from './components/SkyEffects';
import FloatingDecorations from './components/FloatingDecorations';
import DecorativeBackground from './components/ui/DecorativeBackground';


export default function App() {
  // ── Dark mode ────────────────────────────────────────────────────────────
  const [darkMode, setDarkMode] = useDebouncedLocalStorage('dlt_dark', false, 1000);
  const [theme, setTheme]       = useDebouncedLocalStorage('dlt_theme', 'matcha', 1000);
  
  // ── Character ────────────────────────────────────────────────────────────
  const [currentCharacter, setCurrentCharacter] = useDebouncedLocalStorage('dlt_character', 'cat', 1000);
  const handleSwitchCharacter = useCallback(() => {
    setCurrentCharacter(prev => prev === 'cat' ? 'human' : 'cat');
  }, [setCurrentCharacter]);

  const currentDate = useCurrentDate();
  
  // Default rendering flags (feature enabled)
  const shouldRenderDecorations = true;
  const shouldRenderSkyEffects = true;
  const shouldRenderAuraEffects = true;

  const [showWelcome, setShowWelcome] = useState(true);
  const [showHistory, setShowHistory] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showScrapbook, setShowScrapbook] = useState(false);
  const [settings, setSettings] = useDebouncedLocalStorage('dlt_settings', {
    daily: 100000,
    weekly: 700000,
    monthly: 2000000,
    stickers: []
  }, 1000);
  
  const handleUpdateStickers = useCallback((updater) => {
    setSettings(prev => ({
      ...prev,
      stickers: typeof updater === 'function' ? updater(prev.stickers || []) : updater
    }));
  }, [setSettings]);
  const { show: showWeeklyReport, setShow: setShowWeeklyReport, dismiss: dismissWeekly } = useWeeklyReportTrigger();
  
  useEffect(() => {
    document.documentElement.classList.toggle('dark', darkMode);
    document.documentElement.setAttribute('data-theme', theme);
  }, [darkMode, theme]);

  // ── Filter ────────────────────────────────────────────────────────────────
  const [filter, setFilter] = useState('daily');

  // ── Sparkle Burst ────────────────────────────────────────────────────────
  const [sparkleTrigger, setSparkleTrigger] = useState(null);
  const triggerSparkle = useCallback((x, y) => {
    setSparkleTrigger({ id: Date.now(), x, y });
  }, []);

  // ── Game state ────────────────────────────────────────────────────────────
  const { exp, streak, levelInfo, addExp, streakBroke, setExp, setStreak } = useGameState();

  // ── Data state ────────────────────────────────────────────────────────────
  const [tasks,    setTasks]    = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [papHistory, setPapHistory] = useState([]);
  const [ready,    setReady]    = useState(false);

  const {
    loading,
    fetchTasks,
    addTask:          apiAddTask,
    updateTask:       apiUpdateTask,
    deleteTask:       apiDeleteTask,
    fetchExpenses,
    addExpense:       apiAddExpense,
    deleteExpense:    apiDeleteExpense,
    addPapRecord:     apiAddPap,
    fetchTodayPap,
    fetchPapHistory,
    saveStreakToSheets,
    fetchGameState,
    updateGameState,
  } = useSheetsAPI();

  const isSyncingRef = useRef(false);
  const syncTimeoutRef = useRef(null);

  // ── Toasts ────────────────────────────────────────────────────────────────
  const { toasts, addToast } = useToast();

  // ── EXP Popups ─────────────────────────────────────────────────────────────
  const { popups: expPopups, showExpPopup } = useExpPopup();

  // ── Streak broke notification ─────────────────────────────────────────
  useEffect(() => {
    if (streakBroke) {
      setTimeout(() => {
        addToast('Aduh! Streak kemarin putus gara-gara ga absen 😭 Mulai lagi ya!', 'warn');
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
          const localStored = localStorage.getItem('dlt_exp');
          const localExp    = localStored ? Number(JSON.parse(localStored)) : 0;
          const remoteExp   = Number(remoteState.exp || 0);
          const remoteStreak = Number(remoteState.streak || 0);
          const remoteSettings = remoteState.settings;

          if (remoteExp > localExp + 5 || remoteSettings) {
            isSyncingRef.current = true;
            localStorage.setItem('dlt_exp',        JSON.stringify(remoteExp));
            localStorage.setItem('dlt_streak',     JSON.stringify(remoteStreak));
            localStorage.setItem('dlt_lastActive', JSON.stringify(remoteState.last_active || ''));
            
            if (remoteSettings) {
              localStorage.setItem('dlt_settings', JSON.stringify(remoteSettings));
              setSettings(remoteSettings);
            }
            
            // Update state directly
            setExp(remoteExp);
            setStreak(remoteStreak);
            
            // Release flag after a small delay
            setTimeout(() => { isSyncingRef.current = false; }, 1000);
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

      // 4. ── Fetch FULL PAP history for Scrapbook ──────────────────────────
      try {
        const history = await fetchPapHistory();
        setPapHistory(history || []);
      } catch (e) {
        console.warn('[PAP History] Failed to fetch full history:', e);
      }

      setReady(true);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Sync Game State ke Cloud saat EXP berubah (Debounced) ─────────────────
  useEffect(() => {
    if (ready && exp > 0 && !isSyncingRef.current) {
      if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current);
      
      syncTimeoutRef.current = setTimeout(() => {
        updateGameState({ 
          exp, 
          streak, 
          settings,
          last_active: localStorage.getItem('dlt_lastActive')?.replace(/"/g, '') || '' 
        });
      }, 2000); // 2 second debounce
    }
    
    return () => { if (syncTimeoutRef.current) clearTimeout(syncTimeoutRef.current); };
  }, [exp, streak, ready, updateGameState, settings]); 

  // ── ONE-TIME RESET to 150 (USER REQUEST) ──────────────────────────────────
  useEffect(() => {
    if (ready && exp > 5000) { 
      setExp(150);
      updateGameState({ exp: 150, streak, last_active: localStorage.getItem('dlt_lastActive')?.replace(/"/g, '') || '' });
      addToast('EXP sudah aku reset ke 150 sesuai permintaanmu ya! ✨', 'success');
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── EXP Correction (Auto-reset ONLY if truly corrupted/impossible) ────────
  useEffect(() => {
    // Increased threshold to 1,000,000
    if (ready && Number(exp) > 1000000) {
      const resetValue = 150;
      setExp(resetValue);
      updateGameState({ 
        exp: resetValue, 
        streak, 
        last_active: localStorage.getItem('dlt_lastActive')?.replace(/"/g, '') || '' 
      });
      addToast('Waduh, EXP kamu tadi sempat error (kebanyakan). Sudah aku rapihin lagi ke 150 ya! ✨', 'success');
    }
  }, [ready, exp, setExp, streak, updateGameState, addToast]);

  // ── Daily Task Check (Penalty for missed tasks) ──────────────────────────
  useEffect(() => {
    if (!ready) return;
    const today = currentDate.isoDate;
    const lastCheck = localStorage.getItem('dlt_lastTaskCheck');

    if (lastCheck !== today) {
      const pendingOldCount = tasks.filter(t => t.status === 'pending' && t.date < today).length;
      
      if (pendingOldCount > 0) {
        const penalty = pendingOldCount * 5;
        addExp(-penalty);
        
        // Mark as missed in LocalStorage & Cloud
        const updatedTasks = tasks.map(t => 
          (t.status === 'pending' && t.date < today) ? { ...t, status: 'missed' } : t
        );
        
        // Update local tasks state
        setTasks(updatedTasks);
        
        // Sync missed tasks to cloud
        updatedTasks.forEach(t => {
          if (t.status === 'missed') {
            apiUpdateTask(t.id, 'missed').catch(() => {});
          }
        });

        setTimeout(() => {
          addToast(`Kamu melewatkan ${pendingOldCount} task kemarin 😢 EXP -${penalty}`, 'warn');
        }, 2000);
      }
      
      localStorage.setItem('dlt_lastTaskCheck', today);
    }
  }, [ready, tasks, addExp, addToast, apiUpdateTask]);

  // ── Task handlers ─────────────────────────────────────────────────────────
  const handleAddTask = useCallback(async (title, date) => {
    const tempId = 'temp-' + Date.now();
    const tempTask = { id: tempId, title, date, status: 'pending' };
    
    // Save previous state for rollback
    const prevTasks = [...tasks];
    
    // Optimistic update
    setTasks(prev => [tempTask, ...prev]);

    try {
      const task = await apiAddTask(title, date);
      // Replace temp with real ID from server
      setTasks(prev => prev.map(t => t.id === tempId ? task : t));
    } catch (err) {
      setTasks(prevTasks);
      addToast('Gagal nambah tugas 😭 Coba lagi ya!', 'error');
    }
  }, [apiAddTask, tasks, addToast]);

  const handleCompleteTask = useCallback(async (id) => {
    // Save previous state for rollback
    const prevTasks = [...tasks];
    const prevExp = exp;
    const prevLevel = levelInfo.level;

    // Optimistic update
    setTasks(prev => prev.map(t => t.id === id ? { ...t, status: 'done' } : t));
    addExp(10);
    showExpPopup(10, 'exp');

    // Immediate UI feedback (sound + potential confetti later)
    // Note: sounds/confetti are already triggered in TaskSection.jsx or here
    // But since level up check depends on exp, we do it after optimistic addExp

    try {
      await apiUpdateTask(id, 'done');
      
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
    } catch (err) {
      setTasks(prevTasks);
      setExp(prevExp);
      addToast('Gagal update tugas 😭', 'error');
    }
  }, [apiUpdateTask, addExp, levelInfo, showExpPopup, tasks, exp, setExp, addToast]);

  const handleDeleteTask = useCallback(async (id) => {
    const prevTasks = [...tasks];
    setTasks(prev => prev.filter(t => t.id !== id));

    try {
      await apiDeleteTask(id);
    } catch (err) {
      setTasks(prevTasks);
      addToast('Gagal hapus tugas 😭', 'error');
    }
  }, [apiDeleteTask, tasks, addToast]);

  // ── Expense handlers ──────────────────────────────────────────────────────
  const handleAddExpense = useCallback(async (name, amount) => {
    const tempId = 'temp-' + Date.now();
    const tempExpense = { id: tempId, name, amount, date: currentDate.isoDate };
    
    const prevExpenses = [...expenses];
    const prevExp = exp;

    // Optimistic update
    setExpenses(prev => [tempExpense, ...prev]);
    
    // High spending penalty (-2 EXP if over 200k)
    if (amount >= 200000) {
      addExp(-2);
      showExpPopup(-2, 'exp');
      addToast('Dompet kamu nangis 😭 (-2 EXP)', 'warn');
    } else {
      addExp(5);
      showExpPopup(5, 'exp');
    }

    try {
      const expense = await apiAddExpense(name, amount);
      setExpenses(prev => prev.map(e => e.id === tempId ? expense : e));
    } catch (err) {
      setExpenses(prevExpenses);
      setExp(prevExp);
      addToast('Gagal catat pengeluaran 😭', 'error');
    }
  }, [apiAddExpense, addExp, addToast, showExpPopup, expenses, exp, setExp]);

  const handleDeleteExpense = useCallback(async (id) => {
    const prevExpenses = [...expenses];
    setExpenses(prev => prev.filter(e => e.id !== id));

    try {
      await apiDeleteExpense(id);
    } catch (err) {
      setExpenses(prevExpenses);
      addToast('Gagal hapus pengeluaran 😭', 'error');
    }
  }, [apiDeleteExpense, expenses, addToast]);

  const handleAddPap = useCallback(async (data) => {
    const record = await apiAddPap(data);
    if (record) {
      const updated = await fetchPapHistory();
      setPapHistory(updated || []);
    }
    return record;
  }, [apiAddPap, fetchPapHistory]);


  if (!ready) {
    return (
      <div
        className="min-h-screen flex items-center justify-center p-6"
        style={{ background: 'var(--bg)' }}
      >
        <div className="flex flex-col items-center max-w-sm w-full text-center space-y-6">
          {/* Loading Image */}
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-3xl rounded-full scale-110 animate-pulse" />
            <img 
              src="cis.svg" 
              alt="loading" 
              className="relative w-40 h-40 object-contain animate-bounce-slow drop-shadow-2xl"
            />
          </div>
          
          <div className="space-y-2">
            <h2 className="text-xl font-bold" style={{ color: 'var(--text)' }}>
              Sabar ya matchaa... 🍵
            </h2>
            <p className="text-sm" style={{ color: 'var(--muted)' }}>
              Lagi nyiapin data buat kamu~
            </p>
          </div>

          {/* Skeleton placeholders simplified below */}
          <div className="w-full space-y-3 opacity-50 px-4">
            <div className="skeleton-line mx-auto" style={{ width: '80%' }} />
            <div className="skeleton-line mx-auto" style={{ width: '60%' }} />
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
      {/* ── Decorative elements ── */}
      {shouldRenderSkyEffects && <SkyEffects theme={theme} />}
      {shouldRenderDecorations && <FloatingDecorations theme={theme} />}

      <SparkleBurst trigger={sparkleTrigger} />
      <DecorativeBackground />
      {shouldRenderAuraEffects && <AuraEffect />}
      <InteractiveTrails />
      <StickerManager stickers={settings.stickers} onUpdate={handleUpdateStickers} />
      
      {/* ── Container ── */}
      <div className="app-container !max-w-[1240px] !pt-14 !pb-24">

        {/* ── Header Row: Greeting/EXP (L) + Date (R) ── */}
        <div className="header-row">
          <div className="header-main card p-4 md:p-5 flex flex-col justify-center">
            <Header
              levelInfo={levelInfo}
              exp={exp}
              streak={streak}
              darkMode={darkMode}
              onToggleDark={() => setDarkMode(d => !d)}
              onShowSettings={() => setShowSettings(true)}
              theme={theme}
              onThemeChange={setTheme}
            />
          </div>
          <div className="header-date-card card p-3.5 md:p-5 flex flex-col items-center justify-center min-w-[80px] md:min-w-[100px] border-none shadow-sm relative overflow-hidden">
            <p className="text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5 md:mb-1 opacity-70" style={{ color: 'var(--text)' }}>
              {currentDate.weekday}
            </p>
            <p className="text-2xl md:text-3xl font-black leading-none mb-0.5 md:mb-1" style={{ color: 'var(--accent)' }}>
              {currentDate.day}
            </p>
            <p className="text-[10px] md:text-xs font-bold opacity-80" style={{ color: 'var(--text)' }}>
              {currentDate.monthYear}
            </p>
          </div>
        </div>

        {/* ── Action Bar ── */}
        <div className="action-bar">
          <FilterBar active={filter} onChange={setFilter} />
          <div className="action-bar-buttons">
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
            <button
              className="history-btn"
              onClick={() => setShowScrapbook(true)}
              aria-label="Buka buku kenangan"
              style={{ background: 'var(--accent)', color: 'var(--text)' }}
            >
              <span>📒</span>
              <span>Scrapbook</span>
            </button>
          </div>
        </div>

        {/* ── Desk Buddy (Hero Cat) Placement ── */}
        <div className="flex justify-center z-[100] relative pointer-events-none -mt-4 mb-2 md:-mt-8 md:mb-8">
          <DeskBuddy 
            levelInfo={levelInfo} 
            darkMode={darkMode}
            currentCharacter={currentCharacter}
            tasksCompletedToday={tasks.filter(t => t.status === 'done' && t.date === currentDate.isoDate).length}
          />
        </div>

        {/* ── Main 2-Column Grid (From Wireframe) ── */}
        <div className="main-grid">

          {/* ── Column 1 (Left): PAP + Daily Tasks ── */}
          <ScrollReveal delay={0.1}>
            <div className="col-left">
              <DailyPhotoTask
                onExp={addExp}
                onToast={addToast}
                onAddPap={handleAddPap}
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
                onSparkle={triggerSparkle}
              />
            </div>
          </ScrollReveal>

          {/* ── Column 2 (Right): Expenses + Chart + Tomorrow's Plan ── */}
          <ScrollReveal delay={0.2}>
            <div className="col-right">
              <ExpenseSection
                expenses={expenses}
                filter={filter}
                onAdd={handleAddExpense}
                onDelete={handleDeleteExpense}
                onToast={addToast}
              />
              <ExpenseChart expenses={expenses} />
              <TomorrowTaskSection
                tasks={tasks}
                onAdd={handleAddTask}
                onDelete={handleDeleteTask}
                onToast={addToast}
              />

              {/* Optional Small Stats Card at the bottom of sidebar */}
              <div className="card p-4 md:p-5">
                <div className="section-title mb-3">
                  <span>⚡</span>
                  <span>Status</span>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <StatTile
                    icon="📋"
                    label="Tasks"
                    value={tasks.filter(t => {
                      const today = currentDate.isoDate;
                      return t.date === today;
                    }).length}
                  />
                  <StatTile
                    icon="✅"
                    label="Selesai"
                    value={tasks.filter(t => {
                      const today = currentDate.isoDate;
                      return t.status === 'done' && t.date === today;
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
          </ScrollReveal>

          {/* ── Bottom Section: Insights (Full Width) ── */}
          <ScrollReveal delay={0.3}>
            <div className="insight-container">
              <InsightCard
                tasks={tasks}
                expenses={expenses}
                filter={filter}
                settings={settings}
              />
            </div>
          </ScrollReveal>

        </div>

        {/* ── Footer ── */}
        <div className="footer-credit">
          <p>
            Made with <span className="heart">❤️</span> by <span className="creator-name">Hengky</span>
          </p>
          <p style={{ marginTop: '0.25rem' }}>
            specially for <span className="for-name">matchaaww</span> 🍵
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

      {/* ── Settings Modal ── */}
      {showSettings && (
        <SettingsModal
          settings={settings}
          setSettings={setSettings}
          onClose={() => setShowSettings(false)}
          onToast={addToast}
        />
      )}

      {/* ── Desk Buddy & Auras ── */}
      {shouldRenderAuraEffects && <AuraEffect level={levelInfo.level} />}

      {/* ── Scrapbook Modal ── */}
      {showScrapbook && (
        <ScrapbookModal
          onClose={() => setShowScrapbook(false)}
          papRecords={papHistory}
          onRefresh={async () => {
            const h = await fetchPapHistory();
            setPapHistory(h || []);
          }}
        />
      )}

      {/* ── Sticker Manager ── */}
      <StickerManager 
        stickers={settings?.stickers || []}
        setStickers={handleUpdateStickers}
      />

      {/* ── Interactive Trails ── */}
      <InteractiveTrails />

      {/* ── Interactive Emote Reaction ── */}
      <EmoteReaction onAddExp={addExp} />

      {/* ── Character Switcher (Dock) ── */}
      <div className="action-dock-item character-dock">
        <button
          onClick={handleSwitchCharacter}
          className="dock-btn group"
          aria-label="Switch Character"
          title={`Magically transform to ${currentCharacter === 'cat' ? 'Human' : 'Cat'} ✨`}
        >
          <div className="relative flex items-center justify-center">
            <span className="text-sm absolute -top-4 -right-4 animate-pulse">✨</span>
            <span className="group-hover:rotate-[20deg] group-hover:scale-110 transition-transform duration-500 text-2xl">
              {currentCharacter === 'cat' ? '🪄' : '🎀'}
            </span>
          </div>
        </button>
      </div>
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
