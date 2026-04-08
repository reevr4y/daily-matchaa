import React from 'react';

const THEME_ICONS = {
  matcha:     ['🍃', '🌿', '🍵', '🍃', '🌱', '☘️'],
  strawberry: ['🍓', '🌸', '💖', '🍨', '🌷', '🎀'],
  peach:      ['🍑', '🍑', '🧡', '🍑', '🍊', '🎐'],
  lavender:   ['🍇', '🪻', '💜', '🌙', '🔮', '💤'],
};

const FloatingDecorations = React.memo(function FloatingDecorations({ theme = 'matcha' }) {
  const icons = THEME_ICONS[theme] || THEME_ICONS.matcha;

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none" style={{ zIndex: 0 }}>
      {icons.map((icon, i) => (
        <span 
          key={i} 
          className={`floating-decoration decoration-${i + 1}`}
        >
          {icon}
        </span>
      ))}
    </div>
  );
});

export default FloatingDecorations;

