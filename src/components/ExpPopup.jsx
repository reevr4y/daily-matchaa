import { useState, useEffect, useCallback, useRef } from 'react';

// ── EXP gain motivational quotes ─────────────────────────────────────────
const EXP_QUOTES = [
  'Terus gasss matchaaww! 🔥',
  'Keren banget! Keep going~ ✨',
  'EXP nambah! Semangat terus! 💪',
  'Ciee yang rajin banget 😍',
  'Satu langkah lebih dekat ke level up! 🚀',
  'Mantap jiwa matchaaww! 🌟',
  'Gaskeun! Kamu amazing! 🎯',
  'Produktifnya overflow hari ini~ 📈',
  'On fire! Jangan berhenti! 🔥🔥',
  'Small wins, big impact! ⚡',
];

// ── Level-up celebration quotes ──────────────────────────────────────────
const LEVELUP_QUOTES = [
  'WOWWW LEVEL NAIK! Kamu memang the best, matchaaww! 🏆',
  'LEVEL UP! Ga nyangka bisa secepet ini! 🎉🎉',
  'CONGRATULATIONS! Kamu terlalu keren, matchaaww! 👑',
  'NAIK LEVEL! Api semangat kamu ga bisa dipadamkan! 🔥',
  'WOW LEVEL UP! Kamu ini bintang yang bersinar terang ya! ⭐',
  'AMAZING! Level baru, semangat baru, kamu makin keren! 🌈',
  'LEVEL UP BESTIE! Aku bangga sama kamu, matchaaww! 🥰',
];

// ── EXP loss quotes ─────────────────────────────────────────────────────
const LOSS_QUOTES = [
  'Oops... tapi gapapa, bangkit lagi! 💪',
  'Dih, minus... Yuk cari EXP lagi! 😤',
  'Tenang matchaaww, ini cuma sementara~ 🌸',
  'EXP turun dikit, tapi kamu tetap hebat! 💕',
];

export function useExpPopup() {
  const [popups, setPopups] = useState([]);
  const idRef = useRef(0);

  const showExpPopup = useCallback((amount, type = 'exp', extraData = {}) => {
    const id = ++idRef.current;

    let quote, emoji, title;

    if (type === 'levelup') {
      quote = LEVELUP_QUOTES[Math.floor(Math.random() * LEVELUP_QUOTES.length)];
      emoji = '🏆';
      title = `Level ${extraData.newLevel}!`;
    } else if (amount < 0) {
      quote = LOSS_QUOTES[Math.floor(Math.random() * LOSS_QUOTES.length)];
      emoji = '😢';
      title = `${amount} EXP`;
    } else {
      quote = EXP_QUOTES[Math.floor(Math.random() * EXP_QUOTES.length)];
      emoji = '🔥';
      title = `+${amount} EXP`;
    }

    const popup = { id, amount, type, quote, emoji, title, ...extraData };
    setPopups(prev => [...prev, popup]);

    // Auto remove
    const duration = type === 'levelup' ? 4000 : 2500;
    setTimeout(() => {
      setPopups(prev => prev.map(p => p.id === id ? { ...p, dismissing: true } : p));
      setTimeout(() => {
        setPopups(prev => prev.filter(p => p.id !== id));
      }, 500);
    }, duration);

    return id;
  }, []);

  return { popups, showExpPopup };
}

// ── Fire particle component ──────────────────────────────────────────────
function FireParticle({ delay, x, size, type }) {
  return (
    <div
      className={`fire-particle ${type === 'levelup' ? 'fire-golden' : ''}`}
      style={{
        left: `${x}%`,
        animationDelay: `${delay}s`,
        width: `${size}px`,
        height: `${size}px`,
      }}
    />
  );
}

// ── Floating emoji ───────────────────────────────────────────────────────
function FloatingEmoji({ emoji, delay, x }) {
  return (
    <div
      className="floating-emoji"
      style={{
        left: `${x}%`,
        animationDelay: `${delay}s`,
      }}
    >
      {emoji}
    </div>
  );
}

// ── Single popup card ────────────────────────────────────────────────────
function ExpPopupCard({ popup }) {
  const [entered, setEntered] = useState(false);
  const isLevelUp = popup.type === 'levelup';
  const isLoss = popup.amount < 0;

  useEffect(() => {
    requestAnimationFrame(() => setEntered(true));
  }, []);

  const fireParticles = Array.from({ length: isLevelUp ? 14 : 8 }, (_, i) => ({
    delay: Math.random() * 0.8,
    x: 10 + Math.random() * 80,
    size: 4 + Math.random() * (isLevelUp ? 10 : 6),
  }));

  const floatingEmojis = isLevelUp
    ? ['🔥', '⭐', '🎉', '✨', '👑', '💥', '🌟', '🏆']
    : isLoss
    ? ['💸', '😭']
    : ['🔥', '⚡', '✨', '💪'];

  return (
    <div className={`exp-popup-overlay ${entered && !popup.dismissing ? 'show' : ''} ${popup.dismissing ? 'hide' : ''}`}>
      <div className={`exp-popup-card ${isLevelUp ? 'level-up' : isLoss ? 'loss' : 'gain'}`}>

        {/* Fire particles background */}
        <div className="fire-container">
          {fireParticles.map((p, i) => (
            <FireParticle key={i} {...p} type={popup.type} />
          ))}
        </div>

        {/* Floating emojis */}
        <div className="floating-emojis-container">
          {floatingEmojis.map((e, i) => (
            <FloatingEmoji
              key={i}
              emoji={e}
              delay={i * 0.15}
              x={5 + (i * (90 / floatingEmojis.length))}
            />
          ))}
        </div>

        {/* Main icon/image */}
        <div className={`exp-popup-icon ${isLevelUp ? 'mega-bounce' : 'bounce-in'}`}>
          {popup.amount > 0 && !isLevelUp ? (
            <img 
              src="semangat.svg" 
              alt="semangat" 
              className="w-20 h-20 mx-auto object-contain pointer-events-none drop-shadow-lg"
            />
          ) : (
            popup.emoji
          )}
        </div>

        {/* Title (EXP amount or Level) */}
        <div className={`exp-popup-title ${isLevelUp ? 'golden-text' : isLoss ? 'loss-text' : 'fire-text'}`}>
          {popup.title}
        </div>

        {/* Level info for level ups */}
        {isLevelUp && popup.levelTitle && (
          <div className="exp-popup-level-title">
            「 {popup.levelTitle} 」
          </div>
        )}

        {/* Quote */}
        <p className="exp-popup-quote">{popup.quote}</p>

        {/* Progress bar flash for level ups */}
        {isLevelUp && (
          <div className="exp-popup-progress">
            <div className="exp-popup-progress-fill" />
          </div>
        )}
      </div>
    </div>
  );
}

// ── Main render container ────────────────────────────────────────────────
export default function ExpPopup({ popups }) {
  if (popups.length === 0) return null;

  return (
    <div className="exp-popup-container">
      {popups.map(popup => (
        <ExpPopupCard key={popup.id} popup={popup} />
      ))}
    </div>
  );
}
