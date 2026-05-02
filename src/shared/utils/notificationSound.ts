import sound1 from "../../assets/sounds/sound1.mp3";
import sound2 from "../../assets/sounds/sound2.mp3";
import sound3 from "../../assets/sounds/sound3.mp3";
import sound4 from "../../assets/sounds/sound4.mp3";
import sound5 from "../../assets/sounds/sound5.mp3";

export type NotificationSoundType = "default" | "chime" | "ding" | "pop" | "tone";

const soundMap: Record<NotificationSoundType, string> = {
  default: sound1,
  chime: sound2,
  ding: sound3,
  pop: sound4,
  tone: sound5,
};

export const playNotificationSound = (soundType: NotificationSoundType = "default") => {
  try {
    const audioUrl = soundMap[soundType];
    if (audioUrl) {
      const audio = new Audio(audioUrl);
      audio.play().catch(err => console.warn("Failed to play notification sound:", err));
    }
  } catch (error) {
    console.warn("Failed to play notification sound:", error);
  }
};
