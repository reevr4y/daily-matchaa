import { useMemo } from 'react';
import { formatCurrency } from '../utils/insights';

// Get all days in the current month
function getDaysInMonth() {
  const now   = new Date();
  const year  = now.getFullYear();
  const month = now.getMonth();
  const count = new Date(year, month + 1, 0).getDate();
  const days  = [];
  for (let d = 1; d <= count; d++) {
    const day   = String(d).padStart(2, '0');
    const mon   = String(month + 1).padStart(2, '0');
    days.push(`${year}-${mon}-${day}`);
  }
  return days;
}

function getDateKey(dateStr) {
  if (!dateStr) return '';
  if (/^\d{4}-\d{2}-\d{2}/.test(String(dateStr))) return String(dateStr).slice(0, 10);
  try { return new Date(dateStr).toLocaleDateString('en-CA'); }
  catch { return ''; }
}

const MONTH_ID = ['Januari','Februari','Maret','April','Mei','Juni',
                  'Juli','Agustus','September','Oktober','November','Desember'];

export default function ExpenseChart({ expenses }) {
  const days = useMemo(() => getDaysInMonth(), []);

  // Sum expenses per day
  const daily = useMemo(() => {
    const map = {};
    expenses.forEach(e => {
      const k = getDateKey(e.date);
      if (!map[k]) map[k] = 0;
      map[k] += Number(e.amount || 0);
    });
    return days.map(d => ({ date: d, amount: map[d] || 0 }));
  }, [expenses, days]);

  const maxAmount  = Math.max(...daily.map(d => d.amount), 1);
  const totalMonth = daily.reduce((s, d) => s + d.amount, 0);
  const avgDay     = totalMonth / (daily.filter(d => d.amount > 0).length || 1);
  const todayKey   = new Date().toLocaleDateString('en-CA');
  const todayIdx   = days.indexOf(todayKey);

  const now = new Date();
  const monthLabel = `${MONTH_ID[now.getMonth()]} ${now.getFullYear()}`;

  const chartH   = 120; // px height of bars area
  const barW     = 100 / days.length; // percent

  return (
    <div className="card p-5">
      {/* Header */}
      <div className="section-title mb-1">
        <span>📊</span>
        <span>Grafik Pengeluaran</span>
        <span
          className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--text)' }}
        >
          {monthLabel}
        </span>
      </div>

      {/* Summary row */}
      <div className="flex gap-3 mb-4 mt-2">
        <div
          className="flex-1 rounded-xl px-3 py-2 text-center"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Total Bulan</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>{formatCurrency(totalMonth)}</p>
        </div>
        <div
          className="flex-1 rounded-xl px-3 py-2 text-center"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Rata-rata/Hari</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: 'var(--text)' }}>{formatCurrency(Math.round(avgDay))}</p>
        </div>
        <div
          className="flex-1 rounded-xl px-3 py-2 text-center"
          style={{ background: 'var(--bg)', border: '1px solid var(--border)' }}
        >
          <p className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--muted)' }}>Hari Boros</p>
          <p className="text-sm font-bold mt-0.5" style={{ color: '#ef4444' }}>
            {daily.filter(d => d.amount > avgDay && d.amount > 0).length} hari
          </p>
        </div>
      </div>

      {/* Bar chart SVG */}
      <div style={{ overflowX: 'auto', overflowY: 'visible' }}>
        <div style={{ minWidth: `${days.length * 22}px`, position: 'relative' }}>
          {/* Average line label */}
          {avgDay > 0 && (
            <div
              style={{
                position:  'absolute',
                top:       `${chartH - (avgDay / maxAmount) * chartH - 1}px`,
                left:      0,
                right:     0,
                borderTop: '1.5px dashed rgba(239,68,68,0.45)',
                zIndex:    1,
              }}
            />
          )}

          {/* Bars */}
          <div
            style={{
              display:       'flex',
              alignItems:    'flex-end',
              height:        `${chartH}px`,
              gap:           '2px',
              paddingBottom: '0',
            }}
          >
            {daily.map((d, i) => {
              const h      = d.amount > 0 ? Math.max((d.amount / maxAmount) * chartH, 6) : 0;
              const isAbove = d.amount > avgDay && d.amount > 0;
              const isToday = i === todayIdx;
              const dayNum  = parseInt(d.date.slice(8), 10);

              return (
                <div
                  key={d.date}
                  style={{
                    flex:           '1',
                    display:        'flex',
                    flexDirection:  'column',
                    alignItems:     'center',
                    justifyContent: 'flex-end',
                    height:         `${chartH}px`,
                    position:       'relative',
                    cursor:         d.amount > 0 ? 'pointer' : 'default',
                  }}
                  title={d.amount > 0 ? `${d.date}: ${formatCurrency(d.amount)}` : ''}
                >
                  {/* Tooltip amount */}
                  {d.amount > 0 && (
                    <div
                      style={{
                        position:   'absolute',
                        bottom:     `${h + 4}px`,
                        fontSize:   '7px',
                        fontWeight: '700',
                        color:      isAbove ? '#ef4444' : 'var(--muted)',
                        whiteSpace: 'nowrap',
                        lineHeight: 1,
                      }}
                    >
                      {d.amount >= 1000000
                        ? `${(d.amount/1000000).toFixed(1)}jt`
                        : d.amount >= 1000
                        ? `${Math.round(d.amount/1000)}k`
                        : d.amount}
                    </div>
                  )}

                  {/* Bar */}
                  <div
                    style={{
                      width:        '100%',
                      height:       `${h}px`,
                      borderRadius: '4px 4px 2px 2px',
                      background:   isToday
                        ? 'var(--success)'
                        : isAbove
                        ? 'linear-gradient(180deg,#ef4444,#f97316)'
                        : 'linear-gradient(180deg, var(--accent-2), var(--accent))',
                      transition:   'height 0.5s cubic-bezier(.4,0,.2,1)',
                      boxShadow:    isToday ? '0 0 8px rgba(34,197,94,0.4)' : 'none',
                    }}
                  />

                  {/* Date label */}
                  <div
                    style={{
                      fontSize:    '8px',
                      fontWeight:  isToday ? '800' : '500',
                      color:       isToday ? 'var(--success)' : 'var(--muted)',
                      marginTop:   '3px',
                      lineHeight:  1,
                    }}
                  >
                    {dayNum}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-3 text-[10px]" style={{ color: 'var(--muted)' }}>
        <div className="flex items-center gap-1">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--accent-2)' }} />
          <span>Normal</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: '#ef4444' }} />
          <span>Di atas rata-rata</span>
        </div>
        <div className="flex items-center gap-1">
          <div style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--success)' }} />
          <span>Hari ini</span>
        </div>
      </div>

      {totalMonth === 0 && (
        <div className="empty-state mt-3">
          <div className="text-3xl mb-2">💸</div>
          <p>Belum ada pengeluaran bulan ini!<br />Hemat banget nih 🎉</p>
        </div>
      )}
    </div>
  );
}
