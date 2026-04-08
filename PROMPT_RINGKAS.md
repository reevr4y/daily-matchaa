# Optimasi Performa — daily-life-tracker

Repository: https://github.com/reevr4y/daily-life-tracker

**Aturan:** Jangan hapus/nonaktifkan fitur apapun. Semua efek visual tetap aktif. Hanya buat kode lebih efisien.

---

## Perbaikan 1 — Fix bug import (LAKUKAN PERTAMA)

File: `src/hooks/useCurrentDate.js`
Tambahkan `useMemo` ke baris import:
```js
import { useState, useEffect, useMemo } from 'react';
```

---

## Perbaikan 2 — Buat hook mouse terpusat

Buat file baru `src/hooks/useMousePosition.js`:
```js
import { useEffect, useRef } from 'react';

const listeners = new Set();
let globalX = 0, globalY = 0, listening = false;

function onMove(e) {
  globalX = e.clientX; globalY = e.clientY;
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
```

---

## Perbaikan 3 — Refactor InteractiveTrails.jsx

Di `src/components/InteractiveTrails.jsx`:
- Import `useMousePosition` dari `../hooks/useMousePosition`
- Hapus `window.addEventListener('mousemove', handleMove)` dan `window.removeEventListener`
- Ganti dengan `useMousePosition(handleMove)` dipanggil di dalam komponen
- Logika partikel lainnya tidak diubah

---

## Perbaikan 4 — Refactor DeskBuddy.jsx

Di `src/components/DeskBuddy.jsx`:
- Import `useMousePosition` dari `../hooks/useMousePosition`
- Hapus `window.addEventListener('mousemove', handleMouseMove, { passive: true })` dan `removeEventListener`-nya
- Ganti dengan `useMousePosition((x, y) => { mouseX = x; mouseY = y; })`
- Tambahkan pause RAF saat tab tidak aktif, letakkan di dalam `useEffect` yang sama dengan RAF:
```js
const handleVisibility = () => {
  if (document.hidden) {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    rafRef.current = null;
  } else {
    rafRef.current = requestAnimationFrame(updateEyes);
  }
};
document.addEventListener('visibilitychange', handleVisibility);
// jangan lupa cleanup: document.removeEventListener('visibilitychange', handleVisibility)
```
- Semua logika lain (lookAt, pacing, triggerInteract) tidak diubah

---

## Perbaikan 5 — Cache Audio object

Di `src/utils/sounds.js`, ganti fungsi `playMeow` dan `playMachiiSuara`:
```js
let _meow = null, _machii = null;

export function playMeow() {
  try {
    if (!_meow) { _meow = new Audio(import.meta.env.BASE_URL + 'assets/meow.mp3'); _meow.volume = 0.5; }
    _meow.currentTime = 0;
    _meow.play().catch(e => console.warn("Meow blocked:", e));
  } catch(e) {}
}

export function playMachiiSuara() {
  try {
    if (!_machii) { _machii = new Audio(import.meta.env.BASE_URL + 'assets/machii_suara.mp3'); _machii.volume = 0.5; }
    _machii.currentTime = 0;
    _machii.play().catch(e => console.warn("Machii suara blocked:", e));
  } catch(e) {}
}
```

---

## Perbaikan 6 — Tambah React.memo

Wrap dengan `React.memo` pada komponen berikut (tidak ubah logika dalamnya):
- `src/components/AuraEffect.jsx`
- `src/components/FloatingDecorations.jsx`
- `src/components/SkyEffects.jsx`
- `src/components/InteractiveTrails.jsx`
- `src/components/EmoteReaction.jsx`

Contoh:
```js
// Sebelum:
export default function NamaKomponen(props) { ... }

// Sesudah:
const NamaKomponen = React.memo(function NamaKomponen(props) { ... });
export default NamaKomponen;
```

---

## Perbaikan 7 — Pisahkan chunk framer-motion di Vite

Di `vite.config.js`, tambahkan di dalam `manualChunks`:
```js
if (id.includes('framer-motion')) return 'vendor-motion';
```

---

## Verifikasi Setelah Selesai

Pastikan masih berfungsi:
- Karakter Machii muncul, bisa diklik, suara keluar
- Mata mengikuti kursor
- Partikel daun/bunga muncul saat mouse bergerak
- Sticker bisa di-drag
- Efek langit dan dekorasi mengambang terlihat
- Semua fitur (task, expense, EXP, scrapbook, dll) normal
