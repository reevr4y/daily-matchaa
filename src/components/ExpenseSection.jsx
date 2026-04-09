import { useState, useMemo, useRef, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterByPeriod, getTotalSpending, formatCurrency } from '../utils/insights';
import { playPop } from '../utils/sounds';
import ExpenseItem from './ExpenseItem';

function useDebouncedValue(value, delay) {
  const [debouncedValue, setDebouncedValue] = useState(value);
  
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    
    return () => clearTimeout(handler);
  }, [value, delay]);
  
  return debouncedValue;
}

const ExpenseSection = memo(function ExpenseSection({ expenses, filter, onAdd, onDelete, onToast }) {
  const [name, setName]     = useState('');
  const [amount, setAmount] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const suggestionsRef = useRef(null);

  // Memoize filtered expenses
  const filtered = useMemo(() => 
    filterByPeriod(expenses, filter),
    [expenses, filter]
  );
  
  // Memoize total
  const total = useMemo(() => 
    getTotalSpending(filtered),
    [filtered]
  );

  // Debounce name for suggestion filtering
  const debouncedName = useDebouncedValue(name, 150);

  // Close suggestions when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (suggestionsRef.current && !suggestionsRef.current.contains(e.target)) {
        setShowSuggestions(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Calculate unique suggestions with frequency count
  const suggestionsData = useMemo(() => {
    if (!expenses || expenses.length === 0) return [];
    
    const freq = {};
    const canonicalNames = {};

    expenses.forEach(e => {
      const n = e.name?.trim();
      if (!n) return;
      const lower = n.toLowerCase();
      freq[lower] = (freq[lower] || 0) + 1;
      
      if (!canonicalNames[lower] || (freq[lower] > (freq[canonicalNames[lower].toLowerCase()] || 0))) {
        canonicalNames[lower] = n;
      }
    });

    return Object.keys(freq)
      .sort((a, b) => freq[b] - freq[a])
      .map(lower => ({
        name: canonicalNames[lower],
        count: freq[lower]
      }));
  }, [expenses]);

  const filteredSuggestions = useMemo(() => {
    const search = debouncedName.trim().toLowerCase();
    if (!search) return suggestionsData.slice(0, 6);
    return suggestionsData
      .filter(s => s.name.toLowerCase().includes(search))
      .slice(0, 6);
  }, [suggestionsData, debouncedName]);

  const handleSelectSuggestion = (suggestedName) => {
    setName(suggestedName);
    setShowSuggestions(false);
  };

  const handleAdd = async (e) => {
    e.preventDefault();
    const n = name.trim();
    const a = parseFloat(amount);
    if (!n || !a || a <= 0) return;
    setName('');
    setAmount('');
    playPop();
    onToast('Jajan lagi nih 👀', 'warn');
    await onAdd(n, a);
  };

  const handleDeleteInternal = useCallback(async (id) => {
    playPop();
    await onDelete(id);
  }, [onDelete]);

  const itemConfig = {
    initial: { opacity: 0, x: -10 },
    animate: { opacity: 1, x: 0 },
    exit: { opacity: 0, x: 10, scale: 0.95 },
    transition: { duration: 0.2 }
  };

  return (
    <div className="card p-5">
      <div className="section-title">
        <span>💸</span>
        <span>Pengeluaran</span>
        {filtered.length > 0 && (
          <span
            className="ml-auto text-xs font-semibold px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--text)' }}
          >
            {filtered.length} item
          </span>
        )}
      </div>

      {/* Add form */}
      <form onSubmit={handleAdd} className="space-y-3 mb-6">
        <div className="suggestions-container" ref={suggestionsRef}>
          <input
            type="text"
            value={name}
            onChange={e => setName(e.target.value)}
            onFocus={() => setShowSuggestions(true)}
            onClick={() => setShowSuggestions(true)}
            placeholder="Nama pengeluaran..."
            className="input-field !rounded-full !px-5 !py-3 !bg-white/50 !border-white/40 focus:!bg-white/80 transition-all font-medium"
            autoComplete="off"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          />
          
          {showSuggestions && filteredSuggestions.length > 0 && (
            <div className="suggestions-menu !bg-white/80 !backdrop-blur-md !border-white/40 !rounded-2xl !shadow-xl !mt-2">
              {filteredSuggestions.map((s, i) => (
                <div 
                  key={i} 
                  className="suggestion-item hover:!bg-accent/40 !px-4 !py-2.5 transition-colors"
                  onClick={() => handleSelectSuggestion(s.name)}
                >
                  <div className="item-content">
                    <span className="item-icon">🛍️</span>
                    <span className="item-name font-semibold">{s.name}</span>
                  </div>
                  {s.count > 1 && (
                    <span className="item-freq bg-accent/50 px-2 py-0.5 rounded-full text-[10px] font-bold">{s.count}x</span>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <input
            type="number"
            value={amount}
            onChange={e => setAmount(e.target.value)}
            placeholder="Nominal (Rp)"
            className="input-field !rounded-full !px-5 !py-3 !bg-white/50 !border-white/40 focus:!bg-white/80 transition-all font-medium"
            min="0"
            step="500"
            style={{ fontFamily: "'Nunito', sans-serif" }}
          />
          <motion.button 
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            type="submit" 
            className="btn-primary !rounded-full !px-6 whitespace-nowrap !bg-success !text-white !font-bold shadow-sm"
          >
            + Catat
          </motion.button>
        </div>
      </form>

      {/* Expense list */}
      <div className="space-y-1.5 mb-4 max-h-56 overflow-y-auto overflow-x-hidden">
        {filtered.length === 0 && (
          <div className="empty-state">
            <div className="text-3xl mb-2">💰</div>
            <p>Belum ada pengeluaran.<br />Hemat banget nih!</p>
          </div>
        )}
        <AnimatePresence mode="popLayout" initial={false}>
          {[...filtered].reverse().map(e => (
            <motion.div key={e.id} layout {...itemConfig}>
              <ExpenseItem expense={e} onDelete={handleDeleteInternal} />
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Total */}
      {filtered.length > 0 && (
        <div
          className="flex items-center justify-between px-4 py-3 rounded-xl"
          style={{ background: 'var(--accent)', border: '1px solid var(--accent-2)' }}
        >
          <span className="text-sm font-semibold" style={{ color: 'var(--text)' }}>
            Total
          </span>
          <span className="text-base font-bold" style={{ color: 'var(--text)' }}>
            {formatCurrency(total)}
          </span>
        </div>
      )}
    </div>
  );
});

export default ExpenseSection;
