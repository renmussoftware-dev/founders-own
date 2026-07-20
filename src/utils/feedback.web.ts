/**
 * Web feedback: HTMLAudio only (no haptics on the web dev preview). Mirrors the
 * native feedback API so callers are platform-agnostic. Assets resolve to URLs
 * on web via require().
 */

export type Cue = 'questComplete' | 'levelUp' | 'milestone' | 'tap';

const SOURCES: Record<Cue, string> = {
  questComplete: require('../../assets/audio/quest-complete.wav'),
  levelUp: require('../../assets/audio/level-up.wav'),
  milestone: require('../../assets/audio/milestone.wav'),
  tap: require('../../assets/audio/tap.wav'),
};

let soundOn = true;
const cache: Partial<Record<Cue, HTMLAudioElement>> = {};

export function setSoundOn(on: boolean) {
  soundOn = on;
}

export function initFeedback() {
  if (typeof Audio === 'undefined') return;
  (Object.keys(SOURCES) as Cue[]).forEach(cue => {
    const el = new Audio(SOURCES[cue]);
    el.preload = 'auto';
    cache[cue] = el;
  });
}

export function feedback(cue: Cue) {
  if (!soundOn || typeof Audio === 'undefined') return;
  try {
    const base = cache[cue];
    // Clone so overlapping cues don't cut each other off.
    const el = base ? (base.cloneNode() as HTMLAudioElement) : new Audio(SOURCES[cue]);
    void el.play().catch(() => {});
  } catch {}
}
