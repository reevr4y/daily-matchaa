import React, { useState, useCallback, useRef } from 'react';
import { playRandomEmoteSound } from '../utils/sounds';

const EMOTES = ['💖', '😆', '🎉', '😺', '✨', '💅', '😭', '🔥', '🌈', '🦄'];

const EmoteReaction = React.memo(function EmoteReaction({ onAddExp }) {
  const [activeEmotes, setActiveEmotes] = useState([]);
  const lastClickRef = useRef(0);

  const handleSpam = useCallback(() => {
    const now = Date.now();
    // Rate limit: Max 10 per second to prevent DOM explosion
    if (now - lastClickRef.current < 100) return;
    lastClickRef.current = now;

    // Play sound
    playRandomEmoteSound();

    // Add EXP
    if (onAddExp) onAddExp(1);

    // Create new emote object
    const id = Math.random().toString(36).substr(2, 9);
    const emoji = EMOTES[Math.floor(Math.random() * EMOTES.length)];
    const driftX = (Math.random() - 0.5) * 80; // drift left/right
    const angle = (Math.random() - 0.5) * 40; // random rotation
    const duration = 1 + Math.random(); // 1s - 2s

    const newEmote = { id, emoji, driftX, angle, duration };

    setActiveEmotes((prev) => [...prev, newEmote]);

    // Cleanup after animation
    setTimeout(() => {
      setActiveEmotes((prev) => prev.filter((e) => e.id !== id));
    }, duration * 1000);
  }, [onAddExp]);

  return (
    <div className="action-dock-item emote-dock">
      {/* Emote Layer (where they float up from) */}
      <div className="emote-layer">
        {activeEmotes.map((e) => (
          <div
            key={e.id}
            className="floating-emote"
            style={{
              '--drift-x': `${e.driftX}px`,
              '--angle': `${e.angle}`,
              '--anim-duration': `${e.duration}s`,
            }}
          >
            <span className="floating-emote-exp">+1</span>
            <span>{e.emoji}</span>
          </div>
        ))}
      </div>

      {/* Main Spam Button */}
      <button
        onClick={handleSpam}
        className="dock-btn"
        aria-label="Send Emote Reaction"
        title="Spam for +1 EXP!"
      >
        <span className="hover:scale-125 transition-transform duration-300">😆</span>
      </button>
    </div>
  );
});

export default EmoteReaction;

