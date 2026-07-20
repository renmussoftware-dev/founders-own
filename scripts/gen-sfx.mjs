/**
 * Synthesizes the app's UI sound effects as WAV files — no external/downloaded
 * assets, just generated tones in an arcane "chime" palette that matches the
 * fantasy-RPG theme. Re-run to regenerate after tweaking:  node scripts/gen-sfx.mjs
 *
 * Output: assets/audio/*.wav  (mono, 44.1kHz, 16-bit PCM)
 */
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SR = 44100;
const OUT = join(dirname(fileURLToPath(import.meta.url)), '..', 'assets', 'audio');

// Equal-temperament note frequencies we use.
const N = {
  C5: 523.25, E5: 659.25, G5: 783.99, A5: 880.0,
  C6: 1046.5, D6: 1174.66, E6: 1318.51, G6: 1567.98, C7: 2093.0,
};

/** A struck-tone voice: fundamental + soft harmonics, exponential decay. */
function tone(buf, startSec, freq, durSec, gain, { shimmer = false, decay = 6 } = {}) {
  const start = Math.floor(startSec * SR);
  const len = Math.floor(durSec * SR);
  const attack = Math.floor(0.004 * SR); // 4ms fade-in to kill clicks
  for (let i = 0; i < len; i++) {
    const t = i / SR;
    const env = Math.exp(-decay * t) * Math.min(1, i / attack);
    let s =
      Math.sin(2 * Math.PI * freq * t) +
      0.3 * Math.sin(2 * Math.PI * freq * 2 * t) +
      0.12 * Math.sin(2 * Math.PI * freq * 3 * t);
    if (shimmer) s += 0.18 * Math.sin(2 * Math.PI * freq * 2.01 * t); // detuned octave = magical sparkle
    const idx = start + i;
    if (idx < buf.length) buf[idx] += s * gain * env;
  }
}

function render(durSec, build) {
  const buf = new Float32Array(Math.ceil(durSec * SR));
  build(buf);
  // Normalize to -1.5 dBFS headroom.
  let peak = 0;
  for (const v of buf) peak = Math.max(peak, Math.abs(v));
  const norm = peak > 0 ? 0.84 / peak : 1;
  const pcm = Buffer.alloc(buf.length * 2);
  for (let i = 0; i < buf.length; i++) {
    const s = Math.max(-1, Math.min(1, buf[i] * norm));
    pcm.writeInt16LE((s * 32767) | 0, i * 2);
  }
  return pcm;
}

function wav(pcm) {
  const header = Buffer.alloc(44);
  header.write('RIFF', 0);
  header.writeUInt32LE(36 + pcm.length, 4);
  header.write('WAVE', 8);
  header.write('fmt ', 12);
  header.writeUInt32LE(16, 16);
  header.writeUInt16LE(1, 20); // PCM
  header.writeUInt16LE(1, 22); // mono
  header.writeUInt32LE(SR, 24);
  header.writeUInt32LE(SR * 2, 28);
  header.writeUInt16LE(2, 32);
  header.writeUInt16LE(16, 34);
  header.write('data', 36);
  header.writeUInt32LE(pcm.length, 40);
  return Buffer.concat([header, pcm]);
}

const sfx = {
  // Soft two-note pluck — a small, satisfying "done".
  'quest-complete': render(0.42, b => {
    tone(b, 0.0, N.C6, 0.34, 0.7);
    tone(b, 0.07, N.E6, 0.36, 0.7);
  }),
  // Bright rising arpeggio — you leveled a stat.
  'level-up': render(0.72, b => {
    tone(b, 0.0, N.C6, 0.4, 0.6, { shimmer: true });
    tone(b, 0.08, N.E6, 0.42, 0.6, { shimmer: true });
    tone(b, 0.16, N.G6, 0.5, 0.65, { shimmer: true });
  }),
  // Triumphant chord roll + sparkle — a verified milestone.
  milestone: render(1.5, b => {
    tone(b, 0.0, N.C5, 1.2, 0.5, { decay: 3 });
    tone(b, 0.09, N.E5, 1.15, 0.5, { decay: 3 });
    tone(b, 0.18, N.G5, 1.1, 0.5, { decay: 3 });
    tone(b, 0.27, N.C6, 1.1, 0.55, { shimmer: true, decay: 3 });
    tone(b, 0.5, N.E6, 0.8, 0.4, { shimmer: true, decay: 4 });
    tone(b, 0.62, N.G6, 0.7, 0.4, { shimmer: true, decay: 4 });
    tone(b, 0.74, N.C7, 0.7, 0.35, { shimmer: true, decay: 5 });
  }),
  // Tiny high tick — subtle press feedback on primary buttons.
  tap: render(0.09, b => {
    tone(b, 0.0, N.G6, 0.07, 0.5, { decay: 40 });
  }),
};

mkdirSync(OUT, { recursive: true });
for (const [name, pcm] of Object.entries(sfx)) {
  const file = join(OUT, `${name}.wav`);
  writeFileSync(file, wav(pcm));
  console.log(`wrote ${file} (${(wav(pcm).length / 1024).toFixed(1)} KB)`);
}
