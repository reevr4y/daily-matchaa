import { useState, useMemo, useEffect, useRef } from 'react';
import { formatCurrency } from '../utils/insights';

// ── Helpers ──────────────────────────────────────────────────────────────────
function isoToDisplay(iso) {
  if (!iso) return '';
  const d = new Date(iso + 'T00:00:00');
  return d.toLocaleDateString('id-ID', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
}


function getLast30Days() {
  const days = [];
  const today = new Date();
  for (let i = 0; i < 30; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    days.push(d.toISOString().slice(0, 10));
  }
  return days;
}

function getDateKey(dateStr) {
  // dateStr could be 'YYYY-MM-DD' or a Date string
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) return String(dateStr).slice(0, 10);
  try { return new Date(dateStr).toISOString().slice(0, 10); }
  catch { return ''; }
}

function getPapFromLocalHistory(dateKey) {
  // Check dlt_pap_history array
  try {
    const history = JSON.parse(localStorage.getItem('dlt_pap_history') || '[]');
    return history.find(p => getDateKey(p.date) === dateKey) || null;
  } catch { return null; }
}

function getTodayPapFromLocal(dateKey) {
  // Check dlt_daily_pap for today's photo_url
  try {
    const raw = JSON.parse(localStorage.getItem('dlt_daily_pap') || 'null');
    if (raw && raw.date === dateKey) return raw;
    return null;
  } catch { return null; }
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function HistoryModal({ tasks, expenses, onClose }) {
  const days = useMemo(() => getLast30Days(), []);
  const [selectedDate, setSelectedDate] = useState(days[0]); // default: today
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef(null);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  // Group data by date
  const tasksByDate = useMemo(() => {
    const map = {};
    tasks.forEach(t => {
      const k = getDateKey(t.date);
      if (!k) return;
      if (!map[k]) map[k] = [];
      map[k].push(t);
    });
    return map;
  }, [tasks]);

  const expensesByDate = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const k = getDateKey(e.date);
      if (!k) return;
      if (!map[k]) map[k] = [];
      map[k].push(e);
    });
    return map;
  }, [expenses]);

  // Selected date data
  const dayTasks    = tasksByDate[selectedDate]    || [];
  const dayExpenses = expensesByDate[selectedDate] || [];

  // PAP for this date (check both history and today's local)
  const papRecord = useMemo(() => {
    if (selectedDate === days[0]) {
      return getTodayPapFromLocal(selectedDate) || getPapFromLocalHistory(selectedDate);
    }
    return getPapFromLocalHistory(selectedDate);
  }, [selectedDate, days]);

  const dayTotal = dayExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);
  const doneTasks = dayTasks.filter(t => t.status === 'done');
  const pendingTasks = dayTasks.filter(t => t.status !== 'done');

  // Dot indicators for sidebar
  const hasDots = (iso) => {
    const hasTask = Boolean(tasksByDate[iso]?.length);
    const hasExp  = Boolean(expensesByDate[iso]?.length);
    return { hasTask, hasExp };
  };

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`history-backdrop ${visible ? 'show' : ''}`}
        onClick={handleClose}
      />

      {/* Modal */}
      <div className={`history-modal ${visible ? 'show' : ''}`}>
        {/* Header */}
        <div className="history-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <span className="font-bold text-base" style={{ color: 'var(--text)' }}>Riwayat Harian</span>
          </div>
          <button className="history-close-btn" onClick={handleClose} aria-label="Tutup">✕</button>
        </div>

        {/* Body: sidebar + content */}
        <div className="history-body">
          {/* ── Date sidebar ── */}
          <div className="history-sidebar">
            {days.map(iso => {
              const d = new Date(iso + 'T00:00:00');
              const dayNum = d.getDate();
              const month  = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Agu','Sep','Okt','Nov','Des'][d.getMonth()];
              const dayName= ['Min','Sen','Sel','Rab','Kam','Jum','Sab'][d.getDay()];
              const { hasTask, hasExp } = hasDots(iso);
              const isToday = iso === days[0];
              const isActive = iso === selectedDate;
              return (
                <button
                  key={iso}
                  className={`history-date-btn ${isActive ? 'active' : ''}`}
                  onClick={() => setSelectedDate(iso)}
                >
                  <span className="history-date-name">{dayName}</span>
                  <span className="history-date-num">{dayNum}</span>
                  <span className="history-date-month">{month}</span>
                  {isToday && <span className="history-today-dot" />}
                  <div className="history-dot-row">
                    {hasTask && <span className="history-dot task-dot" />}
                    {hasExp  && <span className="history-dot expense-dot" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* ── Day detail ── */}
          <div className="history-content">
            {/* Date header */}
            <div className="history-day-header">
              <p className="text-xs font-medium mb-0.5" style={{ color: 'var(--muted)' }}>
                {selectedDate === days[0] ? '📍 Hari ini' : ''}
              </p>
              <h3 className="text-base font-bold leading-tight" style={{ color: 'var(--text)' }}>
                {isoToDisplay(selectedDate)}
              </h3>
            </div>

            {/* Empty state */}
            {dayTasks.length === 0 && dayExpenses.length === 0 && !papRecord && (
              <div className="history-empty">
                <div className="text-4xl mb-3">🌿</div>
                <p className="font-semibold text-sm" style={{ color: 'var(--text)' }}>Ga ada aktivitas nih</p>
                <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>Hari ini santai kayaknya~ 😴</p>
              </div>
            )}

            {/* ── PAP Section ── */}
            {papRecord && (
              <div className="history-section">
                <div className="history-section-title">
                  <span>📸</span>
                  <span>Absen Cantik</span>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(123,174,127,0.15)', color: 'var(--success)' }}
                  >
                    ✅ Done
                  </span>
                </div>
                {papRecord.photo_url ? (
                  <div className="history-pap-photo">
                    <img
                      src={papRecord.photo_url}
                      alt={`absen ${selectedDate}`}
                      onError={e => { e.target.parentElement.innerHTML = '<div class="history-pap-fallback">📷 Foto tidak bisa dimuat</div>'; }}
                    />
                  </div>
                ) : (
                  <div className="history-pap-fallback">📷 Foto belum ter-sync ke Drive</div>
                )}
                {papRecord.timestamp && (
                  <p className="text-xs mt-2 text-center" style={{ color: 'var(--muted)' }}>
                    ⏰ {new Date(papRecord.timestamp).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })}
                  </p>
                )}
              </div>
            )}

            {/* ── Tasks Section ── */}
            {dayTasks.length > 0 && (
              <div className="history-section">
                <div className="history-section-title">
                  <span>📋</span>
                  <span>Tugas</span>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent)', color: 'var(--text)' }}
                  >
                    {doneTasks.length}/{dayTasks.length} selesai
                  </span>
                </div>

                <div className="history-task-list">
                  {doneTasks.map(task => (
                    <div key={task.id} className="history-task-item done">
                      <span className="history-task-check">✓</span>
                      <span className="history-task-text done-text">{task.title}</span>
                    </div>
                  ))}
                  {pendingTasks.map(task => (
                    <div key={task.id} className="history-task-item pending">
                      <span className="history-task-check pending-check">○</span>
                      <span className="history-task-text">{task.title}</span>
                      <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: 'rgba(249,115,22,0.12)', color: '#f97316' }}>
                        pending
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ── Expenses Section ── */}
            {dayExpenses.length > 0 && (
              <div className="history-section">
                <div className="history-section-title">
                  <span>💸</span>
                  <span>Pengeluaran</span>
                  <span
                    className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
                    style={{ background: 'var(--accent)', color: 'var(--text)' }}
                  >
                    {dayExpenses.length} item
                  </span>
                </div>

                <div className="history-expense-list">
                  {[...dayExpenses].reverse().map((exp, i) => (
                    <div key={exp.id || i} className="history-expense-item">
                      <span className="text-base">🛍️</span>
                      <span className="flex-1 text-sm font-medium capitalize" style={{ color: 'var(--text)' }}>
                        {exp.name}
                      </span>
                      <span className="text-sm font-bold" style={{ color: 'var(--exp-fill, #C4A882)' }}>
                        {formatCurrency(Number(exp.amount))}
                      </span>
                    </div>
                  ))}

                  {/* Total */}
                  <div className="history-expense-total">
                    <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>Total hari ini</span>
                    <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
                      {formatCurrency(dayTotal)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* ── Summary chip ── */}
            {(dayTasks.length > 0 || dayExpenses.length > 0) && (
              <div className="history-summary-chips">
                {dayTasks.length > 0 && (
                  <div className={`history-chip ${doneTasks.length === dayTasks.length ? 'chip-green' : 'chip-orange'}`}>
                    {doneTasks.length === dayTasks.length ? '🌟' : '⚡'} {doneTasks.length}/{dayTasks.length} tasks
                  </div>
                )}
                {dayExpenses.length > 0 && (
                  <div className={`history-chip ${dayTotal >= 200000 ? 'chip-red' : 'chip-neutral'}`}>
                    💸 {formatCurrency(dayTotal)}
                  </div>
                )}
                {papRecord && (
                  <div className="history-chip chip-green">
                    📸 Absen done!
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  );
}
