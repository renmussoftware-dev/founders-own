import { createAudioPlayer, setAudioModeAsync, type AudioPlayer } from 'expo-audio';
import * as Haptics from 'expo-haptics';

/**
 * Unified UI feedback — a synthesized sound (see scripts/gen-sfx.mjs) paired
 * with a haptic — for the app's satisfying moments. Muteable via setSoundOn().
 * Players are created once and rewound on each play so rapid taps don't stall.
 * Web has its own no-haptics implementation in feedback.web.ts.
 */

export type Cue = 'questComplete' | 'levelUp' | 'milestone' | 'tap';

const SOURCES: Record<Cue, number> = {
  questComplete: require('../../assets/audio/quest-complete.wav'),
  levelUp: require('../../assets/audio/level-up.wav'),
  milestone: require('../../assets/audio/milestone.wav'),
  tap: require('../../assets/audio/tap.wav'),
};

const HAPTIC: Record<Cue, () => void> = {
  questComplete: () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light),
  levelUp: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  milestone: () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success),
  tap: () => Haptics.selectionAsync(),
};

let soundOn = true;
let players: Partial<Record<Cue, AudioPlayer>> = {};
let ready = false;

export function setSoundOn(on: boolean) {
  soundOn = on;
}

/** Preload players so the first cue is instant (call once at launch). */
export function initFeedback() {
  if (ready) return;
  ready = true;
  // Play even when the ringer is on silent — feedback should still be felt/heard.
  setAudioModeAsync({ playsInSilentMode: true }).catch(() => {});
  (Object.keys(SOURCES) as Cue[]).forEach(cue => {
    try {
      players[cue] = createAudioPlayer(SOURCES[cue]);
    } catch {
      // A missing player just means that cue is silent — never block the UI.
    }
  });
}

export function feedback(cue: Cue) {
  // Haptics fire regardless of the sound toggle — the tactile layer is subtle
  // and users who mute audio still expect the app to feel responsive.
  try {
    HAPTIC[cue]();
  } catch {}
  if (!soundOn) return;
  const player = players[cue];
  if (!player) return;
  try {
    player.seekTo(0);
    player.play();
  } catch {}
}
