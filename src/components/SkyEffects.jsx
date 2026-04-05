import React, { useMemo } from 'react';

const THEME_AURORA_COLORS = {
  matcha:     ['rgba(123, 174, 127, 0.4)', 'rgba(230, 211, 179, 0.3)'],
  strawberry: ['rgba(255, 138, 161, 0.4)', 'rgba(255, 212, 219, 0.3)'],
  peach:      ['rgba(255, 179, 102, 0.4)', 'rgba(255, 229, 204, 0.3)'],
  lavender:   ['rgba(160, 132, 232, 0.4)', 'rgba(232, 221, 255, 0.3)'],
};

export default function SkyEffects({ theme = 'matcha' }) {
  const colors = THEME_AURORA_COLORS[theme] || THEME_AURORA_COLORS.matcha;

  // Generate 5 random star positions/timings one-time
  const stars = useMemo(() => {
    return Array.from({ length: 6 }).map((_, i) => ({
      id: i,
      top: `${Math.random() * 50}%`,
      left: `${70 + Math.random() * 30}%`, // Start mostly from top-right
      duration: `${4 + Math.random() * 6}s`,
      delay: `${Math.random() * 15}s`,
      width: `${80 + Math.random() * 120}px`
    }));
  }, []);

  return (
    <div className="sky-effects-container">
      {/* 🌌 Aurora Blobs (Slow & Dreamy) */}
      <div 
        className="aurora-blob" 
        style={{ 
          top: '-15%', 
          left: '-10%', 
          background: `radial-gradient(circle, ${colors[0]}, transparent 70%)`,
          animationDuration: '30s'
        }} 
      />
      <div 
        className="aurora-blob" 
        style={{ 
          top: '10%', 
          right: '-15%', 
          background: `radial-gradient(circle, ${colors[1]}, transparent 70%)`,
          animationDuration: '25s',
          animationDelay: '-7s'
        }} 
      />
      <div 
        className="aurora-blob" 
        style={{ 
          bottom: '-10%', 
          left: '20%', 
          width: '60vw',
          background: `radial-gradient(circle, ${colors[0]}, transparent 70%)`,
          animationDuration: '35s',
          animationDelay: '-12s',
          opacity: 0.1
        }} 
      />
      
      {/* ✨ Shooting Stars (Occasional & Fast) */}
      <div className="shooting-star-layer">
        {stars.map(star => (
          <div 
            key={star.id}
            className="shooting-star"
            style={{
              top: star.top,
              left: star.left,
              width: star.width,
              animation: `shooting-star-anim ${star.duration} ${star.delay} linear infinite`
            }}
          />
        ))}
      </div>
    </div>
  );
}
