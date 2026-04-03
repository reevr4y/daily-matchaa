import { useState, useCallback } from 'react';
import { SHEETS_API_URL } from '../config';

// ─── localStorage helpers (always used as cache) ─────────────────────────────
const LS_TASKS    = 'dlt_tasks';
const LS_EXPENSES = 'dlt_expenses';
const LS_PAP      = 'dlt_pap_history';

function lsGet(key) {
  try { return JSON.parse(localStorage.getItem(key)) || []; }
  catch { return []; }
}
function lsSet(key, val) {
  try { localStorage.setItem(key, JSON.stringify(val)); }
  catch {}
}
function makeId() {
  return `${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
}
function todayIso() {
  // Gunakan local time format YYYY-MM-DD
  return new Date().toLocaleDateString('en-CA'); 
}

// ─── Image compression helper ─────────────────────────────────────────────────
function compressImage(dataUrl, maxWidth = 600, quality = 0.6) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const ratio = Math.min(maxWidth / img.width, maxWidth / img.height, 1);
      canvas.width = img.width * ratio;
      canvas.height = img.height * ratio;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.src = dataUrl;
  });
}

// ─── Sheets via GET params (no CORS issues) ───────────────────────────────────
async function sheetsRead(sheet) {
  // Tambahkan cache-buster (_t) supaya browser tidak ambil data basi
  const url = `${SHEETS_API_URL}?action=read&sheet=${sheet}&_t=${Date.now()}`;
  const res  = await fetch(url);
  const text = await res.text();
  return JSON.parse(text);
}

async function sheetsWrite(action, sheet, data) {
  // Gunakan 'text/plain' supaya tidak ter-mangle oleh URL-encoding
  // dan menghindari preflight OPTIONS yang lambat di GAS.
  const payload = { action, sheet, data };
  
  const res  = await fetch(SHEETS_API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain' },
    body: JSON.stringify(payload),
    redirect: 'follow',
  });
  const text = await res.text();
  return JSON.parse(text);
}

// ─── Upload photo to Google Drive via Apps Script ─────────────────────────────
async function uploadPhotoToDrive(base64DataUrl, date) {
  const base64 = base64DataUrl.split(',')[1];
  const mimeMatch = base64DataUrl.match(/data:(.+?);/);
  const mime = mimeMatch ? mimeMatch[1] : 'image/jpeg';

  console.log('[Drive] Starting upload, base64 length:', base64?.length ?? 0);

  // ── Gunakan text/plain JSON POST ──
  // Menghindari karakter '+' di base64 berubah jadi spasi di server.
  try {
    const payload = {
      action: 'upload_photo',
      photo:  base64,
      date:   date,
      mime:   mime
    };

    const res = await fetch(SHEETS_API_URL, {
      method:   'POST',
      headers:  { 'Content-Type': 'text/plain' },
      body:     JSON.stringify(payload),
      redirect: 'follow',
    });

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const text = await res.text();
    console.log('[Drive] Upload response:', text.slice(0, 300));
    
    try {
      const json = JSON.parse(text);
      if (json.photo_url) return json;
      if (json.error) return json;
      return { error: 'Unknown response format from server' };
    } catch (e) {
      return { error: 'Failed to parse server response: ' + text.slice(0, 50) };
    }
  } catch (e) {
    console.error('[Drive] Upload failed:', e);
    return { error: 'Connection failed: ' + e.message };
  }
}


// ─── Hook ─────────────────────────────────────────────────────────────────────
export function useSheetsAPI() {
  const useSheets = Boolean(SHEETS_API_URL);
  const [loading, setLoading] = useState(false);

  // ── TASKS ──────────────────────────────────────────────────────────────────
  const fetchTasks = useCallback(async () => {
    const cached = lsGet(LS_TASKS);

    if (useSheets) {
      try {
        setLoading(true);
        const remote = await sheetsRead('tasks');
        if (Array.isArray(remote) && remote.length > 0) {
          lsSet(LS_TASKS, remote);
          return remote;
        }
      } catch (e) {
        console.warn('[Sheets] fetchTasks failed, using localStorage:', e);
      } finally {
        setLoading(false);
      }
    }

    return cached;
  }, [useSheets]);

  const addTask = useCallback(async (title, date) => {
    const taskDate = date || todayIso();
    const task = { id: makeId(), title, status: 'pending', date: taskDate };
    const tasks = lsGet(LS_TASKS);
    lsSet(LS_TASKS, [task, ...tasks]);

    if (useSheets) {
      sheetsWrite('insert', 'tasks', task).catch(e =>
        console.warn('[Sheets] addTask failed:', e)
      );
    }

    return task;
  }, [useSheets]);

  const updateTask = useCallback(async (id, status) => {
    const tasks = lsGet(LS_TASKS).map(t => t.id === id ? { ...t, status } : t);
    lsSet(LS_TASKS, tasks);

    if (useSheets) {
      sheetsWrite('update', 'tasks', { id, status }).catch(e =>
        console.warn('[Sheets] updateTask failed:', e)
      );
    }
  }, [useSheets]);

  const deleteTask = useCallback(async (id) => {
    const tasks = lsGet(LS_TASKS).filter(t => t.id !== id);
    lsSet(LS_TASKS, tasks);

    if (useSheets) {
      sheetsWrite('delete', 'tasks', { id }).catch(e =>
        console.warn('[Sheets] deleteTask failed:', e)
      );
    }
  }, [useSheets]);

  // ── EXPENSES ───────────────────────────────────────────────────────────────
  const fetchExpenses = useCallback(async () => {
    const cached = lsGet(LS_EXPENSES);

    if (useSheets) {
      try {
        const remote = await sheetsRead('expenses');
        if (Array.isArray(remote) && remote.length > 0) {
          lsSet(LS_EXPENSES, remote);
          return remote;
        }
      } catch (e) {
        console.warn('[Sheets] fetchExpenses failed, using localStorage:', e);
      }
    }

    return cached;
  }, [useSheets]);

  const addExpense = useCallback(async (name, amount) => {
    const expense = { id: makeId(), name, amount: Number(amount), date: todayIso() };
    const expenses = lsGet(LS_EXPENSES);
    lsSet(LS_EXPENSES, [expense, ...expenses]);

    if (useSheets) {
      sheetsWrite('insert', 'expenses', expense).catch(e =>
        console.warn('[Sheets] addExpense failed:', e)
      );
    }

    return expense;
  }, [useSheets]);

  const deleteExpense = useCallback(async (id) => {
    const expenses = lsGet(LS_EXPENSES).filter(e => e.id !== id);
    lsSet(LS_EXPENSES, expenses);

    if (useSheets) {
      sheetsWrite('delete', 'expenses', { id }).catch(e =>
        console.warn('[Sheets] deleteExpense failed:', e)
      );
    }
  }, [useSheets]);

  // ── PAP (Daily Photo) ──────────────────────────────────────────────────────
  const addPapRecord = useCallback(async ({ date, status, timestamp, photoDataUrl }) => {
    const record = {
      id: makeId(),
      date,
      status,
      timestamp: timestamp || new Date().toISOString(),
      photo_url: '',
    };

    // Save to localStorage immediately
    const history = lsGet(LS_PAP);
    const exists  = history.find(p => p.date === date);
    if (!exists) lsSet(LS_PAP, [record, ...history]);

    // Upload photo to Google Drive if available
    if (useSheets && photoDataUrl) {
      try {
        const compressed = await compressImage(photoDataUrl, 600, 0.6);
        const uploadResult = await uploadPhotoToDrive(compressed, date);
        if (uploadResult.photo_url) {
          record.photo_url = uploadResult.photo_url;

          // Update localStorage with the Drive URL
          const updated = lsGet(LS_PAP).map(p =>
            p.date === date ? { ...p, photo_url: record.photo_url } : p
          );
          lsSet(LS_PAP, updated);
        }
      } catch (e) {
        console.warn('[Drive] Photo upload failed:', e);
      }
    }

    // Save record to Sheets (TUNGGU sampai selesai - AWAIT)
    if (useSheets) {
      try {
        await sheetsWrite('insert', 'pap', record);
        console.log('[Sheets] PAP record saved to cloud');
      } catch (e) {
        console.warn('[Sheets] addPapRecord failed:', e);
      }
    }

    // Kembalikan record dengan photo_url agar komponen bisa simpan Drive URL
    return record;
  }, [useSheets]);

  // ── Fetch today's PAP from Sheets (for cross-device sync) ─────────────────
  const fetchTodayPap = useCallback(async () => {
    if (!useSheets) return null;

    try {
      const remote = await sheetsRead('pap');
      if (!Array.isArray(remote)) return null;

      const today = todayIso();
      // Cari record terbaru (paling bawah di sheets) untuk hari ini yang PUNYA photo_url
      const todayPap = [...remote].reverse().find(p => 
        p.date === today && 
        p.status === 'done' && 
        p.photo_url && p.photo_url.length > 5
      );

      if (todayPap) {
        const history = lsGet(LS_PAP);
        const exists = history.find(p => p.date === today && p.photo_url);
        if (!exists) lsSet(LS_PAP, [todayPap, ...history.filter(h => h.date !== today)]);
        return todayPap;
      }
      return null;
    } catch (e) {
      console.warn('[Sheets] fetchTodayPap failed:', e);
      return null;
    }
  }, [useSheets]);

  // ── STREAK sync ───────────────────────────────────────────────────────────
  const saveStreakToSheets = useCallback(async ({ date, streak_count, pap_done }) => {
    if (!useSheets) return;
    await sheetsWrite('insert', 'streak', { date, streak_count, pap_done }).catch(e =>
      console.warn('[Sheets] saveStreak failed:', e)
    );
  }, [useSheets]);

  // ── GAME STATE (EXP, Streak) Sync ──────────────────────────────────────────
  const fetchGameState = useCallback(async () => {
    if (!useSheets) return null;
    try {
      const remote = await sheetsRead('gameState');
      if (Array.isArray(remote) && remote.length > 0) {
        // Cari yang paling baru di-update
        const latest = [...remote]
          .filter(r => r.updated_at && !isNaN(new Date(r.updated_at).getTime()))
          .sort((a, b) => new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime())[0];
        return latest || remote[remote.length - 1]; // Fallback to last row if sort fails
      }
    } catch (e) {
      console.warn('[Sheets] fetchGameState failed:', e);
    }
    return null;
  }, [useSheets]);

  const updateGameState = useCallback(async ({ exp, streak, last_active }) => {
    if (!useSheets) return;
    try {
      const data = { id: 'user_state', exp, streak, last_active, updated_at: new Date().toISOString() };
      // Kita pakai 'update' kalau ID 'user_state' sudah ada, tapi untuk simpel kita append terus saja
      // di sheet 'gameState' agar ada history-nya (fetchGameState ambil yang terbaru).
      await sheetsWrite('insert', 'gameState', data);
    } catch (e) {
      console.warn('[Sheets] updateGameState failed:', e);
    }
  }, [useSheets]);

  return {
    loading,
    fetchTasks,
    addTask,
    updateTask,
    deleteTask,
    fetchExpenses,
    addExpense,
    deleteExpense,
    addPapRecord,
    fetchTodayPap,
    saveStreakToSheets,
    fetchGameState,
    updateGameState,
  };
}
