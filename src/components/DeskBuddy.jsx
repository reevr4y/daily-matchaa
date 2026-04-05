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
  
  // Pacing State
  const [offsetX, setOffsetX] = useState(0);
  const [direction, setDirection] = useState(1);
  const [lookAt, setLookAt] = useState({ x: 0, y: 0 });
  const isWalkingRef = useRef(false);
  const containerRef = useRef(null);

  const lastMsgIdxRef = useRef(-1);
  const messageTimeoutRef = useRef(null);

  useEffect(() => {
    if (tasksCompletedToday > 0) {
      triggerHappy();
    }
  }, [tasksCompletedToday]);

  // Eye/Face tracking logic
  useEffect(() => {
    const handleMouseMove = (e) => {
      if (!containerRef.current || isWalkingRef.current) return;
      
      const rect = containerRef.current.getBoundingClientRect();
      const catX = rect.left + rect.width / 2;
      const catY = rect.top + rect.height / 2;
      
      const angleX = (e.clientX - catX) / 100;
      const angleY = (e.clientY - catY) / 100;
      
      setLookAt({
        x: Math.max(-8, Math.min(8, angleX * 5)),
        y: Math.max(-5, Math.min(5, angleY * 5))
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, []);

  const triggerHappy = useCallback((isClick = false) => {
    setState('happy');
    playMeow();

    if (isClick) {
      let nextIdx = Math.floor(Math.random() * MESSAGES.length);
      if (nextIdx === lastMsgIdxRef.current) {
        nextIdx = (nextIdx + 1) % MESSAGES.length;
      }
      lastMsgIdxRef.current = nextIdx;
      setActiveMessage(MESSAGES[nextIdx]);

      if (messageTimeoutRef.current) clearTimeout(messageTimeoutRef.current);
      messageTimeoutRef.current = setTimeout(() => {
        setActiveMessage(null);
      }, 3000);
    }

    setTimeout(() => {
        if(!isWalkingRef.current) setState('idle');
    }, 600);
  }, []);

  // Occasional pacing back and forth
  useEffect(() => {
    const paceTimer = setInterval(() => {
      if (Math.random() > 0.6 && state === 'idle' && !isWalkingRef.current) {
        startPacing();
      }
    }, 12000); // Check more often

    return () => clearInterval(paceTimer);
  }, [state]);

  const startPacing = () => {
    if (isWalkingRef.current) return;
    isWalkingRef.current = true;
    setLookAt({ x: 0, y: 0 });
    
    // 1. Determine direction
    const walkRight = Math.random() > 0.5;
    const dist = 350; // Long distance
    const targetX = walkRight ? dist : -dist;
    
    // 2. Set direction and start walk animation
    setDirection(walkRight ? 1 : -1);
    setState('walk');
    
    // 3. Move after a frame
    setTimeout(() => {
        setOffsetX(targetX);
    }, 50);

    // 4. After walk forward (5s) -> Flip and walk back
    setTimeout(() => {
      // Done walking out -> Flip instantly
      setDirection(walkRight ? -1 : 1);
      
      // Wait for flip, then move back
      setTimeout(() => {
          setOffsetX(0);
          
          // 5. After walk back (5s) -> Go back to idle
          setTimeout(() => {
            isWalkingRef.current = false;
            setState('idle');
            setDirection(1); // Default face right
          }, 5000);
      }, 100); 
    }, 6000); // Wait 1s extra at destination
  };

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center pointer-events-auto relative z-[100] mt-8 mb-4 transition-transform duration-300"
    >
      
      {/* --- Translate Container (The Walk Speed) --- */}
      <div 
         className="relative transition-transform"
         style={{ 
             transform: `translateX(${offsetX}px)`,
             transitionDuration: state === 'walk' ? '5s' : '0.4s',
             transitionTimingFunction: 'linear'
         }}
      >
          {/* --- Flip Container (Invisible Rotation) --- */}
          <div style={{ transform: `scaleX(${direction})` }}>
              
              {/* ── Chat Bubble ── */}
              {activeMessage && (
                <div className="machii-chat-bubble" style={{ transform: `scaleX(${direction})` }}>
                  {activeMessage}
                </div>
              )}

              {/* ── Name Tag ── */}
              <div 
                className="machii-name-tag absolute -top-4 flex justify-center w-full z-10 pointer-events-none transition-transform duration-200" 
                style={{ transform: `scaleX(${direction}) translate(${lookAt.x * 0.5}px, ${lookAt.y * 0.5}px)` }}
              >
                <span className="machii-name-text">Machii 🐱</span>
              </div>

              {/* ── Cat Sprite ── */}
              <div 
                className={`machii-sprite ${state} filter drop-shadow-md cursor-pointer transition-transform duration-200`} 
                style={{ transform: `translate(${lookAt.x}px, ${lookAt.y}px)` }}
                onClick={() => triggerHappy(true)}
              />
          </div>
      </div>
    </div>
  );
}
