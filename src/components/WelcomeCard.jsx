import { useState, useEffect } from 'react';

const sweetMessages = [
  "Hari ini pasti seru, apalagi kalau kamu senyum terus ya matchaaww~ 🥰",
  "Jangan lupa makan, minum, dan istirahat ya sayangku matchaaww 💕",
  "Kamu tuh udah cantik, rajin pula. Sempurna deh matchaawwku! ✨",
  "Setiap usaha kecil kamu itu berarti banget loh, matchaaww 🌸",
  "Semangat hari ini! Aku selalu support kamu, matchaaww 💪🩷",
  "Kamu itu kayak matcha latte—manis, elegant, dan bikin nagih 🍵💚",
  "Apapun yang kamu kerjain hari ini, pasti bisa! Percaya deh, matchaaww~ 🌟",
  "Good vibes only buat matchaaww hari ini! 🦋✨",
  "Kamu udah hebat banget, matchaaww. Jangan terlalu keras sama diri sendiri ya 🤗",
  "Selamat pagi/siang/malam matchaaww! Kamu selalu bikin hari aku lebih berwarna 🌈",
  "Fun fact: kamu itu sumber kebahagiaan terbesar aku, matchaaww 🥹💗",
  "Ciee yang lagi buka daily tracker-nya~ Rajin banget matchaawwku! 📋🩷",
  "Matchaaww, kamu tahu ga? Kamu itu lebih manis dari gula 🍬💕",
  "Hari ini mau produktif atau rebahan? Dua-duanya valid kok, matchaaww! 😴✨",
  "Kamu itu punya power yang ga kamu sadari, matchaaww. Keep going! 💥🌸",
];

const greetingByTime = () => {
  const hour = new Date().getHours();
  if (hour >= 5 && hour < 12) return { text: 'Selamat Pagi', emoji: '🌅' };
  if (hour >= 12 && hour < 15) return { text: 'Selamat Siang', emoji: '☀️' };
  if (hour >= 15 && hour < 18) return { text: 'Selamat Sore', emoji: '🌇' };
  return { text: 'Selamat Malam', emoji: '🌙' };
};

export default function WelcomeCard({ onDismiss }) {
  const [visible, setVisible] = useState(false);
  const [dismissing, setDismissing] = useState(false);
  const [message] = useState(() =>
    sweetMessages[Math.floor(Math.random() * sweetMessages.length)]
  );
  const greeting = greetingByTime();

  useEffect(() => {
    // Slight delay for entrance animation
    const timer = setTimeout(() => setVisible(true), 150);
    return () => clearTimeout(timer);
  }, []);

  const handleDismiss = () => {
    setDismissing(true);
    setTimeout(() => {
      onDismiss?.();
    }, 400);
  };

  return (
    <>
      {/* Backdrop overlay */}
      <div
        className={`welcome-backdrop ${visible && !dismissing ? 'show' : ''} ${dismissing ? 'hide' : ''}`}
        onClick={handleDismiss}
      />

      {/* Card */}
      <div className={`welcome-card-wrapper ${visible && !dismissing ? 'show' : ''} ${dismissing ? 'hide' : ''}`}>
        <div className="welcome-card">
          {/* Sparkle decorations */}
          <div className="sparkle sparkle-1">✦</div>
          <div className="sparkle sparkle-2">✧</div>
          <div className="sparkle sparkle-3">♡</div>
          <div className="sparkle sparkle-4">✦</div>
          <div className="sparkle sparkle-5">🌸</div>

          {/* Greeting header */}
          <div className="welcome-greeting">
            <span className="welcome-emoji">{greeting.emoji}</span>
            <span>{greeting.text},</span>
          </div>

          {/* Name */}
          <h2 className="welcome-name">
            Dinda Sabrina Arianti
          </h2>
          <p className="welcome-nickname">~ matchaaww ~</p>

          {/* Divider */}
          <div className="welcome-divider">
            <span>💌</span>
          </div>

          {/* Sweet message */}
          <p className="welcome-message">
            {message}
          </p>

          {/* Dismiss button */}
          <button className="welcome-btn" onClick={handleDismiss}>
            Makasih, sayang! 🩷
          </button>

          {/* Subtle credit note */}
          <p className="welcome-credit">
            — with love, from <strong>Hengky</strong> 💕
          </p>
        </div>
      </div>
    </>
  );
}
