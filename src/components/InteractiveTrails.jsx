import React, { useState, useEffect, useRef } from 'react';
import { useMousePosition } from '../hooks/useMousePosition';


const PARTICLE_LIFETIME = 1500;
const MAX_PARTICLES = 15;

const InteractiveTrails = React.memo(function InteractiveTrails() {
  const [particles, setParticles] = useState([]);
  const lastPos = useRef({ x: 0, y: 0 });

  const handleMove = (x, y) => {
    if (!x || !y) return;

    // Only spawn if moved enough to avoid overcrowding
    const dist = Math.sqrt(Math.pow(x - lastPos.current.x, 2) + Math.pow(y - lastPos.current.y, 2));
    
    if (dist > 30) {
      lastPos.current = { x, y };
      const id = Math.random().toString(36).substring(2, 9);
      const type = Math.random() > 0.5 ? 'leaf' : 'flower';
      const size = Math.random() * 15 + 10;
      const rotation = Math.random() * 360;

      const newParticle = { id, x, y, type, size, rotation, birth: Date.now() };

      setParticles(prev => {
         const updated = [...prev, newParticle];
         if (updated.length > MAX_PARTICLES) return updated.slice(1);
         return updated;
      });

      setTimeout(() => {
        setParticles(prev => prev.filter(p => p.id !== id));
      }, PARTICLE_LIFETIME);
    }
  };

  useMousePosition(handleMove);

  useEffect(() => {
    // Keep touchmove for mobile if needed, but the hook only does mousemove.
    // However the prompt says "Ganti dengan memanggil useMousePosition(handleMove) di dalam komponen."
    // and "Hapus window.addEventListener('mousemove', handleMove) dan window.removeEventListener-nya."
    // It doesn't explicitly say to remove touchmove, but singleton pattern usually benefits from both.
    // For now I'll follow instructions strictly and only replace mousemove if that's what's implied.
    // Actually, usually useMousePosition should handle both if it's a "mouse/touch position" hook,
    // but the user's implementation of useMousePosition only has mousemove.
    // I'll stick to the provided code for the hook.
    
    window.addEventListener('touchmove', handleMove);
    return () => {
      window.removeEventListener('touchmove', handleMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {particles.map(p => (
        <div
          key={p.id}
          className="absolute transition-opacity duration-1000 ease-out animate-trail-float"
          style={{
            left: p.x,
            top: p.y,
            width: p.size,
            height: p.size,
            transform: `translate(-50%, -50%) rotate(${p.rotation}deg)`,
            opacity: 1,
            '--tx': `${(Math.random() - 0.5) * 40}px`,
            '--ty': `${20 + Math.random() * 40}px`,
          }}
        >
          {p.type === 'leaf' ? (
             <svg viewBox="0 0 24 24" fill="var(--success)" opacity="0.6">
               <path d="M17,8C8,10 5.9,16.17 3.82,21.34L5.71,22L6.66,19.7C7.14,19.87 7.64,20 8,20C19,20 22,3 22,3C21,5 14,5.25 9,6.25C4,7.25 2,11.5 2,13.5C2,15.5 3.75,17.25 3.75,17.25C7,11 17,8 17,8Z" />
             </svg>
          ) : (
            <span className="text-sm opacity-60">🌸</span>
          )}
        </div>
      ))}
    </div>
  );
});

export default InteractiveTrails;
