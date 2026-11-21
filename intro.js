/* ilans.net intro: a pen draws a line, light pours out of it and finds the words,
   then the pen flies home to the squiggle in the hero.
   Shown once per session. Skipped for reduced motion, ?nointro, automation; forced with ?intro=1.
   The decision is made early by the inline script in <head> (class "intro-pending" on <html>).
   Source prototype: ~/light-beam/intro.html */
if (document.documentElement.classList.contains('intro-pending')) (() => {
'use strict';
const LINES = {
  a: 'Good design is ~invisible~.',          // ~word~ = only visible while a light swell passes over it
  b: 'Until the *light* finds it.',          // *word* = italic, brand colour
  name: 'ILAN LENZNER',
  role: 'Creative Technologist  ·  Design Engineer',
};

// Site palette: brand violet, an icy core, the clinical cyan.
const VIOLET = [138, 123, 255], CYAN = [34, 211, 238], IVORY = [237, 237, 234];
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
// Colour stops across the fan, per scene: a = first line, b = second line, c = the name
const SCENES = {
  a: [[0, hex('#8a7bff')], [.2, hex('#bdb3ff')], [.5, hex('#fff4e4')], [.8, hex('#b5eef7')], [1, hex('#22d3ee')]],
  b: [[0, hex('#22d3ee')], [.25, hex('#a6ecf7')], [.5, hex('#eef8ff')], [.75, hex('#b4f5e4')], [1, hex('#5eead4')]],
  c: [[0, hex('#8a7bff')], [.28, hex('#c4b9ff')], [.5, hex('#f6f3ff')], [.72, hex('#c4b9ff')], [1, hex('#8a7bff')]],
};
let STOPS = SCENES.a, sceneKey = '', CORE = IVORY, EDGE_A = VIOLET, EDGE_B = CYAN;
const PALETTE = [];                     // 8 steps across the fan, rebuilt when the scene changes
function useScene(key) {
  if (key === sceneKey) return;
  sceneKey = key;
  STOPS = SCENES[key];
  EDGE_A = STOPS[0][1]; EDGE_B = STOPS[STOPS.length - 1][1];
  CORE = colorAtArr(0.5);
  PALETTE.length = 0;
  for (let i = 0; i < 8; i++) PALETTE.push(colorAtArr(i / 7).map(Math.round));
}
function colorAtArr(x) {
  x = Math.max(0, Math.min(1, x));
  for (let i = 1; i < STOPS.length; i++) {
    const [p1, c1] = STOPS[i], [p0, c0] = STOPS[i - 1];
    if (x <= p1) { const k = (x - p0) / (p1 - p0 || 1); return [0, 1, 2].map(j => c0[j] + (c1[j] - c0[j]) * k); }
  }
  return STOPS[STOPS.length - 1][1].slice();
}

// ---- overlay ----
const css = document.createElement('style');
css.textContent = `
#intro { position: fixed; left: 0; top: 0; width: 100vw; height: 100vh; max-width: 100%; overflow: hidden; z-index: 100001; background: #000; transition: opacity .9s ease; }
#intro.gone { opacity: 0; pointer-events: none; }
#intro canvas { position: absolute; left: 0; top: 0; display: block; }
#intro .intro-meta { position: absolute; left: 0; width: min(100%, 100vw); bottom: 22px; box-sizing: border-box; display: flex; justify-content: space-between;
  align-items: center; padding: 0 24px; font: 11px/1 'JetBrains Mono', ui-monospace, monospace; letter-spacing: .14em;
  text-transform: uppercase; color: rgba(237,237,234,.28); }
#intro .intro-skip { font: inherit; letter-spacing: inherit; text-transform: inherit; color: rgba(237,237,234,.55);
  background: none; border: 1px solid rgba(237,237,234,.16); border-radius: 999px; padding: 9px 15px; cursor: pointer;
  transition: color .2s, border-color .2s; }
#intro .intro-skip:hover, #intro .intro-skip:focus-visible { color: #ededea; border-color: rgba(138,123,255,.75); outline: none; }
#intro .intro-sr { position: absolute; width: 1px; height: 1px; overflow: hidden; clip: rect(0 0 0 0); white-space: nowrap; }`;
document.head.appendChild(css);
const intro = document.createElement('div');
intro.id = 'intro';
intro.setAttribute('role', 'region');
intro.setAttribute('aria-label', 'Intro');
intro.innerHTML = '<canvas id="introCanvas" aria-hidden="true"></canvas>' +
  '<p class="intro-sr">Good design is invisible. Until the light finds it. Ilan Lenzner, Creative Technologist and Design Engineer.</p>' +
  '<div class="intro-meta"><span>Ilan Lenzner</span><button class="intro-skip" type="button">Skip intro</button></div>';
document.body.appendChild(intro);
window.__introStarted = true;
document.documentElement.classList.remove('intro-pending');
const c = document.getElementById('introCanvas'), ctx = c.getContext('2d');
const haze = document.createElement('canvas'), hctx = haze.getContext('2d');
const mask = document.createElement('canvas'), mctx = mask.getContext('2d');
const sh = document.createElement('canvas'), sctx = sh.getContext('2d', { willReadFrequently: true });
const txt = document.createElement('canvas'), tctx = txt.getContext('2d');
const nameCv = document.createElement('canvas'), nctx = nameCv.getContext('2d', { willReadFrequently: true });

let W = 0, H = 0, DPR = 1, MOBILE = false, spacing = 9, cols = 0, rows = 0, P = [];
let HS = 4;                           // haze / mask render at 1/4 size; upscaling is the blur

// the visible screen, not innerWidth: a page that overflows sideways on mobile inflates innerWidth
const viewW = () => document.documentElement.clientWidth || innerWidth;
const viewH = () => document.documentElement.clientHeight || innerHeight;
function layout() {
  W = viewW(); H = viewH(); if (!W || !H) return false;
  c.style.width = W + 'px'; c.style.height = H + 'px';
  DPR = Math.min(devicePixelRatio || 1, 1.5);
  MOBILE = W < 700;
  c.width = W * DPR; c.height = H * DPR; ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  txt.width = W * DPR; txt.height = H * DPR; tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  HS = W > 1400 ? 5 : 4; hazeImg = null;
  for (const k of [haze, mask, sh]) { k.width = Math.ceil(W / HS); k.height = Math.ceil(H / HS); }
  // Same grid rule as the site's dotfield, so the hand-off lines up
  spacing = Math.max(MOBILE ? 11 : 9, Math.sqrt(W * H / 18000));
  cols = Math.ceil(W / spacing) + 2; rows = Math.ceil(H / spacing) + 2;
  P = [];
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    const x = q * spacing, y = r * spacing;
    P.push({ hx: x, hy: y, x, y, vx: 0, vy: 0, plus: (r + q) % 2 === 1, k3: (r + q) % 3 === 0, name: 0, lit: 0, ph: Math.random() * 6.283 });
  }
  sampleName();
  return true;
}

// Name as a dot-matrix, sampled onto the grid (one pixel per dot, like the site banner)
function sampleName() {
  nameCv.width = cols; nameCv.height = rows;
  nctx.clearRect(0, 0, cols, rows);
  nctx.fillStyle = '#fff'; nctx.textAlign = 'center'; nctx.textBaseline = 'middle';
  const per = str => { nctx.font = '700 100px Inter, sans-serif'; return nctx.measureText(str).width / 100; };
  // one line if it fits, otherwise first and last name on two lines (narrow phones)
  let lines = [LINES.name], fs = Math.min(rows * 0.2, cols * 0.9 / per(LINES.name));
  if (fs < 9 && LINES.name.includes(' ')) {
    lines = LINES.name.split(' ');
    fs = Math.min(rows * 0.12, cols * 0.9 / Math.max(...lines.map(per)));
  }
  fs = Math.max(6, Math.floor(fs));
  const lh = fs * 1.05, top = rows * 0.5 - (lines.length - 1) * lh / 2;
  nctx.font = `700 ${fs}px Inter, sans-serif`;
  lines.forEach((ln, k) => nctx.fillText(ln, cols / 2, top + k * lh));
  const d = nctx.getImageData(0, 0, cols, rows).data;
  for (let r = 0; r < rows; r++) for (let q = 0; q < cols; q++) {
    P[r * cols + q].name = d[(r * cols + q) * 4 + 3] / 255;
  }
  nameRow = top + (lines.length - 1) * lh; nameFs = fs;    // the role line sits under the last line
}
let nameRow = 0, nameFs = 0;

// ---------------- timeline ----------------
const ease = t => t <= 0 ? 0 : t >= 1 ? 1 : (t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const clamp01 = t => Math.max(0, Math.min(1, t));
const seg = (t, a, b) => clamp01((t - a) / (b - a));
const lerp = (a, b, k) => a + (b - a) * k;
const smooth = (e0, e1, x) => { const t = clamp01((x - e0) / (e1 - e0)); return t * t * (3 - 2 * t); };

function spots() {
  if (MOBILE) return {
    A: { x: W * 0.5, y: H * 0.08, a: Math.PI / 2 },
    B: { x: W * 0.5, y: H * 0.92, a: -Math.PI / 2 },
    C: { x: W * 0.5, y: H * 0.97, a: -Math.PI / 2 },
  };
  return {
    A: { x: W * 0.2, y: H * 0.47, a: 0 },
    B: { x: W * 0.8, y: H * 0.5, a: Math.PI },
    C: { x: W * 0.5, y: H * 0.96, a: -Math.PI / 2 },
  };
}
// Each line stays lit about 3 s: enough to read it, and to catch the hidden word.
const T = { appear: 0.9, aOpen: 1.6, aClose: 5.0, bArrive: 5.6, bOpen: 6.3, bClose: 9.3, cArrive: 9.9, cOpen: 10.7,
            nameOn: 11.0, flyStart: 12.8, flood: 13.6, flyEnd: 15.3, fade: 15.45, end: 16.4 };

// Beam state for time t
function beamAt(t) {
  const S = spots(), R = Math.max(W, H);
  const travel = (p, q, k) => {
    // arc through the upper middle so the slit glides, not teleports
    const e = ease(k), mx = (p.x + q.x) / 2, my = Math.min(p.y, q.y) - H * 0.12;
    const x = (1 - e) * (1 - e) * p.x + 2 * (1 - e) * e * mx + e * e * q.x;
    const y = (1 - e) * (1 - e) * p.y + 2 * (1 - e) * e * my + e * e * q.y;
    let da = q.a - p.a; if (da > Math.PI) da -= 2 * Math.PI; if (da < -Math.PI) da += 2 * Math.PI;
    return { x, y, a: p.a + da * e };
  };
  let pos, open = 0, power = 0, spread = 0.6, reach = R * 0.7, slit = 1, text = null;
  if (t < T.aClose) {
    pos = S.A; slit = ease(seg(t, 0.15, T.appear));
    open = ease(seg(t, T.appear, T.aOpen)) * (1 - ease(seg(t, T.aClose - 0.4, T.aClose)));
    text = 'a';
  } else if (t < T.bArrive) {
    pos = travel(S.A, S.B, seg(t, T.aClose, T.bArrive));
  } else if (t < T.bClose) {
    pos = S.B; open = ease(seg(t, T.bArrive + 0.1, T.bOpen)) * (1 - ease(seg(t, T.bClose - 0.4, T.bClose)));
    text = 'b';
  } else if (t < T.cArrive) {
    pos = travel(S.B, S.C, seg(t, T.bClose, T.cArrive));
  } else {
    pos = S.C; open = ease(seg(t, T.cArrive + 0.1, T.cOpen)); text = 'c';
    reach = R * 0.95; spread = MOBILE ? 0.5 : 0.78;
    const f = ease(seg(t, T.flood, T.fade + 0.4));      // final flood: the fan swallows the screen
    spread = lerp(spread, 1.55, f); reach = lerp(reach, R * 2.2, f);
  }
  power = open * open;
  // when the pen flies home to the hero, it takes its light with it
  if (penHome) power *= 1 - ease(seg(t, T.flyStart - 0.1, T.flyStart + 0.5));
  // a slow breathe while held
  const a = pos.a + Math.sin(t * 1.7) * 0.035 * open;
  return { x: pos.x, y: pos.y, a, open, power, spread, reach, slit, text };
}

// ---------------- rendering ----------------
let mouseX = -9999, mouseY = -9999;
addEventListener('pointermove', e => { mouseX = e.clientX; mouseY = e.clientY; }, { passive: true });

const buckets = Array.from({ length: 8 * 16 }, () => []);

function fanGeometry(b) {
  const L = Math.min(W, H) * (MOBILE ? 0.09 : 0.07);   // slit half-length
  const dx = Math.cos(b.a), dy = Math.sin(b.a), px = -dy, py = dx;
  const sp = Math.max(0.02, b.spread * (0.04 + 0.96 * b.open));
  const apex = Math.min(L / Math.tan(sp), 4000);       // virtual apex behind the slit
  const bulge = L * 0.7 * b.open;
  return { L, dx, dy, px, py, sp, apex, bulge,
    e1: [b.x + px * L, b.y + py * L], e2: [b.x - px * L, b.y - py * L], v: [b.x - dx * bulge, b.y - dy * bulge],
    ax: b.x - dx * apex, ay: b.y - dy * apex };
}

// ---------------- one light field ----------------
// Haze, text mask, dots and letters all read the same function, so they move as one.
const PULSE_K = 0.032, PULSE_W = 4.2;          // light pulses running outward from the slit
const SWELL_K = 0.004, SWELL_W = 1.6;          // one wide swell per scene; its crest crosses the text mid-hold
let swellMid = 0, swellOff = 0;
const swellAt = (d, t) => Math.sin((d - swellOff) * SWELL_K - (t - swellMid) * SWELL_W + Math.PI / 2);
const L_ = { I: 0, m: 0, tc: 0.5, d: 0 };
// Offset of the pen stroke along the beam at slit position s (-1..1). The light starts exactly here.
function penOffset(s, t, g) {
  // a calm wave: shallow, a single soft S, slow drift, barely bows back
  const wave = Math.sin(s * Math.PI * 0.9 + t * 1.1) * g.L * 0.085 * (1 - 0.35 * s * s);
  return wave - g.bulge * 0.22 * (1 - s * s);
}
function light(b, g, x, y, t) {
  L_.I = 0; L_.m = 0; L_.tc = 0.5; L_.d = 0;
  if (b.power <= 0.002) return L_;
  const rx = x - g.ax, ry = y - g.ay;
  const along = rx * g.dx + ry * g.dy, across = -rx * g.dy + ry * g.dx;
  // the light is born on the pen line, not on a straight edge
  const alongS = along - g.apex, sN = across / g.L;
  let gate = 1, emit = 0;
  if (Math.abs(sN) <= 1.2) {
    const off = penOffset(Math.max(-1, Math.min(1, sN)), t, g), past = alongS - off;
    if (past < -1.5) return L_;
    gate = smooth(-1.5, 7, past) * (1 - smooth(1, 1.2, Math.abs(sN)) * 0.0);
    emit = Math.exp(-past / (g.L * 0.45)) * (1 - smooth(0.85, 1.2, Math.abs(sN)));   // hottest right at the stroke
  } else if (alongS < 0) return L_;
  const ang = Math.atan2(across, along), aa = Math.abs(ang);
  if (aa >= g.sp) return L_;
  const dpx = Math.hypot(x - b.x, y - b.y), dist = dpx / b.reach;
  if (dist >= 1) return L_;
  const u = ang / g.sp, fall = 1 - dist;
  const edge = smooth(g.sp, g.sp * 0.72, aa);
  // slow god-rays drifting across the fan
  const rays = 0.68 + 0.32 * (0.55 * Math.sin(u * 9.5 + t * 0.8) + 0.45 * Math.sin(u * 17 - t * 1.25 + 2.1));
  const pulse = 1 + 0.17 * Math.sin(dpx * PULSE_K - t * PULSE_W) + 0.3 * Math.pow(Math.max(0, swellAt(dpx, t)), 4);
  const base = b.power * edge * rays * pulse * gate;
  L_.I = base * (fall * fall * 0.85 + Math.max(0, 1 - dist * 4) * 0.35 + emit * 0.55);
  L_.m = base * Math.pow(fall, 0.7);
  L_.tc = u * 0.5 + 0.5; L_.d = dpx;
  return L_;
}
const C_ = [0, 0, 0];
function colorAt(tc) {
  const c3 = colorAtArr(tc); C_[0] = c3[0]; C_[1] = c3[1]; C_[2] = c3[2];
}

let hazeImg = null, maskImg = null, shadowA = null;
function shadowAt(x, y) {
  if (!shadowA) return 1;
  const xi = (x / HS) | 0, yi = (y / HS) | 0;
  if (xi < 0 || yi < 0 || xi >= sh.width || yi >= sh.height) return 1;
  return 1 - Math.min(1, shadowA[(yi * sh.width + xi) * 4 + 3] / 255) * 0.78;
}

// Letters are objects in the beam: project them away from the slit to get their shadows.
function renderField(b, g, t, letters) {
  const w = haze.width, h = haze.height;
  if (!hazeImg) { hazeImg = hctx.createImageData(w, h); maskImg = mctx.createImageData(w, h); }
  shadowA = null;
  if (letters && b.power > 0.01) {
    sctx.setTransform(1, 0, 0, 1, 0, 0); sctx.clearRect(0, 0, w, h);
    sctx.textBaseline = 'middle'; sctx.textAlign = 'left';
    sctx.fillStyle = 'rgba(0,0,0,0.17)';
    for (let s = 1; s <= 12; s++) {
      const k = 1.03 + s * 0.042;
      sctx.setTransform(k / HS, 0, 0, k / HS, b.x / HS * (1 - k), b.y / HS * (1 - k));
      for (const L of letters) { sctx.font = L.font; sctx.fillText(L.ch, L.x + L.ox, L.y + L.oy); }
    }
    shadowA = sctx.getImageData(0, 0, w, h).data;
  }
  const hd = hazeImg.data, md = maskImg.data;
  for (let y = 0, i = 0; y < h; y++) for (let x = 0; x < w; x++, i += 4) {
    const f = light(b, g, (x + .5) * HS, (y + .5) * HS, t);
    let I = f.I, m = f.m;
    if (I <= 0.001 && m <= 0.001) { hd[i + 3] = 0; md[i + 3] = 0; continue; }
    if (shadowA) { const s = 1 - Math.min(1, shadowA[i + 3] / 255) * 0.78; I *= s; m *= s; }
    colorAt(f.tc);
    hd[i] = C_[0]; hd[i + 1] = C_[1]; hd[i + 2] = C_[2]; hd[i + 3] = Math.min(255, I * 200);
    md[i] = md[i + 1] = md[i + 2] = 255; md[i + 3] = Math.min(255, (0.35 * m + 0.9 * I) * 330);
  }
  hctx.putImageData(hazeImg, 0, 0); mctx.putImageData(maskImg, 0, 0);
}

function parseRich(s) {
  return s.split(/(\*[^*]+\*|~[^~]+~)/).filter(Boolean).map(p =>
    p[0] === '*' ? { t: p.slice(1, -1), i: true } : p[0] === '~' ? { t: p.slice(1, -1), i: true, h: true } : { t: p, i: false });
}

const AMP = () => MOBILE ? 2.4 : 3.6;
// Lay the line out letter by letter, and let each letter ride the light the dots ride.
function layoutLetters(b, g, t) {
  if (b.text !== 'a' && b.text !== 'b') return null;
  const parts = parseRich(LINES[b.text]);
  let fs = Math.min(W, H) * (MOBILE ? 0.11 : 0.105);
  const font = i => `${i ? 'italic ' : ''}400 ${fs}px 'Instrument Serif', serif`;
  const measure = () => parts.reduce((w, p) => (tctx.font = font(p.i), w + tctx.measureText(p.t).width), 0);
  let w = measure(); const maxW = MOBILE ? W * 0.86 : W * 0.5;
  if (w > maxW) { fs *= maxW / w; w = measure(); }
  const off = MOBILE ? H * 0.36 : W * 0.31;
  swellOff = off; swellMid = (b.text === 'a' ? (T.aOpen + T.aClose) / 2 : (T.bOpen + T.bClose) / 2) - 0.2;
  const cx = b.x + g.dx * off, cy = b.y + g.dy * off;
  const out = []; let x0 = cx - w / 2, n = 0;
  for (const p of parts) {
    const f = font(p.i); tctx.font = f;
    for (let j = 0; j < p.t.length; j++) {
      const pre = tctx.measureText(p.t.slice(0, j)).width, cw = tctx.measureText(p.t[j]).width;
      const L = { ch: p.t[j], x: x0 + pre, y: cy, w: cw, font: f, it: p.i, hid: !!p.h, n: n++ };
      const fl = light(b, g, L.x + cw / 2, cy, t), m = Math.min(1, fl.m);
      const wave = Math.sin(fl.d * PULSE_K - t * PULSE_W);           // same pulse as the dots
      const sway = Math.sin(t * 2.2 + L.n * 0.85);
      L.ox = g.dx * wave * m * AMP() * 0.9 + g.px * sway * m * 1.1;
      L.oy = g.dy * wave * m * AMP() * 0.9 + g.py * sway * m * 1.1;
      L.rot = wave * m * 0.018;
      L.m = m; L.I = fl.I; L.wave = wave; L.swell = swellAt(fl.d, t);
      out.push(L);
    }
    tctx.font = f; x0 += tctx.measureText(p.t).width;
  }
  return out;
}

function drawLetters(b, g, t, letters) {
  tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tctx.clearRect(0, 0, W, H);
  if (!letters) return;
  tctx.textBaseline = 'middle'; tctx.textAlign = 'left';
  // lit pass: a chromatic split that widens with the light on each letter
  tctx.globalCompositeOperation = 'lighter';
  for (const L of letters) {
    const ab = 0.5 + L.m * 2.4;
    tctx.save();
    tctx.translate(L.x + L.ox + L.w / 2, L.y + L.oy); tctx.rotate(L.rot); tctx.translate(-L.w / 2, 0);
    tctx.font = L.font;
    // a hidden word only catches the crest of a light pulse, then sinks back
    const vis = L.hid ? 0.04 + 0.96 * smooth(0.45, 0.92, L.swell) : 1;
    tctx.globalAlpha = vis;
    tctx.fillStyle = `rgba(${EDGE_A},0.85)`; tctx.fillText(L.ch, -g.dx * ab - g.px * ab * 0.4, -g.dy * ab - g.py * ab * 0.4);
    tctx.fillStyle = `rgba(${EDGE_B},0.7)`;  tctx.fillText(L.ch,  g.dx * ab + g.px * ab * 0.4,  g.dy * ab + g.py * ab * 0.4);
    tctx.fillStyle = L.it ? `rgba(${colorAtArr(0.3).map(Math.round)},0.95)` : `rgba(${CORE.map(Math.round)},0.9)`; tctx.fillText(L.ch, 0, 0);
    tctx.restore();
  }
  tctx.globalCompositeOperation = 'source-over';
  finishTextLayer(0.5);
}

function drawRole(b, t) {
  tctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  tctx.clearRect(0, 0, W, H);
  const k = ease(seg(t, T.nameOn + 0.6, T.nameOn + 1.6));
  if (b.text !== 'c' || k <= 0) return;
  const fs = Math.max(10, Math.min(W, H) * (MOBILE ? 0.026 : 0.017));
  tctx.font = `500 ${fs}px 'JetBrains Mono', monospace`;
  tctx.textAlign = 'center'; tctx.textBaseline = 'middle'; tctx.fillStyle = `rgba(237,237,234,${k})`;
  if ('letterSpacing' in tctx) tctx.letterSpacing = `${fs * 0.22}px`;
  const y = nameRow * spacing + nameFs * spacing * 0.62;
  const f = light(b, beamGeo, W / 2, y, t);
  tctx.fillText(LINES.role.toUpperCase(), W / 2, y + Math.sin(f.d * PULSE_K - t * PULSE_W) * Math.min(1, f.m) * 1.5);
  if ('letterSpacing' in tctx) tctx.letterSpacing = '0px';
  tctx.textAlign = 'start';
  finishTextLayer(0.35);
}

// Only where the beam lands, and in the colour of the light that lands there.
function finishTextLayer(tint) {
  tctx.save(); tctx.setTransform(1, 0, 0, 1, 0, 0);
  tctx.imageSmoothingQuality = 'high';
  tctx.globalCompositeOperation = 'destination-in';
  tctx.drawImage(mask, 0, 0, txt.width, txt.height);
  tctx.globalCompositeOperation = 'source-atop'; tctx.globalAlpha = tint;
  tctx.drawImage(haze, 0, 0, txt.width, txt.height);
  tctx.restore();
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.drawImage(txt, 0, 0, W, H); ctx.restore();
}
let beamGeo = null;

function drawDots(b, g, t, dtk) {
  for (const arr of buckets) arr.length = 0;
  const nameK = b.text === 'c' ? 1 : 0;
  const flood = ease(seg(t, T.flood, T.fade + 0.3));
  const radius = 150 + Math.sin(t * 4) * 30, r2 = radius * radius;
  const ca = Math.cos(b.a), sa = Math.sin(b.a), tanSp = Math.tan(g.sp);
  const live = b.power > 0.002;

  for (let i = 0; i < P.length; i++) {
    const p = P[i];
    // cursor pushes dots, exactly like the site
    const mx = p.x - mouseX, my = p.y - mouseY, d2 = mx * mx + my * my;
    if (d2 < r2 && d2 > 0) { const d = Math.sqrt(d2), s = (1 - d / radius) * 5; p.vx += mx / d * s; p.vy += my / d * s; }
    let ox = 0, oy = 0;
    let I = 0, tc = 0.5;
    if (live) {
      const f = light(b, g, p.hx, p.hy, t);
      if (f.m > 0) {
        I = f.I * shadowAt(p.hx, p.hy); tc = f.tc;
        // light pressure: dots surf the outgoing pulses and shiver across the beam
        const m = Math.min(1, f.m), push = Math.sin(f.d * PULSE_K - t * PULSE_W) * m * AMP();
        const jit = Math.sin(t * 3.1 + p.ph) * m * AMP() * 0.35;
        ox = g.dx * push + g.px * jit; oy = g.dy * push + g.py * jit;
        I *= 0.86 + 0.14 * Math.sin(t * 5 + p.ph * 3);          // twinkle
      }
    }
    p.vx = (p.vx + (p.hx + ox - p.x) * 0.04) * 0.92; p.vy = (p.vy + (p.hy + oy - p.y) * 0.04) * 0.92;
    p.x += p.vx * dtk; p.y += p.vy * dtk;

    // the flying pen is a little light of its own: dots glow as it passes
    if (penHead) {
      const qx = p.hx - penHead[0], qy = p.hy - penHead[1], q2 = qx * qx + qy * qy;
      if (q2 < 12000) { const pi = 0.8 * Math.exp(-q2 / 2400); if (pi > I) { I = pi; tc = 0.15; } }
    }
    // the name ignites inside the beam, then holds on its own
    let nameI = 0;
    if (p.name > 0.25 && nameK > 0) {
      // ignites left to right, like the beam is writing it
      const sweep = ease(seg(t, T.nameOn + (p.hx / W) * 0.9, T.nameOn + (p.hx / W) * 0.9 + 0.45));
      nameI = sweep * p.name * (0.85 + 0.15 * Math.min(1, I * 3));
      nameI *= 1 - 0.8 * smooth(0.6, 0.95, flyNow);   // the name dims so the landing reads
    }
    // flood settles every dot to the site's resting field
    const rest = flood * (p.k3 ? 0.18 : 0.12);
    const target = Math.max(I, nameI, rest);
    p.lit += (target - p.lit) * Math.min(1, 0.22 * dtk);
    const v = p.lit;
    if (v < 0.012) continue;
    const ci = nameI > I * 0.8 ? 0 : Math.max(0, Math.min(7, Math.round(tc * 7)));
    const ai = Math.max(0, Math.min(15, Math.round(v * 15)));
    buckets[ci * 16 + ai].push(i);
  }

  ctx.globalCompositeOperation = 'lighter';
  for (let ci = 0; ci < 8; ci++) {
    const col = PALETTE[ci];
    for (let ai = 1; ai < 16; ai++) {
      const arr = buckets[ci * 16 + ai]; if (!arr.length) continue;
      const v = ai / 15;
      // bright dots run hot toward ivory, like the site's lit banner
      const hot = Math.max(0, v - 0.6) * 1.6;
      const r = Math.round(col[0] + (CORE[0] - col[0]) * hot), gg = Math.round(col[1] + (CORE[1] - col[1]) * hot), bb = Math.round(col[2] + (CORE[2] - col[2]) * hot);
      ctx.fillStyle = ctx.strokeStyle = `rgba(${r},${gg},${bb},${Math.min(1, 0.1 + v * 0.95)})`;
      const dotR = 0.55 + v * 1.5, plusS = 1 + v * 1.9;
      ctx.lineWidth = 1 + v * 0.5;
      const dotPath = new Path2D(), plusPath = new Path2D();
      for (const idx of arr) {
        const p = P[idx];
        // like the site: shapes swap when a dot is lit
        const asPlus = v > 0.3 ? !p.plus : p.plus;
        if (asPlus) { plusPath.moveTo(p.x - plusS, p.y); plusPath.lineTo(p.x + plusS, p.y); plusPath.moveTo(p.x, p.y - plusS); plusPath.lineTo(p.x, p.y + plusS); }
        else { dotPath.moveTo(p.x + dotR, p.y); dotPath.arc(p.x, p.y, dotR, 0, Math.PI * 2); }
      }
      ctx.fill(dotPath); ctx.stroke(plusPath);
    }
  }
  ctx.globalCompositeOperation = 'source-over';
}

// The light source is the site's pen squiggle: a pen draws it, the beam pours out of it,
// it retracts into its dot to travel, and is drawn again where the light opens next.
function rgb2hsl([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2;
  if (mx === mn) return [0, 0, l];
  const d = mx - mn, s = l > .5 ? d / (2 - mx - mn) : d / (mx + mn);
  const h = mx === r ? (g - b) / d + (g < b ? 6 : 0) : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [h / 6, s, l];
}
function hsl2rgb([h, s, l]) {
  const f = n => { const k = (n + h * 12) % 12, a = s * Math.min(l, 1 - l); return 255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))); };
  return [f(0), f(8), f(4)];
}
// Pen colours = the light's colours, but vivid: the beam's white core would wash the line out.
function penStops() {
  const vivid = (c, sat, lig) => { const h = rgb2hsl(c); return hsl2rgb([h[0], Math.max(h[1], sat), lig]); };
  const A = vivid(EDGE_A, 0.85, 0.68), B = vivid(EDGE_B, 0.85, 0.62);
  const same = EDGE_A.every((v, i) => Math.abs(v - EDGE_B[i]) < 8);
  const midRaw = colorAtArr(0.5).map((v, i) => same ? v : (EDGE_A[i] + EDGE_B[i]) / 2);
  const M = same ? vivid(EDGE_A, 0.9, 0.8) : vivid(midRaw, 0.8, 0.7);
  return [[0, A], [0.5, M], [1, B]].map(([p, c]) => [p, c.map(Math.round)]);
}

function penDraw(t) {
  if (t < T.aClose) return ease(seg(t, 0.15, T.appear + 0.15));
  if (t < T.bArrive) return 1 - ease(seg(t, T.aClose, T.aClose + 0.3));
  if (t < T.bClose) return ease(seg(t, T.bArrive - 0.05, T.bArrive + 0.5));
  if (t < T.cArrive) return 1 - ease(seg(t, T.bClose, T.bClose + 0.3));
  return ease(seg(t, T.cArrive - 0.05, T.cArrive + 0.5));
}
// Where the hero's pen squiggle (and the period before it) sit on screen, read live from the site.
let penHome = false;
function heroTarget(N) {
  try {
    const doc = document;
    const path = doc.getElementById('heroWaveThin'), svg = path && path.ownerSVGElement;
    if (!svg) return null;
    const r = svg.getBoundingClientRect(); if (!r.width || r.bottom < 0 || r.top > H) return null;
    const vb = svg.viewBox.baseVal, sc = Math.min(r.width / vb.width, r.height / vb.height);
    const ox = r.left + (r.width - vb.width * sc) / 2 - vb.x * sc, oy = r.top + (r.height - vb.height * sc) / 2 - vb.y * sc;
    const len = path.getTotalLength(), pts = [];
    for (let i = 0; i <= N; i++) { const p = path.getPointAtLength(len * i / N); pts.push([ox + p.x * sc, oy + p.y * sc]); }
    const dotEl = doc.querySelector('.hero h1 .accent-dot');
    let dot = null;
    if (dotEl) { const d = dotEl.getBoundingClientRect(); dot = [d.left + d.width / 2, d.top + d.height * 0.72]; }
    return { pts, dot, sc };
  } catch (e) { return null; }                       // no hero squiggle: just fade out
}

// ---- the flight home: a little creature, not a straight line ----
// one continuous ease for the whole trip: no stops between legs, so the motion flows
const warp = u => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, u)));
function catmull(P, k) {
  const n = P.length - 1, x = Math.min(n - 1e-6, Math.max(0, k * n)), i = Math.floor(x), f = x - i;
  const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(n, i + 2)];
  const c = j => 0.5 * ((2 * p1[j]) + (-p0[j] + p2[j]) * f + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * f * f + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * f * f * f);
  return [c(0), c(1)];
}
let flightPts = null, flightLUT = null;
// constant speed along the curve (Catmull-Rom alone speeds up and slows down with its point spacing)
function buildLUT() {
  const n = 240, L = [0]; let prev = catmull(flightPts, 0);
  for (let i = 1; i <= n; i++) { const q = catmull(flightPts, i / n); L.push(L[i - 1] + Math.hypot(q[0] - prev[0], q[1] - prev[1])); prev = q; }
  flightLUT = L.map(v => v / L[n]);
}
function arcK(f) {
  const L = flightLUT, n = L.length - 1; let lo = 0, hi = n;
  while (hi - lo > 1) { const m = (lo + hi) >> 1; if (L[m] < f) lo = m; else hi = m; }
  const span = L[hi] - L[lo] || 1;
  return (lo + (f - L[lo]) / span) / n;
}
function flightHead(u, S, D) {
  if (!flightPts) {
    flightPts = [S, [W * 0.32, H * 0.68], [W * 0.4, H * 0.48], [W * 0.56, H * 0.35],
      [D[0] + W * 0.22, D[1] - H * 0.06], [D[0] + W * 0.07, D[1] - H * 0.012], D];
    buildLUT();
  }
  const f = warp(u), p = catmull(flightPts, arcK(f));
  // one easy loop-de-loop on the way up, eased in and out so it joins the path smoothly
  const R = Math.min(W, H) * 0.05, th = Math.PI * 2 * ease(seg(f, 0.2, 0.44));
  p[0] += R * Math.sin(th); p[1] -= R * (1 - Math.cos(th));
  return p;
}
let penHead = null;                                 // the dots near the flying pen light up
let flyNow = 0;                                     // flight progress, so the name can step back for the landing

function drawPen(b, g, t) {
  const N = 56;
  const tgt = t > T.flyStart - 0.3 ? heroTarget(N) : null;
  penHome = !!tgt;
  const flyU = tgt ? seg(t, T.flyStart, T.flyEnd) : 0;
  const fly = flyU; flyNow = flyU;
  if (!tgt) { flightPts = null; penHead = null; }
  const a = tgt ? b.slit : b.slit * (1 - ease(seg(t, T.flood, T.fade)));
  if (a <= 0.01) return;
  const k = penDraw(t);
  const pts = [];
  for (let i = 0; i <= N; i++) {
    const s = -1 + 2 * i / N, o = penOffset(s, t, g);     // the same curve the light starts from
    pts.push([b.x + g.px * s * g.L + g.dx * o, b.y + g.py * s * g.L + g.dy * o]);
  }
  // the finale: the dot leads, the line follows it like a ribbon, and settles into the hero squiggle
  let dotP = pts[0];
  if (fly > 0) {
    const D = tgt.dot || tgt.pts[0], S = pts[0];
    const head0 = flightHead(0, S, D);
    const TRAIL = 0.15;                                     // body length, in flight time
    const toRibbon = smooth(0, 0.22, flyU);                  // rigid pen shape -> trailing ribbon
    const settle = smooth(0.8, 1, flyU);                     // ribbon -> the hero squiggle
    const swim = 1 - settle;
    for (let i = 0; i <= N; i++) {
      const ui = flyU - TRAIL * i / N, h = flightHead(ui, S, D);
      const rigid = [pts[i][0] + h[0] - head0[0], pts[i][1] + h[1] - head0[1]];
      // a little swimming wave runs down the body
      const h2 = flightHead(ui - 0.004, S, D), tx = h[0] - h2[0], ty = h[1] - h2[1], tl = Math.hypot(tx, ty) || 1;
      const wv = Math.sin(i * 0.22 - t * 7) * 2.2 * swim * toRibbon;
      const ribbon = [h[0] - ty / tl * wv, h[1] + tx / tl * wv];
      const body = [lerp(rigid[0], ribbon[0], toRibbon), lerp(rigid[1], ribbon[1], toRibbon)];
      pts[i] = [lerp(body[0], tgt.pts[i][0], settle), lerp(body[1], tgt.pts[i][1], settle)];
    }
    dotP = flightHead(flyU, S, D);
    if (flyU >= 1) dotP = D;
    penHead = flyU < 1 ? dotP : null;
  }
  const head = Math.max(1, Math.round(k * N));
  const A = pts[0], Z = pts[N];
  const wThin = fly > 0 ? lerp(MOBILE ? 1.8 : 2.3, 3 * tgt.sc, fly) : (MOBILE ? 1.8 : 2.3);
  const wThick = fly > 0 ? lerp(MOBILE ? 3.5 : 4.5, 7 * tgt.sc, fly) : (MOBILE ? 3.5 : 4.5);
  ctx.save();
  ctx.lineCap = ctx.lineJoin = 'round';
  ctx.globalCompositeOperation = 'lighter';

  // soft light pooling where the beam leaves the stroke
  if (b.open > 0.02 && fly < 0.5) {
    const r = g.L * 2.2, cx = b.x + g.dx * g.L * 0.4, cy = b.y + g.dy * g.L * 0.4;
    const rg = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
    const cc = CORE.map(Math.round), pa = 0.2 * b.open * a * (1 - fly * 2);
    rg.addColorStop(0, `rgba(${cc},${pa})`); rg.addColorStop(0.35, `rgba(${cc},${pa * 0.35})`);
    rg.addColorStop(0.7, `rgba(${cc},${pa * 0.08})`); rg.addColorStop(1, `rgba(${cc},0)`);
    ctx.fillStyle = rg; ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
  }

  if (k > 0.01) {
    const path = new Path2D(); path.moveTo(...pts[0]);
    for (let i = 1; i <= head; i++) path.lineTo(...pts[i]);
    // thick glow stroke: fades in along the line, like the hero squiggle
    const gThick = ctx.createLinearGradient(A[0], A[1], Z[0], Z[1]);
    const soft = 1 - 0.2 * b.open;                       // the glow gives way to the light it makes
    // the pen carries the light's own colours, end to end, in the same order as the fan
    const PS = penStops();
    for (const [pos, col] of PS) gThick.addColorStop(pos, `rgba(${col},${0.45 * a * soft})`);
    ctx.shadowColor = `rgba(${EDGE_A},${0.35 * a})`; ctx.shadowBlur = 10;
    ctx.strokeStyle = gThick; ctx.lineWidth = wThick; ctx.stroke(path);
    // thin bright stroke on top
    const gThin = ctx.createLinearGradient(A[0], A[1], Z[0], Z[1]);
    // as the beam opens the line runs hot: it is the filament the light comes from
    for (const [pos, col] of PS) gThin.addColorStop(pos, `rgba(${col},${a})`);
    ctx.shadowColor = 'rgba(0,0,0,0)'; ctx.shadowBlur = 0;
    ctx.globalCompositeOperation = 'source-over';
    ctx.strokeStyle = gThin; ctx.lineWidth = wThin; ctx.stroke(path);
    ctx.globalCompositeOperation = 'lighter';
    // the pen tip while it is still drawing
    if (k < 0.995) {
      const P = pts[head];
      ctx.shadowBlur = 18; ctx.fillStyle = `rgba(255,255,255,${0.9 * a})`;
      ctx.beginPath(); ctx.arc(P[0], P[1], 2.2, 0, Math.PI * 2); ctx.fill();
    }
  }
  // the full stop it starts from (and travels as)
  const ad = a * (1 - smooth(0.8, 1, fly));          // lands on the hero's own period, then hands over to it
  ctx.shadowColor = `rgba(${EDGE_A},${ad})`; ctx.shadowBlur = 16;
  ctx.fillStyle = `rgba(${EDGE_A},${ad})`;
  ctx.beginPath(); ctx.arc(dotP[0], dotP[1], MOBILE ? 2.8 : 3.4, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

// ---------------- loop ----------------
let start = 0, lastT = 0, lastNow = 0, done = false, raf = 0, handedOver = false, resumed = false;
const prevOverflow = document.documentElement.style.overflow;
document.documentElement.style.overflow = 'hidden';            // the page waits underneath
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
scrollTo(0, 0);
// the site's own dot field sleeps while the intro runs (main.js honours this flag)
window.__introHold = true;
if (window.__dotfieldStop) window.__dotfieldStop();

function frame(now) {
  if (W !== viewW() || H !== viewH()) { if (!layout()) { raf = requestAnimationFrame(frame); return; } }
  if (!start) start = now;
  const t = (now - start) / 1000; lastT = t;
  const dtk = lastNow ? Math.max(0.5, Math.min(4, (now - lastNow) / 16.7)) : 1; lastNow = now;

  // the pen has landed: the hero's squiggle takes over from the same drawn state
  if (!handedOver && t > T.flyEnd) { handedOver = true; if (window.__heroWaveSync) window.__heroWaveSync(); }
  if (t > T.fade && !intro.classList.contains('gone')) finish();
  if (t > T.end) { teardown(); return; }

  useScene(t < T.aClose ? 'a' : t < T.bClose ? 'b' : 'c');
  const b = beamAt(t), g = fanGeometry(b);
  ctx.globalCompositeOperation = 'source-over'; ctx.fillStyle = '#000'; ctx.fillRect(0, 0, W, H);

  beamGeo = g;
  const letters = layoutLetters(b, g, t);
  renderField(b, g, t, letters);
  ctx.save(); ctx.globalCompositeOperation = 'lighter'; ctx.globalAlpha = 0.75; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(haze, 0, 0, W, H); ctx.restore();

  drawDots(b, g, t, dtk);
  if (letters) drawLetters(b, g, t, letters); else drawRole(b, t);
  drawPen(b, g, t);
  raf = requestAnimationFrame(frame);
}

function resumeSite() {
  if (resumed) return; resumed = true;
  window.__introHold = false;
  document.documentElement.style.overflow = prevOverflow;
  if (window.__dotfieldStart) window.__dotfieldStart();
  if (!handedOver && window.__heroWaveSync) { handedOver = true; window.__heroWaveSync(); }
}
function finish() {
  intro.classList.add('gone');
  resumeSite();
}
function teardown() {
  if (done) return; done = true;
  cancelAnimationFrame(raf);
  resumeSite();
  removeEventListener('keydown', onKey); removeEventListener('wheel', skip); removeEventListener('touchmove', skip);
  intro.remove(); css.remove();
}
let skipped = false;
function skip() {
  if (done || intro.classList.contains('gone')) return;
  if (!skipped) { skipped = true; if (typeof trackEvent === 'function') trackEvent('intro-skip'); }
  // jump to the pen's flight home, so a skip still lands on the name and the squiggle, quickly
  const now = performance.now(), jump = T.flyStart + 0.6;
  if ((now - start) / 1000 < jump) start = now - jump * 1000;
}
function onKey(e) { if (e.key === 'Escape' || e.key === 'Enter' || e.key === ' ') skip(); }
intro.querySelector('.intro-skip').addEventListener('click', e => { e.stopPropagation(); skip(); });
intro.addEventListener('click', skip);
addEventListener('keydown', onKey);
addEventListener('wheel', skip, { passive: true });
addEventListener('touchmove', skip, { passive: true });
// if the tab is hidden mid-intro, don't make the visitor sit through it later
document.addEventListener('visibilitychange', () => { if (document.hidden && !done) { finish(); setTimeout(teardown, 950); } });

try { sessionStorage.setItem('introSeen', '1'); } catch (e) {}
if (typeof trackEvent === 'function') trackEvent('intro-start');
Promise.all([
  document.fonts.load("400 40px 'Instrument Serif'"), document.fonts.load("italic 400 40px 'Instrument Serif'"),
  document.fonts.load("700 40px Inter"), document.fonts.load("500 12px 'JetBrains Mono'"),
]).finally(() => { layout(); raf = requestAnimationFrame(frame); });
})();
