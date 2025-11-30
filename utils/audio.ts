
// Simple Web Audio API Synthesizer to avoid external assets

let audioCtx: AudioContext | null = null;

const getContext = (): AudioContext | null => {
  if (typeof window === 'undefined') return null;
  
  if (!audioCtx) {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (AudioContextClass) {
        audioCtx = new AudioContextClass();
    }
  }
  return audioCtx;
};

export const playSound = (type: 'pickup' | 'drop' | 'confirm' | 'win' | 'click' | 'remove') => {
  const ctx = getContext();
  if (!ctx) return;
  
  // Resume context if suspended (browser policy)
  if (ctx.state === 'suspended') {
    ctx.resume().catch(() => {});
  }

  const t = ctx.currentTime;
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.connect(gain);
  gain.connect(ctx.destination);

  switch (type) {
    case 'pickup':
      // High pitched short "pop"
      osc.type = 'sine';
      osc.frequency.setValueAtTime(400, t);
      osc.frequency.exponentialRampToValueAtTime(600, t + 0.1);
      
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      osc.start(t);
      osc.stop(t + 0.1);
      break;

    case 'drop':
      // Lower pitched "thud" or "clack"
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(200, t);
      osc.frequency.exponentialRampToValueAtTime(50, t + 0.1);
      
      gain.gain.setValueAtTime(0.2, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.1);
      
      osc.start(t);
      osc.stop(t + 0.1);
      break;

    case 'remove':
        // Soft "whoosh" out
        osc.type = 'sine';
        osc.frequency.setValueAtTime(300, t);
        osc.frequency.linearRampToValueAtTime(100, t + 0.1);
        
        gain.gain.setValueAtTime(0.1, t);
        gain.gain.linearRampToValueAtTime(0.01, t + 0.1);
        
        osc.start(t);
        osc.stop(t + 0.1);
        break;

    case 'click':
      // Very short high tick
      osc.type = 'square';
      osc.frequency.setValueAtTime(800, t);
      
      gain.gain.setValueAtTime(0.05, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.03);
      
      osc.start(t);
      osc.stop(t + 0.03);
      break;

    case 'confirm':
      // "Scanning" sound - rapid sequence
      osc.type = 'sine';
      // First beep
      osc.frequency.setValueAtTime(440, t);
      osc.frequency.setValueAtTime(554, t + 0.1); // C#
      osc.frequency.setValueAtTime(659, t + 0.2); // E
      
      gain.gain.setValueAtTime(0.1, t);
      gain.gain.setValueAtTime(0.1, t + 0.25);
      gain.gain.exponentialRampToValueAtTime(0.01, t + 0.4);
      
      osc.start(t);
      osc.stop(t + 0.4);
      break;

    case 'win':
      // Victory Chord (C Major Arpeggio)
      playNote(ctx, 523.25, t, 0.4, 'sine'); // C5
      playNote(ctx, 659.25, t + 0.1, 0.4, 'sine'); // E5
      playNote(ctx, 783.99, t + 0.2, 0.4, 'sine'); // G5
      playNote(ctx, 1046.50, t + 0.3, 0.8, 'triangle'); // C6
      break;
  }
};

const playNote = (ctx: AudioContext, freq: number, startTime: number, duration: number, type: OscillatorType = 'sine') => {
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = type;
  osc.frequency.value = freq;
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  gain.gain.setValueAtTime(0, startTime);
  gain.gain.linearRampToValueAtTime(0.2, startTime + 0.05);
  gain.gain.exponentialRampToValueAtTime(0.01, startTime + duration);
  
  osc.start(startTime);
  osc.stop(startTime + duration);
};
