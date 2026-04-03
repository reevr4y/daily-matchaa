import { useMemo, useEffect, useRef, useState } from 'react';
import { formatCurrency } from '../utils/insights';

const WEEKLY_REPORT_KEY = 'dlt_weekly_report_shown';

function getDateKey(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) return String(dateStr).slice(0, 10);
  try { return new Date(dateStr).toLocaleDateString('en-CA'); }
  catch { return ''; }
}

function getLast7Days() {
  const days = [];
  for (let i = 1; i <= 7; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toLocaleDateString('en-CA'));
  }
  return days;
}

export function useWeeklyReportTrigger() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const dayOfWeek = new Date().getDay(); // 1 = Monday
    if (dayOfWeek !== 1) return;

    const lastShown = localStorage.getItem(WEEKLY_REPORT_KEY);
    const today     = new Date().toLocaleDateString('en-CA');
    if (lastShown === today) return;

    // Show after 2s on Mondays
    const t = setTimeout(() => setShow(true), 2000);
    return () => clearTimeout(t);
  }, []);

  const dismiss = () => {
    const today = new Date().toLocaleDateString('en-CA');
    localStorage.setItem(WEEKLY_REPORT_KEY, today);
    setShow(false);
  };

  return { show, setShow, dismiss };
}

export default function WeeklyReport({ tasks, expenses, streak, exp, onClose }) {
  const [visible, setVisible] = useState(false);
  const overlayRef = useRef(null);
  const last7 = useMemo(() => getLast7Days(), []);

  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 30);
    return () => clearTimeout(t);
  }, []);

  const handleClose = () => {
    setVisible(false);
    setTimeout(onClose, 350);
  };

  // Tasks last 7 days
  const weekTasks = useMemo(() =>
    tasks.filter(t => last7.includes(getDateKey(t.date))), [tasks, last7]);
  const doneTasks = weekTasks.filter(t => t.status === 'done');

  // Expenses last 7 days
  const weekExpenses = useMemo(() =>
    expenses.filter(e => last7.includes(getDateKey(e.date))), [expenses, last7]);
  const totalSpend = weekExpenses.reduce((s, e) => s + Number(e.amount || 0), 0);

  // PAP last 7 days from localStorage history
  const papDays = useMemo(() => {
    try {
      const history = JSON.parse(localStorage.getItem('dlt_pap_history') || '[]');
      return last7.filter(d => history.some(p => getDateKey(p.date) === d && p.status === 'done')).length;
    } catch { return 0; }
  }, [last7]);

  // EXP this week (we don't track weekly EXP yet, show current total)
  const taskRate = weekTasks.length > 0
    ? Math.round((doneTasks.length / weekTasks.length) * 100)
    : 0;

  const stats = [
    {
      icon:  '📋',
      label: 'Task Selesai',
      value: `${doneTasks.length}/${weekTasks.length}`,
      sub:   taskRate === 100 ? 'Sempurna! 🌟' : taskRate > 50 ? 'Lumayan nih!' : 'Ayo semangat!',
      color: taskRate === 100 ? 'var(--success)' : taskRate > 50 ? '#f97316' : '#ef4444',
    },
    {
      icon:  '💸',
      label: 'Total Belanja',
      value: formatCurrency(totalSpend),
      sub:   totalSpend > 500000 ? 'Agak boros nih~ 😬' : 'Cukup hemat! 💪',
      color: totalSpend > 500000 ? '#ef4444' : 'var(--success)',
    },
    {
      icon:  '📸',
      label: 'PAP Konsisten',
      value: `${papDays}/7 hari`,
      sub:   papDays === 7 ? 'Streak queen! 👑' : papDays >= 5 ? 'Bagus banget!' : 'Tambahin lagi ya~',
      color: papDays === 7 ? 'var(--success)' : papDays >= 5 ? '#f97316' : '#ef4444',
    },
    {
      icon:  '⚡',
      label: 'Total EXP',
      value: `${exp} EXP`,
      sub:   'Keep it up! 🔥',
      color: 'var(--accent-2)',
    },
  ];

  // Date range label
  const from = new Date();
  from.setDate(from.getDate() - 7);
  const to   = new Date();
  to.setDate(to.getDate() - 1);
  const fmt = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' });
  const rangeLabel = `${fmt(from)} – ${fmt(to)}`;

  return (
    <>
      {/* Backdrop */}
      <div
        ref={overlayRef}
        className={`history-backdrop ${visible ? 'show' : ''}`}
        onClick={handleClose}
        style={{ zIndex: 200 }}
      />

      {/* Modal */}
      <div
        className={`history-modal ${visible ? 'show' : ''}`}
        style={{ maxWidth: 420, zIndex: 201 }}
      >
        {/* Header */}
        <div className="history-modal-header">
          <div className="flex items-center gap-2">
            <span className="text-xl">📅</span>
            <div>
              <span className="font-bold text-sm" style={{ color: 'var(--text)' }}>Laporan Mingguan</span>
              <p className="text-[11px] mt-0.5" style={{ color: 'var(--muted)' }}>{rangeLabel}</p>
            </div>
          </div>
          <button className="history-close-btn" onClick={handleClose} aria-label="Tutup">✕</button>
        </div>

        {/* Body */}
        <div style={{ padding: '16px', overflowY: 'auto', maxHeight: '70vh' }}>
          {/* Greeting */}
          <div
            className="rounded-2xl px-4 py-3 mb-4 text-center"
            style={{
              background: 'linear-gradient(135deg, rgba(34,197,94,0.1), rgba(99,102,241,0.1))',
              border:     '1.5px solid var(--border)',
            }}
          >
            <div className="text-3xl mb-1">
              {papDays === 7 ? '👑' : taskRate === 100 ? '🌟' : '🌿'}
            </div>
            <p className="font-bold text-sm" style={{ color: 'var(--text)' }}>
              {papDays === 7
                ? 'Luar biasa! Konsisten banget minggu ini!'
                : doneTasks.length > 0
                ? 'Minggu yang produktif!'
                : 'Yuk lebih semangat minggu depannya!'}
            </p>
            <p className="text-xs mt-1" style={{ color: 'var(--muted)' }}>
              Rekap 7 hari terakhir kamu~
            </p>
          </div>

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-3 mb-4">
            {stats.map((s, i) => (
              <div
                key={i}
                className="rounded-2xl p-3"
                style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
              >
                <div className="text-xl mb-1">{s.icon}</div>
                <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>
                  {s.label}
                </p>
                <p className="text-base font-bold mt-0.5" style={{ color: s.color }}>
                  {s.value}
                </p>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--muted)' }}>
                  {s.sub}
                </p>
              </div>
            ))}
          </div>

          {/* Motivational footer */}
          <div
            className="rounded-2xl px-4 py-3 text-center"
            style={{ background: 'var(--accent)', border: '1px solid var(--accent-2)' }}
          >
            <p className="text-xs font-semibold" style={{ color: 'var(--text)' }}>
              {streak > 0
                ? `🔥 Streak kamu ${streak} hari! Jangan putus ya~`
                : '💪 Mulai streak baru minggu ini, pasti bisa!'}
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
