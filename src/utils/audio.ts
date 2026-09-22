// Web Audio API POS Barcode Scanner Beep Synthesizer

export const playBarcodeBeep = (type: 'success' | 'error' | 'alert' = 'success') => {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;

    const audioCtx = new AudioContextClass();
    if (audioCtx.state === 'suspended') {
      audioCtx.resume();
    }

    const osc = audioCtx.createOscillator();
    const gain = audioCtx.createGain();

    osc.connect(gain);
    gain.connect(audioCtx.destination);

    if (type === 'success') {
      // High-pitched crisp POS laser scanner beep (1850Hz, 100ms)
      osc.type = 'sine';
      osc.frequency.setValueAtTime(1850, audioCtx.currentTime);
      gain.gain.setValueAtTime(0.18, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.1);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.1);
    } else if (type === 'error') {
      // Low dual buzz for error / not found (280Hz -> 180Hz)
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, audioCtx.currentTime);
      osc.frequency.linearRampToValueAtTime(180, audioCtx.currentTime + 0.22);
      gain.gain.setValueAtTime(0.2, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.22);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.22);
    } else {
      // Alert double-chirp for variant prompt
      osc.type = 'triangle';
      osc.frequency.setValueAtTime(1200, audioCtx.currentTime);
      osc.frequency.setValueAtTime(1600, audioCtx.currentTime + 0.06);
      gain.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.15);

      osc.start(audioCtx.currentTime);
      osc.stop(audioCtx.currentTime + 0.15);
    }
  } catch (err) {
    // Audio might be silenced or blocked until user gesture, safely ignore
  }
};
