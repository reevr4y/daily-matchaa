import {
  filterByPeriod,
  getTotalSpending,
  getMostFrequentExpense,
  getMostProductiveDay,
  getSpendingMessage,
  getProductivityMessage,
  formatCurrency,
} from '../utils/insights';

const periodLabel = { daily: 'Hari Ini', weekly: '7 Hari', monthly: '30 Hari' };

export default function InsightCard({ tasks, expenses, filter, settings }) {
  const filteredExpenses = filterByPeriod(expenses, filter);
  const filteredTasks    = filterByPeriod(tasks, filter);

  const totalSpending    = getTotalSpending(filteredExpenses);
  const completedCount   = filteredTasks.filter(t => t.status === 'done').length;
  const totalTasks       = filteredTasks.length;
  const mostExpense      = getMostFrequentExpense(filteredExpenses);
  const bestDay          = getMostProductiveDay(tasks); // all time for best day

  const spendMsg  = getSpendingMessage(totalSpending, filter, settings);
  const prodMsg   = getProductivityMessage(completedCount);

  const msgColor = {
    good:    '#7BAE7F',
    great:   '#7BAE7F',
    warn:    '#D98080',
    neutral: 'var(--muted)',
    idle:    'var(--muted)',
  };

  return (
    <div className="card p-5">
      <div className="section-title mb-1">
        <span>📊</span>
        <span>Insight</span>
        <span
          className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
          style={{ background: 'var(--accent)', color: 'var(--text)' }}
        >
          {periodLabel[filter]}
        </span>
      </div>

      {/* Mood messages */}
      <div className="space-y-2 mb-4">
        <div
          className="px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: msgColor[prodMsg.type],
          }}
        >
          {prodMsg.text}
        </div>
        <div
          className="px-3 py-2.5 rounded-xl text-sm font-medium"
          style={{
            background: 'var(--bg)',
            border: '1px solid var(--border)',
            color: msgColor[spendMsg.type],
          }}
        >
          {spendMsg.text}
        </div>
      </div>

      {/* Stats */}
      <div className="divide-y" style={{ borderColor: 'var(--border)' }}>
        <InsightRow
          icon="✅"
          label="Tugas selesai"
          value={`${completedCount} / ${totalTasks}`}
        />
        <InsightRow
          icon="💸"
          label="Total pengeluaran"
          value={formatCurrency(totalSpending)}
        />
        {mostExpense && (
          <InsightRow
            icon="🛍️"
            label="Paling sering dibeli"
            value={mostExpense}
            capitalize
          />
        )}
        {bestDay && (
          <InsightRow
            icon="📅"
            label="Hari paling produktif"
            value={bestDay}
          />
        )}
        {filteredExpenses.length > 0 && (
          <InsightRow
            icon="📦"
            label="Jumlah transaksi"
            value={`${filteredExpenses.length}x`}
          />
        )}
      </div>
    </div>
  );
}

function InsightRow({ icon, label, value, capitalize = false }) {
  return (
    <div className="insight-row">
      <span className="flex items-center gap-1.5" style={{ color: 'var(--muted)' }}>
        <span>{icon}</span>
        <span>{label}</span>
      </span>
      <span
        className={`font-semibold text-right ${capitalize ? 'capitalize' : ''}`}
        style={{ color: 'var(--text)' }}
      >
        {value}
      </span>
    </div>
  );
}
