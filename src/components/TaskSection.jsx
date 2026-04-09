import { useState, useRef, useCallback, useMemo, memo, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { filterByPeriod } from '../utils/insights';
import { fireSmallConfetti } from '../utils/confetti';
import { playPop, playChime } from '../utils/sounds';
import TaskItem from './TaskItem';

export default memo(function TaskSection({ tasks, filter, onAdd, onComplete, onDelete, onToast }) {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  // Memoize today calculation
  const today = useMemo(() => new Date().toLocaleDateString('en-CA'), []);
  
  // Memoize filtered tasks
  const filtered = useMemo(() => 
    filterByPeriod(tasks, filter), 
    [tasks, filter]
  );
  
  // Memoize categorized tasks
  const categorized = useMemo(() => ({
    pending: filtered.filter(t => t.status === 'pending' && t.date === today),
    missed: filtered.filter(t => t.status === 'missed' || (t.status === 'pending' && t.date < today)),
    done: filtered.filter(t => t.status === 'done' && t.date === today)
  }), [filtered, today]);
  
  const { pending, missed, done } = categorized;

  const handleAdd = async (e) => {
    e.preventDefault();
    const val = input.trim();
    if (!val) { inputRef.current?.focus(); return; }
    
    setInput('');
    await onAdd(val, today);
    inputRef.current?.focus();
  };

  const handleCompleteInternal = useCallback((task, e) => {
    if (task.status === 'done' || task.status === 'missed') return;
    if (task.date < today) return;

    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX;
    const y = e.clientY;
    
    onSparkle?.(x, y);
    fireSmallConfetti(x / window.innerWidth, y / window.innerHeight);
    playChime();
    onToast('Cie produktif matchaaww 😏✨', 'success');
    onComplete(task.id);
  }, [onComplete, onToast, onSparkle, today]);

  const handleDeleteInternal = useCallback(async (id, isLocked) => {
    if (isLocked) return;
    playPop();
    await onDelete(id);
  }, [onDelete]);

  const listConfig = {
    initial: { opacity: 0, y: 10 },
    animate: { opacity: 1, y: 0 },
    exit: { opacity: 0, scale: 0.95 },
    transition: { duration: 0.2 }
  };

  return (
    <div className="card p-5">
      <div className="section-title">
        <span>📋</span>
        <span>Tugas Hari Ini</span>
        {pending.length > 0 && (
          <span
            className="ml-auto text-xs font-normal px-2 py-0.5 rounded-full"
            style={{ background: 'var(--accent)', color: 'var(--text)' }}
          >
            {pending.length} pending
          </span>
        )}
      </div>

      {/* Add input */}
      <form onSubmit={handleAdd} className="space-y-4 mb-6">
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={e => setInput(e.target.value)}
            placeholder="Tambah tugas baru..."
            className="input-field"
          />
          <button type="submit" className="btn-primary flex-shrink-0 w-12" aria-label="Add task">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
          </button>
        </div>
      </form>

      {/* Task list */}
      <div className="space-y-2">
        {pending.length === 0 && done.length === 0 && missed.length === 0 && (
          <div className="empty-state">
            <div className="text-3xl mb-2">✨</div>
            <p>Belum ada tugas.<br />Yuk tambahin sesuatu!</p>
          </div>
        )}

        <AnimatePresence mode="popLayout" initial={false}>
          {pending.map(task => (
            <motion.div key={task.id} layout {...listConfig}>
              <TaskItem
                task={task}
                today={today}
                onComplete={handleCompleteInternal}
                onDelete={handleDeleteInternal}
              />
            </motion.div>
          ))}
        </AnimatePresence>

        {missed.length > 0 && (
          <>
            <p className="text-xs font-bold pt-4 pb-1 text-red-500 dark:text-red-400" style={{ letterSpacing: '0.05em' }}>
              LEWAT DEADLINE (MISSED) ❌
            </p>
            <AnimatePresence mode="popLayout">
              {missed.map(task => (
                <motion.div key={task.id} layout {...listConfig}>
                  <TaskItem
                    task={task}
                    today={today}
                    onComplete={handleCompleteInternal}
                    onDelete={handleDeleteInternal}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}

        {done.length > 0 && (
          <>
            <p className="text-xs font-semibold pt-4 pb-1" style={{ color: 'var(--muted)' }}>
              SELESAI · {done.length} ✅
            </p>
            <AnimatePresence mode="popLayout">
              {done.map(task => (
                <motion.div key={task.id} layout {...listConfig}>
                  <TaskItem
                    task={task}
                    today={today}
                    onComplete={handleCompleteInternal}
                    onDelete={handleDeleteInternal}
                  />
                </motion.div>
              ))}
            </AnimatePresence>
          </>
        )}
      </div>
    </div>
  );
});
