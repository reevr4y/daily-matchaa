import React from 'react';

const TaskItem = React.memo(({ task, today, onComplete, onDelete }) => {
  const isDone = task.status === 'done';
  const isMissed = task.status === 'missed' || (task.status === 'pending' && task.date < today);

  return (
    <motion.div
      whileHover={{ scale: 1.02, x: 5 }}
      whileTap={{ scale: 0.98 }}
      className={`task-item group !bg-white/40 !backdrop-blur-sm !border-white/40 !shadow-sm !rounded-2xl !p-4 !mb-2 flex items-center gap-4 transition-all duration-300 hover:!bg-white/60 hover:!shadow-md ${isDone ? 'opacity-60' : ''}`}
    >
      {/* Checkbox */}
      <motion.button
        whileTap={{ scale: 1.4 }}
        className={`w-7 h-7 flex-shrink-0 rounded-full border-2 transition-all duration-300 flex items-center justify-center ${isDone ? 'bg-success border-success' : 'border-accent-2 bg-white/50 hover:border-success'}`}
        onClick={(e) => onComplete(task, e)}
        aria-label="Complete task"
        disabled={isDone || isMissed}
      >
        {isDone && (
          <motion.svg 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            width="12" height="10" viewBox="0 0 11 9" fill="none"
          >
            <path d="M1 4.5L4 7.5L10 1" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          </motion.svg>
        )}
        {isMissed && !isDone && <span className="text-xs">❌</span>}
      </motion.button>

      {/* Text */}
      <div className="flex-1 min-w-0">
        <span
          className={`text-[0.95rem] font-semibold tracking-tight transition-all duration-500 ${isDone ? 'line-through opacity-50' : ''}`}
          style={{ color: isMissed ? 'var(--muted)' : 'var(--text)', fontFamily: "'Nunito', sans-serif" }}
        >
          {task.title}
        </span>
      </div>

      {/* Delete button (hidden if missed/done) */}
      {!isDone && !isMissed && (
        <button
          onClick={() => onDelete(task.id, isMissed)}
          className="opacity-0 group-hover:opacity-100 flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full bg-red-50 text-red-300 hover:bg-red-500 hover:text-white transition-all duration-300"
          aria-label="Delete task"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M2 2L12 12M12 2L2 12" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
        </button>
      )}
    </motion.div>
  );
});

TaskItem.displayName = 'TaskItem';

export default TaskItem;
