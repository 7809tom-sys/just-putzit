export const GAME_CELEBRATION_SOUND_KEY = "just-putzit-game-celebration-sound";

export const CELEBRATION_CONFETTI = [
  { left: "8%", color: "#f85a32", x: -44, delay: 0 },
  { left: "15%", color: "#0f9f9a", x: 32, delay: 60 },
  { left: "23%", color: "#f7b733", x: -18, delay: 20 },
  { left: "31%", color: "#e96eb3", x: 45, delay: 90 },
  { left: "40%", color: "#4d9de0", x: -30, delay: 35 },
  { left: "49%", color: "#f85a32", x: 20, delay: 110 },
  { left: "58%", color: "#0f9f9a", x: -40, delay: 50 },
  { left: "67%", color: "#f7b733", x: 38, delay: 15 },
  { left: "76%", color: "#e96eb3", x: -24, delay: 80 },
  { left: "86%", color: "#4d9de0", x: 28, delay: 40 },
  { left: "94%", color: "#f85a32", x: -14, delay: 100 },
] as const;

export const COMPLETION_CHIME_FREQUENCIES = [523.25, 659.25] as const;

export function isGameCompletionSoundEnabled() {
  if (typeof window === "undefined") return true;
  return window.localStorage.getItem(GAME_CELEBRATION_SOUND_KEY) !== "off";
}

export function setGameCompletionSoundEnabled(enabled: boolean) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(GAME_CELEBRATION_SOUND_KEY, enabled ? "on" : "off");
}

export function playGameCompletionChime() {
  if (typeof window === "undefined" || !isGameCompletionSoundEnabled()) return false;
  const legacyWindow = window as typeof window & { webkitAudioContext?: typeof AudioContext };
  const AudioContextConstructor = window.AudioContext ?? legacyWindow.webkitAudioContext;
  if (!AudioContextConstructor) return false;

  try {
    const context = new AudioContextConstructor();
    const now = context.currentTime;
    COMPLETION_CHIME_FREQUENCIES.forEach((frequency, index) => {
      const oscillator = context.createOscillator();
      const gain = context.createGain();
      const start = now + index * 0.09;
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency, start);
      gain.gain.setValueAtTime(0.0001, start);
      gain.gain.exponentialRampToValueAtTime(0.035, start + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + 0.18);
      oscillator.connect(gain).connect(context.destination);
      oscillator.start(start);
      oscillator.stop(start + 0.2);
    });
    window.setTimeout(() => void context.close(), 500);
    return true;
  } catch {
    return false;
  }
}
