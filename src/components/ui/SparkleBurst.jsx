import { motion, AnimatePresence } from 'framer-motion';
import { useState, useCallback, useEffect } from 'react';

const Sparkle = ({ x, y, size, color, delay }) => (
  <motion.div
    initial={{ scale: 0, x: 0, y: 0, opacity: 1 }}
    animate={{ 
      scale: [0, 1.5, 0], 
      x: (Math.random() - 0.5) * 100, 
      y: (Math.random() - 0.5) * 100,
      opacity: [1, 1, 0]
    }}
    transition={{ duration: 0.8, delay, ease: "easeOut" }}
    className="absolute pointer-events-none z-[9999]"
    style={{ left: x, top: y, width: size, height: size, color: color }}
  >
    <svg viewBox="0 0 24 24" fill="currentColor">
      <path d="M12 0L14.59 9.41L24 12L14.59 14.59L12 24L9.41 14.59L0 12L9.41 9.41L12 0Z" />
    </svg>
  </motion.div>
);

export default function SparkleBurst({ trigger }) {
  const [sparkles, setSparkles] = useState([]);

  useEffect(() => {
    if (trigger?.id) {
      const newSparkles = Array.from({ length: 8 }).map((_, i) => ({
        id: Date.now() + i,
        x: trigger.x,
        y: trigger.y,
        size: 10 + Math.random() * 15,
        color: ['#FFD1DC', '#E1F5FE', '#FFF9C4', '#F3E5F5'][i % 4],
        delay: i * 0.05
      }));
      setSparkles(prev => [...prev, ...newSparkles]);
      
      const timer = setTimeout(() => {
        setSparkles(prev => prev.filter(s => !newSparkles.find(ns => ns.id === s.id)));
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [trigger]);

  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden z-[9999]">
      <AnimatePresence>
        {sparkles.map(s => (
          <Sparkle key={s.id} {...s} />
        ))}
      </AnimatePresence>
    </div>
  );
}
