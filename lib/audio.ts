'use client'

/**
 * Lightweight native Web Audio API utility for game sound effects
 * Requires zero external audio files.
 */

let audioCtx: AudioContext | null = null;
let unlocked = false;

// We must unlock the audio context on first user interaction
const initAudio = () => {
    if (typeof window === 'undefined') return;
    if (!audioCtx) {
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        if (AudioContextClass) {
            audioCtx = new AudioContextClass();
        }
    }

    // Resume context if suspended
    if (audioCtx && audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
}

// Ensure context is available
const playTone = (frequency: number, type: OscillatorType, duration: number, vol = 0.1) => {
    initAudio();
    if (!audioCtx) return;

    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, audioCtx.currentTime);

    // Fade out
    gainNode.gain.setValueAtTime(vol, audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + duration);
}

/**
 * Plays an alert sound for an incoming question (Hider)
 */
export const playQuestionSound = () => {
    if (typeof window === 'undefined') return;
    // A two-tone "Attention" beep
    playTone(523.25, 'sine', 0.15, 0.2); // C5
    setTimeout(() => playTone(659.25, 'sine', 0.3, 0.2), 150); // E5
}

/**
 * Plays an alert sound for an incoming answer (Seeker)
 */
export const playAnswerSound = () => {
    if (typeof window === 'undefined') return;
    // A quick high-pitched "Ping"
    playTone(880, 'sine', 0.1, 0.15); // A5
    setTimeout(() => playTone(1760, 'sine', 0.3, 0.1), 100); // A6
}

// User-interaction unlock helper for iOS/Safari
if (typeof window !== 'undefined') {
    const unlockAudio = () => {
        if (unlocked) return;
        initAudio();
        if (audioCtx && audioCtx.state === 'running') {
            unlocked = true;
            ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt =>
                window.removeEventListener(evt, unlockAudio, true)
            );
        }
    };
    ['touchstart', 'touchend', 'click', 'keydown'].forEach(evt =>
        window.addEventListener(evt, unlockAudio, { capture: true, passive: true })
    );
}
