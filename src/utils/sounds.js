// Soft pop sound using Web Audio API — no external file needed
let audioCtx = null;

function getAudioContext() {
  if (!audioCtx) {
    audioCtx = new (window.AudioContext || window.webkitAudioContext)();
  }
  return audioCtx;
}

export function playPop() {
  try {
    const ctx = getAudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(600, ctx.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(300, ctx.currentTime + 0.12);

    gainNode.gain.setValueAtTime(0.18, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.18);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.2);
  } catch (e) {
    // Silent fail — user hasn't interacted yet
  }
}

export function playChime() {
  try {
    const ctx = getAudioContext();
    const notes = [523, 659, 784]; // C, E, G
    notes.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, ctx.currentTime + i * 0.1);
      gain.gain.setValueAtTime(0.12, ctx.currentTime + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + i * 0.1 + 0.3);
      osc.start(ctx.currentTime + i * 0.1);
      osc.stop(ctx.currentTime + i * 0.1 + 0.35);
    });
  } catch (e) {}
}

let _meow = null, _machii = null;

export function playMeow() {
  try {
    if (!_meow) { 
      _meow = new Audio(import.meta.env.BASE_URL + 'assets/meow.mp3'); 
      _meow.volume = 0.5; 
    }
    _meow.currentTime = 0;
    _meow.play().catch(e => console.warn("Meow blocked:", e));
  } catch(e) {}
}

export function playMachiiSuara() {
  try {
    if (!_machii) { 
      _machii = new Audio(import.meta.env.BASE_URL + 'assets/machii_suara.mp3'); 
      _machii.volume = 0.5; 
    }
    _machii.currentTime = 0;
    _machii.play().catch(e => console.warn("Machii suara blocked:", e));
  } catch(e) {}
}


export function playRandomEmoteSound() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    // Choose a random sound type: 0 = Pop, 1 = Bubble, 2 = Sparkle ping
    const type = Math.floor(Math.random() * 3);
    const now = ctx.currentTime;
    
    if (type === 0) {
      // Pop
      osc.type = 'sine';
      osc.frequency.setValueAtTime(800, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.1);
      gain.gain.setValueAtTime(0.2, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);
      osc.start(now);
      osc.stop(now + 0.15);
    } else if (type === 1) {
      // Bubble
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, now);
      osc.frequency.linearRampToValueAtTime(600, now + 0.05);
      gain.gain.setValueAtTime(0.15, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.15);
      osc.start(now);
      osc.stop(now + 0.2);
    } else {
      // Sparkle ping
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200 + Math.random() * 400, now);
      gain.gain.setValueAtTime(0.1, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
      osc.start(now);
      osc.stop(now + 0.3);
    }
  } catch(e) {
    // ignore
  }
}
