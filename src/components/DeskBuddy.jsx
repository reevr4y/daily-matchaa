import { useState, useEffect, useCallback, useRef } from 'react';
import { playMeow } from '../utils/sounds';

const MESSAGES = [
  "Hallo Matchaaawww 😆💖",
  "Matcha lagi ngapain nih? 👀",
  "Semangat ya hari ini Matcha 💪✨",
  "Jangan lupa makan yaa 🍽️",
  "Machii kangen Matcha 😽"
];

const BASE = import.meta.env.BASE_URL || '/';

const CHARACTER_CONFIG = {
  cat: {
    id: 'cat',
    name: 'Machii (Cat)',
    actions: {
      idle: { type: 'gif', src: `${BASE}assets/machii_diem.gif`, size: 100 },
      walk: { type: 'gif', src: `${BASE}assets/machii_jalan.gif`, size: 100 },
      interact: { 
        type: 'sprite', 
        src: `${BASE}assets/machii_happy.png`, 
        sizeY: 119, 
        sizeX: 146, 
        frames: 4, 
        duration: '0.6s' 
      }
    }
  },
  human: {
    id: 'human',
    name: 'Machii (Human)',
    actions: {
      idle: { type: 'video', src: `${BASE}assets/machii_game.mp4`, size: 100 },
      walk: { type: 'video', src: `${BASE}assets/machii_gerak.mp4`, size: 100 },
      interact: { type: 'video', src: `${BASE}assets/machii_hai.mp4`, size: 100 }
    }
  }
};

export default function DeskBuddy({ tasksCompletedToday = 0, darkMode = false, currentCharacter = 'cat' }) {
  const [currentAction, setCurrentAction] = useState('idle');
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
      triggerInteract();
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

  const triggerInteract = useCallback((isClick = false) => {
    setCurrentAction('interact');
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

    // Return to idle (or walk) after animation
    const config = CHARACTER_CONFIG[currentCharacter].actions.interact;
    const duration = config.type === 'sprite' ? 600 : 1200; // Adjust for GIF or Sprite
    
    setTimeout(() => {
        if(!isWalkingRef.current) setCurrentAction('idle');
        else setCurrentAction('walk');
    }, duration);
  }, [currentCharacter]);

  // Occasional pacing back and forth
  useEffect(() => {
    const paceTimer = setInterval(() => {
      if (Math.random() > 0.6 && currentAction === 'idle' && !isWalkingRef.current) {
        startPacing();
      }
    }, 12000);

    return () => clearInterval(paceTimer);
  }, [currentAction]);

  const startPacing = () => {
    if (isWalkingRef.current) return;
    isWalkingRef.current = true;
    setLookAt({ x: 0, y: 0 });
    
    const walkRight = Math.random() > 0.5;
    const dist = window.innerWidth < 640 ? 60 : 350; 
    const targetX = walkRight ? dist : -dist;
    
    setDirection(walkRight ? 1 : -1);
    setCurrentAction('walk');
    
    setTimeout(() => {
        setOffsetX(targetX);
    }, 50);

    setTimeout(() => {
      setDirection(walkRight ? -1 : 1);
      
      setTimeout(() => {
          setOffsetX(0);
          
          setTimeout(() => {
            isWalkingRef.current = false;
            setCurrentAction('idle');
            setDirection(1); 
          }, 5000);
      }, 100); 
    }, 6000); 
  };


  const currentConfig = CHARACTER_CONFIG[currentCharacter];
  let actionConfig = currentConfig.actions[currentAction];

  // Specific override for cat idle in dark mode (sleeping)
  if (currentCharacter === 'cat' && currentAction === 'idle' && darkMode) {
    actionConfig = { ...actionConfig, src: `${BASE}assets/machii_tidur.gif` };
  }

  return (
    <div 
      ref={containerRef}
      className="flex flex-col items-center pointer-events-auto relative z-[100] mt-4 mb-2 md:mt-8 md:mb-4 transition-all duration-300 scale-90 md:scale-100"
    >
      
      {/* --- Translate Container --- */}
      <div 
         className="relative transition-transform"
         style={{ 
             transform: `translateX(${offsetX}px)`,
             transitionDuration: currentAction === 'walk' ? '5s' : '0.4s',
             transitionTimingFunction: 'linear'
         }}
      >
          {/* --- Flip Container --- */}
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
                <span className="machii-name-text">{currentConfig.name}</span>
              </div>

              {/* ── Dynamic Sprite / Video ── */}
              {actionConfig.type === 'video' ? (
                <video
                  key={`${currentCharacter}-${currentAction}`}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className={`machii-sprite dynamic filter drop-shadow-md cursor-pointer transition-all duration-300 ${currentAction === 'interact' ? 'scale-110' : ''}`}
                  style={{
                    transform: `translate(${lookAt.x}px, ${lookAt.y}px)`,
                    width: actionConfig.size || 100,
                    height: actionConfig.size || 100,
                    objectFit: 'contain',
                    // Optional: common trick for black-background transparency if needed
                    // mixBlendMode: 'screen' 
                  }}
                  onClick={() => triggerInteract(true)}
                >
                  <source src={actionConfig.src} type="video/mp4" />
                </video>
              ) : (
                <div 
                  className={`machii-sprite dynamic filter drop-shadow-md cursor-pointer transition-all duration-300 ${currentAction === 'interact' ? 'scale-110' : ''}`} 
                  style={{ 
                      transform: `translate(${lookAt.x}px, ${lookAt.y}px)`,
                      backgroundImage: `url(${actionConfig.src})`,
                      width: actionConfig.sizeX || actionConfig.size || 100,
                      height: actionConfig.sizeY || actionConfig.size || 100,
                      backgroundSize: actionConfig.type === 'sprite' ? `${(actionConfig.sizeX || 100) * actionConfig.frames}px ${actionConfig.sizeY || 100}px` : 'contain',
                      backgroundPosition: 'center bottom',
                      animation: actionConfig.type === 'sprite' ? `sprite${currentAction} ${actionConfig.duration} steps(${actionConfig.frames}) infinite` : 'none'
                  }}
                  onClick={() => triggerInteract(true)}
                />
              )}
          </div>
      </div>
      
      <style>{`
        @keyframes spriteinteract {
          from { background-position-x: 0; }
          to { background-position-x: -${(actionConfig.sizeX || 100) * (actionConfig.frames || 1)}px; }
        }
      `}</style>
    </div>
  );
}
