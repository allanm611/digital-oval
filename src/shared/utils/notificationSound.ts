export type NotificationSoundType = "default" | "chime" | "ding" | "pop" | "tone";

const audioContext = typeof window !== "undefined" ? new (window.AudioContext || (window as any).webkitAudioContext)() : null;

const playTone = (frequency: number, duration: number, delay: number = 0) => {
  if (!audioContext) return;

  const now = audioContext.currentTime;
  const startTime = now + delay;
  const endTime = startTime + duration;

  const oscillator = audioContext.createOscillator();
  const gainNode = audioContext.createGain();

  oscillator.connect(gainNode);
  gainNode.connect(audioContext.destination);

  oscillator.frequency.value = frequency;
  oscillator.type = "sine";

  gainNode.gain.setValueAtTime(0.3, startTime);
  gainNode.gain.exponentialRampToValueAtTime(0.01, endTime);

  oscillator.start(startTime);
  oscillator.stop(endTime);
};

const soundPatterns: Record<NotificationSoundType, () => void> = {
  default: () => {
    // Double beep
    playTone(800, 0.1);
    playTone(1000, 0.1, 0.15);
  },
  chime: () => {
    // Musical chime (C-E-G)
    playTone(262, 0.15); // C
    playTone(330, 0.15, 0.15); // E
    playTone(392, 0.15, 0.3); // G
  },
  ding: () => {
    // Single bright ding
    playTone(1200, 0.2);
  },
  pop: () => {
    // Quick pop sound
    playTone(150, 0.05);
    playTone(100, 0.05, 0.05);
  },
  tone: () => {
    // Simple ascending tone
    playTone(440, 0.1);
    playTone(554, 0.1, 0.12);
  },
};

export const playNotificationSound = (soundType: NotificationSoundType = "default") => {
  try {
    if (!audioContext) return;

    // Resume audio context if suspended (required by some browsers)
    if (audioContext.state === "suspended") {
      audioContext.resume();
    }

    const pattern = soundPatterns[soundType];
    if (pattern) {
      pattern();
    }
  } catch (error) {
    console.warn("Failed to play notification sound:", error);
  }
};
