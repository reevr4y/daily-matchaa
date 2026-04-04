import { useState, useEffect, useCallback, useRef } from 'react';
import { playMeow } from '../utils/sounds';

const MESSAGES = [
  "Hallo Matchaaawww 😆💖",
  "Matcha lagi ngapain nih? 👀",
  "Semangat ya hari ini Matcha 💪✨",
  "Jangan lupa makan yaa 🍽️",
  "Machii kangen Matcha 😽"
];

export default function DeskBuddy({ tasksCompletedToday = 0 }) {
  const [state, setState] = useState('idle');
  const [activeMessage, setActiveMessage] = useState(null);
  const lastMsgIdxRef = useRef(-1);
  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    if (tasksCompletedToday > 0) {
      triggerHappy();
    }
  }, [tasksCompletedToday]);

  const triggerHappy = useCallback((isClick = false) => {
    setState('happy');
    playMeow();

    if (isClick) {
      // Pick random message but prevent repeating the exact same one back-to-back
      let nextIdx = Math.floor(Math.random() * MESSAGES.length);
      if (nextIdx === lastMsgIdxRef.current) {
        nextIdx = (nextIdx + 1) % MESSAGES.length;
      }
      lastMsgIdxRef.current = nextIdx;
      setActiveMessage(MESSAGES[nextIdx]);

      // Clear existing message timeout to prevent overlapping hides
      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => {
        setActiveMessage(null);
      }, 3000); // Hide after 3 seconds
    }

    setTimeout(() => setState('idle'), 600); // 0.6s jump animation duration
  }, []);

  const handleClick = () => {
    triggerHappy(true);
  };

  return (
    <div className="flex flex-col items-center pointer-events-auto relative z-[100] mt-8 mb-4">
      {/* ── Chat Bubble ── */}
      {activeMessage && (
        <div className="machii-chat-bubble">
          {activeMessage}
        </div>
      )}

      {/* ── Name Tag (Above Cat) ── */}
      <div className="machii-name-tag absolute -top-4 flex justify-center w-full z-10 pointer-events-none">
        <span className="machii-name-text">Machii 🐱</span>
      </div>

      {/* ── Cat Sprite ── */}
      <div 
        className={`machii-sprite ${state} filter drop-shadow-md`} 
        onClick={handleClick}
        style={{ cursor: 'pointer' }}
      />
    </div>
  );
}
