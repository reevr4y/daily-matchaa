import { useEffect, useRef } from 'react';

const listeners = new Set();
let globalX = 0, globalY = 0, listening = false;

function onMove(e) {
  globalX = e.clientX;
  globalY = e.clientY;
  listeners.forEach(cb => cb(globalX, globalY));
}

export function useMousePosition(callback) {
  const ref = useRef(callback);
  ref.current = callback;

  useEffect(() => {
    const cb = (x, y) => ref.current(x, y);
    listeners.add(cb);

    if (!listening) {
      window.addEventListener('mousemove', onMove, { passive: true });
      listening = true;
    }

    return () => {
      listeners.delete(cb);
      if (!listeners.size) {
        window.removeEventListener('mousemove', onMove);
        listening = false;
      }
    };
  }, []);
}
