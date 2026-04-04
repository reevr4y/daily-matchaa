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

export function playMeow() {
  try {
    const ctx = getAudioContext();
    const osc = ctx.createOscillator();
    const filter = ctx.createBiquadFilter();
    const gain = ctx.createGain();

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    
    // Meow is best approximated by a sawtooth wave for vocal richness
    osc.type = 'sawtooth';

    // Pitch envelope: slides up slightly then down
    osc.frequency.setValueAtTime(600, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.15); // "me"
    osc.frequency.exponentialRampToValueAtTime(450, now + 0.45); // "ow"
    
    // Formant sweep (Vocal Tract filter)
    // This creates the "me -> ow" vowel transition sound
    filter.type = 'bandpass';
    filter.Q.value = 5.0; // Vocal resonance
    filter.frequency.setValueAtTime(1000, now); // Vowel 'e'
    filter.frequency.exponentialRampToValueAtTime(1600, now + 0.15); // Vowel 'a' peak
    filter.frequency.exponentialRampToValueAtTime(600, now + 0.5); // Vowel 'u/ow' decay

    // Volume envelope
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.08, now + 0.05); // Attack
    gain.gain.linearRampToValueAtTime(0.1, now + 0.15);  // Peak
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.55); // Release

    osc.start(now);
    osc.stop(now + 0.6);
  } catch (e) {}
}
