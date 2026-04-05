import { useState, useEffect, useCallback, useRef } from 'react';

const STICKER_ASSETS = [
  { id: 'matcha_leaf', src: 'assets/stickers/matcha_leaf.png', label: 'Matcha Leaf' },
  { id: 'pink_heart', src: 'assets/stickers/pink_heart.png', label: 'Pink Heart' },
  { id: 'cat_head',   src: 'assets/stickers/cat_head.png', label: 'Cat Head' },
  { id: 'matcha_cup',  src: 'assets/stickers/matcha_cup.png', label: 'Matcha Cup' },
  { id: 'yellow_star', src: 'assets/stickers/yellow_star.png', label: 'Star' },
];

export default function StickerManager() {
  const [stickers, setStickers] = useState(() => {
    const saved = localStorage.getItem('dlt_stickers');
    return saved ? JSON.parse(saved) : [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [draggingId, setDraggingId] = useState(null);
  const dragOffset = useRef({ x: 0, y: 0 });

  useEffect(() => {
    localStorage.setItem('dlt_stickers', JSON.stringify(stickers));
  }, [stickers]);

  const addSticker = (asset) => {
    const id = Date.now().toString();
    const newSticker = {
      id,
      assetId: asset.id,
      src: asset.src,
      x: window.innerWidth / 2 - 50 + (Math.random() * 40 - 20),
      y: window.innerHeight / 2 - 50 + (Math.random() * 40 - 20),
      scale: 1,
      rotation: (Math.random() * 20) - 10,
    };
    setStickers(prev => [...prev, newSticker]);
    setIsOpen(false);
  };

  const handleDragStart = (e, id) => {
    e.preventDefault();
    const touch = e.touches ? e.touches[0] : e;
    const sticker = stickers.find(s => s.id === id);
    if (!sticker) return;
    
    dragOffset.current = {
      x: touch.clientX - sticker.x,
      y: touch.clientY - sticker.y
    };
    setDraggingId(id);
  };

  const handleMove = useCallback((e) => {
    if (!draggingId) return;
    const touch = e.touches ? e.touches[0] : e;
    
    setStickers(prev => prev.map(s => {
      if (s.id === draggingId) {
        return {
          ...s,
          x: touch.clientX - dragOffset.current.x,
          y: touch.clientY - dragOffset.current.y
        };
      }
      return s;
    }));
  }, [draggingId]);

  const handleEnd = useCallback(() => {
    setDraggingId(null);
  }, []);

  useEffect(() => {
    if (draggingId) {
      window.addEventListener('mousemove', handleMove);
      window.addEventListener('mouseup', handleEnd);
      window.addEventListener('touchmove', handleMove);
      window.addEventListener('touchend', handleEnd);
    }
    return () => {
      window.removeEventListener('mousemove', handleMove);
      window.removeEventListener('mouseup', handleEnd);
      window.removeEventListener('touchmove', handleMove);
      window.removeEventListener('touchend', handleEnd);
    };
  }, [draggingId, handleMove, handleEnd]);

  const removeSticker = (id) => {
    setStickers(prev => prev.filter(s => s.id !== id));
  };

  return (
    <>
      {/* ── Sticker Layer ── */}
      <div className="fixed inset-0 pointer-events-none z-[1000]">
        {stickers.map(s => (
          <div
            key={s.id}
            className="absolute pointer-events-auto cursor-move group"
            style={{
              left: s.x,
              top: s.y,
              transform: `rotate(${s.rotation}deg) scale(${s.scale})`,
              width: '80px',
              height: '80px',
              userSelect: 'none',
              touchAction: 'none'
            }}
            onMouseDown={(e) => handleDragStart(e, s.id)}
            onTouchStart={(e) => handleDragStart(e, s.id)}
          >
            <img 
              src={s.src} 
              alt="sticker" 
              className="w-full h-full object-contain pointer-events-none drop-shadow-sm select-none" 
            />
            <button
              className="absolute -top-2 -right-2 w-6 h-6 bg-white border border-gray-200 rounded-full flex items-center justify-center text-[10px] opacity-0 group-hover:opacity-100 transition-opacity shadow-sm z-10"
              onClick={(e) => {
                e.stopPropagation();
                removeSticker(s.id);
              }}
            >
              ❌
            </button>
          </div>
        ))}
      </div>

      {/* ── Toggle Button ── */}
      <button
        className="fixed bottom-6 right-6 w-14 h-14 bg-white border-2 border-accent-2 rounded-full flex items-center justify-center shadow-lg z-[2000] hover:scale-110 active:scale-95 transition-all text-2xl"
        onClick={() => setIsOpen(!isOpen)}
        style={{ borderColor: 'var(--accent-2)', background: 'var(--card)' }}
        aria-label="Buka Buku Stiker"
      >
        🎨
      </button>

      {/* ── Sticker Drawer ── */}
      <div 
        className={`fixed bottom-24 right-6 bg-white border border-gray-100 rounded-2xl shadow-2xl p-4 z-[2000] transition-all duration-300 w-48 ${
          isOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10 pointer-events-none'
        }`}
        style={{ background: 'var(--card)', borderColor: 'var(--border)' }}
      >
        <p className="text-xs font-bold mb-3 text-center uppercase tracking-widest" style={{ color: 'var(--muted)' }}>
          Sticker Book
        </p>
        <div className="grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto pr-1">
          {STICKER_ASSETS.map(asset => (
            <button
              key={asset.id}
              className="p-2 border border-transparent hover:border-accent rounded-xl hover:bg-accent/10 transition-all flex flex-col items-center gap-1"
              onClick={() => addSticker(asset)}
              title={asset.label}
            >
              <img src={asset.src} alt={asset.label} className="w-12 h-12 object-contain" />
            </button>
          ))}
        </div>
      </div>
    </>
  );
}
