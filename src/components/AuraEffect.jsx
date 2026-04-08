import React, { useState, useEffect } from 'react';

const AuraEffect = React.memo(function AuraEffect({ level = 1 }) {
  const [active, setActive] = useState(false);

  // Trigger brief pulse when level changes
  useEffect(() => {
    setActive(true);
    const timer = setTimeout(() => setActive(false), 3000);
    return () => clearTimeout(timer);
  }, [level]);

  let auraClass = '';
  if (level >= 20) auraClass = 'aura-level-20';
  else if (level >= 10) auraClass = 'aura-level-10';
  else if (level >= 5) auraClass = 'aura-level-5';

  if (!auraClass) return null;

  return (
    <div className={`aura-container ${active ? 'opacity-100' : 'opacity-40'}`}>
      <div className={`aura-glow ${auraClass}`} />
    </div>
  );
});

export default AuraEffect;

