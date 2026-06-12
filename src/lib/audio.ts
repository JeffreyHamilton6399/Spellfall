// Web Audio API sound synthesis — no asset files needed.
// All sounds generated programmatically.

let ctx: AudioContext | null = null;
let masterGain: GainNode | null = null;
let _volume = 0.4;
let _muted = false;

function getCtx(): AudioContext | null {
  if (typeof window === "undefined") return null;
  if (!ctx) {
    ctx = new AudioContext();
    masterGain = ctx.createGain();
    masterGain.gain.value = _muted ? 0 : _volume;
    masterGain.connect(ctx.destination);
  }
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

type OscType = "sine" | "square" | "sawtooth" | "triangle";

function tone(
  freq: number,
  type: OscType,
  duration: number,
  volume: number,
  startDelay = 0,
  freqEnd?: number,
) {
  const c = getCtx();
  if (!c || !masterGain) return;

  const osc = c.createOscillator();
  const gain = c.createGain();
  osc.connect(gain);
  gain.connect(masterGain);

  osc.type = type;
  osc.frequency.setValueAtTime(freq, c.currentTime + startDelay);
  if (freqEnd !== undefined) {
    osc.frequency.linearRampToValueAtTime(freqEnd, c.currentTime + startDelay + duration);
  }

  const start = c.currentTime + startDelay;
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(volume, start + 0.01);
  gain.gain.exponentialRampToValueAtTime(0.0001, start + duration);

  osc.start(start);
  osc.stop(start + duration + 0.02);
}

// ─── Public API ───────────────────────────────────────────────────────

export function setVolume(v: number) {
  _volume = Math.max(0, Math.min(1, v));
  if (masterGain && !_muted) masterGain.gain.value = _volume;
}

export function setMuted(muted: boolean) {
  _muted = muted;
  if (masterGain) masterGain.gain.value = muted ? 0 : _volume;
}

export function getVolume() { return _volume; }
export function getMuted() { return _muted; }

// Initialize context on first user gesture (required by browser autoplay policy)
export function unlock() { getCtx(); }

// Tile key press — sharp click
export function playTilePress() {
  tone(900, "square", 0.04, 0.12);
}

// Word accepted — ascending arpeggio
export function playWordAccepted() {
  tone(523, "sine", 0.09, 0.18);
  tone(659, "sine", 0.09, 0.18, 0.06);
  tone(784, "sine", 0.14, 0.16, 0.12);
}

// Word rejected — low buzz
export function playWordRejected() {
  tone(140, "sawtooth", 0.14, 0.22);
  tone(110, "sawtooth", 0.1,  0.16, 0.06);
}

// Damage dealt to others
export function playDamageDealt() {
  tone(260, "square", 0.07, 0.28);
  tone(180, "sawtooth", 0.1, 0.18, 0.04);
}

// Damage taken by you
export function playDamageTaken() {
  tone(110, "sawtooth", 0.18, 0.34);
  tone(80,  "sine",     0.25, 0.22, 0.06);
}

// Ability fired
export function playAbilityFired() {
  tone(440, "sine", 0.05, 0.18);
  tone(660, "sine", 0.07, 0.20, 0.04);
  tone(880, "sine", 0.12, 0.16, 0.09);
}

// You eliminated someone
export function playElimination() {
  tone(440, "square", 0.06, 0.25);
  tone(554, "square", 0.06, 0.25, 0.07);
  tone(659, "square", 0.18, 0.22, 0.14);
}

// You were eliminated
export function playDefeat() {
  [392, 349, 311, 261].forEach((f, i) => tone(f, "sine", 0.35, 0.20, i * 0.18));
}

// Countdown tick (last few seconds)
export function playCountdownTick(isFinal = false) {
  if (isFinal) {
    tone(1318, "square", 0.08, 0.28);
  } else {
    tone(1046, "triangle", 0.04, 0.16);
  }
}

// Round start — subtle shuffle
export function playRoundStart() {
  [880, 1046, 1174, 1318].forEach((f, i) => tone(f, "triangle", 0.06, 0.10, i * 0.04));
}

// Victory
export function playVictory() {
  const notes = [523, 659, 784, 1046, 784, 1046, 1318];
  notes.forEach((f, i) => tone(f, "sine", 0.22, 0.20, i * 0.10));
}
