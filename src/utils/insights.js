// Insights calculation helpers
export function filterByPeriod(items, filter) {
  const now = new Date();
  return items.filter(item => {
    const itemDate = new Date(item.date);
    if (filter === 'daily') {
      return itemDate.toDateString() === now.toDateString();
    } else if (filter === 'weekly') {
      const diff = (now - itemDate) / (1000 * 60 * 60 * 24);
      return diff <= 7;
    } else {
      const diff = (now - itemDate) / (1000 * 60 * 60 * 24);
      return diff <= 30;
    }
  });
}

export function getTotalSpending(expenses) {
  return expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
}

export function getMostFrequentExpense(expenses) {
  if (!expenses.length) return null;
  const freq = {};
  expenses.forEach(e => {
    const name = e.name?.toLowerCase() || 'other';
    freq[name] = (freq[name] || 0) + 1;
  });
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function getMostProductiveDay(tasks) {
  const completed = tasks.filter(t => t.status === 'done');
  if (!completed.length) return null;
  const dayCount = {};
  const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  completed.forEach(t => {
    const day = dayNames[new Date(t.date).getDay()];
    dayCount[day] = (dayCount[day] || 0) + 1;
  });
  return Object.entries(dayCount).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
}

export function getSpendingMessage(total, filter = 'daily', settings = { daily: 100000, weekly: 700000, monthly: 2000000 }) {
  if (total === 0) return { text: 'Hemat banget periode ini! 🌿', type: 'good' };
  
  const limit = settings[filter] || 100000;
  
  if (total > limit) return { text: 'Dompet kamu nangis 😭', type: 'warn' };
  if (total > limit * 0.8) return { text: 'Hampir batas belanja nih 🧐', type: 'neutral' };
  
  return { text: 'Pengeluaran terkendali ✨', type: 'neutral' };
}

export function getProductivityMessage(completedCount) {
  if (completedCount === 0) return { text: 'Hari ini belum ngapa-ngapain 😭', type: 'idle' };
  if (completedCount >= 5) return { text: 'Mantap, makin disiplin 😎', type: 'great' };
  if (completedCount >= 3) return { text: 'Kamu lagi rajin banget 🔥', type: 'good' };
  return { text: 'Lumayan, terus semangat! 💪', type: 'neutral' };
}

export function formatCurrency(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(amount);
}
